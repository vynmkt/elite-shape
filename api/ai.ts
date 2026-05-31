import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'elite-shape-secret-key-123';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

function uid(req: any): number | null {
  const a = req.headers.authorization;
  if (!a?.startsWith('Bearer ')) return null;
  try { return (jwt.verify(a.slice(7), JWT_SECRET) as any).id; } catch { return null; }
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
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Não autorizado' });
  if (req.method !== 'POST') return res.status(405).end();
  if (!OPENAI_API_KEY) return res.status(400).json({ error: 'OPENAI_API_KEY não configurada.' });

  // Handle /api/ai/config via query or directly
  const action = (req.query.action as string) || '';

  if (action === 'config' || req.url?.includes('/config')) {
    return res.json({ active_ai_provider: 'openai', ai_fallback_enabled: '0' });
  }

  const { prompt, systemInstruction, responseMimeType, images } = req.body;

  try {
    const messages: any[] = [
      { role: 'system', content: systemInstruction || 'Você é um assistente fitness de elite.' },
      { role: 'user', content: [] as any[] }
    ];
    if (prompt) (messages[1].content as any[]).push({ type: 'text', text: prompt });
    if (images?.length) {
      images.forEach((img: string) => {
        const base64 = img.includes('base64,') ? img : `data:image/jpeg;base64,${img}`;
        (messages[1].content as any[]).push({ type: 'image_url', image_url: { url: base64 } });
      });
    }
    const text = await callOpenAI(messages, responseMimeType === 'application/json');
    return res.json({ text });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
