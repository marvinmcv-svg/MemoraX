const databaseUrl = process.env.DATABASE_URL;

let db: any = null;
let sql: any = null;

if (databaseUrl) {
  try {
    const { neon } = require('@neondatabase/serverless');
    const { drizzle } = require('drizzle-orm/neon-http');
    sql = neon(databaseUrl);
    db = drizzle(sql);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
} else {
  console.warn('DATABASE_URL not set - running in mock mode');
}

export { db, sql };
export type Database = typeof db;
