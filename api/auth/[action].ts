// api/auth/[action].ts — handles /api/auth/signup and /api/auth/login
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { queryOne, queryRun } from '../_db';
import { signToken } from '../_auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  if (req.method === 'POST' && action === 'signup') {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Preencha todos os campos' });
    try {
      const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing) return res.status(400).json({ error: 'Email already exists' });
      const hash = await bcrypt.hash(password, 10);
      const result = await queryRun('INSERT INTO users (email, password, name) VALUES ($1,$2,$3) RETURNING id, email, name, is_premium, role', [email.toLowerCase(), hash, name]);
      const user = result.rows[0];
      return res.json({ token: signToken(user.id, user.email), user });
    } catch (e: any) {
      return res.status(400).json({ error: 'Email already exists' });
    }
  }

  if (req.method === 'POST' && action === 'login') {
    const { email, password } = req.body;
    try {
      const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Credenciais inválidas' });
      }
      return res.json({ token: signToken(user.id, user.email), user: { id: user.id, email: user.email, name: user.name, is_premium: user.is_premium, role: user.role, theme: user.theme, language: user.language } });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(404).json({ error: 'Rota não encontrada' });
}
