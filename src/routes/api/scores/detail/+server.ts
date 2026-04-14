import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform }) => {
  const db = platform?.env.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const scoreId = url.searchParams.get('scoreId');
  if (!scoreId) return json({ error: 'scoreId is required' }, { status: 400 });

  const details = await db
    .prepare(`
      SELECT question_idx, idol_name, correct_answer, user_answer, is_correct
      FROM score_details
      WHERE score_id = ?
      ORDER BY question_idx ASC
    `)
    .bind(parseInt(scoreId))
    .all();

  return json({ details: details.results });
};
