<script lang="ts">
  import { onMount } from 'svelte';
  import { columns, cvMap, type Idol, type RangeFilter } from '$lib/columns';
  import { filterIdols, highlight, highlightHtml } from '$lib/utils';

  const defaultRange: RangeFilter = { min: -Infinity, max: Infinity, dataMin: -Infinity, dataMax: Infinity };

  let {
    idols,
    keyword = '',
    bloodType = '',
    zodiac = '',
    birthplace = '',
    hand = '',
    age = defaultRange,
    height = defaultRange,
    weight = defaultRange,
    bust = defaultRange,
    waist = defaultRange,
    hip = defaultRange,
    bday = defaultRange,
    nonNumAge = false,
    nonNumWeight = false,
    nonNumSizes = false,
    filteredCount = $bindable(0),
    tableWidthPx = $bindable(0)
  }: {
    idols: Idol[];
    keyword?: string;
    bloodType?: string;
    zodiac?: string;
    birthplace?: string;
    hand?: string;
    age?: RangeFilter;
    height?: RangeFilter;
    weight?: RangeFilter;
    bust?: RangeFilter;
    waist?: RangeFilter;
    hip?: RangeFilter;
    bday?: RangeFilter;
    nonNumAge?: boolean;
    nonNumWeight?: boolean;
    nonNumSizes?: boolean;
    filteredCount?: number;
    tableWidthPx?: number;
  } = $props();

  // Search - filter idols by keyword (AND, partial match)
  function getAllText(idol: Idol): string {
    const colTexts = columns.map((col) => col.get(idol)).join(' ');
    const furigana = idol.furigana;
    const cvFurigana = idol.cv ? cvMap.get(idol.cv) ?? '' : '';
    return `${colTexts} ${furigana} ${cvFurigana}`;
  }

  let filteredIdols = $derived.by(() => {
    let result = idols as Idol[];

    // Keyword filter
    if (keyword.trim()) {
      const keywords = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter((idol) => {
        const text = getAllText(idol).toLowerCase();
        return keywords.every((kw) => text.includes(kw));
      });
    }

    return filterIdols(result, {
      bloodType, zodiac, birthplace, hand,
      age, height, weight, bust, waist, hip, bday,
      nonNumAge, nonNumWeight, nonNumSizes
    });
  });

  $effect(() => { filteredCount = filteredIdols.length; });
  $effect(() => { tableWidthPx = tableWidth; });

  // Sort state
  let sortColIdx = $state<number | null>(null);
  let sortAsc = $state(true);

  function toggleSort(colIdx: number) {
    if (sortColIdx === colIdx) {
      sortAsc = !sortAsc;
    } else {
      sortColIdx = colIdx;
      sortAsc = true;
    }
  }

  let sortedIdols = $derived.by(() => {
    if (sortColIdx === null) return filteredIdols;
    const col = columns[sortColIdx];
    const getValue = col.sortValue ?? col.get;
    return [...filteredIdols].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), 'ja');
      }
      return sortAsc ? cmp : -cmp;
    });
  });

  // Build header rows from columns definition
  const headerRow1: { label: string; colspan?: number; rowspan?: number; colIdx?: number }[] = [];
  const headerRow2: { label: string; colIdx: number }[] = [];
  for (let i = 0; i < columns.length; ) {
    const { group } = columns[i];
    if (group) {
      let count = 1;
      while (i + count < columns.length && columns[i + count].group === group) count++;
      headerRow1.push({ label: group, colspan: count });
      for (let j = 0; j < count; j++)
        headerRow2.push({ label: columns[i + j].label, colIdx: i + j });
      i += count;
    } else {
      headerRow1.push({ label: columns[i].label, rowspan: 2, colIdx: i });
      i++;
    }
  }

  // Measure column widths using Canvas API for pixel-accurate sizing
  let colWidths = $state<number[]>([]);
  let tableWidth = $state(0);
  let tableEl: HTMLTableElement = undefined!;

  onMount(() => {
    const ctx = document.createElement('canvas').getContext('2d')!;
    const { fontSize, fontFamily } = getComputedStyle(tableEl);
    ctx.font = `${fontSize} ${fontFamily}`;
    const padding = 16;

    const arrowWidth = ctx.measureText(' ▲').width;
    const widths = columns.map((col) => {
      const max = Math.max(...idols.map((i) => ctx.measureText(col.get(i)).width));
      const labelWidth = ctx.measureText(col.label).width + arrowWidth;
      return Math.ceil(Math.max(max, labelWidth)) + padding;
    });

    // Unify grouped columns to the widest in the group
    const groups = new Set(columns.map((c) => c.group).filter(Boolean));
    for (const group of groups) {
      const indices = columns.reduce<number[]>(
        (a, c, i) => (c.group === group ? [...a, i] : a),
        []
      );
      const maxW = Math.max(...indices.map((i) => widths[i]));
      for (const i of indices) widths[i] = maxW;
    }

    colWidths = widths;
    tableWidth = widths.reduce((sum, w) => sum + w, 0);
  });
</script>

<div class="table-wrapper">
<table bind:this={tableEl} style={tableWidth ? `width: ${tableWidth}px` : ''}>
  {#if colWidths.length}
    <colgroup>
      {#each colWidths as w}
        <col style="width: {w}px" />
      {/each}
    </colgroup>
  {/if}
  <thead>
    <tr>
      {#each headerRow1 as h}
        {#if h.colIdx != null}
          <th
            class="sortable"
            class:active={sortColIdx === h.colIdx}
            rowspan={h.rowspan}
            onclick={() => toggleSort(h.colIdx!)}
          >
            {h.label}{#if sortColIdx === h.colIdx}{sortAsc ? ' ▲' : ' ▼'}{/if}
          </th>
        {:else}
          <th colspan={h.colspan}>{h.label}</th>
        {/if}
      {/each}
    </tr>
    {#if headerRow2.length}
      <tr>
        {#each headerRow2 as h}
          <th
            class="sortable"
            class:active={sortColIdx === h.colIdx}
            onclick={() => toggleSort(h.colIdx)}
          >
            {h.label}{#if sortColIdx === h.colIdx}{sortAsc ? ' ▲' : ' ▼'}{/if}
          </th>
        {/each}
      </tr>
    {/if}
  </thead>
  <tbody>
    {#each sortedIdols as idol}
      <tr>
        {#each columns as col, colIdx}
          <td class:active-col={sortColIdx === colIdx}
            >{#if col.html}{@html highlightHtml(col.html(idol), keyword)}{:else}{@html highlight(col.get(idol), keyword)}{/if}</td
          >
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
</div>

{#if sortedIdols.length === 0}
  <p class="no-results">該当するアイドルが見つかりません</p>
{/if}

<style>
  .table-wrapper {
    overflow-x: auto;
  }

  table {
    font-size: 14px;
    table-layout: fixed;
    border-collapse: collapse;
    border: 1px solid rgb(from var(--brand) r g b / 0.25);
    margin: 0 auto 40px;
  }

  th,
  td {
    border: 1px solid rgb(from var(--brand) r g b / 0.1);
    border-top: 1px solid rgb(from var(--brand) r g b / 0.25);
    border-bottom: 1px solid rgb(from var(--brand) r g b / 0.25);
    padding: 8px;
    text-align: left;
    white-space: nowrap;
    vertical-align: middle;
  }

  th {
    font-weight: bold;
    background: rgb(from var(--brand) r g b / 0.08);
  }

  th.sortable {
    cursor: pointer;
    user-select: none;
  }

  th.sortable:hover {
    background: rgb(from var(--brand) r g b / 0.15);
  }

  th.active {
    background: rgb(from var(--brand) r g b / 0.15);
  }

  td.active-col {
    background: rgb(from var(--brand) r g b / 0.04);
  }

  tbody tr:nth-child(even) td.active-col {
    background: rgb(from var(--brand) r g b / 0.08);
  }

  tbody tr:nth-child(even) {
    background: rgb(from var(--brand) r g b / 0.03);
  }

  tbody tr:hover {
    background: rgb(from var(--brand) r g b / 0.1);
  }

  td :global(.ruby-wrap) {
    display: inline-flex;
    align-items: center;
    height: 100%;
  }

  td :global(rt) {
    font-size: 0.6em;
  }

  td :global(mark) {
    background: var(--color-highlight);
    color: inherit;
  }

  .no-results {
    font-size: 14px;
    color: var(--color-gray-500);
    padding: 24px 0;
    text-align: center;
  }
</style>
