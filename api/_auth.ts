import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || 'elite-shape-secret-key-123';

export interface AuthRequest extends VercelRequest {
  user?: { id: number; email: string };
}

export type Handler = (req: AuthRequest, res: VercelResponse) => Promise<any> | any;

export function withAuth(handler: Handler) {
  return async (req: AuthRequest, res: VercelResponse) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido' });
    try {
      const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { id: number; email: string };
      req.user = decoded;
      return handler(req, res);
    } catch {
      return res.status(401).json({ error: 'Token inválido. Faça login novamente.' });
    }
  };
}

export function withAdminAuth(handler: Handler) {
  return withAuth(async (req: AuthRequest, res: VercelResponse) => {
    const { queryOne } = await import('./_db');
    const user = await queryOne('SELECT role FROM users WHERE id = $1', [req.user!.id]);
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    return handler(req, res);
  });
}

export function signToken(id: number, email: string): string {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '30d' });
}
