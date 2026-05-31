import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
const JWT = process.env.JWT_SECRET || 'elite-shape-secret-key-123';
const db = () => new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 });
const uid = (req: any): number | null => { const a = req.headers.authorization; if (!a?.startsWith('Bearer ')) return null; try { return (jwt.verify(a.slice(7), JWT) as any).id; } catch { return null; } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Não autorizado' });
  try {
    const { message, stack, context } = req.body;
    const c = db();
    await c.query('INSERT INTO error_logs (user_id,error_message,stack_trace,context) VALUES ($1,$2,$3,$4)', [userId, message, stack, JSON.stringify(context)]);
    await c.end();
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
