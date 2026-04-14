<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  const COURSE = 'furigana';
  const USER_KEY = 'ranking-user';

  let user = $state<{ id: number; nickname: string } | null>(null);
  let tab = $state<'ranking' | 'history'>('ranking');

  // 認証フォーム
  let isRegister = $state(false);
  let nickname = $state('');
  let password = $state('');
  let authError = $state('');
  let authLoading = $state(false);

  // ランキングデータ
  let ranking = $state<{ nickname: string; time_ms: number; correct_count: number; total_count: number; played_at: string }[]>([]);
  let history = $state<{ id: number; time_ms: number; correct_count: number; total_count: number; played_at: string }[]>([]);


  onMount(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try { user = JSON.parse(saved); } catch { /* ignore */ }
    }
    loadRanking();
  });

  async function loadRanking() {
    const res = await fetch(`/api/ranking?course=${COURSE}`);
    const data = await res.json();
    ranking = data.ranking ?? [];
  }

  async function loadHistory() {
    if (!user) return;
    const res = await fetch(`/api/scores/history?userId=${user.id}&course=${COURSE}`);
    const data = await res.json();
    history = data.history ?? [];
  }

  async function handleAuth() {
    authError = '';
    authLoading = true;
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        authError = data.error;
        return;
      }
      user = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      nickname = '';
      password = '';
    } catch {
      authError = '通信エラーが発生しました';
    } finally {
      authLoading = false;
    }
  }

  function logout() {
    user = null;
    localStorage.removeItem(USER_KEY);
    history = [];
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
    if (tab === 'history' && user) loadHistory();
  });
</script>

<div class="page">
  <h1>ランキングモード</h1>
  <p class="course-desc">立ち絵 → ふりがな（記述式・全員出題）</p>

  {#if !user}
    <div class="auth-card">
      <h2>{isRegister ? '新規登録' : 'ログイン'}</h2>
      <form onsubmit={(e) => { e.preventDefault(); handleAuth(); }}>
        <input type="text" placeholder="ニックネーム" bind:value={nickname} maxlength={20} />
        <input type="password" placeholder="パスワード" bind:value={password} />
        {#if authError}<p class="error">{authError}</p>{/if}
        <button class="btn btn-primary" type="submit" disabled={authLoading}>
          {isRegister ? '登録' : 'ログイン'}
        </button>
      </form>
      <button class="switch-auth" onclick={() => { isRegister = !isRegister; authError = ''; }}>
        {isRegister ? 'アカウントをお持ちの方はこちら' : '新規登録はこちら'}
      </button>
    </div>
  {:else}
    <div class="user-bar">
      <span class="user-name">{user.nickname}</span>
      <button class="btn btn-primary" onclick={startRanking}>挑戦する</button>
      <button class="logout-btn" onclick={logout}>ログアウト</button>
    </div>
  {/if}

  <div class="tabs">
    <button class:active={tab === 'ranking'} onclick={() => (tab = 'ranking')}>ランキング</button>
    {#if user}
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
            <tr class:mine={user && r.nickname === user.nickname}>
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

  {#if tab === 'history' && user}
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

  /* Auth */
  .auth-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background: var(--color-gray-100);
    border-radius: 8px;
  }

  .auth-card h2 {
    font-size: 15px;
    font-weight: 600;
  }

  .auth-card form {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .auth-card input {
    padding: 10px;
    font-size: 14px;
    border: 1px solid var(--color-gray-400);
    border-radius: 4px;
  }

  .error {
    font-size: 13px;
    color: var(--color-danger);
  }

  .switch-auth {
    background: none;
    border: none;
    font-size: 13px;
    color: var(--brand);
    cursor: pointer;
    text-align: left;
  }

  .switch-auth:hover {
    text-decoration: underline;
  }

  /* User bar */
  .user-bar {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-name {
    font-weight: 600;
    font-size: 15px;
  }

  .logout-btn {
    margin-left: auto;
    background: none;
    border: none;
    font-size: 13px;
    color: var(--color-gray-500);
    cursor: pointer;
  }

  .logout-btn:hover {
    color: var(--color-gray-700);
  }

  /* Tabs */
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

  /* Table */
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

  /* History detail */
  .history-row {
    cursor: pointer;
  }

  .history-row:hover {
    background: var(--color-gray-100);
  }

</style>
