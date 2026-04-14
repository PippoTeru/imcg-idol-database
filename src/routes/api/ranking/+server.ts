import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
  const db = platform?.env.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const course = url.searchParams.get('course') ?? 'furigana';

  // 各ユーザーのベストスコア（正答数が多い順、同じなら速い順）
  const ranking = await db
    .prepare(`
      SELECT u.nickname, s.time_ms, s.correct_count, s.total_count, s.played_at
      FROM scores s
      JOIN users u ON u.id = s.user_id
      WHERE s.course = ?
      AND (s.correct_count, -s.time_ms) = (
        SELECT s2.correct_count, -s2.time_ms FROM scores s2
        WHERE s2.user_id = s.user_id AND s2.course = s.course
        ORDER BY s2.correct_count DESC, s2.time_ms ASC
        LIMIT 1
      )
      ORDER BY s.correct_count DESC, s.time_ms ASC
    `)
    .bind(course)
    .all();

  return json({ ranking: ranking.results });
};
