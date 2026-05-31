import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
const JWT = process.env.JWT_SECRET || 'elite-shape-secret-key-123';
const db = () => new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 });
const q = async (s: string, p: any[] = []) => { const c = db(); try { return (await c.query(s, p)).rows; } finally { await c.end(); } };
const qr = async (s: string, p: any[] = []) => { const c = db(); try { await c.query(s, p); } finally { await c.end(); } };
const uid = (req: any): number | null => { const a = req.headers.authorization; if (!a?.startsWith('Bearer ')) return null; try { return (jwt.verify(a.slice(7), JWT) as any).id; } catch { return null; } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Não autorizado' });

  const path = req.url?.split('?')[0] || '';

  if (path.endsWith('/history')) {
    if (req.method === 'GET') return res.json(await q('SELECT * FROM shape_history WHERE user_id = $1 ORDER BY timestamp DESC', [userId]));
  }
  if (path.endsWith('/analysis')) {
    if (req.method === 'POST') {
      const { image_data, analysis, fat_percentage } = req.body;
      await qr('INSERT INTO shape_history (user_id,image_data,analysis,fat_percentage) VALUES ($1,$2,$3,$4)', [userId, image_data, analysis, fat_percentage]);
      return res.json({ success: true });
    }
  }
  // DELETE /api/shape/history/:id
  if (req.method === 'DELETE') {
    const id = path.split('/').pop();
    await qr('DELETE FROM shape_history WHERE id = $1 AND user_id = $2', [id, userId]);
    return res.json({ success: true });
  }

  res.status(404).json({ error: 'Rota não encontrada: ' + path });
}
