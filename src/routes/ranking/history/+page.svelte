<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import idols from '$lib/data/idol_data.json';
  import type { Idol } from '$lib/columns';
  import { quizFields } from '$lib/quiz';

  const questionField = quizFields.find((f) => f.key === 'img_detail')!;

  const scoreId = page.url.searchParams.get('id');

  type Detail = {
    question_idx: number;
    idol_name: string;
    correct_answer: string;
    user_answer: string | null;
    is_correct: number;
  };

  type ScoreInfo = {
    time_ms: number;
    correct_count: number;
    total_count: number;
    played_at: string;
  };

  let details = $state<Detail[]>([]);
  let scoreInfo = $state<ScoreInfo | null>(null);
  let loading = $state(true);

  // アイドル名→画像のマップ
  const idolMap = new Map((idols as Idol[]).map((i) => [i.name, i]));

  onMount(async () => {
    if (!scoreId) { goto('/ranking'); return; }

    const [detailRes, historyRes] = await Promise.all([
      fetch(`/api/scores/detail?scoreId=${scoreId}`),
      // scoreの基本情報を取得するため履歴からフィルタ
      fetch(`/api/scores/info?scoreId=${scoreId}`)
    ]);

    const detailData: { details?: Detail[] } = await detailRes.json();
    details = detailData.details ?? [];

    if (historyRes.ok) {
      const infoData: { score?: ScoreInfo } = await historyRes.json();
      scoreInfo = infoData.score ?? null;
    }

    loading = false;
  });

  function formatTime(ms: number): string {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    const frac = Math.floor((ms % 1000) / 10);
    return `${min}:${String(s).padStart(2, '0')}.${String(frac).padStart(2, '0')}`;
  }
</script>

{#if loading}
  <div class="center"><p>読み込み中...</p></div>
{:else if !scoreInfo}
  <div class="center"><p>データが見つかりません</p></div>
{:else}
  <div class="result">
    <h2>結果</h2>
    <p class="time">{formatTime(scoreInfo.time_ms)}</p>
    <p class="score">{scoreInfo.correct_count} / {scoreInfo.total_count} 問正解 ({Math.round((scoreInfo.correct_count / scoreInfo.total_count) * 100)}%)</p>

    <ul class="result-list">
      {#each details as d}
        {@const idol = idolMap.get(d.idol_name)}
        {@const correct = !!d.is_correct}
        <li class:correct class:wrong={!correct}>
          {#if idol}
            <img src={questionField.get(idol)} alt="" />
          {/if}
          <span class="idol-name">{d.idol_name}</span>
          <span class="a">正解: {d.correct_answer}</span>
          {#if !correct}
            <span class="wrong-a">あなたの回答: {d.user_answer ?? '未回答'}</span>
          {/if}
        </li>
      {/each}
    </ul>

    <div class="result-actions">
      <button class="btn btn-primary" onclick={() => goto('/ranking/play')}>もう一度挑戦する</button>
      <button class="btn btn-secondary" onclick={() => goto('/ranking')}>ランキングに戻る</button>
    </div>
  </div>
{/if}

<style>
  .center {
    padding: 40px 16px;
    text-align: center;
    color: var(--color-gray-500);
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

  .time {
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

  .result-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
</style>
