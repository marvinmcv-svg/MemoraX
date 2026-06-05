import { describe, it, expect } from 'vitest';
import { memoryStore, reminderStore } from '../lib/store';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const uniqueUserId = (label: string) =>
  `user-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const makeMemoryInput = (userId: string, content: string) => ({
  userId,
  content,
  contentType: 'text' as const,
  intent: 'note' as const,
  sourceChannel: 'app' as const,
  mediaUrl: null,
  metadata: {},
  embedding: null,
});

const makeReminderInput = (
  userId: string,
  memoryId: string,
  remindAt: Date,
  status: 'pending' | 'sent' | 'snoozed' | 'cancelled' = 'pending'
) => ({
  userId,
  memoryId,
  remindAt,
  rrule: null,
  status,
  deliveryChannel: 'app' as const,
});

describe('memoryStore', () => {
  it('create: returns a memory with id, createdAt, updatedAt', async () => {
    const userId = uniqueUserId('create');
    const memory = await memoryStore.create(makeMemoryInput(userId, 'Test memory'));

    expect(memory).toHaveProperty('id');
    expect(memory).toHaveProperty('createdAt');
    expect(memory).toHaveProperty('updatedAt');
    expect(typeof memory.id).toBe('string');
    expect(memory.id.length).toBeGreaterThan(0);
    expect(memory.createdAt).toBeInstanceOf(Date);
    expect(memory.updatedAt).toBeInstanceOf(Date);
    expect(memory.userId).toBe(userId);
    expect(memory.content).toBe('Test memory');
  });

  it('findByUser: returns only memories for that user, sorted by createdAt desc', async () => {
    const userId = uniqueUserId('find-by-user');
    const otherUserId = uniqueUserId('find-by-user-other');

    await memoryStore.create(makeMemoryInput(userId, 'first'));
    await delay(5);
    await memoryStore.create(makeMemoryInput(userId, 'second'));
    await delay(5);
    await memoryStore.create(makeMemoryInput(userId, 'third'));
    await memoryStore.create(makeMemoryInput(otherUserId, 'other user memory'));

    const memories = await memoryStore.findByUser(userId);

    expect(memories).toHaveLength(3);
    expect(memories.every((m) => m.userId === userId)).toBe(true);
    expect(memories[0].content).toBe('third');
    expect(memories[1].content).toBe('second');
    expect(memories[2].content).toBe('first');
    expect(memories[0].createdAt.getTime()).toBeGreaterThanOrEqual(
      memories[1].createdAt.getTime()
    );
    expect(memories[1].createdAt.getTime()).toBeGreaterThanOrEqual(
      memories[2].createdAt.getTime()
    );
  });

  it('findById: returns memory only if userId matches', async () => {
    const userId = uniqueUserId('find-by-id');
    const otherUserId = uniqueUserId('find-by-id-other');
    const memory = await memoryStore.create(makeMemoryInput(userId, 'find me'));

    const found = await memoryStore.findById(memory.id, userId);
    expect(found).toBeDefined();
    expect(found?.id).toBe(memory.id);
    expect(found?.content).toBe('find me');

    const notFound = await memoryStore.findById(memory.id, otherUserId);
    expect(notFound).toBeUndefined();
  });

  it('findById: returns undefined if not found', async () => {
    const userId = uniqueUserId('find-missing');
    const result = await memoryStore.findById('non-existent-id', userId);
    expect(result).toBeUndefined();
  });

  it('delete: removes the memory and returns true', async () => {
    const userId = uniqueUserId('delete');
    const memory = await memoryStore.create(makeMemoryInput(userId, 'to delete'));

    const result = await memoryStore.delete(memory.id, userId);
    expect(result).toBe(true);

    const afterDelete = await memoryStore.findById(memory.id, userId);
    expect(afterDelete).toBeUndefined();
  });

  it('delete: returns false if not found', async () => {
    const userId = uniqueUserId('delete-missing');
    const result = await memoryStore.delete('non-existent-id', userId);
    expect(result).toBe(false);
  });

  it('delete: returns false if userId does not match', async () => {
    const userId = uniqueUserId('delete-wrong-user');
    const otherUserId = uniqueUserId('delete-wrong-user-other');
    const memory = await memoryStore.create(makeMemoryInput(userId, 'protected'));

    const result = await memoryStore.delete(memory.id, otherUserId);
    expect(result).toBe(false);

    const stillThere = await memoryStore.findById(memory.id, userId);
    expect(stillThere).toBeDefined();
  });

  it('search: filters by query case-insensitively', async () => {
    const userId = uniqueUserId('search');
    await memoryStore.create(makeMemoryInput(userId, 'Buy groceries at the Market'));
    await memoryStore.create(makeMemoryInput(userId, 'Call mom on Sunday'));
    await memoryStore.create(makeMemoryInput(userId, 'MARKET research notes'));

    const lowerResults = await memoryStore.search(userId, 'market');
    expect(lowerResults).toHaveLength(2);
    expect(lowerResults.every((m) => m.content.toLowerCase().includes('market'))).toBe(true);

    const upperResults = await memoryStore.search(userId, 'MARKET');
    expect(upperResults).toHaveLength(2);

    const mixedResults = await memoryStore.search(userId, 'MaRkEt');
    expect(mixedResults).toHaveLength(2);

    const noResults = await memoryStore.search(userId, 'nonexistent-term-xyz');
    expect(noResults).toHaveLength(0);
  });

  it('search: only returns memories for the specified user', async () => {
    const userId = uniqueUserId('search-user-scope');
    const otherUserId = uniqueUserId('search-user-scope-other');
    await memoryStore.create(makeMemoryInput(userId, 'shared keyword apple'));
    await memoryStore.create(makeMemoryInput(otherUserId, 'shared keyword apple'));

    const results = await memoryStore.search(userId, 'apple');
    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe(userId);
  });
});

describe('reminderStore', () => {
  it('create: returns a reminder with id and createdAt', async () => {
    const userId = uniqueUserId('reminder-create');
    const remindAt = new Date(Date.now() + 60_000);
    const reminder = await reminderStore.create(
      makeReminderInput(userId, 'memory-id-1', remindAt)
    );

    expect(reminder).toHaveProperty('id');
    expect(reminder).toHaveProperty('createdAt');
    expect(typeof reminder.id).toBe('string');
    expect(reminder.id.length).toBeGreaterThan(0);
    expect(reminder.createdAt).toBeInstanceOf(Date);
    expect(reminder.userId).toBe(userId);
    expect(reminder.memoryId).toBe('memory-id-1');
    expect(reminder.remindAt.getTime()).toBe(remindAt.getTime());
    expect(reminder.status).toBe('pending');
  });

  it('findByUser: returns only reminders for that user, sorted by remindAt asc', async () => {
    const userId = uniqueUserId('reminder-find-by-user');
    const otherUserId = uniqueUserId('reminder-find-by-user-other');
    const now = Date.now();

    await reminderStore.create(
      makeReminderInput(userId, 'm1', new Date(now + 30_000))
    );
    await reminderStore.create(
      makeReminderInput(userId, 'm2', new Date(now + 10_000))
    );
    await reminderStore.create(
      makeReminderInput(userId, 'm3', new Date(now + 20_000))
    );
    await reminderStore.create(
      makeReminderInput(otherUserId, 'm-other', new Date(now + 5_000))
    );

    const reminders = await reminderStore.findByUser(userId);

    expect(reminders).toHaveLength(3);
    expect(reminders.every((r) => r.userId === userId)).toBe(true);
    expect(reminders[0].memoryId).toBe('m2');
    expect(reminders[1].memoryId).toBe('m3');
    expect(reminders[2].memoryId).toBe('m1');
    expect(reminders[0].remindAt.getTime()).toBeLessThanOrEqual(
      reminders[1].remindAt.getTime()
    );
    expect(reminders[1].remindAt.getTime()).toBeLessThanOrEqual(
      reminders[2].remindAt.getTime()
    );
  });

  it('findById: returns reminder only if userId matches', async () => {
    const userId = uniqueUserId('reminder-find-by-id');
    const otherUserId = uniqueUserId('reminder-find-by-id-other');
    const reminder = await reminderStore.create(
      makeReminderInput(userId, 'memory-x', new Date(Date.now() + 60_000))
    );

    const found = await reminderStore.findById(reminder.id, userId);
    expect(found).toBeDefined();
    expect(found?.id).toBe(reminder.id);
    expect(found?.memoryId).toBe('memory-x');

    const notFound = await reminderStore.findById(reminder.id, otherUserId);
    expect(notFound).toBeUndefined();

    const missing = await reminderStore.findById('non-existent-id', userId);
    expect(missing).toBeUndefined();
  });

  it('update: modifies the reminder fields', async () => {
    const userId = uniqueUserId('reminder-update');
    const originalRemindAt = new Date(Date.now() + 60_000);
    const reminder = await reminderStore.create(
      makeReminderInput(userId, 'memory-update', originalRemindAt)
    );

    const newRemindAt = new Date(Date.now() + 120_000);
    const updated = await reminderStore.update(reminder.id, userId, {
      status: 'snoozed',
      remindAt: newRemindAt,
    });

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('snoozed');
    expect(updated?.remindAt.getTime()).toBe(newRemindAt.getTime());
    expect(updated?.id).toBe(reminder.id);

    const fetched = await reminderStore.findById(reminder.id, userId);
    expect(fetched?.status).toBe('snoozed');
    expect(fetched?.remindAt.getTime()).toBe(newRemindAt.getTime());
  });

  it('update: returns undefined if reminder does not belong to user', async () => {
    const userId = uniqueUserId('reminder-update-wrong');
    const otherUserId = uniqueUserId('reminder-update-wrong-other');
    const reminder = await reminderStore.create(
      makeReminderInput(userId, 'memory-y', new Date(Date.now() + 60_000))
    );

    const result = await reminderStore.update(reminder.id, otherUserId, {
      status: 'cancelled',
    });
    expect(result).toBeUndefined();

    const unchanged = await reminderStore.findById(reminder.id, userId);
    expect(unchanged?.status).toBe('pending');
  });

  it('delete: removes and returns true', async () => {
    const userId = uniqueUserId('reminder-delete');
    const reminder = await reminderStore.create(
      makeReminderInput(userId, 'memory-del', new Date(Date.now() + 60_000))
    );

    const result = await reminderStore.delete(reminder.id, userId);
    expect(result).toBe(true);

    const afterDelete = await reminderStore.findById(reminder.id, userId);
    expect(afterDelete).toBeUndefined();
  });

  it('delete: returns false if not found', async () => {
    const userId = uniqueUserId('reminder-delete-missing');
    const result = await reminderStore.delete('non-existent-id', userId);
    expect(result).toBe(false);
  });

  it('findDue: returns reminders where status=pending and remindAt <= now', async () => {
    const userId = uniqueUserId('reminder-find-due');
    const now = Date.now();

    const duePending = await reminderStore.create(
      makeReminderInput(userId, 'due-pending', new Date(now - 10_000), 'pending')
    );
    const dueSent = await reminderStore.create(
      makeReminderInput(userId, 'due-sent', new Date(now - 10_000), 'sent')
    );
    const dueCancelled = await reminderStore.create(
      makeReminderInput(userId, 'due-cancelled', new Date(now - 10_000), 'cancelled')
    );
    const futurePending = await reminderStore.create(
      makeReminderInput(userId, 'future-pending', new Date(now + 60_000), 'pending')
    );

    const due = await reminderStore.findDue();
    const dueIds = due.map((r) => r.id);

    expect(dueIds).toContain(duePending.id);
    expect(dueIds).not.toContain(dueSent.id);
    expect(dueIds).not.toContain(dueCancelled.id);
    expect(dueIds).not.toContain(futurePending.id);

    expect(due.every((r) => r.status === 'pending')).toBe(true);
    expect(due.every((r) => r.remindAt.getTime() <= Date.now())).toBe(true);
  });
});
