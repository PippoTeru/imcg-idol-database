import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface ScoreDetail {
  idolName: string;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
  timeMs?: number;
}

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform?.env.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const body = await request.json() as {
    userId: number;
    mode?: 'quiz' | 'ranking';
    course?: string | null;
    questionField?: string;
    answerField?: string;
    isMultipleChoice?: boolean;
    timeMs: number;
    correctCount: number;
    totalCount: number;
    details?: ScoreDetail[];
  };

  const { userId, timeMs, correctCount, totalCount, details } = body;
  const mode = body.mode ?? 'ranking';
  const course = body.course ?? null;
  const questionField = body.questionField ?? null;
  const answerField = body.answerField ?? null;
  const isMultipleChoice = body.isMultipleChoice ? 1 : 0;

  if (!userId || timeMs == null || correctCount == null || totalCount == null) {
    return json({ error: 'パラメータが不足しています' }, { status: 400 });
  }

  const result = await db
    .prepare(`
      INSERT INTO scores (user_id, mode, course, question_field, answer_field, is_multiple_choice, time_ms, correct_count, total_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(userId, mode, course, questionField, answerField, isMultipleChoice, timeMs, correctCount, totalCount)
    .run();

  const scoreId = result.meta.last_row_id;

  // 回答詳細を保存
  if (details?.length) {
    const stmt = db.prepare(
      'INSERT INTO score_details (score_id, question_idx, idol_name, correct_answer, user_answer, is_correct, time_ms) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    await db.batch(
      details.map((d, i) =>
        stmt.bind(scoreId, i, d.idolName, d.correctAnswer, d.userAnswer, d.isCorrect ? 1 : 0, d.timeMs ?? 0)
      )
    );
  }

  return json({ id: scoreId });
};
