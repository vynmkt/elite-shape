import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const JWT_SECRET = process.env.JWT_SECRET || 'elite-shape-secret-key-123';

function getPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });
}

async function queryOne(sql: string, params: any[] = []) {
  const pool = getPool();
  try {
    const result = await pool.query(sql, params);
    return result.rows[0] ?? null;
  } finally {
    await pool.end();
  }
}

async function queryRun(sql: string, params: any[] = []) {
  const pool = getPool();
  try {
    const result = await pool.query(sql, params);
    return { rows: result.rows, rowCount: result.rowCount };
  } finally {
    await pool.end();
  }
}

function signToken(id: number, email: string): string {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '30d' });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action as string;

  if (req.method === 'POST' && action === 'signup') {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Preencha todos os campos' });
    try {
      const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing) return res.status(400).json({ error: 'Email already exists' });
      const hash = await bcrypt.hash(password, 10);
      const result = await queryRun(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, is_premium, role',
        [email.toLowerCase(), hash, name]
      );
      const user = result.rows[0];
      return res.json({ token: signToken(user.id, user.email), user });
    } catch (e: any) {
      console.error('Signup error:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'POST' && action === 'login') {
    const { email, password } = req.body;
    try {
      const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Credenciais inválidas' });
      }
      return res.json({
        token: signToken(user.id, user.email),
        user: { id: user.id, email: user.email, name: user.name, is_premium: user.is_premium, role: user.role, theme: user.theme, language: user.language }
      });
    } catch (e: any) {
      console.error('Login error:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(404).json({ error: 'Rota não encontrada' });
}
