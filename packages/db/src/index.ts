import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export { eq, and, desc, like, sql } from 'drizzle-orm';

const databaseUrl = process.env.DATABASE_URL;

let db;
let pool;
if (databaseUrl) {
  // node-postgres Pool: works with any TCP Postgres (Railway, Neon TCP, local docker).
  // For internal Railway connections (`postgres.railway.internal`) no SSL is needed.
  // For external Neon / cloud connections the URL may carry `?sslmode=require`,
  // which `pg` honors automatically.
  pool = new Pool({ connectionString: databaseUrl, max: 10 });
  db = drizzle(pool, { schema });
}

export { db, schema, pool };
export type Database = typeof db;
