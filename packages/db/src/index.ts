import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export { eq, and, desc, like, sql } from 'drizzle-orm';

const databaseUrl = process.env.DATABASE_URL;

let db;
let pool;
if (databaseUrl) {
  const cleanUrl = databaseUrl.replace(/^['"]|['"]$/g, '');
  console.log(`[db] DATABASE_URL len=${databaseUrl.length} cleanLen=${cleanUrl.length} startsWith=${databaseUrl.substring(0, 20)} endsWith=${databaseUrl.substring(databaseUrl.length - 20)}`);
  try {
    const u = new URL(cleanUrl);
    console.log(`[db] parsed OK: host=${u.hostname} port=${u.port}`);
  } catch (e) {
    console.error(`[db] URL parse FAILED: ${(e as Error).message} rawCode=${databaseUrl.charCodeAt(0)}`);
  }
  pool = new Pool({ connectionString: cleanUrl, max: 10 });
  db = drizzle(pool, { schema });
} else {
  console.warn('[db] DATABASE_URL not set');
}

export { db, schema, pool };
export type Database = typeof db;
