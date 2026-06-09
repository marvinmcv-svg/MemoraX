import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  primaryKey,
  index,
  integer,
  real,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').unique().notNull(),
  name: text('name'),
  timezone: text('timezone').default('UTC').notNull(),
  plan: text('plan').default('free').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userChannels = pgTable('user_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  channel: text('channel').notNull(),
  channelUserId: text('channel_user_id').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  contentType: text('content_type').default('text').notNull(),
  intent: text('intent'),
  sourceChannel: text('source_channel'),
  mediaUrl: text('media_url'),
  metadata: jsonb('metadata').default({}).notNull(),
  // Stored as a JSON-stringified float[] at the Drizzle level.
  // The actual pg column is `vector(1536)` and is created/owned by
  // packages/db/src/migrations/001_initial.sql (and run via src/migrations/run.ts).
  // drizzle-orm 0.30 does not export a `vector()` column type; once we bump
  // to >=0.31 we can replace this with `vector('embedding', { dimensions: 1536 })`.
  embedding: text('embedding'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  memoryId: uuid('memory_id').notNull(),
  remindAt: timestamp('remind_at', { withTimezone: true }).notNull(),
  rrule: text('rrule'),
  status: text('status').default('pending').notNull(),
  deliveryChannel: text('delivery_channel'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const memoryEntities = pgTable('memory_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  memoryId: uuid('memory_id').notNull(),
  entityType: text('entity_type').notNull(),
  entityValue: text('entity_value').notNull(),
  confidence: real('confidence'),
  neo4jNodeId: text('neo4j_node_id'),
});

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerId: uuid('owner_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teamMembers = pgTable('team_members', {
  teamId: uuid('team_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: text('role').default('member').notNull(),
});

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workspaceMemories = pgTable('workspace_memories', {
  workspaceId: uuid('workspace_id').notNull(),
  memoryId: uuid('memory_id').notNull(),
  addedBy: uuid('added_by'),
});

export const briefings = pgTable('briefings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  memoriesCount: integer('memories_count').default(0).notNull(),
  remindersCount: integer('reminders_count').default(0).notNull(),
});

export const homework = pgTable('homework', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  subject: text('subject'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  status: text('status').default('pending').notNull(), // pending | in_progress | completed | overdue
  priority: text('priority').default('medium').notNull(), // low | medium | high
  source: text('source').default('manual').notNull(), // manual | whatsapp | classroom | telegram
  courseId: text('course_id'), // Google Classroom course ID
  classroomAssignmentId: text('classroom_assignment_id'), // Google Classroom assignment ID
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type MemoryEntity = typeof memoryEntities.$inferSelect;
export type NewMemoryEntity = typeof memoryEntities.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Workspace = typeof workspaces.$inferSelect;
export type WorkspaceMemory = typeof workspaceMemories.$inferSelect;
export type Briefing = typeof briefings.$inferSelect;
export type UserChannel = typeof userChannels.$inferSelect;
export type Homework = typeof homework.$inferSelect;
export type NewHomework = typeof homework.$inferInsert;
