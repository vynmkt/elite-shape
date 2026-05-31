import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const JWT_SECRET = process.env.JWT_SECRET || 'elite-shape-secret-key-123';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

function getPool() {
  return new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });
}

async function q(sql: string, params: any[] = []) {
  const pool = getPool();
  try { return (await pool.query(sql, params)).rows; } finally { await pool.end(); }
}

async function q1(sql: string, params: any[] = []) {
  const rows = await q(sql, params);
  return rows[0] ?? null;
}

async function qr(sql: string, params: any[] = []) {
  const pool = getPool();
  try { const r = await pool.query(sql, params); return { rows: r.rows, rowCount: r.rowCount }; } finally { await pool.end(); }
}

async function callOpenAI(messages: any[], jsonMode = false): Promise<string> {
  const body: any = { model: 'gpt-4o-mini', messages, max_tokens: 8192, temperature: 0.4 };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`OpenAI error ${r.status}: ${await r.text()}`);
  return (await r.json()).choices[0].message.content;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });
  let userId: number;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: number; email: string };
    userId = decoded.id;
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const slug = (req.query.slug as string[]) || [];
  const path = '/' + slug.join('/');
  const method = req.method;

  // PROFILE
  if (path === '/profile') {
    if (method === 'GET') {
      const profile = await q1('SELECT * FROM profiles WHERE user_id = $1', [userId]);
      const user = await q1('SELECT name, is_premium, role, points, theme, language FROM users WHERE id = $1', [userId]);
      return res.json({ ...profile, ...user });
    }
    if (method === 'POST') {
      const { age, height, weight, fat_percentage, gender, activity_level, personality_mode, training_time, routine, sleep, current_diet, financial_condition, objective, rest_days } = req.body;
      await qr(`INSERT INTO profiles (user_id,age,height,weight,fat_percentage,gender,activity_level,personality_mode,training_time,routine,sleep,current_diet,financial_condition,objective,rest_days) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (user_id) DO UPDATE SET age=$2,height=$3,weight=$4,fat_percentage=$5,gender=$6,activity_level=$7,personality_mode=$8,training_time=$9,routine=$10,sleep=$11,current_diet=$12,financial_condition=$13,objective=$14,rest_days=$15`,
        [userId, age, height, weight, fat_percentage, gender, activity_level, personality_mode, training_time, routine, sleep, current_diet, financial_condition, objective, rest_days || '[]']);
      return res.json({ success: true });
    }
  }

  // PLANS
  if (path === '/plans') {
    if (method === 'GET') {
      const plans = await q1('SELECT * FROM plans WHERE user_id = $1', [userId]);
      return res.json(plans || { training_plan: null, nutrition_plan: null, last_analysis: null, target_calories: null, target_protein: null, target_carbs: null, target_fat: null, training_schedule: null, nutrition_schedule: null });
    }
    if (method === 'POST') {
      const { training_plan, nutrition_plan, last_analysis, target_calories, target_protein, target_carbs, target_fat, training_schedule, nutrition_schedule } = req.body;
      const ts = typeof training_schedule === 'string' ? training_schedule : JSON.stringify(training_schedule);
      const ns = typeof nutrition_schedule === 'string' ? nutrition_schedule : JSON.stringify(nutrition_schedule);
      await qr(`INSERT INTO plans (user_id,training_plan,nutrition_plan,last_analysis,target_calories,target_protein,target_carbs,target_fat,training_schedule,nutrition_schedule) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (user_id) DO UPDATE SET training_plan=$2,nutrition_plan=$3,last_analysis=$4,target_calories=$5,target_protein=$6,target_carbs=$7,target_fat=$8,training_schedule=$9,nutrition_schedule=$10`,
        [userId, training_plan, nutrition_plan, last_analysis, target_calories, target_protein, target_carbs, target_fat, ts, ns]);
      return res.json({ success: true });
    }
  }

  // NUTRITION
  if (path === '/nutrition/daily' && method === 'GET') return res.json(await q('SELECT * FROM meals WHERE user_id = $1 AND timestamp > CURRENT_DATE', [userId]));
  if (path === '/nutrition/meal' && method === 'POST') {
    const { name, calories, protein, carbs, fat } = req.body;
    await qr('INSERT INTO meals (user_id,name,calories,protein,carbs,fat) VALUES ($1,$2,$3,$4,$5,$6)', [userId, name, calories, protein, carbs, fat]);
    await qr('UPDATE users SET points = points + 10 WHERE id = $1', [userId]);
    return res.json({ success: true });
  }

  // WEIGHT
  if (path === '/weight/history' && method === 'GET') return res.json(await q('SELECT * FROM weight_history WHERE user_id = $1 ORDER BY timestamp ASC', [userId]));
  if (path === '/weight' && method === 'POST') {
    const { weight } = req.body;
    await qr('INSERT INTO weight_history (user_id,weight) VALUES ($1,$2)', [userId, weight]);
    await qr('UPDATE profiles SET weight = $1 WHERE user_id = $2', [weight, userId]);
    return res.json({ success: true });
  }

  // WATER
  if (path === '/water/daily' && method === 'GET') {
    const row = await q1('SELECT SUM(amount) as total FROM water_logs WHERE user_id = $1 AND timestamp > CURRENT_DATE', [userId]);
    return res.json({ total: row?.total || 0 });
  }
  if (path === '/water' && method === 'POST') {
    await qr('INSERT INTO water_logs (user_id,amount) VALUES ($1,$2)', [userId, req.body.amount]);
    return res.json({ success: true });
  }

  // CHALLENGE
  if (path === '/challenge/status' && method === 'GET') {
    const challenge = await q1("SELECT * FROM challenges WHERE user_id = $1 AND status = 'active'", [userId]);
    const missions = await q1('SELECT * FROM daily_missions WHERE user_id = $1 AND date = CURRENT_DATE', [userId]);
    return res.json({ challenge, missions: missions || { protein_met: 0, training_done: 0, cardio_done: 0 } });
  }
  if (path === '/challenge/start' && method === 'POST') {
    await qr('INSERT INTO challenges (user_id) VALUES ($1)', [userId]);
    return res.json({ success: true });
  }
  if (path === '/challenge/mission' && method === 'POST') {
    const { type, value } = req.body;
    const allowed = ['protein_met', 'training_done', 'cardio_done'];
    if (!allowed.includes(type)) return res.status(400).json({ error: 'Tipo inválido' });
    const existing = await q1('SELECT * FROM daily_missions WHERE user_id = $1 AND date = CURRENT_DATE', [userId]);
    if (existing) await qr(`UPDATE daily_missions SET ${type} = $1 WHERE id = $2`, [value ? 1 : 0, existing.id]);
    else await qr(`INSERT INTO daily_missions (user_id, date, ${type}) VALUES ($1, CURRENT_DATE, $2)`, [userId, value ? 1 : 0]);
    if (value) await qr('UPDATE users SET points = points + 50 WHERE id = $1', [userId]);
    const missions: any = await q1('SELECT * FROM daily_missions WHERE user_id = $1 AND date = CURRENT_DATE', [userId]);
    if (missions?.protein_met && missions?.training_done && missions?.cardio_done) {
      const profile: any = await q1('SELECT last_mission_date, streak FROM profiles WHERE user_id = $1', [userId]);
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      if (profile && profile.last_mission_date !== today) {
        const newStreak = profile.last_mission_date === yesterday.toISOString().split('T')[0] ? (profile.streak || 0) + 1 : 1;
        const user: any = await q1('SELECT points FROM users WHERE id = $1', [userId]);
        const newLevel = user.points > 5000 ? 'Lenda' : user.points > 2000 ? 'Guerreiro' : user.points > 500 ? 'Atleta' : 'Frango';
        await qr('UPDATE profiles SET streak=$1, last_mission_date=$2, level=$3 WHERE user_id=$4', [newStreak, today, newLevel, userId]);
      }
    }
    return res.json({ success: true });
  }

  // SHAPE
  if (path === '/shape/history' && method === 'GET') return res.json(await q('SELECT * FROM shape_history WHERE user_id = $1 ORDER BY timestamp DESC', [userId]));
  if (path === '/shape/analysis' && method === 'POST') {
    const { image_data, analysis, fat_percentage } = req.body;
    await qr('INSERT INTO shape_history (user_id,image_data,analysis,fat_percentage) VALUES ($1,$2,$3,$4)', [userId, image_data, analysis, fat_percentage]);
    return res.json({ success: true });
  }

  // STATS
  if (path === '/stats/consistency' && method === 'GET') {
    const row = await q1(`SELECT COUNT(DISTINCT date) as count FROM daily_missions WHERE user_id=$1 AND (protein_met=1 AND training_done=1) AND date > CURRENT_DATE - INTERVAL '30 days'`, [userId]);
    return res.json({ percentage: Math.round(((row?.count || 0) / 30) * 100) });
  }

  // LEADERBOARD
  if (path === '/leaderboard' && method === 'GET') {
    return res.json(await q(`SELECT users.name, users.points, COALESCE(profiles.level,'Frango') as level, COALESCE(profiles.streak,0) as streak FROM users LEFT JOIN profiles ON users.id=profiles.user_id ORDER BY users.points DESC LIMIT 10`));
  }

  // TRAINING
  if (path === '/training/loads' && method === 'GET') return res.json(await q('SELECT * FROM load_tracking WHERE user_id=$1 ORDER BY timestamp DESC', [userId]));
  if (path === '/training/load' && method === 'POST') {
    const { exercise_name, weight, reps, sets } = req.body;
    await qr('INSERT INTO load_tracking (user_id,exercise_name,weight,reps,sets) VALUES ($1,$2,$3,$4,$5)', [userId, exercise_name, weight, reps, sets]);
    return res.json({ success: true });
  }

  // LOGS
  if (path === '/usage/log' && method === 'POST') {
    await qr('INSERT INTO usage_logs (user_id,type,tokens) VALUES ($1,$2,$3)', [userId, req.body.type, req.body.tokens || 0]);
    return res.json({ success: true });
  }
  if (path === '/logs/error' && method === 'POST') {
    await qr('INSERT INTO error_logs (user_id,error_message,stack_trace,context) VALUES ($1,$2,$3,$4)', [userId, req.body.message, req.body.stack, JSON.stringify(req.body.context)]);
    return res.json({ success: true });
  }
  if (path === '/user/settings' && method === 'POST') {
    await qr('UPDATE users SET theme=$1, language=$2 WHERE id=$3', [req.body.theme || 'dark', req.body.language || 'pt', userId]);
    return res.json({ success: true });
  }

  // AI CONFIG
  if (path === '/ai/config' && method === 'GET') return res.json({ active_ai_provider: 'openai', ai_fallback_enabled: '0' });

  // AI GENERATE
  if (path === '/ai/openai/generate' && method === 'POST') {
    if (!OPENAI_API_KEY) return res.status(400).json({ error: 'OPENAI_API_KEY não configurada.' });
    const { prompt, systemInstruction, responseMimeType, images } = req.body;
    try {
      const messages: any[] = [
        { role: 'system', content: systemInstruction || 'Você é um assistente fitness de elite.' },
        { role: 'user', content: [] }
      ];
      if (prompt) messages[1].content.push({ type: 'text', text: prompt });
      if (images?.length) images.forEach((img: string) => {
        const base64 = img.includes('base64,') ? img : `data:image/jpeg;base64,${img}`;
        messages[1].content.push({ type: 'image_url', image_url: { url: base64 } });
      });
      const text = await callOpenAI(messages, responseMimeType === 'application/json');
      return res.json({ text });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ADMIN
  if (path.startsWith('/admin')) {
    const adminUser = await q1('SELECT role FROM users WHERE id = $1', [userId]);
    if (!adminUser || adminUser.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    if (path === '/admin/users' && method === 'GET') {
      const search = `%${req.query.search || ''}%`;
      return res.json(await q('SELECT id,name,email,is_premium,role,created_at FROM users WHERE name ILIKE $1 OR email ILIKE $2 ORDER BY created_at DESC', [search, search]));
    }
    if (path === '/admin/stats' && method === 'GET') {
      const total = await q1('SELECT COUNT(*) as count FROM users');
      const premium = await q1('SELECT COUNT(*) as count FROM users WHERE is_premium = 1');
      const tokens = await q1('SELECT SUM(tokens) as count FROM usage_logs');
      return res.json({ totalUsers: parseInt(total?.count || 0), premiumUsers: parseInt(premium?.count || 0), totalTokens: parseInt(tokens?.count || 0) });
    }
    if (path === '/admin/ai-settings') return res.json({ active_ai_provider: 'openai', openai_api_key: '****', ai_fallback_enabled: '0' });
    const idPlan = path.match(/^\/admin\/user\/(\d+)\/plan$/);
    if (idPlan && method === 'POST') {
      await qr('UPDATE users SET is_premium = $1 WHERE id = $2', [req.body.is_premium ? 1 : 0, idPlan[1]]);
      return res.json({ success: true });
    }
    const idStats = path.match(/^\/admin\/user\/(\d+)\/stats$/);
    if (idStats && method === 'GET') return res.json(await q('SELECT type, SUM(tokens) as total_tokens, COUNT(*) as count FROM usage_logs WHERE user_id=$1 GROUP BY type', [idStats[1]]));
  }

  res.status(404).json({ error: `Rota não encontrada: ${path}` });
}
