import { Pool } from 'pg';

let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export async function query(sql: string, params: any[] = []) {
  const db = getDb();
  const result = await db.query(sql, params);
  return result.rows;
}

export async function queryOne(sql: string, params: any[] = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

export async function queryRun(sql: string, params: any[] = []) {
  const db = getDb();
  const result = await db.query(sql, params);
  return { rowCount: result.rowCount, rows: result.rows };
}
