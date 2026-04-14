<script lang="ts">
  import { beforeNavigate, goto } from '$app/navigation';
  import idols from '$lib/data/idol_data.json';
  import type { Idol } from '$lib/columns';
  import { quizFields } from '$lib/quiz';

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
  let textInput = $state('');
  let textInputEl = $state<HTMLInputElement | undefined>(undefined);
  let showAnswer = $state(false);

  // タイマー
  let startTime = $state(0);
  let elapsed = $state(0);
  let timerInterval = $state<ReturnType<typeof setInterval> | undefined>(undefined);

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
    answers[currentIdx] = textInput.trim();
    showAnswer = true;
  }

  function nextQuestion() {
    showAnswer = false;
    textInput = '';
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
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        course: COURSE,
        timeMs: elapsed,
        correctCount,
        totalCount
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
      <span class="timer">{formatTime(elapsed)}</span>
      <span class="progress">{currentIdx + 1} / {totalCount}</span>
    </div>

    <div class="question">
      <img src={questionField.get(currentIdol)} alt="問題" />
    </div>

    <form
      class="answer-form"
      onsubmit={(e) => { e.preventDefault(); submitAnswer(); }}
    >
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="text"
        bind:this={textInputEl}
        bind:value={textInput}
        placeholder="ふりがなを入力"
        disabled={showAnswer}
        autofocus
      />
      <button class="btn btn-primary" type="submit" disabled={showAnswer || !textInput.trim()}>回答</button>
    </form>

    {#if showAnswer}
      <div class="inline-feedback" class:correct={isCorrect} class:wrong={!isCorrect}>
        {#if isCorrect}
          <span class="fb-mark">○</span>
        {:else}
          <span class="fb-mark">✕</span>
          <span class="fb-answer">正解: {answerField.get(currentIdol)}</span>
        {/if}
        <button class="btn btn-primary fb-next" onclick={nextQuestion}>
          {currentIdx + 1 < totalCount ? '次へ' : '結果を見る'}
        </button>
      </div>
    {/if}
  </div>
{:else if phase === 'result'}
  <div class="result">
    <h2>結果</h2>
    <p class="final-time">{formatTime(elapsed)}</p>
    <p class="final-score">{correctCount} / {totalCount} 問正解</p>

    {#if correctCount === totalCount}
      <p class="perfect">パーフェクト！ランキングに記録されました</p>
    {:else}
      <p class="not-perfect">全問正解でランキングに反映されます</p>
    {/if}

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

  .timer {
    font-size: 20px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--brand);
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

  .answer-form input {
    flex: 1;
    padding: 10px;
    font-size: 14px;
    border: 1px solid var(--color-gray-400);
    border-radius: 4px;
  }

  /* Inline feedback */
  .inline-feedback {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 6px;
    margin-bottom: 8px;
  }

  .inline-feedback.correct {
    background: var(--color-success-bg);
  }

  .inline-feedback.wrong {
    background: var(--color-danger-bg);
  }

  .fb-mark {
    font-size: 20px;
    font-weight: 700;
  }

  .inline-feedback.correct .fb-mark {
    color: var(--color-success);
  }

  .inline-feedback.wrong .fb-mark {
    color: var(--color-danger);
  }

  .fb-answer {
    font-size: 14px;
  }

  .fb-next {
    margin-left: auto;
    padding: 6px 16px;
    font-size: 13px;
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

  .not-perfect {
    font-size: 14px;
    color: var(--color-gray-500);
  }

  .result-actions {
    margin-top: 8px;
    display: flex;
    gap: 8px;
  }
</style>
