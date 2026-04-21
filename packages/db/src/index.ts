import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

let db;
if (databaseUrl) {
  const sql = neon(databaseUrl);
  db = drizzle(sql, { schema });
}

export { db, schema };
export type Database = typeof db;
