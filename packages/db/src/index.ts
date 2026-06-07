import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export { eq, and, desc, like, sql } from 'drizzle-orm';

const databaseUrl = process.env.DATABASE_URL;

let db;
let pool;
if (databaseUrl) {
  console.log(`[db] DATABASE_URL (first 80 chars)=${databaseUrl.substring(0, 80)} len=${databaseUrl.length}`);
  try {
    const u = new URL(databaseUrl);
    console.log(`[db] parsed: host=${u.hostname} port=${u.port} db=${u.pathname.slice(1)} protocol=${u.protocol}`);
  } catch (e) {
    console.error(`[db] URL parse FAILED: ${(e as Error).message}`);
  }
  pool = new Pool({ connectionString: databaseUrl, max: 10 });
  db = drizzle(pool, { schema });
} else {
  console.warn('[db] DATABASE_URL not set');
}

export { db, schema, pool };
export type Database = typeof db;
