/** プレイ完了後、リザルト画面へ結果を引き渡すsessionStorage用ユーティリティ */
const KEY = 'play-result';

export type PlayResult = {
  // プレイ設定（リトライ時に再現するため）
  questionFieldKey: string;
  answerFieldKey: string;
  isMultipleChoice: boolean;
  isRanking: boolean;

  // 出題・回答
  idolNames: string[]; // 出題順
  answers: (string | null)[];
  timings: number[]; // 各問題の解答までにかかったms
  elapsed: number; // 総ms

  // 保存済みスコアID（ログイン時のみ）
  scoreId?: number;

  // リトライ用パラメータ（フィルタ等）
  playParams: Record<string, string>;
};

export function savePlayResult(result: PlayResult) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(result));
}

export function loadPlayResult(): PlayResult | null {
  if (typeof sessionStorage === 'undefined') return null;
  const saved = sessionStorage.getItem(KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as PlayResult;
  } catch {
    return null;
  }
}

export function clearPlayResult() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(KEY);
}
