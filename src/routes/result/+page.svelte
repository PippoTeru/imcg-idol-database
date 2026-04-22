<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import idols from '$lib/data/idol_data.json';
  import type { Idol } from '$lib/columns';
  import { quizFields } from '$lib/quiz';
  import { loadPlayResult, clearPlayResult, type PlayResult } from '$lib/stores/playResult';

  let result = $state<PlayResult | null>(null);
  let loaded = $state(false);

  const idolByName = new Map((idols as Idol[]).map((i) => [i.name, i]));

  onMount(() => {
    result = loadPlayResult();
    loaded = true;
    // 結果を見終わった後にブラウザバック等で再度表示されないよう、表示後にクリア
    // （ただしリトライボタンで使うので遷移まで保持）
  });

  let questionField = $derived(result ? quizFields.find((f) => f.key === result.questionFieldKey)! : null);
  let answerField = $derived(result ? quizFields.find((f) => f.key === result.answerFieldKey)! : null);

  let idolsInOrder = $derived(result ? result.idolNames.map((n) => idolByName.get(n)!).filter(Boolean) : []);

  let correctCount = $derived.by(() => {
    if (!result || !answerField) return 0;
    return idolsInOrder.filter((idol, i) => result!.answers[i] === answerField!.get(idol)).length;
  });

  function formatTime(ms: number): string {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    const frac = Math.floor((ms % 1000) / 10);
    return `${min}:${String(s).padStart(2, '0')}.${String(frac).padStart(2, '0')}`;
  }

  // ---- リトライ ----
  function buildParams(extra: Record<string, string> = {}): string {
    if (!result) return '';
    const p = new URLSearchParams({ ...result.playParams, ...extra });
    return p.toString();
  }

  function retryNew() {
    goto(`/play?${buildParams()}`);
  }

  function retryWithIdols(names: string[], shuffle: boolean) {
    if (typeof localStorage !== 'undefined') {
      const list = shuffle ? [...names].sort(() => Math.random() - 0.5) : names;
      localStorage.setItem('quiz-preset-idols', JSON.stringify(list));
    }
    const extra: Record<string, string> = { preset: '1', count: String(names.length) };
    goto(`/play?${buildParams(extra)}`);
  }

  function retrySame() {
    retryWithIdols(result!.idolNames, false);
  }

  function retrySameShuffled() {
    retryWithIdols(result!.idolNames, true);
  }

  function retryWrong(shuffle: boolean) {
    if (!result || !answerField) return;
    const wrongIdols = idolsInOrder.filter((idol, i) => result!.answers[i] !== answerField!.get(idol));
    if (wrongIdols.length === 0) return;
    retryWithIdols(wrongIdols.map((i) => i.name), shuffle);
  }

  function backToSetup() {
    clearPlayResult();
    goto(result?.isRanking ? '/ranking' : '/quiz');
  }

  // キーボードショートカット: Enterで別の問題でもう一度、ESCで戻る
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      retryNew();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      backToSetup();
    }
  }

  $effect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if !loaded}
  <div class="center"><p>読み込み中...</p></div>
{:else if !result || !questionField || !answerField}
  <div class="center">
    <p>結果データが見つかりません</p>
    <button class="btn btn-primary" onclick={() => goto('/quiz')}>クイズ設定へ</button>
  </div>
{:else}
  {@const hasWrong = correctCount < idolsInOrder.length}
  {@const answerTimeSum = result.timings.reduce((a, b) => a + b, 0)}
  {@const feedbackTime = Math.max(0, result.elapsed - answerTimeSum)}
  <div class="result">
    <h2>結果{result.isRanking ? '（ランキング）' : ''}</h2>
    <p class="result-time">{formatTime(result.elapsed)}</p>
    <p class="score">{correctCount} / {idolsInOrder.length} 問正解 ({Math.round((correctCount / idolsInOrder.length) * 100)}%)</p>

    <div class="time-breakdown">
      <div class="tb-row"><span class="tb-label">総合タイム</span><span class="tb-value">{formatTime(result.elapsed)}</span></div>
      <div class="tb-row"><span class="tb-label">解答時間</span><span class="tb-value">{formatTime(answerTimeSum)}</span></div>
      <div class="tb-row"><span class="tb-label">フィードバック時間</span><span class="tb-value">{formatTime(feedbackTime)}</span></div>
      <div class="tb-row"><span class="tb-label">1問あたり（総合）</span><span class="tb-value">{(result.elapsed / idolsInOrder.length / 1000).toFixed(2)}秒</span></div>
      <div class="tb-row"><span class="tb-label">1問あたり（解答）</span><span class="tb-value">{(answerTimeSum / idolsInOrder.length / 1000).toFixed(2)}秒</span></div>
    </div>

    {#if result.isRanking}
      <p class="note">ランキングに記録されました</p>
    {/if}

    <ul class="result-list">
      {#each idolsInOrder as idol, i}
        {@const correct = result.answers[i] === answerField.get(idol)}
        <li class:correct class:wrong={!correct}>
          {#if questionField.type === 'image'}
            <img src={questionField.get(idol)} alt="" />
          {:else}
            <span class="q">問題: {questionField.get(idol)}</span>
          {/if}
          <span class="a">正解: {answerField.get(idol)}</span>
          {#if !correct}
            <span class="wrong-a">あなたの回答: {result.answers[i] ?? '未回答'}</span>
          {/if}
          {#if result.timings[i]}
            <span class="t">タイム: {(result.timings[i] / 1000).toFixed(2)}秒</span>
          {/if}
        </li>
      {/each}
    </ul>

    <div class="result-actions">
      <button class="btn btn-primary" onclick={retryNew}>別の問題でもう一度</button>
      <div class="result-actions-row">
        <button class="btn btn-secondary" onclick={retrySame}>同じ問題（同順）</button>
        <button class="btn btn-secondary" onclick={retrySameShuffled}>同じ問題（シャッフル）</button>
      </div>
      {#if hasWrong}
        <div class="result-actions-row">
          <button class="btn btn-secondary" onclick={() => retryWrong(false)}>誤答のみ（同順）</button>
          <button class="btn btn-secondary" onclick={() => retryWrong(true)}>誤答のみ（シャッフル）</button>
        </div>
      {/if}
      <button class="btn btn-muted" onclick={backToSetup}>
        {result.isRanking ? 'ランキングに戻る' : '問題設定に戻る'}
      </button>
    </div>
  </div>
{/if}

<style>
  .center {
    padding: 40px 16px;
    text-align: center;
    color: var(--color-gray-500);
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

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

  .result-time {
    font-size: 28px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-align: center;
    color: var(--brand);
  }

  .score {
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    color: var(--color-gray-600);
  }

  .time-breakdown {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px;
    background: var(--color-gray-100);
    border-radius: 6px;
    font-size: 13px;
  }

  .tb-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tb-label {
    color: var(--color-gray-600);
  }

  .tb-value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .note {
    font-size: 13px;
    text-align: center;
    color: var(--color-gray-500);
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

  .result-list .t {
    font-size: 12px;
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
</style>
