<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { userStore } from '$lib/stores/user.svelte';

  const COURSE = 'furigana';

  let tab = $state<'ranking' | 'history'>('ranking');

  let ranking = $state<{ nickname: string; time_ms: number; correct_count: number; total_count: number; played_at: string }[]>([]);
  let history = $state<{ id: number; time_ms: number; correct_count: number; total_count: number; played_at: string }[]>([]);

  onMount(() => {
    loadRanking();
  });

  async function loadRanking() {
    const res = await fetch(`/api/ranking?course=${COURSE}`);
    const data = await res.json();
    ranking = data.ranking ?? [];
  }

  async function loadHistory() {
    const user = userStore.current;
    if (!user) return;
    const res = await fetch(`/api/scores/history?userId=${user.id}&course=${COURSE}`);
    const data = await res.json();
    history = data.history ?? [];
  }

  function startRanking() {
    goto('/ranking/play');
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
    return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  $effect(() => {
    if (tab === 'history' && userStore.current) loadHistory();
  });
</script>

<div class="page">
  <h1>ランキングモード</h1>
  <p class="course-desc">立ち絵 → ふりがな（記述式・全員出題）</p>

  <div class="action-bar">
    <button class="btn btn-primary" onclick={startRanking}>挑戦する</button>
    {#if !userStore.current}
      <a class="login-hint" href="/login?redirect=/ranking">ログインすると記録が残ります</a>
    {/if}
  </div>

  <div class="tabs">
    <button class:active={tab === 'ranking'} onclick={() => (tab = 'ranking')}>ランキング</button>
    {#if userStore.current}
      <button class:active={tab === 'history'} onclick={() => (tab = 'history')}>マイ履歴</button>
    {/if}
  </div>

  {#if tab === 'ranking'}
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>#</th><th>ニックネーム</th><th>正答</th><th>タイム</th><th>日時</th></tr>
        </thead>
        <tbody>
          {#each ranking as r, i}
            <tr class:mine={userStore.current && r.nickname === userStore.current.nickname}>
              <td class="rank">{i + 1}</td>
              <td>{r.nickname}</td>
              <td>{r.correct_count}/{r.total_count}</td>
              <td class="time">{formatTime(r.time_ms)}</td>
              <td class="date">{formatDate(r.played_at)}</td>
            </tr>
          {:else}
            <tr><td colspan="5" class="empty">まだ記録がありません</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if tab === 'history' && userStore.current}
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>日時</th><th>タイム</th><th>正答</th></tr>
        </thead>
        <tbody>
          {#each history as h}
            <tr class="history-row" onclick={() => goto(`/ranking/history?id=${h.id}`)}>
              <td class="date">{formatDate(h.played_at)}</td>
              <td class="time">{formatTime(h.time_ms)}</td>
              <td>{h.correct_count}/{h.total_count}</td>
            </tr>
          {:else}
            <tr><td colspan="3" class="empty">まだプレイ履歴がありません</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 500px;
    margin: 0 auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h1 {
    font-size: 16px;
    font-weight: 700;
  }

  .course-desc {
    font-size: 13px;
    color: var(--color-gray-500);
  }

  .action-bar {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .login-hint {
    font-size: 12px;
    color: var(--color-gray-500);
    text-decoration: underline;
  }

  .tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--color-gray-200);
  }

  .tabs button {
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    color: var(--color-gray-500);
  }

  .tabs button.active {
    color: var(--brand);
    border-bottom-color: var(--brand);
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    font-size: 14px;
    border-collapse: collapse;
  }

  th {
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray-500);
    padding: 8px;
    border-bottom: 1px solid var(--color-gray-200);
  }

  td {
    padding: 10px 8px;
    border-bottom: 1px solid var(--color-gray-100);
  }

  .rank {
    font-weight: 700;
    width: 32px;
  }

  .time {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .date {
    font-size: 12px;
    color: var(--color-gray-500);
  }

  tr.mine {
    background: var(--brand-light-bg);
  }

  .empty {
    text-align: center;
    color: var(--color-gray-500);
    padding: 24px;
  }

  .history-row {
    cursor: pointer;
  }

  .history-row:hover {
    background: var(--color-gray-100);
  }
</style>
