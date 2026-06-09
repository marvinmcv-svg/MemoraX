/**
 * Run migrations against the production database.
 * Usage: node dist/apps/backend/src/scripts/run-migration.js
 * Requires DATABASE_URL environment variable.
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  console.log('[migration] Starting...');

  try {
    await sql(`
      CREATE TABLE IF NOT EXISTS homework (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        subject TEXT,
        due_at TIMESTAMPTZ,
        status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
        priority TEXT DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
        source TEXT DEFAULT 'manual' NOT NULL CHECK (source IN ('manual', 'whatsapp', 'classroom', 'telegram', 'slack')),
        course_id TEXT,
        classroom_assignment_id TEXT,
        metadata JSONB DEFAULT '{}' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS homework_user_id_idx ON homework(user_id);
      CREATE INDEX IF NOT EXISTS homework_due_at_idx ON homework(due_at);
      CREATE INDEX IF NOT EXISTS homework_status_idx ON homework(status);
    `);

    console.log('[migration] homework table created/verified successfully');
  } catch (error) {
    console.error('[migration] Failed:', error);
    throw error;
  }
}

runMigration()
  .then(() => {
    console.log('[migration] Done');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });