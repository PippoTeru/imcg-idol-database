import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hashPassword, generateToken } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, platform }) => {
  const db = platform?.env.DB;
  if (!db) return json({ error: 'DB unavailable' }, { status: 500 });

  const { nickname, password } = await request.json();

  if (!nickname?.trim() || !password) {
    return json({ error: 'ニックネームとパスワードは必須です' }, { status: 400 });
  }
  if (nickname.length > 20) {
    return json({ error: 'ニックネームは20文字以内です' }, { status: 400 });
  }
  if (password.length < 4) {
    return json({ error: 'パスワードは4文字以上です' }, { status: 400 });
  }

  const existing = await db.prepare('SELECT id FROM users WHERE nickname = ?').bind(nickname.trim()).first();
  if (existing) {
    return json({ error: 'このニックネームは既に使われています' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const result = await db
    .prepare('INSERT INTO users (nickname, password_hash) VALUES (?, ?)')
    .bind(nickname.trim(), passwordHash)
    .run();

  const token = generateToken();
  const userId = result.meta.last_row_id;

  return json({ token, user: { id: userId, nickname: nickname.trim() } }, {
    headers: {
      'Set-Cookie': `session=${userId}:${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`
    }
  });
};
