import idols from '$lib/data/idol_data.json';
import cvData from '$lib/data/cv_data.json';

export type Idol = (typeof idols)[number];

export type RangeFilter = { min: number; max: number; dataMin: number; dataMax: number };

export interface Column {
  label: string;
  group?: string;
  get: (i: Idol) => string;
  html?: (i: Idol) => string;
  sortValue?: (i: Idol) => string | number;
}

export const cvMap = new Map(cvData.map((cv) => [cv.name, cv.furigana]));

function parseNum(s: string): number {
  const n = parseInt(s);
  return isNaN(n) ? Infinity : n;
}

function parseBirthday(s: string): number {
  const m = s.match(/(\d+)月(\d+)日/);
  if (!m) return Infinity;
  return parseInt(m[1]) * 100 + parseInt(m[2]);
}

export const columns: Column[] = [
  {
    label: '名前',
    get: (i) => i.name,
    html: (i) =>
      `<span class="ruby-wrap"><ruby>${i.name}<rp>(</rp><rt>${i.furigana}</rt><rp>)</rp></ruby></span>`,
    sortValue: (i) => i.furigana
  },
  { label: '年齢', get: (i) => i.age, sortValue: (i) => parseNum(i.age) },
  { label: '身長', get: (i) => i.height, sortValue: (i) => parseNum(i.height) },
  { label: '体重', get: (i) => i.weight, sortValue: (i) => parseNum(i.weight) },
  {
    label: 'B',
    group: 'スリーサイズ',
    get: (i) => i.three_sizes.split('/')[0],
    sortValue: (i) => parseNum(i.three_sizes.split('/')[0])
  },
  {
    label: 'W',
    group: 'スリーサイズ',
    get: (i) => i.three_sizes.split('/')[1],
    sortValue: (i) => parseNum(i.three_sizes.split('/')[1])
  },
  {
    label: 'H',
    group: 'スリーサイズ',
    get: (i) => i.three_sizes.split('/')[2],
    sortValue: (i) => parseNum(i.three_sizes.split('/')[2])
  },
  { label: '誕生日', get: (i) => i.birthday, sortValue: (i) => parseBirthday(i.birthday) },
  { label: '星座', get: (i) => i.zodiac },
  {
    label: '血液型',
    get: (i) => i.blood_type,
    sortValue: (i) => ({ A型: 0, B型: 1, O型: 2, AB型: 3 })[i.blood_type] ?? 4
  },
  { label: '利き手', get: (i) => i.dominant_hand },
  { label: '出身地', get: (i) => i.birthplace },
  { label: '趣味', get: (i) => i.hobby },
  {
    label: 'CV',
    get: (i) => i.cv || '-',
    html: (i) => {
      if (!i.cv) return '-';
      const furigana = cvMap.get(i.cv);
      if (!furigana) return i.cv;
      return `<span class="ruby-wrap"><ruby>${i.cv}<rp>(</rp><rt>${furigana}</rt><rp>)</rp></ruby></span>`;
    },
    sortValue: (i) => (i.cv ? cvMap.get(i.cv) ?? i.cv : 'ん')
  }
];
