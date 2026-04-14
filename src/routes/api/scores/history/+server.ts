import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
  const db = platform?.env.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const userId = url.searchParams.get('userId');
  const course = url.searchParams.get('course') ?? 'furigana';

  if (!userId) {
    return json({ error: 'userId is required' }, { status: 400 });
  }

  const history = await db
    .prepare(`
      SELECT id, time_ms, correct_count, total_count, played_at
      FROM scores
      WHERE user_id = ? AND course = ?
      ORDER BY played_at DESC
    `)
    .bind(parseInt(userId), course)
    .all();

  return json({ history: history.results });
};
