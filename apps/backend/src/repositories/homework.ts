import { eq, and, desc, sql } from '@memorax/db';
import { schema, requireDb } from '../lib/db';
import type { Homework, HomeworkStatus, HomeworkPriority, HomeworkSource } from '@memorax/shared';

type DbHomework = typeof schema.homework.$inferSelect;

function toHomework(row: DbHomework): Homework {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description ?? null,
    subject: row.subject ?? null,
    dueAt: row.dueAt ?? null,
    status: row.status as HomeworkStatus,
    priority: row.priority as HomeworkPriority,
    source: row.source as HomeworkSource,
    courseId: row.courseId ?? null,
    classroomAssignmentId: row.classroomAssignmentId ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface CreateHomeworkInput {
  userId: string;
  title: string;
  description?: string | null;
  subject?: string | null;
  dueAt?: Date | null;
  status?: HomeworkStatus;
  priority?: HomeworkPriority;
  source?: HomeworkSource;
  courseId?: string | null;
  classroomAssignmentId?: string | null;
  metadata?: Record<string, unknown>;
}

export const homeworkRepository = {
  async create(data: CreateHomeworkInput): Promise<Homework> {
    const db = requireDb();
    const [row] = await db.insert(schema.homework).values({
      userId: data.userId,
      title: data.title,
      description: data.description ?? null,
      subject: data.subject ?? null,
      dueAt: data.dueAt ?? null,
      status: data.status ?? 'pending',
      priority: data.priority ?? 'medium',
      source: data.source ?? 'manual',
      courseId: data.courseId ?? null,
      classroomAssignmentId: data.classroomAssignmentId ?? null,
      metadata: data.metadata ?? {},
    }).returning();
    if (!row) throw new Error('homeworkRepository.create: insert returned no row');
    return toHomework(row);
  },

  async findByUser(userId: string, limit = 50): Promise<Homework[]> {
    const db = requireDb();
    const rows = await db
      .select()
      .from(schema.homework)
      .where(eq(schema.homework.userId, userId))
      .orderBy(desc(schema.homework.dueAt));
    return rows.map(toHomework);
  },

  async findById(id: string, userId: string): Promise<Homework | null> {
    const db = requireDb();
    const rows = await db
      .select()
      .from(schema.homework)
      .where(and(eq(schema.homework.id, id), eq(schema.homework.userId, userId)))
      .limit(1);
    return rows[0] ? toHomework(rows[0]) : null;
  },

  async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      description: string | null;
      subject: string | null;
      dueAt: Date | null;
      status: HomeworkStatus;
      priority: HomeworkPriority;
      metadata: Record<string, unknown>;
    }>
  ): Promise<Homework | null> {
    const db = requireDb();
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updateValues.title = data.title;
    if (data.description !== undefined) updateValues.description = data.description;
    if (data.subject !== undefined) updateValues.subject = data.subject;
    if (data.dueAt !== undefined) updateValues.dueAt = data.dueAt;
    if (data.status !== undefined) updateValues.status = data.status;
    if (data.priority !== undefined) updateValues.priority = data.priority;
    if (data.metadata !== undefined) updateValues.metadata = data.metadata;

    const [row] = await db
      .update(schema.homework)
      .set(updateValues)
      .where(and(eq(schema.homework.id, id), eq(schema.homework.userId, userId)))
      .returning();
    return row ? toHomework(row) : null;
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const db = requireDb();
    const result = await db
      .delete(schema.homework)
      .where(and(eq(schema.homework.id, id), eq(schema.homework.userId, userId)))
      .returning({ id: schema.homework.id });
    return result.length > 0;
  },

  async findPending(userId: string): Promise<Homework[]> {
    const db = requireDb();
    const rows = await db
      .select()
      .from(schema.homework)
      .where(and(
        eq(schema.homework.userId, userId),
        sql`${schema.homework.status} IN ('pending', 'in_progress')`
      ))
      .orderBy(desc(schema.homework.dueAt));
    return rows.map(toHomework);
  },

  async findDueBefore(dueBefore: Date, userId: string): Promise<Homework[]> {
    const db = requireDb();
    const rows = await db
      .select()
      .from(schema.homework)
      .where(and(
        eq(schema.homework.userId, userId),
        sql`${schema.homework.dueAt} IS NOT NULL AND ${schema.homework.dueAt} <= ${dueBefore}`,
        sql`${schema.homework.status} IN ('pending', 'in_progress')`
      ))
      .orderBy(schema.homework.dueAt);
    return rows.map(toHomework);
  },

  async countByStatus(userId: string): Promise<{ pending: number; in_progress: number; completed: number; overdue: number }> {
    const db = requireDb();
    const result = await db
      .select({
        status: schema.homework.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(schema.homework)
      .where(eq(schema.homework.userId, userId))
      .groupBy(schema.homework.status);
    const counts = { pending: 0, in_progress: 0, completed: 0, overdue: 0 };
    for (const row of result) {
      const status = row.status as keyof typeof counts;
      if (status in counts) counts[status] = row.count;
    }
    return counts;
  },
};