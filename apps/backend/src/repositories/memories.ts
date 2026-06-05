import { eq, and, desc, like, sql } from '@memorax/db';
import { schema, requireDb } from '../lib/db';
import type { Memory, ContentType, IntentType, ChannelType } from '../types';

type DbMemory = typeof schema.memories.$inferSelect;
type NewDbMemory = typeof schema.memories.$inferInsert;

function toMemory(row: DbMemory): Memory {
  return {
    id: row.id,
    userId: row.userId,
    content: row.content,
    contentType: row.contentType as ContentType,
    intent: (row.intent as IntentType | null) ?? null,
    sourceChannel: (row.sourceChannel as ChannelType | null) ?? null,
    mediaUrl: row.mediaUrl ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    embedding: row.embedding ? (JSON.parse(row.embedding) as number[]) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toNewDbMemory(data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): NewDbMemory {
  return {
    userId: data.userId,
    content: data.content,
    contentType: data.contentType,
    intent: data.intent,
    sourceChannel: data.sourceChannel,
    mediaUrl: data.mediaUrl,
    metadata: data.metadata,
    embedding: data.embedding ? JSON.stringify(data.embedding) : null,
  };
}

export const memoryRepository = {
  async create(data: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    const db = requireDb();
    const [row] = await db.insert(schema.memories).values(toNewDbMemory(data)).returning();
    if (!row) {
      throw new Error('memoryRepository.create: insert returned no row');
    }
    return toMemory(row);
  },

  async findByUser(userId: string): Promise<Memory[]> {
    const db = requireDb();
    const rows = await db
      .select()
      .from(schema.memories)
      .where(eq(schema.memories.userId, userId))
      .orderBy(desc(schema.memories.createdAt));
    return rows.map(toMemory);
  },

  async findById(id: string, userId: string): Promise<Memory | null> {
    const db = requireDb();
    const rows = await db
      .select()
      .from(schema.memories)
      .where(and(eq(schema.memories.id, id), eq(schema.memories.userId, userId)))
      .limit(1);
    const row = rows[0];
    return row ? toMemory(row) : null;
  },

  async update(
    id: string,
    userId: string,
    data: { content?: string; metadata?: Record<string, unknown> }
  ): Promise<Memory | null> {
    const db = requireDb();
    const updateValues: Partial<NewDbMemory> = { updatedAt: new Date() };
    if (data.content !== undefined) updateValues.content = data.content;
    if (data.metadata !== undefined) updateValues.metadata = data.metadata;

    const [row] = await db
      .update(schema.memories)
      .set(updateValues)
      .where(and(eq(schema.memories.id, id), eq(schema.memories.userId, userId)))
      .returning();
    return row ? toMemory(row) : null;
  },

  async setIntentAndEmbedding(
    id: string,
    intent: IntentType | null,
    embedding: number[] | null
  ): Promise<Memory | null> {
    const db = requireDb();
    const [row] = await db
      .update(schema.memories)
      .set({
        intent,
        embedding: embedding ? JSON.stringify(embedding) : null,
        updatedAt: new Date(),
      })
      .where(eq(schema.memories.id, id))
      .returning();
    return row ? toMemory(row) : null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const db = requireDb();
    const result = await db
      .delete(schema.memories)
      .where(and(eq(schema.memories.id, id), eq(schema.memories.userId, userId)))
      .returning({ id: schema.memories.id });
    return result.length > 0;
  },

  async search(userId: string, query: string): Promise<Memory[]> {
    const db = requireDb();
    const pattern = `%${query.toLowerCase()}%`;
    const rows = await db
      .select()
      .from(schema.memories)
      .where(and(eq(schema.memories.userId, userId), sql`LOWER(${schema.memories.content}) LIKE ${pattern}`))
      .orderBy(desc(schema.memories.createdAt));
    return rows.map(toMemory);
  },

  async countByUser(userId: string): Promise<number> {
    const db = requireDb();
    const result = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.memories)
      .where(eq(schema.memories.userId, userId));
    return result[0]?.count ?? 0;
  },

  async countThisWeek(userId: string): Promise<number> {
    const db = requireDb();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const result = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.memories)
      .where(
        and(
          eq(schema.memories.userId, userId),
          sql`${schema.memories.createdAt} >= ${oneWeekAgo}`
        )
      );
    return result[0]?.count ?? 0;
  },
};
