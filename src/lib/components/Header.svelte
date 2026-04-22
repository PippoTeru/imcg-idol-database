<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { userStore } from '$lib/stores/user.svelte';

  const navLinks = [
    { href: '/idols', label: '一覧・検索' },
    { href: '/quiz', label: 'クイズ' },
    { href: '/ranking', label: 'ランキング' }
  ];

  let menuOpen = $state(false);

  function closeMenu() { menuOpen = false; }

  function logout() {
    userStore.clear();
    closeMenu();
    goto('/');
  }
</script>

<header>
  <a href="/" class="logo" onclick={closeMenu}>iM@S CG DB</a>
  <nav>
    {#each navLinks as link}
      <a href={link.href} class:active={page.url.pathname.startsWith(link.href)} onclick={closeMenu}>{link.label}</a>
    {/each}
  </nav>
  <div class="user-area">
    {#if userStore.current}
      <button class="user-btn" onclick={() => (menuOpen = !menuOpen)}>
        {userStore.current.nickname}
        <span class="chevron">▾</span>
      </button>
      {#if menuOpen}
        <button class="menu-backdrop" aria-label="メニューを閉じる" onclick={closeMenu}></button>
        <div class="menu">
          <a href="/mypage" onclick={closeMenu}>マイページ</a>
          <button onclick={logout}>ログアウト</button>
        </div>
      {/if}
    {:else}
      <a class="login-link" href="/login?redirect={encodeURIComponent(page.url.pathname)}" onclick={closeMenu}>ログイン</a>
    {/if}
  </div>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 24px;
    background: var(--brand);
  }

  .logo {
    font-size: 16px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 1px;
  }

  nav {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }

  nav a {
    font-size: 14px;
    padding: 6px 12px;
    border-radius: 6px;
    color: rgb(255 255 255 / 0.7);
  }

  nav a:hover {
    color: #fff;
    background: rgb(255 255 255 / 0.1);
  }

  nav a.active {
    color: #fff;
    font-weight: 600;
    background: rgb(255 255 255 / 0.15);
  }

  .user-area {
    position: relative;
  }

  .user-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    font-size: 13px;
    color: #fff;
    background: rgb(255 255 255 / 0.15);
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .user-btn:hover {
    background: rgb(255 255 255 / 0.25);
  }

  .chevron {
    font-size: 10px;
  }

  .login-link {
    font-size: 13px;
    padding: 6px 12px;
    border-radius: 6px;
    color: #fff;
    background: rgb(255 255 255 / 0.15);
  }

  .login-link:hover {
    background: rgb(255 255 255 / 0.25);
  }

  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: transparent;
    border: none;
    padding: 0;
    cursor: default;
  }

  .menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 61;
    background: #fff;
    border: 1px solid var(--color-gray-300);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 140px;
    overflow: hidden;
  }

  .menu button,
  .menu a {
    display: block;
    width: 100%;
    padding: 10px 16px;
    font-size: 13px;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-gray-700);
  }

  .menu button:hover,
  .menu a:hover {
    background: var(--color-gray-100);
  }

  @media (max-width: 768px) {
    header {
      padding: 8px 12px;
    }

    .logo {
      font-size: 14px;
    }

    nav a {
      font-size: 13px;
      padding: 6px 8px;
    }
  }
</style>
