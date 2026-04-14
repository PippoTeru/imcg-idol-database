import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
  const db = platform?.env.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const course = url.searchParams.get('course') ?? 'furigana';

  // 各ユーザーのベストタイム（全問正解のみ）
  const ranking = await db
    .prepare(`
      SELECT u.nickname, s.time_ms, s.correct_count, s.total_count, s.played_at
      FROM scores s
      JOIN users u ON u.id = s.user_id
      WHERE s.course = ? AND s.correct_count = s.total_count
      AND s.time_ms = (
        SELECT MIN(s2.time_ms) FROM scores s2
        WHERE s2.user_id = s.user_id AND s2.course = s.course AND s2.correct_count = s2.total_count
      )
      ORDER BY s.time_ms ASC
    `)
    .bind(course)
    .all();

  return json({ ranking: ranking.results });
};
