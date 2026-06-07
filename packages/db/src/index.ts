import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export { eq, and, desc, like, sql } from 'drizzle-orm';

const databaseUrl = process.env.DATABASE_URL;

let db;
let pool;
if (databaseUrl) {
  console.log(`[db] DATABASE_URL host=${new URL(databaseUrl).hostname} port=${new URL(databaseUrl).port} db=${new URL(databaseUrl).pathname.slice(1)}`);
  pool = new Pool({ connectionString: databaseUrl, max: 10 });
  db = drizzle(pool, { schema });
} else {
  console.warn('[db] DATABASE_URL not set');
}

export { db, schema, pool };
export type Database = typeof db;
