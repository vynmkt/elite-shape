import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'elite-shape-secret-key-123';
function getPool() { return new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 2 }); }
async function q1(sql: string, params: any[] = []) { const pool = getPool(); try { return (await pool.query(sql, params)).rows[0] ?? null; } finally { await pool.end(); } }
async function qr(sql: string, params: any[] = []) { const pool = getPool(); try { return (await pool.query(sql, params)).rows; } finally { await pool.end(); } }
function uid(req: any): number | null { const a = req.headers.authorization; if (!a?.startsWith('Bearer ')) return null; try { return (jwt.verify(a.slice(7), JWT_SECRET) as any).id; } catch { return null; } }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Não autorizado' });

  if (req.method === 'GET') {
    const plans = await q1('SELECT * FROM plans WHERE user_id = $1', [userId]);
    return res.json(plans || { training_plan: null, nutrition_plan: null, last_analysis: null, target_calories: null, target_protein: null, target_carbs: null, target_fat: null, training_schedule: null, nutrition_schedule: null });
  }

  if (req.method === 'POST') {
    const { training_plan, nutrition_plan, last_analysis, target_calories, target_protein, target_carbs, target_fat, training_schedule, nutrition_schedule } = req.body;
    const ts = typeof training_schedule === 'string' ? training_schedule : JSON.stringify(training_schedule);
    const ns = typeof nutrition_schedule === 'string' ? nutrition_schedule : JSON.stringify(nutrition_schedule);
    await qr(`INSERT INTO plans (user_id,training_plan,nutrition_plan,last_analysis,target_calories,target_protein,target_carbs,target_fat,training_schedule,nutrition_schedule) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (user_id) DO UPDATE SET training_plan=$2,nutrition_plan=$3,last_analysis=$4,target_calories=$5,target_protein=$6,target_carbs=$7,target_fat=$8,training_schedule=$9,nutrition_schedule=$10`,
      [userId, training_plan, nutrition_plan, last_analysis, target_calories, target_protein, target_carbs, target_fat, ts, ns]);
    return res.json({ success: true });
  }

  res.status(405).end();
}
