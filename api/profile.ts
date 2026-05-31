import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'elite-shape-secret-key-123';
function getPool() { return new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 }); }
async function q(sql: string, params: any[] = []) { const pool = getPool(); try { return (await pool.query(sql, params)).rows; } finally { await pool.end(); } }
async function q1(sql: string, params: any[] = []) { return (await q(sql, params))[0] ?? null; }
async function qr(sql: string, params: any[] = []) { const pool = getPool(); try { return (await pool.query(sql, params)).rows; } finally { await pool.end(); } }
function uid(req: any): number | null { const a = req.headers.authorization; if (!a?.startsWith('Bearer ')) return null; try { return (jwt.verify(a.slice(7), JWT_SECRET) as any).id; } catch { return null; } }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Não autorizado' });

  if (req.method === 'GET') {
    const profile = await q1('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    const user = await q1('SELECT name, is_premium, role, points, theme, language FROM users WHERE id = $1', [userId]);
    return res.json({ ...profile, ...user });
  }

  if (req.method === 'POST') {
    const { age, height, weight, fat_percentage, gender, activity_level, personality_mode, training_time, routine, sleep, current_diet, financial_condition, objective, rest_days } = req.body;
    await qr(`INSERT INTO profiles (user_id,age,height,weight,fat_percentage,gender,activity_level,personality_mode,training_time,routine,sleep,current_diet,financial_condition,objective,rest_days) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (user_id) DO UPDATE SET age=$2,height=$3,weight=$4,fat_percentage=$5,gender=$6,activity_level=$7,personality_mode=$8,training_time=$9,routine=$10,sleep=$11,current_diet=$12,financial_condition=$13,objective=$14,rest_days=$15`,
      [userId, age, height, weight, fat_percentage, gender, activity_level, personality_mode, training_time, routine, sleep, current_diet, financial_condition, objective, rest_days || '[]']);
    return res.json({ success: true });
  }

  res.status(405).end();
}
