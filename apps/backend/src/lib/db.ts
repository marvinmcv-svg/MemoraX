import { db as _db, schema as _schema, type Database } from '@memorax/db';

const databaseUrl = process.env.DATABASE_URL;

if (_db) {
  console.log('Database connected successfully');
} else {
  if (databaseUrl) {
    console.warn('DATABASE_URL is set but the database client failed to initialize — running without database');
  } else {
    console.warn('DATABASE_URL not set — running in mock mode (no database)');
  }
}

export const db = _db;
export const schema = _schema;

export function getDb(): Database | null {
  return _db;
}

export function requireDb(): Database {
  if (!_db) {
    throw new Error(
      'Database is not configured. Set DATABASE_URL in your environment (or in apps/backend/.env) and restart the server.'
    );
  }
  return _db;
}

export type { Database };
