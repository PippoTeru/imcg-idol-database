<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import idols from '$lib/data/idol_data.json';
  import type { Idol } from '$lib/columns';
  import { quizFields } from '$lib/quiz';

  type ScoreInfo = {
    mode: 'quiz' | 'ranking';
    question_field: string | null;
    answer_field: string | null;
    is_multiple_choice: number;
    time_ms: number;
    correct_count: number;
    total_count: number;
    played_at: string;
  };
  type Detail = {
    question_idx: number;
    idol_name: string;
    correct_answer: string;
    user_answer: string | null;
    is_correct: number;
    time_ms: number;
  };

  const scoreId = page.params.scoreId;

  let scoreInfo = $state<ScoreInfo | null>(null);
  let details = $state<Detail[]>([]);
  let loading = $state(true);

  const idolByName = new Map((idols as Idol[]).map((i) => [i.name, i]));

  onMount(async () => {
    try {
      const [infoRes, detailRes] = await Promise.all([
        fetch(`/api/scores/info?scoreId=${scoreId}`),
        fetch(`/api/scores/detail?scoreId=${scoreId}`),
      ]);
      if (infoRes.ok) {
        const d = await infoRes.json();
        scoreInfo = d.score ?? null;
      }
      if (detailRes.ok) {
        const d = await detailRes.json();
        details = d.details ?? [];
      }
    } finally {
      loading = false;
    }
  });

  let questionField = $derived(scoreInfo ? quizFields.find((f) => f.key === scoreInfo.question_field) : null);
  let answerField = $derived(scoreInfo ? quizFields.find((f) => f.key === scoreInfo.answer_field) : null);
  let answerTimeSum = $derived(details.reduce((sum, d) => sum + (d.time_ms ?? 0), 0));
  let feedbackTime = $derived(scoreInfo ? Math.max(0, scoreInfo.time_ms - answerTimeSum) : 0);

  function formatTime(ms: number): string {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    const frac = Math.floor((ms % 1000) / 10);
    return `${min}:${String(s).padStart(2, '0')}.${String(frac).padStart(2, '0')}`;
  }

  function modeLabel(s: ScoreInfo): string {
    if (s.mode === 'ranking') return 'ランキング';
    const q = quizFields.find((f) => f.key === s.question_field)?.label ?? s.question_field ?? '';
    const a = quizFields.find((f) => f.key === s.answer_field)?.label ?? s.answer_field ?? '';
    const style = s.is_multiple_choice ? '4択' : '記述';
    return `${q} → ${a}（${style}）`;
  }

  // 同じ問題でクイズに挑戦
  function retryWithIdols(names: string[], shuffle: boolean) {
    if (!scoreInfo) return;
    const list = shuffle ? [...names].sort(() => Math.random() - 0.5) : names;
    localStorage.setItem('quiz-preset-idols', JSON.stringify(list));
    const q = new URLSearchParams({
      q: scoreInfo.question_field ?? '',
      a: scoreInfo.answer_field ?? '',
      mode: scoreInfo.is_multiple_choice ? '4' : 'text',
      count: String(names.length),
      preset: '1',
    });
    if (scoreInfo.mode === 'ranking') q.set('ranking', '1');
    goto(`/play?${q.toString()}`);
  }

  function allNames() {
    return details.map((d) => d.idol_name);
  }

  function wrongNames() {
    return details.filter((d) => !d.is_correct).map((d) => d.idol_name);
  }

  let wrongCount = $derived(details.filter((d) => !d.is_correct).length);
</script>

<div class="page">
  {#if loading}
    <p class="center">読み込み中...</p>
  {:else if !scoreInfo || !questionField || !answerField}
    <div class="center">
      <p>結果データが見つかりません</p>
      <button class="btn btn-primary" onclick={() => goto('/mypage')}>マイページへ</button>
    </div>
  {:else}
    <div class="result">
      <h2>結果（{modeLabel(scoreInfo)}）</h2>
      <p class="result-time">{formatTime(scoreInfo.time_ms)}</p>
      <p class="score">{scoreInfo.correct_count} / {scoreInfo.total_count} 問正解 ({Math.round((scoreInfo.correct_count / scoreInfo.total_count) * 100)}%)</p>

      <div class="time-breakdown">
        <div class="tb-row"><span class="tb-label">総合タイム</span><span class="tb-value">{formatTime(scoreInfo.time_ms)}</span></div>
        <div class="tb-row"><span class="tb-label">解答時間</span><span class="tb-value">{formatTime(answerTimeSum)}</span></div>
        <div class="tb-row"><span class="tb-label">フィードバック時間</span><span class="tb-value">{formatTime(feedbackTime)}</span></div>
        <div class="tb-row"><span class="tb-label">1問あたり（総合）</span><span class="tb-value">{(scoreInfo.time_ms / scoreInfo.total_count / 1000).toFixed(2)}秒</span></div>
        <div class="tb-row"><span class="tb-label">1問あたり（解答）</span><span class="tb-value">{(answerTimeSum / scoreInfo.total_count / 1000).toFixed(2)}秒</span></div>
      </div>

      <ul class="result-list">
        {#each details as d}
          {@const idol = idolByName.get(d.idol_name)}
          {@const correct = !!d.is_correct}
          <li class:correct class:wrong={!correct}>
            {#if idol && questionField.type === 'image'}
              <img src={questionField.get(idol)} alt="" />
            {:else}
              <span class="q">問題: {idol ? questionField.get(idol) : d.idol_name}</span>
            {/if}
            <span class="idol-name">{d.idol_name}</span>
            <span class="a">正解: {d.correct_answer}</span>
            {#if !correct}
              <span class="wrong-a">あなたの回答: {d.user_answer ?? '未回答'}</span>
            {/if}
            {#if d.time_ms}
              <span class="t">タイム: {(d.time_ms / 1000).toFixed(2)}秒</span>
            {/if}
          </li>
        {/each}
      </ul>

      <div class="result-actions">
        <button class="btn btn-primary" onclick={() => retryWithIdols(allNames(), true)}>同じ問題でもう一度（シャッフル）</button>
        <div class="result-actions-row">
          <button class="btn btn-secondary" onclick={() => retryWithIdols(allNames(), false)}>同じ問題（同順）</button>
          {#if wrongCount > 0}
            <button class="btn btn-secondary" onclick={() => retryWithIdols(wrongNames(), true)}>誤答のみ（シャッフル）</button>
          {/if}
        </div>
        <button class="btn btn-muted" onclick={() => goto('/mypage')}>マイページに戻る</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 500px;
    margin: 0 auto;
    padding: 16px 16px 40px;
  }

  .center {
    text-align: center;
    padding: 40px 16px;
    color: var(--color-gray-500);
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .result {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h2 {
    font-size: 16px;
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
  }

  .tb-label {
    color: var(--color-gray-600);
  }

  .tb-value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
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

  .idol-name {
    font-weight: 700;
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
  }

  .result-actions-row {
    display: flex;
    gap: 8px;
  }

  .result-actions-row :global(.btn) {
    flex: 1;
  }
</style>
