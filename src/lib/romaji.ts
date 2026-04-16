/** ローマ字→ひらがな変換テーブル */
const ROMAJI_MAP: [string, string][] = [
  // 拗音・特殊
  ['sha', 'しゃ'], ['shi', 'し'], ['shu', 'しゅ'], ['sho', 'しょ'],
  ['cha', 'ちゃ'], ['chi', 'ち'], ['chu', 'ちゅ'], ['cho', 'ちょ'],
  ['tsu', 'つ'],
  ['kya', 'きゃ'], ['kyi', 'きぃ'], ['kyu', 'きゅ'], ['kyo', 'きょ'],
  ['gya', 'ぎゃ'], ['gyi', 'ぎぃ'], ['gyu', 'ぎゅ'], ['gyo', 'ぎょ'],
  ['nya', 'にゃ'], ['nyi', 'にぃ'], ['nyu', 'にゅ'], ['nyo', 'にょ'],
  ['hya', 'ひゃ'], ['hyi', 'ひぃ'], ['hyu', 'ひゅ'], ['hyo', 'ひょ'],
  ['bya', 'びゃ'], ['byi', 'びぃ'], ['byu', 'びゅ'], ['byo', 'びょ'],
  ['pya', 'ぴゃ'], ['pyi', 'ぴぃ'], ['pyu', 'ぴゅ'], ['pyo', 'ぴょ'],
  ['mya', 'みゃ'], ['myi', 'みぃ'], ['myu', 'みゅ'], ['myo', 'みょ'],
  ['rya', 'りゃ'], ['ryi', 'りぃ'], ['ryu', 'りゅ'], ['ryo', 'りょ'],
  ['jya', 'じゃ'], ['jyi', 'じぃ'], ['jyu', 'じゅ'], ['jyo', 'じょ'],
  ['ja', 'じゃ'], ['ju', 'じゅ'], ['jo', 'じょ'],
  ['dya', 'ぢゃ'], ['dyi', 'ぢぃ'], ['dyu', 'ぢゅ'], ['dyo', 'ぢょ'],
  // 基本
  ['ka', 'か'], ['ki', 'き'], ['ku', 'く'], ['ke', 'け'], ['ko', 'こ'],
  ['sa', 'さ'], ['si', 'し'], ['su', 'す'], ['se', 'せ'], ['so', 'そ'],
  ['ta', 'た'], ['ti', 'ち'], ['tu', 'つ'], ['te', 'て'], ['to', 'と'],
  ['na', 'な'], ['ni', 'に'], ['nu', 'ぬ'], ['ne', 'ね'], ['no', 'の'],
  ['ha', 'は'], ['hi', 'ひ'], ['hu', 'ふ'], ['he', 'へ'], ['ho', 'ほ'],
  ['ma', 'ま'], ['mi', 'み'], ['mu', 'む'], ['me', 'め'], ['mo', 'も'],
  ['ya', 'や'], ['yi', 'い'], ['yu', 'ゆ'], ['yo', 'よ'],
  ['ra', 'ら'], ['ri', 'り'], ['ru', 'る'], ['re', 'れ'], ['ro', 'ろ'],
  ['wa', 'わ'], ['wi', 'ゐ'], ['we', 'ゑ'], ['wo', 'を'],
  ['ga', 'が'], ['gi', 'ぎ'], ['gu', 'ぐ'], ['ge', 'げ'], ['go', 'ご'],
  ['za', 'ざ'], ['zi', 'じ'], ['zu', 'ず'], ['ze', 'ぜ'], ['zo', 'ぞ'],
  ['da', 'だ'], ['di', 'ぢ'], ['du', 'づ'], ['de', 'で'], ['do', 'ど'],
  ['ba', 'ば'], ['bi', 'び'], ['bu', 'ぶ'], ['be', 'べ'], ['bo', 'ぼ'],
  ['pa', 'ぱ'], ['pi', 'ぴ'], ['pu', 'ぷ'], ['pe', 'ぺ'], ['po', 'ぽ'],
  ['fa', 'ふぁ'], ['fi', 'ふぃ'], ['fu', 'ふ'], ['fe', 'ふぇ'], ['fo', 'ふぉ'],
  ['ji', 'じ'],
  // 母音
  ['a', 'あ'], ['i', 'い'], ['u', 'う'], ['e', 'え'], ['o', 'お'],
  // ん: n + 子音 or nn
  ['nn', 'ん'], ['n\'', 'ん'],
  // 小文字
  ['xa', 'ぁ'], ['xi', 'ぃ'], ['xu', 'ぅ'], ['xe', 'ぇ'], ['xo', 'ぉ'],
  ['xya', 'ゃ'], ['xyu', 'ゅ'], ['xyo', 'ょ'], ['xtu', 'っ'],
  // 記号
  ['-', 'ー'],
];

// 子音の文字（「ん」判定用）
const CONSONANTS = new Set('bcdfghjklmnpqrstvwxyz'.split(''));

/**
 * ローマ字文字列をひらがなに変換する。
 * 未変換のローマ字が末尾に残る場合はそのまま返す。
 */
export function romajiToHiragana(input: string): { text: string; pending: string } {
  let result = '';
  let buf = '';
  const lower = input.toLowerCase();

  let i = 0;
  while (i < lower.length) {
    buf += lower[i];
    i++;

    // 促音: 同じ子音が連続（nn以外）
    if (buf.length >= 2 && buf[0] === buf[1] && CONSONANTS.has(buf[0]) && buf[0] !== 'n') {
      result += 'っ';
      buf = buf.slice(1);
      continue;
    }

    // 「ん」: n + 子音（n以外）or n + 非アルファベット
    if (buf.length >= 2 && buf[0] === 'n' && buf[1] !== 'n' && CONSONANTS.has(buf[1]) && buf[1] !== 'y') {
      result += 'ん';
      buf = buf.slice(1);
      continue;
    }

    // テーブルマッチ（長い順に試す）
    let matched = false;
    for (const [rom, hira] of ROMAJI_MAP) {
      if (buf === rom) {
        result += hira;
        buf = '';
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // まだマッチの可能性があるかチェック
    const canMatch = ROMAJI_MAP.some(([rom]) => rom.startsWith(buf));
    if (!canMatch) {
      // マッチしない文字はそのまま出力
      result += buf[0];
      // 残りを再処理
      const rest = buf.slice(1);
      buf = '';
      // restを先頭に戻す
      i -= rest.length;
    }
  }

  return { text: result, pending: buf };
}
