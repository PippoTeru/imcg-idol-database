<script lang="ts">
  import '$lib/styles/reset.css';
  import favicon from '$lib/assets/favicon.ico';
  import Header from '$lib/components/Header.svelte';
  import { onMount } from 'svelte';
  import { userStore } from '$lib/stores/user.svelte';

  let { children } = $props();

  onMount(() => {
    userStore.load();
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Header />

<main>
  {@render children()}
</main>

<style>
  :global(html),
  :global(body) {
    height: 100dvh;
    overflow: hidden;
  }

  :global(body) {
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
