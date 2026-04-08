<script lang="ts">
  import '$lib/styles/reset.css';
  import favicon from '$lib/assets/favicon.ico';
  import Header from '$lib/components/Header.svelte';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Header />

<main>
  {@render children()}
</main>

<style>
  :global(body) {
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  :global(body > div) {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  main {
    flex: 1;
    overflow: auto;
  }
</style>
