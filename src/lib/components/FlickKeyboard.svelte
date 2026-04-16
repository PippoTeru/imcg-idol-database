<script lang="ts">
  type FlickDir = 'center' | 'left' | 'right' | 'up' | 'down';

  const KEYS: { center: string; left?: string; up?: string; right?: string; down?: string }[] = [
    { center: 'あ', left: 'い', up: 'う', right: 'え', down: 'お' },
    { center: 'か', left: 'き', up: 'く', right: 'け', down: 'こ' },
    { center: 'さ', left: 'し', up: 'す', right: 'せ', down: 'そ' },
    { center: 'た', left: 'ち', up: 'つ', right: 'て', down: 'と' },
    { center: 'な', left: 'に', up: 'ぬ', right: 'ね', down: 'の' },
    { center: 'は', left: 'ひ', up: 'ふ', right: 'へ', down: 'ほ' },
    { center: 'ま', left: 'み', up: 'む', right: 'め', down: 'も' },
    { center: 'や', left: '（', up: 'ゆ', right: '）', down: 'よ' },
    { center: 'ら', left: 'り', up: 'る', right: 'れ', down: 'ろ' },
    { center: 'わ', left: 'を', up: 'ん', right: 'ー', down: '〜' },
  ];

  // 濁点・半濁点・小文字の変換マップ
  const DAKUTEN: Record<string, string> = {
    'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご',
    'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ',
    'た': 'だ', 'ち': 'ぢ', 'つ': 'づ', 'て': 'で', 'と': 'ど',
    'は': 'ば', 'ひ': 'び', 'ふ': 'ぶ', 'へ': 'べ', 'ほ': 'ぼ',
    'う': 'ゔ',
    // 逆変換
    'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ',
    'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ',
    'だ': 'た', 'ぢ': 'ち', 'づ': 'つ', 'で': 'て', 'ど': 'と',
    'ば': 'は', 'び': 'ひ', 'ぶ': 'ふ', 'べ': 'へ', 'ぼ': 'ほ',
    'ゔ': 'う',
  };

  const HANDAKUTEN: Record<string, string> = {
    'は': 'ぱ', 'ひ': 'ぴ', 'ふ': 'ぷ', 'へ': 'ぺ', 'ほ': 'ぽ',
    'ば': 'ぱ', 'び': 'ぴ', 'ぶ': 'ぷ', 'べ': 'ぺ', 'ぼ': 'ぽ',
    'ぱ': 'は', 'ぴ': 'ひ', 'ぷ': 'ふ', 'ぺ': 'へ', 'ぽ': 'ほ',
  };

  const KOMOJI: Record<string, string> = {
    'あ': 'ぁ', 'い': 'ぃ', 'う': 'ぅ', 'え': 'ぇ', 'お': 'ぉ',
    'つ': 'っ', 'や': 'ゃ', 'ゆ': 'ゅ', 'よ': 'ょ', 'わ': 'ゎ',
    'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お',
    'っ': 'つ', 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ', 'ゎ': 'わ',
  };

  let { oninput, onbackspace, onsubmit, disabled = false }: {
    oninput: (ch: string) => void;
    onbackspace: () => void;
    onsubmit: () => void;
    disabled?: boolean;
  } = $props();

  // フリック状態
  let activeIdx = $state<number | null>(null);
  let flickDir = $state<FlickDir>('center');
  let startX = $state(0);
  let startY = $state(0);

  const THRESHOLD = 30;

  function getDir(dx: number, dy: number): FlickDir {
    if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return 'center';
    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'up' : 'down';
  }

  function handleStart(idx: number, x: number, y: number) {
    if (disabled) return;
    activeIdx = idx;
    flickDir = 'center';
    startX = x;
    startY = y;
  }

  function handleMove(x: number, y: number) {
    if (activeIdx === null) return;
    flickDir = getDir(x - startX, y - startY);
  }

  function handleEnd() {
    if (activeIdx === null) return;
    const key = KEYS[activeIdx];
    const ch = key[flickDir] ?? key.center;
    oninput(ch);
    activeIdx = null;
    flickDir = 'center';
  }

  function handleCancel() {
    activeIdx = null;
    flickDir = 'center';
  }

  function handleDakuten() {
    if (disabled) return;
    oninput('\u3099'); // 濁点マーカー
  }

  function handleHandakuten() {
    if (disabled) return;
    oninput('\u309A'); // 半濁点マーカー
  }

  function handleKomoji() {
    if (disabled) return;
    oninput('\u0001'); // 小文字マーカー
  }

  // 外部に公開: 入力文字を処理してテキストに変換
  export function processChar(text: string, ch: string): string {
    // 濁点
    if (ch === '\u3099') {
      if (text.length === 0) return text;
      const last = text[text.length - 1];
      const converted = DAKUTEN[last];
      if (converted) return text.slice(0, -1) + converted;
      return text;
    }
    // 半濁点
    if (ch === '\u309A') {
      if (text.length === 0) return text;
      const last = text[text.length - 1];
      const converted = HANDAKUTEN[last];
      if (converted) return text.slice(0, -1) + converted;
      return text;
    }
    // 小文字
    if (ch === '\u0001') {
      if (text.length === 0) return text;
      const last = text[text.length - 1];
      const converted = KOMOJI[last];
      if (converted) return text.slice(0, -1) + converted;
      return text;
    }
    return text + ch;
  }

  function getPreview(idx: number): string | null {
    if (activeIdx !== idx) return null;
    const key = KEYS[idx];
    return key[flickDir] ?? key.center;
  }
</script>

<div class="flick-keyboard" class:disabled>
  <div class="keys-grid">
    {#each KEYS as key, idx}
      <button
        class="flick-key"
        class:active={activeIdx === idx}
        ontouchstart={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          handleStart(idx, t.clientX, t.clientY);
        }}
        ontouchmove={(e) => {
          const t = e.touches[0];
          handleMove(t.clientX, t.clientY);
        }}
        ontouchend={(e) => { e.preventDefault(); handleEnd(); }}
        ontouchcancel={handleCancel}
        onmousedown={(e) => handleStart(idx, e.clientX, e.clientY)}
        onmouseup={handleEnd}
        onmouseleave={handleCancel}
        {disabled}
      >
        {#if getPreview(idx)}
          <span class="preview">{getPreview(idx)}</span>
        {:else}
          {key.center}
        {/if}
        {#if activeIdx === idx}
          <span class="flick-hint flick-left">{key.left ?? ''}</span>
          <span class="flick-hint flick-up">{key.up ?? ''}</span>
          <span class="flick-hint flick-right">{key.right ?? ''}</span>
          <span class="flick-hint flick-down">{key.down ?? ''}</span>
        {/if}
      </button>
    {/each}
  </div>
  <div class="bottom-row">
    <button class="func-key" onclick={handleDakuten} {disabled}>゛</button>
    <button class="func-key" onclick={handleHandakuten} {disabled}>゜</button>
    <button class="func-key" onclick={handleKomoji} {disabled}>小</button>
    <button class="func-key del-key" onclick={onbackspace} {disabled}>⌫</button>
    <button class="func-key submit-key" onclick={onsubmit} {disabled}>回答</button>
  </div>
</div>

<style>
  .flick-keyboard {
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
  }

  .flick-keyboard.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .keys-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    padding: 4px;
  }

  .flick-key {
    position: relative;
    aspect-ratio: 1;
    font-size: 18px;
    font-weight: 500;
    border: 1px solid var(--color-gray-300);
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .flick-key.active {
    background: var(--brand-light-bg);
    border-color: var(--brand);
  }

  .flick-key:active {
    background: var(--color-gray-100);
  }

  .preview {
    font-size: 22px;
    font-weight: 700;
    color: var(--brand);
  }

  .flick-hint {
    position: absolute;
    font-size: 11px;
    color: var(--color-gray-500);
    pointer-events: none;
  }

  .flick-left { left: 2px; top: 50%; transform: translateY(-50%); }
  .flick-right { right: 2px; top: 50%; transform: translateY(-50%); }
  .flick-up { top: 2px; left: 50%; transform: translateX(-50%); }
  .flick-down { bottom: 2px; left: 50%; transform: translateX(-50%); }

  .bottom-row {
    display: flex;
    gap: 4px;
    padding: 4px;
  }

  .func-key {
    flex: 1;
    padding: 10px 0;
    font-size: 14px;
    font-weight: 600;
    border: 1px solid var(--color-gray-300);
    border-radius: 6px;
    background: var(--color-gray-100);
    cursor: pointer;
  }

  .func-key:active {
    background: var(--color-gray-200);
  }

  .del-key {
    font-size: 18px;
  }

  .submit-key {
    background: var(--brand);
    color: #fff;
    border-color: var(--brand);
  }

  .submit-key:active {
    background: var(--brand-hover);
  }
</style>
