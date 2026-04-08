import type { Idol } from '$lib/columns';

export interface QuizField {
  key: string;
  label: string;
  get: (i: Idol) => string;
  type: 'text' | 'image';
}

export const quizFields: QuizField[] = [
  { key: 'name', label: '名前', get: (i) => i.name, type: 'text' },
  { key: 'furigana', label: 'ふりがな', get: (i) => i.furigana, type: 'text' },
  { key: 'age', label: '年齢', get: (i) => i.age, type: 'text' },
  { key: 'height', label: '身長', get: (i) => i.height, type: 'text' },
  { key: 'weight', label: '体重', get: (i) => i.weight, type: 'text' },
  { key: 'birthday', label: '誕生日', get: (i) => i.birthday, type: 'text' },
  { key: 'blood_type', label: '血液型', get: (i) => i.blood_type, type: 'text' },
  { key: 'zodiac', label: '星座', get: (i) => i.zodiac, type: 'text' },
  { key: 'birthplace', label: '出身地', get: (i) => i.birthplace, type: 'text' },
  { key: 'dominant_hand', label: '利き手', get: (i) => i.dominant_hand, type: 'text' },
  { key: 'three_sizes', label: 'スリーサイズ', get: (i) => i.three_sizes, type: 'text' },
  { key: 'hobby', label: '趣味', get: (i) => i.hobby, type: 'text' },
  { key: 'cv', label: 'CV', get: (i) => i.cv || '-', type: 'text' },
  { key: 'description', label: '説明文', get: (i) => i.description, type: 'text' },
  { key: 'img_detail', label: '立ち絵', get: (i) => i.img_detail, type: 'image' },
  { key: 'img_sd', label: 'SDイラスト', get: (i) => i.img_sd, type: 'image' }
];

export interface QuizQuestion {
  idol: Idol;
  choices?: string[];
}

export function generateQuiz(
  idols: Idol[],
  answerField: QuizField,
  count: number,
  isMultipleChoice: boolean
): QuizQuestion[] {
  const shuffled = [...idols].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((idol) => {
    let choices: string[] | undefined;
    if (isMultipleChoice) {
      const correct = answerField.get(idol);
      const others = idols
        .filter((i) => answerField.get(i) !== correct)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((i) => answerField.get(i));
      choices = [...others, correct].sort(() => Math.random() - 0.5);
    }
    return { idol, choices };
  });
}
