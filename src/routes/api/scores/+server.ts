import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface ScoreDetail {
  idolName: string;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform?.env.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const { userId, course, timeMs, correctCount, totalCount, details } = await request.json() as {
    userId: number;
    course: string;
    timeMs: number;
    correctCount: number;
    totalCount: number;
    details?: ScoreDetail[];
  };

  if (!userId || !course || timeMs == null || correctCount == null || totalCount == null) {
    return json({ error: 'パラメータが不足しています' }, { status: 400 });
  }

  const result = await db
    .prepare('INSERT INTO scores (user_id, course, time_ms, correct_count, total_count) VALUES (?, ?, ?, ?, ?)')
    .bind(userId, course, timeMs, correctCount, totalCount)
    .run();

  const scoreId = result.meta.last_row_id;

  // 回答詳細を保存
  if (details?.length) {
    const stmt = db.prepare(
      'INSERT INTO score_details (score_id, question_idx, idol_name, correct_answer, user_answer, is_correct) VALUES (?, ?, ?, ?, ?, ?)'
    );
    await db.batch(
      details.map((d, i) =>
        stmt.bind(scoreId, i, d.idolName, d.correctAnswer, d.userAnswer, d.isCorrect ? 1 : 0)
      )
    );
  }

  return json({ id: scoreId });
};
