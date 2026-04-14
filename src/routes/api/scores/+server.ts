import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform?.env.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const { userId, course, timeMs, correctCount, totalCount } = await request.json();

  if (!userId || !course || timeMs == null || correctCount == null || totalCount == null) {
    return json({ error: 'パラメータが不足しています' }, { status: 400 });
  }

  const result = await db
    .prepare('INSERT INTO scores (user_id, course, time_ms, correct_count, total_count) VALUES (?, ?, ?, ?, ?)')
    .bind(userId, course, timeMs, correctCount, totalCount)
    .run();

  return json({ id: result.meta.last_row_id });
};
