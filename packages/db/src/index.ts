import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export { eq, and, desc, like, sql } from 'drizzle-orm';

const rawUrl = process.env.DATABASE_URL;
const databaseUrl = rawUrl ? rawUrl.replace(/^['"]|['"]$/g, '') : rawUrl;

let db;
let pool;
if (databaseUrl) {
  pool = new Pool({ connectionString: databaseUrl, max: 10 });
  db = drizzle(pool, { schema });
}

export { db, schema, pool };
export type Database = typeof db;
