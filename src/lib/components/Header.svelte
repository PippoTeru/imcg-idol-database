<script lang="ts">
  import { page } from '$app/state';

  const navLinks = [
    { href: '/idols', label: '一覧・検索' },
    { href: '/quiz', label: 'クイズ' }
  ];
</script>

<header>
  <a href="/" class="logo">iM@S CG DB</a>
  <nav>
    {#each navLinks as link}
      <a href={link.href} class:active={page.url.pathname.startsWith(link.href)}>{link.label}</a>
    {/each}
  </nav>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
