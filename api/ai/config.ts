import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({ active_ai_provider: 'openai', ai_fallback_enabled: '0' });
}
