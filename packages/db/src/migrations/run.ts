import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log('Running migrations...');

  const migration = await sql(`
    -- Enable required extensions
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS vector;

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      timezone TEXT DEFAULT 'UTC' NOT NULL,
      plan TEXT DEFAULT 'free' NOT NULL CHECK (plan IN ('free', 'pro', 'team')),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- User channels (multi-channel support)
    CREATE TABLE IF NOT EXISTS user_channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'slack', 'sms', 'email', 'app')),
      channel_user_id TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      UNIQUE(channel, channel_user_id)
    );

    -- Memories (core table)
    CREATE TABLE IF NOT EXISTS memories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      content_type TEXT DEFAULT 'text' NOT NULL CHECK (content_type IN ('text', 'voice', 'image', 'link')),
      intent TEXT CHECK (intent IN ('reminder', 'note', 'task', 'event', 'serendipity', 'unknown')),
      source_channel TEXT,
      media_url TEXT,
      metadata JSONB DEFAULT '{}' NOT NULL,
      embedding vector(1536),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Create index for vector search
    CREATE INDEX IF NOT EXISTS memories_embedding_idx ON memories USING ivfflat (embedding vector_cosine_ops);
    CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(user_id);
    CREATE INDEX IF NOT EXISTS memories_created_at_idx ON memories(created_at DESC);

    -- Reminders
    CREATE TABLE IF NOT EXISTS reminders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
      remind_at TIMESTAMPTZ NOT NULL,
      rrule TEXT,
      status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'sent', 'snoozed', 'cancelled')),
      delivery_channel TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON reminders(user_id);
    CREATE INDEX IF NOT EXISTS reminders_remind_at_idx ON reminders(remind_at);
    CREATE INDEX IF NOT EXISTS reminders_status_idx ON reminders(status);

    -- Memory entities (extracted by AI)
    CREATE TABLE IF NOT EXISTS memory_entities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL,
      entity_value TEXT NOT NULL,
      confidence REAL,
      neo4j_node_id TEXT
    );

    CREATE INDEX IF NOT EXISTS memory_entities_memory_id_idx ON memory_entities(memory_id);

    -- Teams
    CREATE TABLE IF NOT EXISTS teams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      owner_id UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Team members
    CREATE TABLE IF NOT EXISTS team_members (
      team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member' NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
      PRIMARY KEY (team_id, user_id)
    );

    -- Workspaces (shared memory spaces)
    CREATE TABLE IF NOT EXISTS workspaces (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- Workspace memories
    CREATE TABLE IF NOT EXISTS workspace_memories (
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
      memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
      added_by UUID REFERENCES users(id),
      PRIMARY KEY (workspace_id, memory_id)
    );

    -- Briefings (AI-generated daily digests)
    CREATE TABLE IF NOT EXISTS briefings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      memories_count INTEGER DEFAULT 0 NOT NULL,
      reminders_count INTEGER DEFAULT 0 NOT NULL
    );

    CREATE INDEX IF NOT EXISTS briefings_user_id_idx ON briefings(user_id);
    CREATE INDEX IF NOT EXISTS briefings_generated_at_idx ON briefings(generated_at DESC);

    -- AI processing log
    CREATE TABLE IF NOT EXISTS ai_processing_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
      stage TEXT NOT NULL,
      result JSONB,
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS ai_processing_log_memory_id_idx ON ai_processing_log(memory_id);
  `);

  console.log('Migrations completed successfully!');
  console.log('Migration result:', migration);
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
