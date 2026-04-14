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

  const passwordHash = await hashPassword(password);
  const user = await db
    .prepare('SELECT id, nickname FROM users WHERE nickname = ? AND password_hash = ?')
    .bind(nickname.trim(), passwordHash)
    .first<{ id: number; nickname: string }>();

  if (!user) {
    return json({ error: 'ニックネームまたはパスワードが正しくありません' }, { status: 401 });
  }

  const token = generateToken();

  return json({ token, user: { id: user.id, nickname: user.nickname } }, {
    headers: {
      'Set-Cookie': `session=${user.id}:${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`
    }
  });
};
