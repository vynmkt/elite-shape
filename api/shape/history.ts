import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
const JWT = process.env.JWT_SECRET || 'elite-shape-secret-key-123';
const db = () => new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 });
const uid = (req: any): number | null => { 
  const a = req.headers.authorization; 
  if (!a?.startsWith('Bearer ')) return null; 
  try { return (jwt.verify(a.slice(7), JWT) as any).id; } catch { return null; } 
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Não autorizado' });
  
  const c = db();
  try {
    if (req.method === 'GET') {
      const result = await c.query('SELECT * FROM shape_history WHERE user_id = $1 ORDER BY timestamp DESC', [userId]);
      return res.json(result.rows);
    }
    if (req.method === 'POST') {
      const { image_data, analysis, fat_percentage } = req.body;
      await c.query('INSERT INTO shape_history (user_id,image_data,analysis,fat_percentage) VALUES ($1,$2,$3,$4)', [userId, image_data, analysis, fat_percentage]);
      return res.json({ success: true });
    }
    res.status(405).end();
  } finally { await c.end(); }
}
