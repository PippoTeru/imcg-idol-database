<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import idols from '$lib/data/idol_data.json';
  import { quizFields, generateQuiz } from '$lib/quiz';
  import type { Idol, RangeFilter } from '$lib/columns';
  import { filterIdols } from '$lib/utils';
  import { romajiToHiragana } from '$lib/romaji';

  // Parse settings from URL
  const params = page.url.searchParams;
  const questionFieldKey = params.get('q') ?? 'img_detail';
  const answerFieldKey = params.get('a') ?? 'name';
  const isMultipleChoice = params.get('mode') !== 'text';
  const questionCount = parseInt(params.get('count') ?? '10');

  const questionField = quizFields.find((f) => f.key === questionFieldKey)!;
  const answerField = quizFields.find((f) => f.key === answerFieldKey)!;

  // Parse filter params from URL into RangeFilter objects
  function rangeFromParams(key: string, fallbackMin: number, fallbackMax: number): RangeFilter {
    const min = params.has(`${key}Min`) ? parseInt(params.get(`${key}Min`)!) : fallbackMin;
    const max = params.has(`${key}Max`) ? parseInt(params.get(`${key}Max`)!) : fallbackMax;
    return { min, max, dataMin: fallbackMin, dataMax: fallbackMax };
  }

  const INF = -Infinity;
  const PINF = Infinity;

  // 外部から渡されたアイドル名リスト（ランキング履歴からの遷移等）
  const PRESET_KEY = 'quiz-preset-idols';
  const presetParam = params.get('preset');
  let presetIdols: Idol[] | null = null;
  if (presetParam && typeof localStorage !== 'undefined') {
    try {
      const names: string[] = JSON.parse(localStorage.getItem(PRESET_KEY) ?? '[]');
      const idolByName = new Map((idols as Idol[]).map((i) => [i.name, i]));
      presetIdols = names.map((n) => idolByName.get(n)).filter((i): i is Idol => !!i);
      localStorage.removeItem(PRESET_KEY);
    } catch { /* ignore */ }
  }

  const targetIdols = presetIdols ?? filterIdols(idols as Idol[], {
    bloodType: params.get('bloodType') ?? '',
    zodiac: params.get('zodiac') ?? '',
    birthplace: params.get('birthplace') ?? '',
    hand: params.get('hand') ?? '',
    nonNumAge: params.get('nonNumAge') === '1',
    nonNumWeight: params.get('nonNumWeight') === '1',
    nonNumSizes: params.get('nonNumSizes') === '1',
    age: rangeFromParams('age', INF, PINF),
    height: rangeFromParams('height', INF, PINF),
    weight: rangeFromParams('weight', INF, PINF),
    bust: rangeFromParams('bust', INF, PINF),
    waist: rangeFromParams('waist', INF, PINF),
    hip: rangeFromParams('hip', INF, PINF),
    bday: rangeFromParams('bday', INF, PINF),
  });

  // Generate quiz
  const initialQuestions = generateQuiz(targetIdols, answerField, questionCount, isMultipleChoice);
  let questions = $state(initialQuestions);
  let currentIdx = $state(0);
  let answers = $state<(string | null)[]>(new Array(initialQuestions.length).fill(null));
  let showAnswer = $state(false);
  let phase = $state<'playing' | 'result'>('playing');

  // Warn before leaving
  beforeNavigate(({ cancel }) => {
    if (phase === 'playing' && !confirm('クイズ中です。ページを離れますか？')) {
      cancel();
    }
  });

  $effect(() => {
    if (phase !== 'playing') return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  });

  function submitAnswer(answer: string) {
    answers[currentIdx] = answer;
    showAnswer = true;
  }

  function nextQuestion() {
    showAnswer = false;
    imgError = false;
    if (currentIdx + 1 < questions.length) {
      currentIdx++;
    } else {
      phase = 'result';
    }
  }

  let currentQuestion = $derived(questions[currentIdx]);
  let isCorrect = $derived(
    answers[currentIdx] != null &&
      currentQuestion &&
      answers[currentIdx] === answerField.get(currentQuestion.idol)
  );

  let correctCount = $derived(
    questions.filter((q, i) => answers[i] === answerField.get(q.idol)).length
  );

  // 画像読み込みエラー
  let imgError = $state(false);

  // Text input
  const useRomaji = answerFieldKey === 'furigana';
  let rawInput = $state('');
  let converted = $derived(useRomaji ? romajiToHiragana(rawInput) : { text: rawInput, pending: '' });
  let textInput = $derived(useRomaji ? converted.text + converted.pending : rawInput);
  let submitValue = $derived(useRomaji ? converted.text : rawInput);
  let textInputEl = $state<HTMLInputElement | undefined>(undefined);

  $effect(() => {
    currentIdx;
    if (phase === 'playing' && !isMultipleChoice && textInputEl) {
      textInputEl.focus();
    }
  });

  // キーボード表示時に入力欄を見える位置にスクロール
  $effect(() => {
    if (!textInputEl) return;
    const scrollIntoView = () => {
      setTimeout(() => {
        textInputEl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 300);
    };
    textInputEl.addEventListener('focus', scrollIntoView);
    return () => textInputEl?.removeEventListener('focus', scrollIntoView);
  });

  // Quit confirmation
  let showQuitConfirm = $state(false);

  function quitQuiz() {
    phase = 'result';
    goto('/quiz');
  }

  // Keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      showQuitConfirm = !showQuitConfirm;
      return;
    }
    if (e.key === 'Enter' && showAnswer) {
      rawInput = '';
      nextQuestion();
    }
  }

  $effect(() => {
    if (phase !== 'playing') return;
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  // Preload next image
  $effect(() => {
    if (phase !== 'playing' || questionField.type !== 'image') return;
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      const img = new Image();
      img.src = questionField.get(questions[nextIdx].idol);
    }
  });

  function retry() {
    questions = generateQuiz(targetIdols, answerField, questionCount, isMultipleChoice);
    currentIdx = 0;
    answers = new Array(questions.length).fill(null);
    showAnswer = false;
    phase = 'playing';
  }

  function resetQuiz(newQuestions: typeof questions) {
    questions = newQuestions;
    currentIdx = 0;
    answers = new Array(newQuestions.length).fill(null);
    showAnswer = false;
    phase = 'playing';
  }

  function shuffleQuestions(qs: typeof questions) {
    return [...qs].sort(() => Math.random() - 0.5);
  }

  function retrySame() {
    resetQuiz(questions);
  }

  function retrySameShuffled() {
    resetQuiz(shuffleQuestions(questions));
  }

  function retryWrongOnly() {
    const wrong = questions.filter((q, i) => answers[i] !== answerField.get(q.idol));
    if (wrong.length === 0) return;
    resetQuiz(wrong);
  }

  function retryWrongShuffled() {
    const wrong = questions.filter((q, i) => answers[i] !== answerField.get(q.idol));
    if (wrong.length === 0) return;
    resetQuiz(shuffleQuestions(wrong));
  }
</script>

{#if phase === 'playing' && currentQuestion}
  <div class="quiz">
    <div class="quiz-header">
      <button class="quit-btn" onclick={() => (showQuitConfirm = true)}>中断</button>
      <p class="progress">{currentIdx + 1} / {questions.length}</p>
    </div>

    <div class="question">
      {#if questionField.type === 'image'}
        {#if imgError}
          <button
            class="img-retry-btn"
            onclick={() => {
              imgError = false;
            }}
          >読み込み失敗　タップで再試行</button>
        {:else}
          {#key `${currentIdx}-${imgError}`}
            <img
              src={questionField.get(currentQuestion.idol)}
              alt="問題"
              onerror={() => { imgError = true; }}
            />
          {/key}
        {/if}
      {:else}
        <p class="question-text">{questionField.get(currentQuestion.idol)}</p>
      {/if}
    </div>

    {#if isMultipleChoice && currentQuestion.choices}
      <div class="choices">
        {#each currentQuestion.choices as choice}
          <button
            class="choice"
            class:correct={showAnswer && choice === answerField.get(currentQuestion.idol)}
            class:wrong={showAnswer &&
              answers[currentIdx] === choice &&
              choice !== answerField.get(currentQuestion.idol)}
            disabled={showAnswer}
            onclick={() => submitAnswer(choice)}
          >
            {choice}
          </button>
        {/each}
      </div>
    {:else}
      <form
        class="text-answer"
        onsubmit={(e) => {
          e.preventDefault();
          submitAnswer(submitValue.trim());
        }}
      >
        <!-- svelte-ignore a11y_autofocus -->
        {#if useRomaji}
          <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
          <div class="romaji-input" class:disabled={showAnswer} onclick={() => textInputEl?.focus()}>
            <input
              type="text"
              bind:this={textInputEl}
              bind:value={rawInput}
              autocomplete="off"
              disabled={showAnswer}
              autofocus
            />
            <span class="romaji-display">{rawInput ? textInput : ''}</span>
            {#if !rawInput && !showAnswer}
              <span class="romaji-placeholder">ふりがなを入力（ローマ字）</span>
            {/if}
          </div>
        {:else}
          <input type="text" bind:this={textInputEl} bind:value={rawInput} placeholder="答えを入力" disabled={showAnswer} autofocus autocomplete="off" />
        {/if}
        <button type="submit" disabled={showAnswer || !submitValue.trim()}>回答</button>
      </form>
    {/if}
  </div>

  {#if showAnswer}
    <div class="overlay dark feedback-overlay" role="presentation">
      <div class="feedback-modal" class:correct={isCorrect} class:wrong={!isCorrect}>
        {#if isCorrect}
          <p class="feedback-text">正解!</p>
        {:else}
          <p class="feedback-text">不正解...</p>
          <p class="feedback-answer">正解: {answerField.get(currentQuestion.idol)}</p>
        {/if}
        <button class="btn btn-primary" onclick={() => { rawInput = ''; nextQuestion(); }}>
          {currentIdx + 1 < questions.length ? '次の問題' : '結果を見る'}
        </button>
      </div>
    </div>
  {/if}

  {#if showQuitConfirm}
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div class="overlay dark feedback-overlay" onclick={() => (showQuitConfirm = false)}>
      <div class="feedback-modal" onclick={(e) => e.stopPropagation()}>
        <p class="feedback-text">クイズを中断しますか？</p>
        <div class="quit-actions">
          <button class="btn btn-primary" onclick={quitQuiz}>設定に戻る</button>
          <button class="btn quit-cancel" onclick={() => (showQuitConfirm = false)}>続ける</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

{#if phase === 'result'}
  <div class="result">
    <h2>結果</h2>
    <p class="score">{correctCount} / {questions.length} 問正解 ({Math.round((correctCount / questions.length) * 100)}%)</p>

    <ul class="result-list">
      {#each questions as q, i}
        {@const correct = answers[i] === answerField.get(q.idol)}
        <li class:correct class:wrong={!correct}>
          {#if questionField.type === 'image'}
            <img src={questionField.get(q.idol)} alt="" />
          {:else}
            <span class="q">問題: {questionField.get(q.idol)}</span>
          {/if}
          <span class="a">正解: {answerField.get(q.idol)}</span>
          {#if !correct}
            <span class="wrong-a">あなたの回答: {answers[i] ?? '未回答'}</span>
          {/if}
        </li>
      {/each}
    </ul>

    <div class="result-actions">
      <button class="btn btn-primary" onclick={retry}>別の問題でもう一度</button>
      <div class="result-actions-row">
        <button class="btn btn-secondary" onclick={retrySame}>同じ問題（同順）</button>
        <button class="btn btn-secondary" onclick={retrySameShuffled}>同じ問題（シャッフル）</button>
      </div>
      {#if correctCount < questions.length}
        <div class="result-actions-row">
          <button class="btn btn-secondary" onclick={retryWrongOnly}>誤答のみ（同順）</button>
          <button class="btn btn-secondary" onclick={retryWrongShuffled}>誤答のみ（シャッフル）</button>
        </div>
      {/if}
      <button class="btn btn-muted" onclick={() => goto('/quiz')}>問題設定に戻る</button>
    </div>
  </div>
{/if}

<style>
  .quiz {
    max-width: 500px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }

  .quiz-header {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding-top: 8px;
  }

  .quit-btn {
    position: absolute;
    left: 0;
    font-size: 13px;
    padding: 4px 10px;
    border: 1px solid var(--color-gray-400);
    border-radius: 4px;
    cursor: pointer;
    background: #fff;
    color: var(--color-gray-500);
  }

  .quit-btn:hover {
    background: var(--color-gray-100);
    color: var(--color-gray-700);
  }

  .progress {
    font-size: 13px;
    color: var(--color-gray-500);
  }

  .quit-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 16px;
  }

  .question {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
  }

  .question img {
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    margin: 0 auto;
    border-radius: 8px;
  }

  .img-retry-btn {
    padding: 16px 24px;
    font-size: 14px;
    color: var(--color-gray-500);
    background: var(--color-gray-100);
    border: 1px dashed var(--color-gray-400);
    border-radius: 8px;
    cursor: pointer;
  }

  .img-retry-btn:hover {
    background: var(--color-gray-200);
  }

  .question-text {
    font-size: 18px;
    font-weight: 600;
    padding: 24px;
    background: var(--color-gray-100);
    border-radius: 8px;
  }

  .choices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 16px 0;
  }

  .choice {
    padding: 12px;
    font-size: 14px;
    border: 1px solid var(--color-gray-400);
    border-radius: 6px;
    cursor: pointer;
    background: #fff;
  }

  .choice:hover:not(:disabled) {
    background: var(--color-gray-100);
  }

  .choice.correct {
    background: var(--color-success-bg);
    border-color: var(--color-success);
  }

  .choice.wrong {
    background: var(--color-danger-bg);
    border-color: var(--color-danger);
  }

  .text-answer {
    display: flex;
    gap: 8px;
    padding: 16px 0;
  }

  .text-answer input {
    flex: 1;
    padding: 10px;
    font-size: 14px;
    border: 1px solid var(--color-gray-400);
    border-radius: 4px;
  }

  .romaji-input {
    flex: 1;
    position: relative;
    border: 1px solid var(--color-gray-400);
    border-radius: 4px;
    overflow: hidden;
  }

  .romaji-input.disabled {
    opacity: 0.5;
  }

  .romaji-display {
    display: block;
    padding: 10px;
    font-size: 14px;
    min-height: 1.5em;
    pointer-events: none;
  }

  .romaji-input input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 10px;
    font-size: 14px;
    border: none;
    background: transparent;
    color: transparent;
    caret-color: black;
    outline: none;
  }

  .romaji-placeholder {
    position: absolute;
    inset: 0;
    padding: 10px;
    font-size: 14px;
    color: var(--color-gray-400);
    pointer-events: none;
  }

  .text-answer button {
    padding: 10px 16px;
    font-size: 14px;
    border: none;
    border-radius: 4px;
    background: var(--brand);
    color: #fff;
    cursor: pointer;
  }

  .text-answer button:disabled {
    background: var(--color-gray-400);
    cursor: default;
  }

  /* Feedback modal */
  .feedback-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .feedback-modal {
    background: #fff;
    border-radius: 12px;
    padding: 32px 40px;
    text-align: center;
    min-width: 280px;
    animation: pop-in 0.2s ease-out;
  }

  .feedback-modal.correct {
    border-top: 4px solid var(--color-success);
  }

  .feedback-modal.wrong {
    border-top: 4px solid var(--color-danger);
  }

  .feedback-text {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .feedback-modal.correct .feedback-text {
    color: var(--color-success);
  }

  .feedback-modal.wrong .feedback-text {
    color: var(--color-danger);
  }

  .feedback-answer {
    font-size: 14px;
    color: var(--color-gray-600);
    margin-bottom: 16px;
  }

  /* Result */
  .result {
    max-width: 500px;
    margin: 0 auto;
    padding: 16px 16px 40px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h2 {
    font-size: 18px;
    font-weight: 700;
  }

  .score {
    font-size: 24px;
    font-weight: 700;
    text-align: center;
    color: var(--brand);
  }

  .result-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .result-list li {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border-radius: 6px;
    font-size: 13px;
  }

  .result-list li.correct {
    background: var(--color-success-bg);
  }

  .result-list li.wrong {
    background: var(--color-danger-bg);
  }

  .result-list img {
    max-height: 120px;
    align-self: flex-start;
    border-radius: 4px;
  }

  .result-list .a {
    font-weight: 600;
  }

  .result-list .wrong-a {
    color: var(--color-gray-500);
  }

  .result-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .result-actions-row {
    display: flex;
    gap: 8px;
  }

  .result-actions-row :global(.btn) {
    flex: 1;
  }

  @media (max-width: 768px) {
    .choices {
      grid-template-columns: 1fr;
    }
  }
</style>
