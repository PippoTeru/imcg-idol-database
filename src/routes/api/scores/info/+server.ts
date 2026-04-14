import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
  const db = platform?.env.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const scoreId = url.searchParams.get('scoreId');
  if (!scoreId) return json({ error: 'scoreId is required' }, { status: 400 });

  const score = await db
    .prepare('SELECT time_ms, correct_count, total_count, played_at FROM scores WHERE id = ?')
    .bind(parseInt(scoreId))
    .first();

  return json({ score });
};
