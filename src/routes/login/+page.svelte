<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { userStore } from '$lib/stores/user.svelte';

  let isRegister = $state(false);
  let nickname = $state('');
  let password = $state('');
  let error = $state('');
  let loading = $state(false);

  const redirect = page.url.searchParams.get('redirect') ?? '/';

  async function handleSubmit() {
    error = '';
    loading = true;
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        error = data.error;
        return;
      }
      userStore.set(data.user);
      goto(redirect);
    } catch {
      error = '通信エラーが発生しました';
    } finally {
      loading = false;
    }
  }
</script>

<div class="page">
  <h1>{isRegister ? '新規登録' : 'ログイン'}</h1>
  <p class="desc">ログインすると、クイズ/ランキングのプレイ履歴が記録されます</p>

  <form class="auth-form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
    <input type="text" placeholder="ニックネーム" bind:value={nickname} maxlength={20} autocomplete="username" />
    <input type="password" placeholder="パスワード" bind:value={password} autocomplete={isRegister ? 'new-password' : 'current-password'} />
    {#if error}<p class="error">{error}</p>{/if}
    <button class="btn btn-primary" type="submit" disabled={loading}>
      {isRegister ? '登録する' : 'ログインする'}
    </button>
  </form>

  <button class="switch" onclick={() => { isRegister = !isRegister; error = ''; }}>
    {isRegister ? 'アカウントをお持ちの方はこちら' : '新規登録はこちら'}
  </button>
</div>

<style>
  .page {
    max-width: 400px;
    margin: 0 auto;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h1 {
    font-size: 18px;
    font-weight: 700;
  }

  .desc {
    font-size: 13px;
    color: var(--color-gray-500);
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 20px;
    background: var(--color-gray-100);
    border-radius: 8px;
  }

  .auth-form input {
    padding: 10px;
    font-size: 14px;
    border: 1px solid var(--color-gray-400);
    border-radius: 4px;
  }

  .error {
    font-size: 13px;
    color: var(--color-danger);
  }

  .switch {
    background: none;
    border: none;
    font-size: 13px;
    color: var(--brand);
    cursor: pointer;
    text-align: center;
  }

  .switch:hover {
    text-decoration: underline;
  }
</style>
