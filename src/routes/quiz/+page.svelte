<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import idols from '$lib/data/idol_data.json';
  import FilterPanel from '$lib/components/FilterPanel.svelte';
  import { quizFields } from '$lib/quiz';
  import { type Idol, type RangeFilter } from '$lib/columns';

  const STORAGE_KEY = 'quiz-settings';

  // Filter state
  let filterOpen = $state(false);
  let bloodType = $state('');
  let zodiac = $state('');
  let birthplace = $state('');
  let hand = $state('');

  function computeRange(values: number[]): RangeFilter {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { min, max, dataMin: min, dataMax: max };
  }

  function parseNums(arr: string[]): number[] {
    return arr.map((s) => parseInt(s)).filter((n) => !isNaN(n));
  }

  let age = $state(computeRange(parseNums(idols.map((i) => i.age))));
  let height = $state(computeRange(parseNums(idols.map((i) => i.height))));
  let weight = $state(computeRange(parseNums(idols.map((i) => i.weight))));
  let bust = $state(computeRange(parseNums(idols.map((i) => i.three_sizes.split('/')[0]))));
  let waist = $state(computeRange(parseNums(idols.map((i) => i.three_sizes.split('/')[1]))));
  let hip = $state(computeRange(parseNums(idols.map((i) => i.three_sizes.split('/')[2]))));
  let bday = $state<RangeFilter>({ min: 1, max: 366, dataMin: 1, dataMax: 366 });
  let nonNumAge = $state(false);
  let nonNumWeight = $state(false);
  let nonNumSizes = $state(false);

  // Filter logic
  function inRange(val: number | null, r: RangeFilter): boolean {
    const moved = r.min !== r.dataMin || r.max !== r.dataMax;
    if (val === null) return !moved;
    return val >= r.min && val <= r.max;
  }

  function parseBirthdayToDoy(s: string): number | null {
    const m = s.match(/(\d+)月(\d+)日/);
    if (!m) return null;
    const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let doy = parseInt(m[2]);
    for (let i = 1; i < parseInt(m[1]); i++) doy += daysInMonth[i];
    return doy;
  }

  let filteredIdols = $derived.by(() => {
    const parseN = (s: string) => {
      const n = parseInt(s);
      return isNaN(n) ? null : n;
    };
    return (idols as Idol[]).filter((idol) => {
      if (bloodType && idol.blood_type !== bloodType) return false;
      if (zodiac && idol.zodiac !== zodiac) return false;
      if (birthplace && idol.birthplace !== birthplace) return false;
      if (hand && idol.dominant_hand !== hand) return false;
      if (nonNumAge) {
        if (parseN(idol.age) !== null) return false;
      } else {
        if (!inRange(parseN(idol.age), age)) return false;
      }
      if (!inRange(parseN(idol.height), height)) return false;
      if (nonNumWeight) {
        if (parseN(idol.weight) !== null) return false;
      } else {
        if (!inRange(parseN(idol.weight), weight)) return false;
      }
      const sizes = idol.three_sizes.split('/');
      if (nonNumSizes) {
        if (parseN(sizes[0]) !== null) return false;
      } else {
        if (!inRange(parseN(sizes[0]), bust)) return false;
        if (!inRange(parseN(sizes[1]), waist)) return false;
        if (!inRange(parseN(sizes[2]), hip)) return false;
      }
      if (!inRange(parseBirthdayToDoy(idol.birthday), bday)) return false;
      return true;
    });
  });

  // Quiz settings
  let questionFieldKey = $state('img_detail');
  let answerFieldKey = $state('name');
  let isMultipleChoice = $state(true);
  let questionCount = $state(10);

  // Restore settings from localStorage
  onMount(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const s = JSON.parse(saved);
      if (s.questionFieldKey) questionFieldKey = s.questionFieldKey;
      if (s.answerFieldKey) answerFieldKey = s.answerFieldKey;
      if (s.isMultipleChoice !== undefined) isMultipleChoice = s.isMultipleChoice;
      if (s.questionCount) questionCount = s.questionCount;
    } catch {
      // ignore
    }
  });

  function saveSettings() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ questionFieldKey, answerFieldKey, isMultipleChoice, questionCount })
    );
  }

  function startQuiz() {
    saveSettings();
    const params = new URLSearchParams({
      q: questionFieldKey,
      a: answerFieldKey,
      mode: isMultipleChoice ? '4' : 'text',
      count: String(questionCount)
    });
    // Only add filter params that are active
    if (bloodType) params.set('bloodType', bloodType);
    if (zodiac) params.set('zodiac', zodiac);
    if (birthplace) params.set('birthplace', birthplace);
    if (hand) params.set('hand', hand);
    if (nonNumAge) params.set('nonNumAge', '1');
    if (nonNumWeight) params.set('nonNumWeight', '1');
    if (nonNumSizes) params.set('nonNumSizes', '1');
    if (age.min !== age.dataMin) params.set('ageMin', String(age.min));
    if (age.max !== age.dataMax) params.set('ageMax', String(age.max));
    if (height.min !== height.dataMin) params.set('heightMin', String(height.min));
    if (height.max !== height.dataMax) params.set('heightMax', String(height.max));
    if (weight.min !== weight.dataMin) params.set('weightMin', String(weight.min));
    if (weight.max !== weight.dataMax) params.set('weightMax', String(weight.max));
    if (bust.min !== bust.dataMin) params.set('bustMin', String(bust.min));
    if (bust.max !== bust.dataMax) params.set('bustMax', String(bust.max));
    if (waist.min !== waist.dataMin) params.set('waistMin', String(waist.min));
    if (waist.max !== waist.dataMax) params.set('waistMax', String(waist.max));
    if (hip.min !== hip.dataMin) params.set('hipMin', String(hip.min));
    if (hip.max !== hip.dataMax) params.set('hipMax', String(hip.max));
    if (bday.min !== bday.dataMin) params.set('bdayMin', String(bday.min));
    if (bday.max !== bday.dataMax) params.set('bdayMax', String(bday.max));
    goto(`/quiz/play?${params}`);
  }
</script>

<h1>クイズ</h1>

<div class="setup">
  <label>
    問題の項目
    <select bind:value={questionFieldKey}>
      {#each quizFields as f}
        <option value={f.key}>{f.label}</option>
      {/each}
    </select>
  </label>

  <label>
    解答の項目
    <select bind:value={answerFieldKey}>
      {#each quizFields as f}
        <option value={f.key}>{f.label}</option>
      {/each}
    </select>
  </label>

  <label>
    出題形式
    <select bind:value={isMultipleChoice}>
      <option value={true}>4択</option>
      <option value={false}>記述式</option>
    </select>
  </label>

  <label>
    出題数
    <input type="number" bind:value={questionCount} min={1} max={filteredIdols.length} />
  </label>

  <p>出題対象: {filteredIdols.length}人</p>
  <button class="filter-btn" onclick={() => (filterOpen = true)}>
    <span class="material-symbols-outlined">filter_list</span> フィルタで絞り込む
  </button>

  <button class="start-btn" onclick={startQuiz} disabled={filteredIdols.length === 0}>
    スタート
  </button>
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

<style>
  h1 {
    font-size: 16px;
    font-weight: 700;
    padding: 12px 16px;
  }

  .setup {
    max-width: 400px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .setup label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
  }

  .setup select,
  .setup input {
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .setup p {
    font-size: 13px;
    color: #888;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    font-size: 13px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    background: #fff;
  }

  .filter-btn :global(.material-symbols-outlined) {
    font-size: 18px;
  }

  .filter-btn:hover {
    background: #f5f5f5;
  }

  .start-btn {
    padding: 12px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 6px;
    background: #2681c8;
    color: #fff;
    cursor: pointer;
  }

  .start-btn:hover {
    background: #1f6fad;
  }

  .start-btn:disabled {
    background: #ccc;
    cursor: default;
  }
</style>
