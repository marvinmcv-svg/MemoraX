import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './app';

describe('Reminders API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/v1/reminders', () => {
    it('creates a reminder with valid memoryId and remindAt', async () => {
      const future = new Date(Date.now() + 60_000).toISOString();
      const res = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', 'rem-create-1')
        .send({ memoryId: 'mem-123', remindAt: future });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.memoryId).toBe('mem-123');
      expect(res.body.userId).toBe('rem-create-1');
      expect(res.body.status).toBe('pending');
      expect(new Date(res.body.remindAt).toISOString()).toBe(future);
    });

    it('returns 400 when memoryId is missing', async () => {
      const res = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', 'rem-create-2')
        .send({ remindAt: new Date(Date.now() + 60_000).toISOString() });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/memoryId/);
    });

    it('returns 400 when remindAt is missing', async () => {
      const res = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', 'rem-create-3')
        .send({ memoryId: 'mem-456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/remindAt/);
    });

    it('returns 400 when body is empty', async () => {
      const res = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', 'rem-create-4')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/reminders', () => {
    it('lists reminders for the user', async () => {
      const userId = 'rem-list-1';
      const future = new Date(Date.now() + 60_000).toISOString();

      await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', userId)
        .send({ memoryId: 'mem-list-a', remindAt: future });
      await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', userId)
        .send({ memoryId: 'mem-list-b', remindAt: future });

      const res = await request(app)
        .get('/api/v1/reminders')
        .set('x-test-user-id', userId);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.every((r: { userId: string }) => r.userId === userId)).toBe(true);
      const memoryIds = res.body.data.map((r: { memoryId: string }) => r.memoryId);
      expect(memoryIds).toContain('mem-list-a');
      expect(memoryIds).toContain('mem-list-b');
    });

    it('filters by status=pending', async () => {
      const userId = 'rem-filter-1';
      const future = new Date(Date.now() + 60_000).toISOString();

      await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', userId)
        .send({ memoryId: 'mem-pending-1', remindAt: future });
      await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', userId)
        .send({ memoryId: 'mem-pending-2', remindAt: future });

      const res = await request(app)
        .get('/api/v1/reminders?status=pending')
        .set('x-test-user-id', userId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.every((r: { status: string }) => r.status === 'pending')).toBe(true);
    });

    it('returns only sent reminders when status=sent', async () => {
      const userId = 'rem-filter-2';
      const future = new Date(Date.now() + 60_000).toISOString();

      const created = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', userId)
        .send({ memoryId: 'mem-becomes-sent', remindAt: future });

      await request(app)
        .put(`/api/v1/reminders/${created.body.id}`)
        .set('x-test-user-id', userId)
        .send({ status: 'sent' });

      const res = await request(app)
        .get('/api/v1/reminders?status=sent')
        .set('x-test-user-id', userId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.every((r: { status: string }) => r.status === 'sent')).toBe(true);
      const ids = res.body.data.map((r: { id: string }) => r.id);
      expect(ids).toContain(created.body.id);
    });
  });

  describe('GET /api/v1/reminders/:id', () => {
    it('returns 200 with the reminder', async () => {
      const userId = 'rem-get-1';
      const created = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', userId)
        .send({ memoryId: 'mem-get-ok', remindAt: new Date(Date.now() + 60_000).toISOString() });

      const res = await request(app)
        .get(`/api/v1/reminders/${created.body.id}`)
        .set('x-test-user-id', userId);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.memoryId).toBe('mem-get-ok');
      expect(res.body.userId).toBe(userId);
    });

    it('returns 404 when reminder is not found', async () => {
      const res = await request(app)
        .get('/api/v1/reminders/non-existent-id')
        .set('x-test-user-id', 'rem-get-2');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe('PUT /api/v1/reminders/:id', () => {
    it('updates the reminder', async () => {
      const userId = 'rem-put-1';
      const created = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', userId)
        .send({ memoryId: 'mem-put-ok', remindAt: new Date(Date.now() + 60_000).toISOString() });

      const newRemindAt = new Date(Date.now() + 3_600_000).toISOString();
      const res = await request(app)
        .put(`/api/v1/reminders/${created.body.id}`)
        .set('x-test-user-id', userId)
        .send({ status: 'cancelled', remindAt: newRemindAt });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.status).toBe('cancelled');
      expect(new Date(res.body.remindAt).toISOString()).toBe(newRemindAt);
    });

    it('returns 404 when updating a non-existent reminder', async () => {
      const res = await request(app)
        .put('/api/v1/reminders/does-not-exist')
        .set('x-test-user-id', 'rem-put-2')
        .send({ status: 'cancelled' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/reminders/:id', () => {
    it('deletes the reminder and returns success', async () => {
      const userId = 'rem-delete-1';
      const created = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', userId)
        .send({ memoryId: 'mem-delete-ok', remindAt: new Date(Date.now() + 60_000).toISOString() });

      const del = await request(app)
        .delete(`/api/v1/reminders/${created.body.id}`)
        .set('x-test-user-id', userId);

      expect(del.status).toBe(200);
      expect(del.body.success).toBe(true);

      const get = await request(app)
        .get(`/api/v1/reminders/${created.body.id}`)
        .set('x-test-user-id', userId);

      expect(get.status).toBe(404);
    });

    it('returns 404 when deleting a non-existent reminder', async () => {
      const res = await request(app)
        .delete('/api/v1/reminders/no-such-id')
        .set('x-test-user-id', 'rem-delete-2');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/reminders/:id/snooze', () => {
    it('snoozes the reminder and changes remindAt to the future with custom minutes', async () => {
      const userId = 'rem-snooze-1';
      const past = new Date(Date.now() - 60_000).toISOString();
      const created = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', userId)
        .send({ memoryId: 'mem-snooze-30', remindAt: past });

      const before = Date.now();
      const res = await request(app)
        .post(`/api/v1/reminders/${created.body.id}/snooze`)
        .set('x-test-user-id', userId)
        .send({ minutes: 30 });

      expect(res.status).toBe(200);
      const newRemindAt = new Date(res.body.remindAt).getTime();
      expect(newRemindAt).toBeGreaterThan(before);
      expect(newRemindAt).toBeGreaterThanOrEqual(before + 30 * 60_000 - 5_000);
      expect(newRemindAt).toBeLessThanOrEqual(before + 30 * 60_000 + 5_000);
      expect(res.body.status).toBe('pending');
    });

    it('defaults to 15 minutes when minutes is not specified', async () => {
      const userId = 'rem-snooze-2';
      const past = new Date(Date.now() - 60_000).toISOString();
      const created = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', userId)
        .send({ memoryId: 'mem-snooze-default', remindAt: past });

      const before = Date.now();
      const res = await request(app)
        .post(`/api/v1/reminders/${created.body.id}/snooze`)
        .set('x-test-user-id', userId)
        .send({});

      expect(res.status).toBe(200);
      const newRemindAt = new Date(res.body.remindAt).getTime();
      expect(newRemindAt).toBeGreaterThanOrEqual(before + 15 * 60_000 - 5_000);
      expect(newRemindAt).toBeLessThanOrEqual(before + 15 * 60_000 + 5_000);
      expect(res.body.status).toBe('pending');
    });

    it('returns 404 when snoozing a non-existent reminder', async () => {
      const res = await request(app)
        .post('/api/v1/reminders/missing-snooze-id/snooze')
        .set('x-test-user-id', 'rem-snooze-3')
        .send({ minutes: 5 });

      expect(res.status).toBe(404);
    });
  });

  describe('Multi-user isolation', () => {
    it('user-1 cannot see user-2 reminders in list', async () => {
      const user1 = 'iso-list-user-1';
      const user2 = 'iso-list-user-2';
      const future = new Date(Date.now() + 60_000).toISOString();

      await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', user2)
        .send({ memoryId: 'mem-private-list', remindAt: future });

      const res = await request(app)
        .get('/api/v1/reminders')
        .set('x-test-user-id', user1);

      expect(res.status).toBe(200);
      expect(res.body.data.every((r: { userId: string }) => r.userId === user1)).toBe(true);
      const memoryIds = res.body.data.map((r: { memoryId: string }) => r.memoryId);
      expect(memoryIds).not.toContain('mem-private-list');
    });

    it('user-1 cannot GET user-2 reminder by id', async () => {
      const user1 = 'iso-get-user-1';
      const user2 = 'iso-get-user-2';
      const created = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', user2)
        .send({ memoryId: 'mem-private-get', remindAt: new Date(Date.now() + 60_000).toISOString() });

      const res = await request(app)
        .get(`/api/v1/reminders/${created.body.id}`)
        .set('x-test-user-id', user1);

      expect(res.status).toBe(404);
    });

    it('user-1 cannot PUT user-2 reminder', async () => {
      const user1 = 'iso-put-user-1';
      const user2 = 'iso-put-user-2';
      const created = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', user2)
        .send({ memoryId: 'mem-private-put', remindAt: new Date(Date.now() + 60_000).toISOString() });

      const res = await request(app)
        .put(`/api/v1/reminders/${created.body.id}`)
        .set('x-test-user-id', user1)
        .send({ status: 'cancelled' });

      expect(res.status).toBe(404);

      const ownerView = await request(app)
        .get(`/api/v1/reminders/${created.body.id}`)
        .set('x-test-user-id', user2);

      expect(ownerView.status).toBe(200);
      expect(ownerView.body.status).toBe('pending');
    });

    it('user-1 cannot DELETE user-2 reminder', async () => {
      const user1 = 'iso-delete-user-1';
      const user2 = 'iso-delete-user-2';
      const created = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', user2)
        .send({ memoryId: 'mem-private-delete', remindAt: new Date(Date.now() + 60_000).toISOString() });

      const res = await request(app)
        .delete(`/api/v1/reminders/${created.body.id}`)
        .set('x-test-user-id', user1);

      expect(res.status).toBe(404);

      const ownerView = await request(app)
        .get(`/api/v1/reminders/${created.body.id}`)
        .set('x-test-user-id', user2);

      expect(ownerView.status).toBe(200);
      expect(ownerView.body.id).toBe(created.body.id);
    });

    it('user-1 cannot snooze user-2 reminder', async () => {
      const user1 = 'iso-snooze-user-1';
      const user2 = 'iso-snooze-user-2';
      const created = await request(app)
        .post('/api/v1/reminders')
        .set('x-test-user-id', user2)
        .send({ memoryId: 'mem-private-snooze', remindAt: new Date(Date.now() - 60_000).toISOString() });

      const res = await request(app)
        .post(`/api/v1/reminders/${created.body.id}/snooze`)
        .set('x-test-user-id', user1)
        .send({ minutes: 60 });

      expect(res.status).toBe(404);
    });
  });
});
