import type { Idol, RangeFilter } from '$lib/columns';

const DAYS_IN_MONTH = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function parseNum(s: string): number | null {
  const n = parseInt(s);
  return isNaN(n) ? null : n;
}

export function parseNums(arr: string[]): number[] {
  return arr.map((s) => parseInt(s)).filter((n) => !isNaN(n));
}

export function computeRange(values: number[]): RangeFilter {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return { min, max, dataMin: min, dataMax: max };
}

export function parseBirthdayToDoy(s: string): number | null {
  const m = s.match(/(\d+)月(\d+)日/);
  if (!m) return null;
  let doy = parseInt(m[2]);
  for (let i = 1; i < parseInt(m[1]); i++) doy += DAYS_IN_MONTH[i];
  return doy;
}

export function dayOfYearToStr(doy: number): string {
  let month = 1;
  let remaining = doy;
  while (month <= 12 && remaining > DAYS_IN_MONTH[month]) {
    remaining -= DAYS_IN_MONTH[month];
    month++;
  }
  return `${month}月${remaining}日`;
}

export function inRange(val: number | null, r: RangeFilter): boolean {
  const moved = r.min !== r.dataMin || r.max !== r.dataMax;
  if (val === null) return !moved;
  return val >= r.min && val <= r.max;
}

export function filterIdols(
  idols: Idol[],
  filters: {
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
  }
): Idol[] {
  return idols.filter((idol) => {
    if (filters.bloodType && idol.blood_type !== filters.bloodType) return false;
    if (filters.zodiac && idol.zodiac !== filters.zodiac) return false;
    if (filters.birthplace && idol.birthplace !== filters.birthplace) return false;
    if (filters.hand && idol.dominant_hand !== filters.hand) return false;

    // Age
    if (filters.nonNumAge) {
      if (parseNum(idol.age) !== null) return false;
    } else if (filters.age) {
      if (!inRange(parseNum(idol.age), filters.age)) return false;
    }

    // Height
    if (filters.height && !inRange(parseNum(idol.height), filters.height)) return false;

    // Weight
    if (filters.nonNumWeight) {
      if (parseNum(idol.weight) !== null) return false;
    } else if (filters.weight) {
      if (!inRange(parseNum(idol.weight), filters.weight)) return false;
    }

    // Three sizes
    const sizes = idol.three_sizes.split('/');
    if (filters.nonNumSizes) {
      if (parseNum(sizes[0]) !== null) return false;
    } else {
      if (filters.bust && !inRange(parseNum(sizes[0]), filters.bust)) return false;
      if (filters.waist && !inRange(parseNum(sizes[1]), filters.waist)) return false;
      if (filters.hip && !inRange(parseNum(sizes[2]), filters.hip)) return false;
    }

    // Birthday
    if (filters.bday && !inRange(parseBirthdayToDoy(idol.birthday), filters.bday)) return false;

    return true;
  });
}

/** テキスト内のキーワードをハイライト */
export function highlight(text: string, keyword: string): string {
  if (!keyword.trim()) return text;
  const keywords = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let result = text;
  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
  }
  return result;
}

/** HTML内のテキスト部分のみキーワードをハイライト */
export function highlightHtml(html: string, keyword: string): string {
  if (!keyword.trim()) return html;
  return html.replace(/([^<>]+)(?=<|$)/g, (text) => highlight(text, keyword));
}
