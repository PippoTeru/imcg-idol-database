/** ローマ字→ひらがな変換テーブル（長い順にソート済み） */
const TABLE: [string, string][] = [
  // 4文字
  ['xtsu', 'っ'], ['ltsu', 'っ'],
  // 3文字: 拗音・特殊
  ['sha', 'しゃ'], ['shi', 'し'], ['shu', 'しゅ'], ['she', 'しぇ'], ['sho', 'しょ'],
  ['cha', 'ちゃ'], ['chi', 'ち'], ['chu', 'ちゅ'], ['che', 'ちぇ'], ['cho', 'ちょ'],
  ['tya', 'ちゃ'], ['tyi', 'ちぃ'], ['tyu', 'ちゅ'], ['tye', 'ちぇ'], ['tyo', 'ちょ'],
  ['cya', 'ちゃ'], ['cyi', 'ちぃ'], ['cyu', 'ちゅ'], ['cye', 'ちぇ'], ['cyo', 'ちょ'],
  ['tsu', 'つ'],
  ['kya', 'きゃ'], ['kyi', 'きぃ'], ['kyu', 'きゅ'], ['kye', 'きぇ'], ['kyo', 'きょ'],
  ['gya', 'ぎゃ'], ['gyi', 'ぎぃ'], ['gyu', 'ぎゅ'], ['gye', 'ぎぇ'], ['gyo', 'ぎょ'],
  ['sya', 'しゃ'], ['syi', 'しぃ'], ['syu', 'しゅ'], ['sye', 'しぇ'], ['syo', 'しょ'],
  ['zya', 'じゃ'], ['zyi', 'じぃ'], ['zyu', 'じゅ'], ['zye', 'じぇ'], ['zyo', 'じょ'],
  ['jya', 'じゃ'], ['jyi', 'じぃ'], ['jyu', 'じゅ'], ['jye', 'じぇ'], ['jyo', 'じょ'],
  ['nya', 'にゃ'], ['nyi', 'にぃ'], ['nyu', 'にゅ'], ['nye', 'にぇ'], ['nyo', 'にょ'],
  ['hya', 'ひゃ'], ['hyi', 'ひぃ'], ['hyu', 'ひゅ'], ['hye', 'ひぇ'], ['hyo', 'ひょ'],
  ['bya', 'びゃ'], ['byi', 'びぃ'], ['byu', 'びゅ'], ['bye', 'びぇ'], ['byo', 'びょ'],
  ['pya', 'ぴゃ'], ['pyi', 'ぴぃ'], ['pyu', 'ぴゅ'], ['pye', 'ぴぇ'], ['pyo', 'ぴょ'],
  ['mya', 'みゃ'], ['myi', 'みぃ'], ['myu', 'みゅ'], ['mye', 'みぇ'], ['myo', 'みょ'],
  ['rya', 'りゃ'], ['ryi', 'りぃ'], ['ryu', 'りゅ'], ['rye', 'りぇ'], ['ryo', 'りょ'],
  ['dya', 'ぢゃ'], ['dyi', 'ぢぃ'], ['dyu', 'ぢゅ'], ['dye', 'ぢぇ'], ['dyo', 'ぢょ'],
  ['dha', 'でゃ'], ['dhi', 'でぃ'], ['dhu', 'でゅ'], ['dhe', 'でぇ'], ['dho', 'でょ'],
  ['tha', 'てゃ'], ['thi', 'てぃ'], ['thu', 'てゅ'], ['the', 'てぇ'], ['tho', 'てょ'],
  ['wha', 'うぁ'], ['whi', 'うぃ'], ['whu', 'う'], ['whe', 'うぇ'], ['who', 'うぉ'],
  ['fya', 'ふゃ'], ['fyi', 'ふぃ'], ['fyu', 'ふゅ'], ['fye', 'ふぇ'], ['fyo', 'ふょ'],
  ['xya', 'ゃ'], ['xyu', 'ゅ'], ['xyo', 'ょ'],
  ['lya', 'ゃ'], ['lyi', 'ぃ'], ['lyu', 'ゅ'], ['lye', 'ぇ'], ['lyo', 'ょ'],
  ['xtu', 'っ'], ['ltu', 'っ'],
  ['xwa', 'ゎ'], ['lwa', 'ゎ'],
  ['xka', 'ゕ'], ['xke', 'ゖ'],
  // 2文字: 基本
  ['ka', 'か'], ['ki', 'き'], ['ku', 'く'], ['ke', 'け'], ['ko', 'こ'],
  ['sa', 'さ'], ['si', 'し'], ['su', 'す'], ['se', 'せ'], ['so', 'そ'],
  ['ta', 'た'], ['ti', 'ち'], ['tu', 'つ'], ['te', 'て'], ['to', 'と'],
  ['na', 'な'], ['ni', 'に'], ['nu', 'ぬ'], ['ne', 'ね'], ['no', 'の'],
  ['ha', 'は'], ['hi', 'ひ'], ['hu', 'ふ'], ['he', 'へ'], ['ho', 'ほ'],
  ['ma', 'ま'], ['mi', 'み'], ['mu', 'む'], ['me', 'め'], ['mo', 'も'],
  ['ya', 'や'], ['yi', 'い'], ['yu', 'ゆ'], ['ye', 'いぇ'], ['yo', 'よ'],
  ['ra', 'ら'], ['ri', 'り'], ['ru', 'る'], ['re', 'れ'], ['ro', 'ろ'],
  ['wa', 'わ'], ['wi', 'ゐ'], ['we', 'ゑ'], ['wo', 'を'],
  ['ga', 'が'], ['gi', 'ぎ'], ['gu', 'ぐ'], ['ge', 'げ'], ['go', 'ご'],
  ['za', 'ざ'], ['zi', 'じ'], ['zu', 'ず'], ['ze', 'ぜ'], ['zo', 'ぞ'],
  ['da', 'だ'], ['di', 'ぢ'], ['du', 'づ'], ['de', 'で'], ['do', 'ど'],
  ['ba', 'ば'], ['bi', 'び'], ['bu', 'ぶ'], ['be', 'べ'], ['bo', 'ぼ'],
  ['pa', 'ぱ'], ['pi', 'ぴ'], ['pu', 'ぷ'], ['pe', 'ぺ'], ['po', 'ぽ'],
  ['fa', 'ふぁ'], ['fi', 'ふぃ'], ['fu', 'ふ'], ['fe', 'ふぇ'], ['fo', 'ふぉ'],
  ['ja', 'じゃ'], ['ji', 'じ'], ['ju', 'じゅ'], ['je', 'じぇ'], ['jo', 'じょ'],
  ['ca', 'か'], ['ci', 'し'], ['cu', 'く'], ['ce', 'せ'], ['co', 'こ'],
  ['la', 'ぁ'], ['li', 'ぃ'], ['lu', 'ぅ'], ['le', 'ぇ'], ['lo', 'ぉ'],
  ['xa', 'ぁ'], ['xi', 'ぃ'], ['xu', 'ぅ'], ['xe', 'ぇ'], ['xo', 'ぉ'],
  ['va', 'ゔぁ'], ['vi', 'ゔぃ'], ['vu', 'ゔ'], ['ve', 'ゔぇ'], ['vo', 'ゔぉ'],
  ['nn', 'ん'], ["n'", 'ん'],
  // 1文字: 母音・記号
  ['a', 'あ'], ['i', 'い'], ['u', 'う'], ['e', 'え'], ['o', 'お'],
  ['-', 'ー'],
  ['/', '・'],
  ['.', '。'],
  [',', '、'],
];

const CONSONANTS = new Set('bcdfghjklmnpqrstvwxyz'.split(''));
const VOWELS = new Set('aiueo'.split(''));

function tryConvert(buf: string): { matched: string; rest: string } | null {
  for (const [rom, hira] of TABLE) {
    if (buf.startsWith(rom)) {
      return { matched: hira, rest: buf.slice(rom.length) };
    }
  }
  return null;
}

function canMatchPrefix(buf: string): boolean {
  return TABLE.some(([rom]) => rom.startsWith(buf));
}

/**
 * ローマ字入力の状態を管理するクラス。
 * 確定済みひらがなと未確定バッファを分けて管理し、
 * Backspaceで確定済みひらがなを1文字ずつ削除できる。
 */
export class RomajiState {
  /** 確定済みひらがな */
  confirmed: string = '';
  /** 未確定のローマ字バッファ */
  pending: string = '';

  /** 表示用テキスト */
  get display(): string {
    return this.confirmed + this.pending;
  }

  /** 回答として送信する値（確定済みのみ） */
  get submitValue(): string {
    return this.confirmed;
  }

  /** 1文字追加 */
  addChar(ch: string): RomajiState {
    const next = new RomajiState();
    next.confirmed = this.confirmed;
    next.pending = this.pending + ch.toLowerCase();
    next.flush();
    return next;
  }

  /** Backspace */
  backspace(): RomajiState {
    const next = new RomajiState();
    if (this.pending.length > 0) {
      // 未確定バッファから1文字削除
      next.confirmed = this.confirmed;
      next.pending = this.pending.slice(0, -1);
    } else if (this.confirmed.length > 0) {
      // 確定済みひらがなを1文字削除
      next.confirmed = this.confirmed.slice(0, -1);
      next.pending = '';
    }
    return next;
  }

  /** リセット */
  static empty(): RomajiState {
    return new RomajiState();
  }

  /** バッファを処理して確定できる部分を確定する */
  private flush(): void {
    let buf = this.pending;

    while (buf.length > 0) {
      // 促音: 同じ子音が連続（nn以外）
      if (buf.length >= 2 && buf[0] === buf[1] && CONSONANTS.has(buf[0]) && buf[0] !== 'n') {
        this.confirmed += 'っ';
        buf = buf.slice(1);
        continue;
      }

      // 「ん」: n + 子音（n, y以外）
      if (buf.length >= 2 && buf[0] === 'n' && !VOWELS.has(buf[1]) && buf[1] !== 'n' && buf[1] !== 'y') {
        this.confirmed += 'ん';
        buf = buf.slice(1);
        continue;
      }

      // テーブルマッチ
      const match = tryConvert(buf);
      if (match) {
        this.confirmed += match.matched;
        buf = match.rest;
        continue;
      }

      // まだマッチの可能性があるなら待機
      if (canMatchPrefix(buf)) {
        break;
      }

      // マッチしない先頭文字を確定出力して再試行
      this.confirmed += buf[0];
      buf = buf.slice(1);
    }

    this.pending = buf;
  }
}
