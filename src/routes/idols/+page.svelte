<script lang="ts">
  import idols from '$lib/data/idol_data.json';
  import IdolTable from '$lib/components/IdolTable.svelte';
  import FilterPanel from '$lib/components/FilterPanel.svelte';
  import type { RangeFilter } from '$lib/columns';

  function computeRange(values: number[]): { min: number; max: number } {
    return { min: Math.min(...values), max: Math.max(...values) };
  }

  function parseNums(arr: string[]): number[] {
    return arr.map((s) => parseInt(s)).filter((n) => !isNaN(n));
  }

  const ageRange = computeRange(parseNums(idols.map((i) => i.age)));
  const heightRange = computeRange(parseNums(idols.map((i) => i.height)));
  const weightRange = computeRange(parseNums(idols.map((i) => i.weight)));
  const bustRange = computeRange(parseNums(idols.map((i) => i.three_sizes.split('/')[0])));
  const waistRange = computeRange(parseNums(idols.map((i) => i.three_sizes.split('/')[1])));
  const hipRange = computeRange(parseNums(idols.map((i) => i.three_sizes.split('/')[2])));

  // Birthday as day-of-year (1-366)
  const bdayRange = { min: 1, max: 366 };

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
  let age = $state<RangeFilter>({ ...ageRange, dataMin: ageRange.min, dataMax: ageRange.max });
  let height = $state<RangeFilter>({
    ...heightRange,
    dataMin: heightRange.min,
    dataMax: heightRange.max
  });
  let weight = $state<RangeFilter>({
    ...weightRange,
    dataMin: weightRange.min,
    dataMax: weightRange.max
  });
  let bust = $state<RangeFilter>({ ...bustRange, dataMin: bustRange.min, dataMax: bustRange.max });
  let waist = $state<RangeFilter>({
    ...waistRange,
    dataMin: waistRange.min,
    dataMax: waistRange.max
  });
  let hip = $state<RangeFilter>({ ...hipRange, dataMin: hipRange.min, dataMax: hipRange.max });
  let bday = $state<RangeFilter>({ ...bdayRange, dataMin: bdayRange.min, dataMax: bdayRange.max });
</script>

<div style={tableWidthPx ? `--table-width: ${tableWidthPx}px` : ''}>
<div class="page-header">
  <h1>アイドル一覧・検索</h1>
  <span class="result-count">{filteredCount} / {idols.length} 件</span>
  <div class="page-header-right">
    <input type="text" placeholder="キーワード検索" bind:value={keyword} />
    <button onclick={() => (filterOpen = true)}><span class="material-symbols-outlined">filter_list</span> フィルタ</button>
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
    color: #888;
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
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .page-header-right button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 13px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    background: #fff;
    white-space: nowrap;
  }

  .page-header-right button :global(.material-symbols-outlined) {
    font-size: 18px;
  }

  .page-header-right button:hover {
    background: #f5f5f5;
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
