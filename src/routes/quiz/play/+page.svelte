<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import idols from '$lib/data/idol_data.json';
  import { quizFields, generateQuiz } from '$lib/quiz';
  import type { Idol } from '$lib/columns';

  // Parse settings from URL
  const params = page.url.searchParams;
  const questionFieldKey = params.get('q') ?? 'img_detail';
  const answerFieldKey = params.get('a') ?? 'name';
  const isMultipleChoice = params.get('mode') !== 'text';
  const questionCount = parseInt(params.get('count') ?? '10');

  const questionField = quizFields.find((f) => f.key === questionFieldKey)!;
  const answerField = quizFields.find((f) => f.key === answerFieldKey)!;

  // Parse filter params
  const bloodType = params.get('bloodType') ?? '';
  const zodiac = params.get('zodiac') ?? '';
  const birthplace = params.get('birthplace') ?? '';
  const hand = params.get('hand') ?? '';
  const nonNumAge = params.get('nonNumAge') === '1';
  const nonNumWeight = params.get('nonNumWeight') === '1';
  const nonNumSizes = params.get('nonNumSizes') === '1';
  const ageMin = params.has('ageMin') ? parseInt(params.get('ageMin')!) : null;
  const ageMax = params.has('ageMax') ? parseInt(params.get('ageMax')!) : null;
  const heightMin = params.has('heightMin') ? parseInt(params.get('heightMin')!) : null;
  const heightMax = params.has('heightMax') ? parseInt(params.get('heightMax')!) : null;
  const weightMin = params.has('weightMin') ? parseInt(params.get('weightMin')!) : null;
  const weightMax = params.has('weightMax') ? parseInt(params.get('weightMax')!) : null;
  const bustMin = params.has('bustMin') ? parseInt(params.get('bustMin')!) : null;
  const bustMax = params.has('bustMax') ? parseInt(params.get('bustMax')!) : null;
  const waistMin = params.has('waistMin') ? parseInt(params.get('waistMin')!) : null;
  const waistMax = params.has('waistMax') ? parseInt(params.get('waistMax')!) : null;
  const hipMin = params.has('hipMin') ? parseInt(params.get('hipMin')!) : null;
  const hipMax = params.has('hipMax') ? parseInt(params.get('hipMax')!) : null;
  const bdayMin = params.has('bdayMin') ? parseInt(params.get('bdayMin')!) : null;
  const bdayMax = params.has('bdayMax') ? parseInt(params.get('bdayMax')!) : null;

  function parseBirthdayToDoy(s: string): number | null {
    const m = s.match(/(\d+)月(\d+)日/);
    if (!m) return null;
    const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let doy = parseInt(m[2]);
    for (let i = 1; i < parseInt(m[1]); i++) doy += daysInMonth[i];
    return doy;
  }

  // Filter idols
  const parseN = (s: string) => { const n = parseInt(s); return isNaN(n) ? null : n; };
  const inNum = (val: number | null, min: number | null, max: number | null, nonNum: boolean) => {
    if (nonNum) return val === null;
    if (val === null) return min === null && max === null;
    if (min !== null && val < min) return false;
    if (max !== null && val > max) return false;
    return true;
  };

  const targetIdols = (idols as Idol[]).filter((idol) => {
    if (bloodType && idol.blood_type !== bloodType) return false;
    if (zodiac && idol.zodiac !== zodiac) return false;
    if (birthplace && idol.birthplace !== birthplace) return false;
    if (hand && idol.dominant_hand !== hand) return false;
    if (!inNum(parseN(idol.age), ageMin, ageMax, nonNumAge)) return false;
    if (!inNum(parseN(idol.height), heightMin, heightMax, false)) return false;
    if (!inNum(parseN(idol.weight), weightMin, weightMax, nonNumWeight)) return false;
    const sizes = idol.three_sizes.split('/');
    if (nonNumSizes) {
      if (parseN(sizes[0]) !== null) return false;
    } else {
      if (!inNum(parseN(sizes[0]), bustMin, bustMax, false)) return false;
      if (!inNum(parseN(sizes[1]), waistMin, waistMax, false)) return false;
      if (!inNum(parseN(sizes[2]), hipMin, hipMax, false)) return false;
    }
    const doy = parseBirthdayToDoy(idol.birthday);
    if (bdayMin !== null && doy !== null && doy < bdayMin) return false;
    if (bdayMax !== null && doy !== null && doy > bdayMax) return false;
    return true;
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

  // Text input
  let textInput = $state('');
  let textInputEl = $state<HTMLInputElement | undefined>(undefined);

  $effect(() => {
    currentIdx;
    if (phase === 'playing' && !isMultipleChoice && textInputEl) {
      textInputEl.focus();
    }
  });

  // Quit confirmation
  let showQuitConfirm = $state(false);

  function quitQuiz() {
    phase = 'result';
    goto('/quiz');
  }

  // Keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && showAnswer) {
      textInput = '';
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

  function retrySame() {
    currentIdx = 0;
    answers = new Array(questions.length).fill(null);
    showAnswer = false;
    phase = 'playing';
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
        <img src={questionField.get(currentQuestion.idol)} alt="問題" />
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
          submitAnswer(textInput);
        }}
      >
        <!-- svelte-ignore a11y_autofocus -->
        <input type="text" bind:this={textInputEl} bind:value={textInput} placeholder="答えを入力" disabled={showAnswer} autofocus />
        <button type="submit" disabled={showAnswer || !textInput.trim()}>回答</button>
      </form>
    {/if}
  </div>

  {#if showAnswer}
    <div class="feedback-overlay" role="presentation">
      <div class="feedback-modal" class:correct={isCorrect} class:wrong={!isCorrect}>
        {#if isCorrect}
          <p class="feedback-text">正解!</p>
        {:else}
          <p class="feedback-text">不正解...</p>
          <p class="feedback-answer">正解: {answerField.get(currentQuestion.idol)}</p>
        {/if}
        <button class="feedback-btn" onclick={() => { textInput = ''; nextQuestion(); }}>
          {currentIdx + 1 < questions.length ? '次の問題' : '結果を見る'}
        </button>
      </div>
    </div>
  {/if}

  {#if showQuitConfirm}
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div class="feedback-overlay" onclick={() => (showQuitConfirm = false)}>
      <div class="feedback-modal" onclick={(e) => e.stopPropagation()}>
        <p class="feedback-text">クイズを中断しますか？</p>
        <div class="quit-actions">
          <button class="feedback-btn" onclick={quitQuiz}>設定に戻る</button>
          <button class="quit-cancel" onclick={() => (showQuitConfirm = false)}>続ける</button>
        </div>
      </div>
    </div>
  {/if}
{/if}

{#if phase === 'result'}
  <div class="result">
    <h2>結果</h2>
    <p class="score">{correctCount} / {questions.length} 問正解 ({Math.round((correctCount / questions.length) * 100)}%)</p>

    <h3>間違えた問題</h3>
    <ul class="mistakes">
      {#each questions as q, i}
        {#if answers[i] !== answerField.get(q.idol)}
          <li>
            {#if questionField.type === 'image'}
              <img src={questionField.get(q.idol)} alt="" />
            {:else}
              <span class="q">問題: {questionField.get(q.idol)}</span>
            {/if}
            <span class="a">正解: {answerField.get(q.idol)}</span>
            <span class="wrong-a">あなたの回答: {answers[i] ?? '未回答'}</span>
          </li>
        {/if}
      {/each}
    </ul>

    <div class="result-actions">
      <button onclick={retrySame}>同じ問題をもう一度</button>
      <button onclick={retry}>別の問題でもう一度</button>
      <button onclick={() => goto('/quiz')}>設定に戻る</button>
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
    overflow: hidden;
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
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    background: #fff;
    color: #888;
  }

  .quit-btn:hover {
    background: #f5f5f5;
    color: #333;
  }

  .progress {
    font-size: 13px;
    color: #888;
  }

  .quit-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 16px;
  }

  .quit-cancel {
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
  }

  .quit-cancel:hover {
    background: #f5f5f5;
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

  .question-text {
    font-size: 18px;
    font-weight: 600;
    padding: 24px;
    background: #f5f5f5;
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
    border: 1px solid #ccc;
    border-radius: 6px;
    cursor: pointer;
    background: #fff;
  }

  .choice:hover:not(:disabled) {
    background: #f5f5f5;
  }

  .choice.correct {
    background: #d4edda;
    border-color: #28a745;
  }

  .choice.wrong {
    background: #f8d7da;
    border-color: #dc3545;
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
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .text-answer button {
    padding: 10px 16px;
    font-size: 14px;
    border: none;
    border-radius: 4px;
    background: #2681c8;
    color: #fff;
    cursor: pointer;
  }

  .text-answer button:disabled {
    background: #ccc;
    cursor: default;
  }

  /* Feedback modal */
  .feedback-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fade-in 0.2s ease-out;
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
    border-top: 4px solid #28a745;
  }

  .feedback-modal.wrong {
    border-top: 4px solid #dc3545;
  }

  .feedback-text {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .feedback-modal.correct .feedback-text {
    color: #28a745;
  }

  .feedback-modal.wrong .feedback-text {
    color: #dc3545;
  }

  .feedback-answer {
    font-size: 14px;
    color: #666;
    margin-bottom: 16px;
  }

  .feedback-btn {
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 6px;
    background: #2681c8;
    color: #fff;
    cursor: pointer;
  }

  .feedback-btn:hover {
    background: #1f6fad;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pop-in {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
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
    color: #2681c8;
  }

  h3 {
    font-size: 14px;
    font-weight: 600;
  }

  .mistakes {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mistakes li {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: #f8d7da;
    border-radius: 6px;
    font-size: 13px;
  }

  .mistakes img {
    max-height: 120px;
    align-self: flex-start;
    border-radius: 4px;
  }

  .mistakes .a {
    font-weight: 600;
  }

  .mistakes .wrong-a {
    color: #888;
  }

  .result-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .result-actions button {
    padding: 10px 20px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 6px;
    cursor: pointer;
    background: #fff;
  }

  .result-actions button:first-child {
    background: #2681c8;
    color: #fff;
    border: none;
  }

  @media (max-width: 768px) {
    .choices {
      grid-template-columns: 1fr;
    }
  }
</style>
