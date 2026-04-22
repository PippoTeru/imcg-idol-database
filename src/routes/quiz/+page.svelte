<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import idols from '$lib/data/idol_data.json';
  import FilterPanel from '$lib/components/FilterPanel.svelte';
  import { quizFields } from '$lib/quiz';
  import { type Idol, type RangeFilter } from '$lib/columns';
  import { computeRange, parseNums, filterIdols } from '$lib/utils';

  const STORAGE_KEY = 'quiz-settings';

  // Filter state
  let filterOpen = $state(false);
  let bloodType = $state('');
  let zodiac = $state('');
  let birthplace = $state('');
  let hand = $state('');

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

  let filteredIdols = $derived(filterIdols(idols as Idol[], {
    bloodType, zodiac, birthplace, hand,
    age, height, weight, bust, waist, hip, bday,
    nonNumAge, nonNumWeight, nonNumSizes
  }));

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
      // フィルタの復元
      if (s.bloodType) bloodType = s.bloodType;
      if (s.zodiac) zodiac = s.zodiac;
      if (s.birthplace) birthplace = s.birthplace;
      if (s.hand) hand = s.hand;
      if (s.nonNumAge !== undefined) nonNumAge = s.nonNumAge;
      if (s.nonNumWeight !== undefined) nonNumWeight = s.nonNumWeight;
      if (s.nonNumSizes !== undefined) nonNumSizes = s.nonNumSizes;
      if (s.age) age = { ...age, min: s.age.min, max: s.age.max };
      if (s.height) height = { ...height, min: s.height.min, max: s.height.max };
      if (s.weight) weight = { ...weight, min: s.weight.min, max: s.weight.max };
      if (s.bust) bust = { ...bust, min: s.bust.min, max: s.bust.max };
      if (s.waist) waist = { ...waist, min: s.waist.min, max: s.waist.max };
      if (s.hip) hip = { ...hip, min: s.hip.min, max: s.hip.max };
      if (s.bday) bday = { ...bday, min: s.bday.min, max: s.bday.max };
    } catch {
      // ignore
    }
  });

  function saveSettings() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        questionFieldKey, answerFieldKey, isMultipleChoice, questionCount,
        bloodType, zodiac, birthplace, hand,
        nonNumAge, nonNumWeight, nonNumSizes,
        age: { min: age.min, max: age.max },
        height: { min: height.min, max: height.max },
        weight: { min: weight.min, max: weight.max },
        bust: { min: bust.min, max: bust.max },
        waist: { min: waist.min, max: waist.max },
        hip: { min: hip.min, max: hip.max },
        bday: { min: bday.min, max: bday.max },
      })
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

  // カウントダウン
  let countdown = $state<number | null>(null);

  function beginCountdown() {
    if (filteredIdols.length === 0 || filterOpen) return;
    if (countdown !== null) return;
    countdown = 3;
    const tick = () => {
      if (countdown === null) return;
      if (countdown <= 1) {
        countdown = null;
        startQuiz();
        return;
      }
      countdown -= 1;
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 1000);
  }

  // Enterでスタート
  function handleKeydown(e: KeyboardEvent) {
    if (e.key !== 'Enter') return;
    if (filterOpen) return;
    const target = e.target as HTMLElement | null;
    // number inputなど他のフォーカスを邪魔しない
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
      (target as HTMLInputElement).blur();
    }
    if (countdown !== null) return;
    e.preventDefault();
    beginCountdown();
  }

  $effect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });
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
  <button class="btn filter-btn" onclick={() => (filterOpen = true)}>
    <span class="material-symbols-outlined">filter_list</span> フィルタで絞り込む
  </button>

  <button class="btn btn-primary start-btn" onclick={beginCountdown} disabled={filteredIdols.length === 0 || countdown !== null}>
    スタート
  </button>
</div>

{#if countdown !== null}
  <div class="overlay dark countdown-overlay" role="presentation">
    <div class="countdown-num">{countdown}</div>
  </div>
{/if}

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

  .countdown-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .countdown-num {
    font-size: 160px;
    font-weight: 900;
    color: #fff;
    font-variant-numeric: tabular-nums;
    animation: pop-in 0.3s ease-out;
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
    border: 1px solid var(--color-gray-400);
    border-radius: 4px;
  }

  .setup p {
    font-size: 13px;
    color: var(--color-gray-500);
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    font-size: 13px;
  }

  .filter-btn :global(.material-symbols-outlined) {
    font-size: 18px;
  }

  .start-btn {
    padding: 12px;
    font-size: 15px;
  }
</style>
