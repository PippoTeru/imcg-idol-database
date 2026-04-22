import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * マイページ用の統計データをまとめて返す。
 *   - summary: 総プレイ数、総問題数、総正答数
 *   - modes: 出題条件（mode × questionField × answerField × isMultipleChoice）別の集計
 *   - recent: 最近のプレイ10件
 */
export const GET: RequestHandler = async ({ url, platform }) => {
  const db = platform?.env.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const userId = url.searchParams.get('userId');
  if (!userId) return json({ error: 'userId is required' }, { status: 400 });
  const uid = parseInt(userId);

  // 総計
  const summary = await db
    .prepare(`
      SELECT
        COUNT(*) AS play_count,
        COALESCE(SUM(total_count), 0) AS total_questions,
        COALESCE(SUM(correct_count), 0) AS total_correct
      FROM scores WHERE user_id = ?
    `)
    .bind(uid)
    .first<{ play_count: number; total_questions: number; total_correct: number }>();

  // 条件別集計
  const modes = await db
    .prepare(`
      SELECT
        mode, question_field, answer_field, is_multiple_choice,
        COUNT(*) AS play_count,
        SUM(total_count) AS total_questions,
        SUM(correct_count) AS total_correct,
        SUM(time_ms) AS total_time_ms
      FROM scores WHERE user_id = ?
      GROUP BY mode, question_field, answer_field, is_multiple_choice
      ORDER BY play_count DESC
    `)
    .bind(uid)
    .all();

  // 最近のプレイ10件
  const recent = await db
    .prepare(`
      SELECT
        id, mode, course, question_field, answer_field, is_multiple_choice,
        time_ms, correct_count, total_count, played_at
      FROM scores WHERE user_id = ?
      ORDER BY played_at DESC
      LIMIT 10
    `)
    .bind(uid)
    .all();

  return json({
    summary: summary ?? { play_count: 0, total_questions: 0, total_correct: 0 },
    modes: modes.results,
    recent: recent.results,
  });
};
