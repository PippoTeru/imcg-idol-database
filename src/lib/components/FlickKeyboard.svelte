<script lang="ts">
  import { TextBuffer } from '$lib/textBuffer';

  type FlickDir = 'center' | 'left' | 'right' | 'up' | 'down';

  type FlickKey = {
    center: string;
    left?: string;
    up?: string;
    right?: string;
    down?: string;
    /** 押した時の処理オーバーライド（濁点トグル等） */
    action?: (dir: FlickDir) => void;
  };

  let { buffer = $bindable(TextBuffer.empty()), onsubmit, disabled = false }: {
    buffer: TextBuffer;
    onsubmit: () => void;
    disabled?: boolean;
  } = $props();

  // ---- 全循環テーブル（Shimeji準拠） ----
  // 「゛゜小」キーで押すたびに次の文字へ循環する
  const CYCLE_CHAINS: string[][] = [
    // 濁点のみ（か行）
    ['か', 'が'], ['き', 'ぎ'], ['く', 'ぐ'], ['け', 'げ'], ['こ', 'ご'],
    // 濁点のみ（さ行）
    ['さ', 'ざ'], ['し', 'じ'], ['す', 'ず'], ['せ', 'ぜ'], ['そ', 'ぞ'],
    // 濁点+小文字（た行）
    ['ち', 'ぢ'],
    // た行の特殊: た→だ、て→で、と→ど
    ['た', 'だ'], ['て', 'で'], ['と', 'ど'],
    // つ: 小文字→濁点（Shimeji準拠）
    ['つ', 'っ', 'づ'],
    // 濁点+半濁点（は行）
    ['は', 'ば', 'ぱ'], ['ひ', 'び', 'ぴ'], ['ふ', 'ぶ', 'ぷ'], ['へ', 'べ', 'ぺ'], ['ほ', 'ぼ', 'ぽ'],
    // 小文字のみ（あ行）
    ['あ', 'ぁ'], ['い', 'ぃ'], ['え', 'ぇ'], ['お', 'ぉ'],
    // う: 小文字→濁点
    ['う', 'ぅ', 'ゔ'],
    // 小文字のみ（や行）
    ['や', 'ゃ'], ['ゆ', 'ゅ'], ['よ', 'ょ'],
    // わ: 小文字のみ
    ['わ', 'ゎ'],
  ];

  // 高速検索用マップ: 文字 → 次の文字
  const NEXT_CHAR_MAP: Record<string, string> = {};
  for (const chain of CYCLE_CHAINS) {
    for (let i = 0; i < chain.length; i++) {
      NEXT_CHAR_MAP[chain[i]] = chain[(i + 1) % chain.length];
    }
  }

  function cycleAll(ch: string): string | null {
    return NEXT_CHAR_MAP[ch] ?? null;
  }

  // ---- キー定義 ----
  // 中央3列×4段: 五十音
  const CENTER_KEYS: FlickKey[] = [
    { center: 'あ', left: 'い', up: 'う', right: 'え', down: 'お' },
    { center: 'か', left: 'き', up: 'く', right: 'け', down: 'こ' },
    { center: 'さ', left: 'し', up: 'す', right: 'せ', down: 'そ' },
    { center: 'た', left: 'ち', up: 'つ', right: 'て', down: 'と' },
    { center: 'な', left: 'に', up: 'ぬ', right: 'ね', down: 'の' },
    { center: 'は', left: 'ひ', up: 'ふ', right: 'へ', down: 'ほ' },
    { center: 'ま', left: 'み', up: 'む', right: 'め', down: 'も' },
    { center: 'や', left: '（', up: 'ゆ', right: '）', down: 'よ' },
    { center: 'ら', left: 'り', up: 'る', right: 'れ', down: 'ろ' },
    {
      center: '゛゜小',
      action: (_dir) => {
        const next = (() => {
          if (buffer.cursor === 0) return buffer;
          const prev = buffer.text[buffer.cursor - 1];
          const converted = cycleAll(prev);
          if (converted === null) return buffer;
          return new TextBuffer(
            buffer.text.slice(0, buffer.cursor - 1) + converted + buffer.text.slice(buffer.cursor),
            buffer.cursor
          );
        })();
        buffer = next;
      }
    },
    { center: 'わ', left: 'を', up: 'ん', right: 'ー', down: '〜' },
    { center: '、', left: '。', up: '?', right: '!', down: '、' },
  ];

  // ---- フリック検出 ----
  let activeIdx = $state<number | null>(null);
  let flickDir = $state<FlickDir>('center');
  let startX = 0;
  let startY = 0;

  const THRESHOLD = 25;

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
    const key = CENTER_KEYS[activeIdx];
    if (key.action) {
      key.action(flickDir);
    } else {
      const ch = key[flickDir] ?? key.center;
      buffer = buffer.insert(ch);
    }
    activeIdx = null;
    flickDir = 'center';
  }

  function handleCancel() {
    activeIdx = null;
    flickDir = 'center';
  }

  function preview(idx: number): string | null {
    if (activeIdx !== idx) return null;
    const key = CENTER_KEYS[idx];
    if (key.action) return null;
    return key[flickDir] ?? key.center;
  }

  // ---- 機能キー ----
  function doBackspace() { if (!disabled) buffer = buffer.backspace(); }
  function doLeft() { if (!disabled) buffer = buffer.moveLeft(); }
  function doRight() { if (!disabled) buffer = buffer.moveRight(); }
  function doSpace(full: boolean) {
    if (disabled) return;
    buffer = buffer.insert(full ? '\u3000' : ' ');
  }
  function doDot() { if (!disabled) buffer = buffer.insert('・'); }

  // スペースキー: タップで半角、左フリックで全角
  let spaceActive = $state(false);
  let spaceFlick = $state<FlickDir>('center');
  let spaceStartX = 0;
  let spaceStartY = 0;

  function handleSpaceStart(x: number, y: number) {
    if (disabled) return;
    spaceActive = true;
    spaceFlick = 'center';
    spaceStartX = x;
    spaceStartY = y;
  }
  function handleSpaceMove(x: number, y: number) {
    if (!spaceActive) return;
    spaceFlick = getDir(x - spaceStartX, y - spaceStartY);
  }
  function handleSpaceEnd() {
    if (!spaceActive) return;
    doSpace(spaceFlick === 'left');
    spaceActive = false;
    spaceFlick = 'center';
  }
</script>

<div class="flick-keyboard" class:disabled>
  <div class="grid">
    <!-- 1段目 -->
    <button class="func-key" onclick={doDot} {disabled}>・</button>
    {#each [0, 1, 2] as i}
      <button
        class="flick-key"
        class:active={activeIdx === i}
        ontouchstart={(e) => { e.preventDefault(); const t = e.touches[0]; handleStart(i, t.clientX, t.clientY); }}
        ontouchmove={(e) => { const t = e.touches[0]; handleMove(t.clientX, t.clientY); }}
        ontouchend={(e) => { e.preventDefault(); handleEnd(); }}
        ontouchcancel={handleCancel}
        onmousedown={(e) => handleStart(i, e.clientX, e.clientY)}
        onmousemove={(e) => handleMove(e.clientX, e.clientY)}
        onmouseup={handleEnd}
        onmouseleave={handleCancel}
        {disabled}
      >
        {#if preview(i)}
          <span class="preview">{preview(i)}</span>
        {:else}
          {CENTER_KEYS[i].center}
        {/if}
      </button>
    {/each}
    <button class="func-key" onclick={doBackspace} {disabled}>⌫</button>

    <!-- 2段目 -->
    <button class="func-key" onclick={doLeft} {disabled}>◀</button>
    {#each [3, 4, 5] as i}
      <button
        class="flick-key"
        class:active={activeIdx === i}
        ontouchstart={(e) => { e.preventDefault(); const t = e.touches[0]; handleStart(i, t.clientX, t.clientY); }}
        ontouchmove={(e) => { const t = e.touches[0]; handleMove(t.clientX, t.clientY); }}
        ontouchend={(e) => { e.preventDefault(); handleEnd(); }}
        ontouchcancel={handleCancel}
        onmousedown={(e) => handleStart(i, e.clientX, e.clientY)}
        onmousemove={(e) => handleMove(e.clientX, e.clientY)}
        onmouseup={handleEnd}
        onmouseleave={handleCancel}
        {disabled}
      >
        {#if preview(i)}
          <span class="preview">{preview(i)}</span>
        {:else}
          {CENTER_KEYS[i].center}
        {/if}
      </button>
    {/each}
    <button class="func-key" onclick={doRight} {disabled}>▶</button>

    <!-- 3段目 -->
    <button class="func-key mode-key" disabled>123</button>
    {#each [6, 7, 8] as i}
      <button
        class="flick-key"
        class:active={activeIdx === i}
        ontouchstart={(e) => { e.preventDefault(); const t = e.touches[0]; handleStart(i, t.clientX, t.clientY); }}
        ontouchmove={(e) => { const t = e.touches[0]; handleMove(t.clientX, t.clientY); }}
        ontouchend={(e) => { e.preventDefault(); handleEnd(); }}
        ontouchcancel={handleCancel}
        onmousedown={(e) => handleStart(i, e.clientX, e.clientY)}
        onmousemove={(e) => handleMove(e.clientX, e.clientY)}
        onmouseup={handleEnd}
        onmouseleave={handleCancel}
        {disabled}
      >
        {#if preview(i)}
          <span class="preview">{preview(i)}</span>
        {:else}
          {CENTER_KEYS[i].center}
        {/if}
      </button>
    {/each}
    <button
      class="flick-key space-key"
      class:active={spaceActive}
      ontouchstart={(e) => { e.preventDefault(); const t = e.touches[0]; handleSpaceStart(t.clientX, t.clientY); }}
      ontouchmove={(e) => { const t = e.touches[0]; handleSpaceMove(t.clientX, t.clientY); }}
      ontouchend={(e) => { e.preventDefault(); handleSpaceEnd(); }}
      ontouchcancel={() => { spaceActive = false; }}
      onmousedown={(e) => handleSpaceStart(e.clientX, e.clientY)}
      onmousemove={(e) => handleSpaceMove(e.clientX, e.clientY)}
      onmouseup={handleSpaceEnd}
      onmouseleave={() => { spaceActive = false; }}
      {disabled}
    >
      {spaceActive && spaceFlick === 'left' ? '全角' : '空白'}
    </button>

    <!-- 4段目 -->
    <button class="func-key mode-key" disabled>あa</button>
    {#each [9, 10, 11] as i}
      <button
        class="flick-key"
        class:active={activeIdx === i}
        ontouchstart={(e) => { e.preventDefault(); const t = e.touches[0]; handleStart(i, t.clientX, t.clientY); }}
        ontouchmove={(e) => { const t = e.touches[0]; handleMove(t.clientX, t.clientY); }}
        ontouchend={(e) => { e.preventDefault(); handleEnd(); }}
        ontouchcancel={handleCancel}
        onmousedown={(e) => handleStart(i, e.clientX, e.clientY)}
        onmousemove={(e) => handleMove(e.clientX, e.clientY)}
        onmouseup={handleEnd}
        onmouseleave={handleCancel}
        {disabled}
      >
        {#if preview(i)}
          <span class="preview">{preview(i)}</span>
        {:else}
          {CENTER_KEYS[i].center}
        {/if}
      </button>
    {/each}
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

  .grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0;
    padding: 4px 0 8px 0;
  }

  .flick-key,
  .func-key {
    position: relative;
    aspect-ratio: 5 / 3;
    font-size: 18px;
    font-weight: 500;
    border: 1px solid var(--color-gray-300);
    border-radius: 0;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .flick-key.active {
    background: var(--brand-light-bg);
    border-color: var(--brand);
  }

  .func-key {
    background: var(--color-gray-100);
    font-size: 14px;
  }

  .func-key:active {
    background: var(--color-gray-200);
  }

  .mode-key {
    color: var(--color-gray-500);
  }

  .preview {
    font-size: 22px;
    font-weight: 700;
    color: var(--brand);
  }

  .space-key {
    font-size: 14px;
  }

  .space-key.active {
    background: var(--brand-light-bg);
    border-color: var(--brand);
  }

  .submit-key {
    background: var(--brand);
    color: #fff;
    border-color: var(--brand);
    font-weight: 600;
  }

  .submit-key:active {
    background: var(--brand-hover);
  }
</style>
