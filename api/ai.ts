import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'elite-shape-secret-key-123';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

function uid(req: any): number | null {
  try {
    const a = req.headers.authorization || req.headers['authorization'];
    if (!a || typeof a !== 'string' || !a.startsWith('Bearer ')) return null;
    const token = a.slice(7).trim();
    return (jwt.verify(token, JWT_SECRET) as any).id;
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: 'Não autorizado' });
  if (!OPENAI_API_KEY) return res.status(400).json({ error: 'OPENAI_API_KEY não configurada.' });

  const { prompt, systemInstruction, responseMimeType, images } = req.body;

  try {
    const userContent: any[] = [];
    if (prompt) userContent.push({ type: 'text', text: prompt });
    if (images?.length) {
      images.forEach((img: string) => {
        const base64 = img.includes('base64,') ? img : `data:image/jpeg;base64,${img}`;
        userContent.push({ type: 'image_url', image_url: { url: base64 } });
      });
    }

    const messages = [
      { role: 'system', content: systemInstruction || 'Você é um assistente fitness de elite.' },
      { role: 'user', content: userContent.length > 0 ? userContent : prompt || '' }
    ];

    const body: any = { model: 'gpt-4o-mini', messages, max_tokens: 8192, temperature: 0.4 };
    if (responseMimeType === 'application/json') body.response_format = { type: 'json_object' };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${OPENAI_API_KEY}` 
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error('OpenAI error:', errText);
      return res.status(500).json({ error: `OpenAI error ${r.status}` });
    }

    const text = (await r.json()).choices[0].message.content;
    return res.json({ text });
  } catch (e: any) {
    console.error('AI handler error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
