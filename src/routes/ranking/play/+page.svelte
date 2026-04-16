<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import idols from '$lib/data/idol_data.json';
  import type { Idol } from '$lib/columns';
  import { quizFields } from '$lib/quiz';
  import { romajiToHiragana } from '$lib/romaji';

  const USER_KEY = 'ranking-user';
  const COURSE = 'furigana';

  const questionField = quizFields.find((f) => f.key === 'img_detail')!;
  const answerField = quizFields.find((f) => f.key === 'furigana')!;

  // ユーザー確認
  let user = $state<{ id: number; nickname: string } | null>(null);
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
    if (saved) user = JSON.parse(saved);
  } catch { /* ignore */ }

  // 全員シャッフル
  const allIdols = [...(idols as Idol[])].sort(() => Math.random() - 0.5);
  const totalCount = allIdols.length;

  let phase = $state<'ready' | 'playing' | 'result'>('ready');
  let currentIdx = $state(0);
  let answers = $state<(string | null)[]>(new Array(totalCount).fill(null));
  let rawInput = $state('');
  let textInputEl = $state<HTMLInputElement | undefined>(undefined);
  let showAnswer = $state(false);

  // ローマ字→ひらがな変換
  let converted = $derived(romajiToHiragana(rawInput));
  let textInput = $derived(converted.text + converted.pending);

  // タイマー
  let startTime = $state(0);
  let elapsed = $state(0);
  let timerInterval = $state<ReturnType<typeof setInterval> | undefined>(undefined);
  let showQuitConfirm = $state(false);

  function startGame() {
    phase = 'playing';
    startTime = Date.now();
    timerInterval = setInterval(() => {
      elapsed = Date.now() - startTime;
    }, 10);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = undefined;
    }
    elapsed = Date.now() - startTime;
  }

  let currentIdol = $derived(allIdols[currentIdx]);

  function submitAnswer() {
    answers[currentIdx] = converted.text.trim();
    showAnswer = true;
  }

  function nextQuestion() {
    showAnswer = false;
    rawInput = '';
    if (currentIdx + 1 < totalCount) {
      currentIdx++;
    } else {
      stopTimer();
      phase = 'result';
      saveScore();
    }
  }

  let isCorrect = $derived(
    answers[currentIdx] != null && currentIdol &&
    answers[currentIdx] === answerField.get(currentIdol)
  );

  let correctCount = $derived(
    allIdols.filter((idol, i) => answers[i] === answerField.get(idol)).length
  );

  async function saveScore() {
    if (!user) return;
    const details = allIdols.map((idol, i) => ({
      idolName: idol.name,
      correctAnswer: answerField.get(idol),
      userAnswer: answers[i],
      isCorrect: answers[i] === answerField.get(idol)
    }));
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        course: COURSE,
        timeMs: elapsed,
        correctCount,
        totalCount,
        details
      })
    });
  }

  // フォーカス管理
  $effect(() => {
    currentIdx;
    if (phase === 'playing' && !showAnswer && textInputEl) {
      textInputEl.focus();
    }
  });

  // キーボードショートカット
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      showQuitConfirm = !showQuitConfirm;
      return;
    }
    if (e.key === 'Enter' && showAnswer) {
      nextQuestion();
    }
  }

  $effect(() => {
    if (phase !== 'playing') return;
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  // 画像プリロード
  $effect(() => {
    if (phase !== 'playing') return;
    const nextIdx = currentIdx + 1;
    if (nextIdx < totalCount) {
      const img = new Image();
      img.src = questionField.get(allIdols[nextIdx]);
    }
  });

  // 離脱防止
  beforeNavigate(({ cancel }) => {
    if (phase === 'playing' && !confirm('ランキングモード中です。離れますか？')) {
      cancel();
    }
  });

  $effect(() => {
    if (phase !== 'playing') return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  });

  function formatTime(ms: number): string {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    const frac = Math.floor((ms % 1000) / 10);
    return `${min}:${String(s).padStart(2, '0')}.${String(frac).padStart(2, '0')}`;
  }
</script>

{#if !user}
  <div class="center">
    <p>ログインが必要です</p>
    <button class="btn btn-primary" onclick={() => goto('/ranking')}>ランキングページへ</button>
  </div>
{:else if phase === 'ready'}
  <div class="center">
    <h1>ランキングモード</h1>
    <p class="desc">立ち絵 → ふりがな（記述式）</p>
    <p class="desc">{totalCount}問・タイム計測</p>
    <p class="user">プレイヤー: {user.nickname}</p>
    <button class="btn btn-primary start-btn" onclick={startGame}>スタート</button>
    <button class="btn btn-muted" onclick={() => goto('/ranking')}>戻る</button>
  </div>
{:else if phase === 'playing' && currentIdol}
  <div class="play">
    <div class="play-header">
      <button class="quit-btn" onclick={() => (showQuitConfirm = true)}>中断</button>
      <span class="progress">{currentIdx + 1} / {totalCount}</span>
      <span class="timer">{formatTime(elapsed)}</span>
    </div>

    <div class="question">
      <img src={questionField.get(currentIdol)} alt="問題" />
    </div>

    <form
      class="answer-form"
      onsubmit={(e) => { e.preventDefault(); submitAnswer(); }}
    >
      <!-- svelte-ignore a11y_autofocus -->
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
      <button class="btn btn-primary" type="submit" disabled={showAnswer || !converted.text.trim()}>回答</button>
    </form>

  </div>

  {#if showAnswer}
    <div class="overlay dark feedback-overlay" role="presentation">
      <div class="feedback-modal" class:correct={isCorrect} class:wrong={!isCorrect}>
        {#if isCorrect}
          <p class="feedback-text">正解!</p>
        {:else}
          <p class="feedback-text">不正解...</p>
          <p class="feedback-answer">正解: {answerField.get(currentIdol)}</p>
        {/if}
        <button class="btn btn-primary" onclick={nextQuestion}>
          {currentIdx + 1 < totalCount ? '次の問題' : '結果を見る'}
        </button>
      </div>
    </div>
  {/if}

  {#if showQuitConfirm}
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div class="overlay dark feedback-overlay" onclick={() => (showQuitConfirm = false)}>
      <div class="feedback-modal" onclick={(e) => e.stopPropagation()}>
        <p class="feedback-text">ランキングモードを中断しますか？</p>
        <p class="feedback-answer">記録は保存されません</p>
        <div class="quit-actions">
          <button class="btn btn-primary" onclick={() => { stopTimer(); goto('/ranking'); }}>中断する</button>
          <button class="btn" onclick={() => (showQuitConfirm = false)}>続ける</button>
        </div>
      </div>
    </div>
  {/if}
{:else if phase === 'result'}
  <div class="result">
    <h2>結果</h2>
    <p class="final-time">{formatTime(elapsed)}</p>
    <p class="final-score">{correctCount} / {totalCount} 問正解</p>

    {#if correctCount === totalCount}
      <p class="perfect">パーフェクト！</p>
    {/if}
    <p class="recorded">ランキングに記録されました</p>

    <div class="result-actions">
      <button class="btn btn-primary" onclick={() => goto('/ranking')}>ランキングを見る</button>
    </div>
  </div>
{/if}

<style>
  .center {
    max-width: 400px;
    margin: 0 auto;
    padding: 40px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }

  h1 {
    font-size: 18px;
    font-weight: 700;
  }

  .desc {
    font-size: 14px;
    color: var(--color-gray-500);
  }

  .user {
    font-size: 14px;
    font-weight: 600;
  }

  .start-btn {
    padding: 14px 48px;
    font-size: 16px;
    margin-top: 8px;
  }

  /* Play */
  .play {
    max-width: 500px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: auto;
  }

  .play-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
  }

  .quit-btn {
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

  .timer {
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--brand);
  }

  .quit-actions {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 16px;
  }

  .progress {
    font-size: 13px;
    color: var(--color-gray-500);
  }

  .question {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .question img {
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    border-radius: 8px;
  }

  .answer-form {
    display: flex;
    gap: 8px;
    padding: 12px 0;
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
    max-width: 400px;
    margin: 0 auto;
    padding: 40px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }

  h2 {
    font-size: 18px;
    font-weight: 700;
  }

  .final-time {
    font-size: 36px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--brand);
  }

  .final-score {
    font-size: 16px;
    color: var(--color-gray-600);
  }

  .perfect {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-success);
  }

  .recorded {
    font-size: 14px;
    color: var(--color-gray-500);
  }

  .result-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
  }
</style>
