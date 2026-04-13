<script lang="ts">
  import idols from '$lib/data/idol_data.json';
  import IdolTable from '$lib/components/IdolTable.svelte';
  import FilterPanel from '$lib/components/FilterPanel.svelte';
  import type { RangeFilter } from '$lib/columns';
  import { computeRange, parseNums } from '$lib/utils';

  let keyword = $state('');
  let filterOpen = $state(false);
  let bloodType = $state('');
  let zodiac = $state('');
  let birthplace = $state('');
  let hand = $state('');
  let filteredCount = $state(idols.length);
  let tableWidthPx = $state(0);
  let nonNumAge = $state(false);
  let nonNumWeight = $state(false);
  let nonNumSizes = $state(false);
  let age = $state(computeRange(parseNums(idols.map((i) => i.age))));
  let height = $state(computeRange(parseNums(idols.map((i) => i.height))));
  let weight = $state(computeRange(parseNums(idols.map((i) => i.weight))));
  let bust = $state(computeRange(parseNums(idols.map((i) => i.three_sizes.split('/')[0]))));
  let waist = $state(computeRange(parseNums(idols.map((i) => i.three_sizes.split('/')[1]))));
  let hip = $state(computeRange(parseNums(idols.map((i) => i.three_sizes.split('/')[2]))));
  let bday = $state<RangeFilter>({ min: 1, max: 366, dataMin: 1, dataMax: 366 });
</script>

<div style={tableWidthPx ? `--table-width: ${tableWidthPx}px` : ''}>
<div class="page-header">
  <h1>アイドル一覧・検索</h1>
  <span class="result-count">{filteredCount} / {idols.length} 件</span>
  <div class="page-header-right">
    <input type="text" placeholder="キーワード検索" bind:value={keyword} />
    <button class="btn filter-btn" onclick={() => (filterOpen = true)}><span class="material-symbols-outlined">filter_list</span> フィルタ</button>
  </div>
</div>

<FilterPanel
  bind:open={filterOpen}
  onclose={() => (filterOpen = false)}
  bind:bloodType
  bind:zodiac
  bind:birthplace
  bind:hand
  bind:age
  bind:height
  bind:weight
  bind:bust
  bind:waist
  bind:hip
  bind:bday
  bind:nonNumAge
  bind:nonNumWeight
  bind:nonNumSizes
/>

<IdolTable
  {idols}
  {keyword}
  {bloodType}
  {zodiac}
  {birthplace}
  {hand}
  {age}
  {height}
  {weight}
  {bust}
  {waist}
  {hip}
  {bday}
  {nonNumAge}
  {nonNumWeight}
  {nonNumSizes}
  bind:filteredCount
  bind:tableWidthPx
/>
</div>

<style>
  .page-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 12px 16px;
    max-width: var(--table-width);
    margin: 0 auto;
  }

  h1 {
    font-size: 16px;
    font-weight: 700;
  }

  .result-count {
    font-size: 13px;
    color: var(--color-gray-500);
  }

  .page-header-right {
    margin-left: auto;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .page-header-right input {
    width: 240px;
    padding: 6px 10px;
    font-size: 13px;
    border: 1px solid var(--color-gray-400);
    border-radius: 4px;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 13px;
    white-space: nowrap;
  }

  .filter-btn :global(.material-symbols-outlined) {
    font-size: 18px;
  }

  @media (max-width: 768px) {
    .page-header {
      max-width: none;
    }

    .page-header-right {
      width: 100%;
      margin-left: 0;
    }

    .page-header-right input {
      flex: 1;
      width: auto;
      min-width: 0;
    }
  }
</style>
