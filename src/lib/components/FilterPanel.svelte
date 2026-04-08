<script lang="ts">
  import idols from '$lib/data/idol_data.json';
  import { onMount } from 'svelte';
  import type RangeSliderType from 'svelte-range-slider-pips';
  import type { RangeFilter } from '$lib/columns';

  let RangeSlider = $state<typeof RangeSliderType | null>(null);
  let visible = $state(false);
  let closing = $state(false);

  $effect(() => {
    if (open) {
      visible = true;
      closing = false;
    } else if (visible) {
      closing = true;
    }
  });

  function handleClose() {
    onclose();
  }

  function onAnimationEnd() {
    if (closing) {
      visible = false;
      closing = false;
    }
  }

  onMount(async () => {
    const mod = await import('svelte-range-slider-pips');
    RangeSlider = mod.default;
  });

  let {
    open = $bindable(),
    onclose,
    bloodType = $bindable(),
    zodiac = $bindable(),
    birthplace = $bindable(),
    hand = $bindable(),
    age = $bindable(),
    height = $bindable(),
    weight = $bindable(),
    bust = $bindable(),
    waist = $bindable(),
    hip = $bindable(),
    bday = $bindable(),
    nonNumAge = $bindable(),
    nonNumWeight = $bindable(),
    nonNumSizes = $bindable()
  }: {
    open: boolean;
    onclose: () => void;
    bloodType: string;
    zodiac: string;
    birthplace: string;
    hand: string;
    age: RangeFilter;
    height: RangeFilter;
    weight: RangeFilter;
    bust: RangeFilter;
    waist: RangeFilter;
    hip: RangeFilter;
    bday: RangeFilter;
    nonNumAge: boolean;
    nonNumWeight: boolean;
    nonNumSizes: boolean;
  } = $props();

  const bloodTypes = [...new Set(idols.map((i) => i.blood_type))].sort();
  const zodiacs = [...new Set(idols.map((i) => i.zodiac))].sort();
  const birthplaces = [...new Set(idols.map((i) => i.birthplace))].sort();
  const hands = [...new Set(idols.map((i) => i.dominant_hand))].sort();

  function dayOfYearToStr(doy: number): string {
    const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let month = 1;
    let remaining = doy;
    while (month <= 12 && remaining > daysInMonth[month]) {
      remaining -= daysInMonth[month];
      month++;
    }
    return `${month}月${remaining}日`;
  }
</script>

{#if visible}
  <div class="overlay" class:closing onclick={handleClose} role="presentation"></div>
  <aside class="filter-panel" class:closing onanimationend={onAnimationEnd}>
    <h2>フィルタ</h2>

    <label>
      血液型
      <select bind:value={bloodType}>
        <option value="">すべて</option>
        {#each bloodTypes as bt}
          <option value={bt}>{bt}</option>
        {/each}
      </select>
    </label>

    <label>
      星座
      <select bind:value={zodiac}>
        <option value="">すべて</option>
        {#each zodiacs as z}
          <option value={z}>{z}</option>
        {/each}
      </select>
    </label>

    <label>
      出身地
      <select bind:value={birthplace}>
        <option value="">すべて</option>
        {#each birthplaces as bp}
          <option value={bp}>{bp}</option>
        {/each}
      </select>
    </label>

    <label>
      利き手
      <select bind:value={hand}>
        <option value="">すべて</option>
        {#each hands as h}
          <option value={h}>{h}</option>
        {/each}
      </select>
    </label>

    {#if RangeSlider}
      <div>
        <span>年齢: {age.min}歳 〜 {age.max}歳</span>
        <RangeSlider min={age.dataMin} max={age.dataMax} values={[age.min, age.max]} range
          on:change={(e) => { age = { ...age, min: e.detail.values[0], max: e.detail.values[1] }; }} />
        <label><input type="checkbox" bind:checked={nonNumAge} /> 非数値のみ</label>
      </div>

      <div>
        <span>身長: {height.min}cm 〜 {height.max}cm</span>
        <RangeSlider min={height.dataMin} max={height.dataMax} values={[height.min, height.max]} range
          on:change={(e) => { height = { ...height, min: e.detail.values[0], max: e.detail.values[1] }; }} />
      </div>

      <div>
        <span>体重: {weight.min}kg 〜 {weight.max}kg</span>
        <RangeSlider min={weight.dataMin} max={weight.dataMax} values={[weight.min, weight.max]} range
          on:change={(e) => { weight = { ...weight, min: e.detail.values[0], max: e.detail.values[1] }; }} />
        <label><input type="checkbox" bind:checked={nonNumWeight} /> 非数値のみ</label>
      </div>

      <div>
        <span>スリーサイズ</span>
        <label><input type="checkbox" bind:checked={nonNumSizes} /> 非数値のみ</label>
      </div>

      <div>
        <span>B: {bust.min} 〜 {bust.max}</span>
        <RangeSlider min={bust.dataMin} max={bust.dataMax} values={[bust.min, bust.max]} range
          on:change={(e) => { bust = { ...bust, min: e.detail.values[0], max: e.detail.values[1] }; }} />
      </div>

      <div>
        <span>W: {waist.min} 〜 {waist.max}</span>
        <RangeSlider min={waist.dataMin} max={waist.dataMax} values={[waist.min, waist.max]} range
          on:change={(e) => { waist = { ...waist, min: e.detail.values[0], max: e.detail.values[1] }; }} />
      </div>

      <div>
        <span>H: {hip.min} 〜 {hip.max}</span>
        <RangeSlider min={hip.dataMin} max={hip.dataMax} values={[hip.min, hip.max]} range
          on:change={(e) => { hip = { ...hip, min: e.detail.values[0], max: e.detail.values[1] }; }} />
      </div>

      <div>
        <span>誕生日: {dayOfYearToStr(bday.min)} 〜 {dayOfYearToStr(bday.max)}</span>
        <RangeSlider min={bday.dataMin} max={bday.dataMax} values={[bday.min, bday.max]} range
          on:change={(e) => { bday = { ...bday, min: e.detail.values[0], max: e.detail.values[1] }; }} />
      </div>
    {/if}

    <button class="submit" onclick={handleClose}>絞り込む</button>
  </aside>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 100;
    animation: fade-in 0.2s ease-out;
  }

  .overlay.closing {
    animation: fade-out 0.2s ease-in forwards;
  }

  .filter-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 320px;
    background: #fff;
    z-index: 101;
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    animation: slide-in 0.2s ease-out;
  }

  .filter-panel.closing {
    animation: slide-out 0.2s ease-in forwards;
  }

  @keyframes slide-in {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  @keyframes slide-out {
    from { transform: translateX(0); }
    to { transform: translateX(100%); }
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  h2 {
    font-size: 16px;
    font-weight: 700;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
  }

  select {
    padding: 6px 8px;
    font-size: 13px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  label:has(input[type='checkbox']) {
    flex-direction: row;
    align-items: center;
    font-weight: normal;
  }

  .submit {
    margin-top: auto;
    padding: 10px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 6px;
    background: #2681c8;
    color: #fff;
    cursor: pointer;
  }

  .submit:hover {
    background: #1f6fad;
  }

  @media (max-width: 768px) {
    .filter-panel {
      width: 100%;
    }
  }
</style>
