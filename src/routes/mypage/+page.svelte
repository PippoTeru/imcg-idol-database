<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { userStore } from '$lib/stores/user.svelte';
  import { quizFields } from '$lib/quiz';

  type Summary = { play_count: number; total_questions: number; total_correct: number };
  type ModeStat = {
    mode: 'quiz' | 'ranking';
    question_field: string | null;
    answer_field: string | null;
    is_multiple_choice: number;
    play_count: number;
    total_questions: number;
    total_correct: number;
    total_time_ms: number;
  };
  type RecentPlay = {
    id: number;
    mode: 'quiz' | 'ranking';
    course: string | null;
    question_field: string | null;
    answer_field: string | null;
    is_multiple_choice: number;
    time_ms: number;
    correct_count: number;
    total_count: number;
    played_at: string;
  };

  let summary = $state<Summary | null>(null);
  let modes = $state<ModeStat[]>([]);
  let recent = $state<RecentPlay[]>([]);
  let loaded = $state(false);

  onMount(async () => {
    const user = userStore.current;
    if (!user) {
      goto('/login?redirect=/mypage');
      return;
    }
    try {
      const res = await fetch(`/api/stats?userId=${user.id}`);
      const data = await res.json();
      summary = data.summary;
      modes = data.modes ?? [];
      recent = data.recent ?? [];
    } finally {
      loaded = true;
    }
  });

  function fieldLabel(key: string | null): string {
    if (!key) return '-';
    return quizFields.find((f) => f.key === key)?.label ?? key;
  }

  function formatTime(ms: number): string {
    const sec = Math.floor(ms / 1000);
    const min = Math.floor(sec / 60);
    const s = sec % 60;
    const frac = Math.floor((ms % 1000) / 10);
    if (min > 0) return `${min}:${String(s).padStart(2, '0')}.${String(frac).padStart(2, '0')}`;
    return `${s}.${String(frac).padStart(2, '0')}秒`;
  }

  function formatDate(iso: string): string {
    const d = new Date(iso + 'Z');
    return d.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function modeLabel(m: ModeStat | RecentPlay): string {
    if (m.mode === 'ranking') return 'ランキング';
    const q = fieldLabel(m.question_field);
    const a = fieldLabel(m.answer_field);
    const style = m.is_multiple_choice ? '4択' : '記述';
    return `${q} → ${a}（${style}）`;
  }
</script>

<div class="page">
  <h1>マイページ</h1>
  {#if userStore.current}
    <p class="nickname">{userStore.current.nickname}</p>
  {/if}

  {#if !loaded}
    <p class="loading">読み込み中...</p>
  {:else if !summary}
    <p class="loading">データを取得できませんでした</p>
  {:else}
    <!-- サマリ -->
    <section class="card">
      <h2>総計</h2>
      <div class="summary-grid">
        <div><span class="num">{summary.play_count}</span><span class="lbl">プレイ</span></div>
        <div><span class="num">{summary.total_questions}</span><span class="lbl">問題</span></div>
        <div><span class="num">{summary.total_correct}</span><span class="lbl">正答</span></div>
        <div>
          <span class="num">{summary.total_questions > 0 ? Math.round(summary.total_correct / summary.total_questions * 100) : 0}%</span>
          <span class="lbl">正答率</span>
        </div>
      </div>
    </section>

    <!-- 出題条件別 -->
    <section class="card">
      <h2>出題条件別の統計</h2>
      {#if modes.length === 0}
        <p class="empty">まだプレイ履歴がありません</p>
      {:else}
        <ul class="mode-list">
          {#each modes as m}
            {@const accuracy = m.total_questions > 0 ? Math.round(m.total_correct / m.total_questions * 100) : 0}
            {@const avgTime = m.total_questions > 0 ? m.total_time_ms / m.total_questions : 0}
            <li>
              <div class="mode-title">{modeLabel(m)}</div>
              <div class="mode-stats">
                <span>{m.play_count}回</span>
                <span>正答率 {accuracy}%（{m.total_correct}/{m.total_questions}）</span>
                <span>平均1問 {(avgTime / 1000).toFixed(2)}秒</span>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- 最近のプレイ -->
    <section class="card">
      <h2>最近のプレイ</h2>
      {#if recent.length === 0}
        <p class="empty">まだプレイ履歴がありません</p>
      {:else}
        <ul class="recent-list">
          {#each recent as r}
            {@const accuracy = r.total_count > 0 ? Math.round(r.correct_count / r.total_count * 100) : 0}
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <li onclick={() => goto(`/result/${r.id}`)} onkeydown={(e) => { if (e.key === 'Enter') goto(`/result/${r.id}`); }} tabindex="0" role="button">
              <div class="recent-head">
                <span class="date">{formatDate(r.played_at)}</span>
                <span class="time">{formatTime(r.time_ms)}</span>
              </div>
              <div class="recent-body">
                <span class="mode-label">{modeLabel(r)}</span>
                <span class="score">{r.correct_count}/{r.total_count}（{accuracy}%）</span>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</div>

<style>
  .page {
    max-width: 600px;
    margin: 0 auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h1 {
    font-size: 18px;
    font-weight: 700;
  }

  .nickname {
    font-size: 14px;
    color: var(--color-gray-600);
  }

  .loading, .empty {
    font-size: 13px;
    color: var(--color-gray-500);
  }

  .card {
    padding: 16px;
    background: var(--color-gray-100);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  h2 {
    font-size: 14px;
    font-weight: 700;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .summary-grid > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px;
    background: #fff;
    border-radius: 6px;
  }

  .summary-grid .num {
    font-size: 20px;
    font-weight: 700;
    color: var(--brand);
    font-variant-numeric: tabular-nums;
  }

  .summary-grid .lbl {
    font-size: 11px;
    color: var(--color-gray-500);
  }

  .mode-list, .recent-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mode-list li {
    padding: 10px 12px;
    background: #fff;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .mode-title {
    font-size: 13px;
    font-weight: 600;
  }

  .mode-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: 12px;
    color: var(--color-gray-600);
    font-variant-numeric: tabular-nums;
  }

  .recent-list li {
    padding: 10px 12px;
    background: #fff;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
  }

  .recent-list li:hover {
    background: var(--brand-light-bg);
  }

  .recent-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .recent-head .date {
    font-size: 12px;
    color: var(--color-gray-500);
  }

  .recent-head .time {
    font-size: 14px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--brand);
  }

  .recent-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--color-gray-600);
  }

  .recent-body .score {
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 480px) {
    .summary-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
