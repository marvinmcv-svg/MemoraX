import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './app';

describe('API Keys API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/v1/api-keys', () => {
    it('creates an API key with a name', async () => {
      const res = await request(app)
        .post('/api/v1/api-keys')
        .set('x-test-user-id', 'user-1')
        .send({ name: 'Production key' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Production key');
      expect(res.body.key).toMatch(/^mxa_[a-f0-9]{64}$/);
      expect(res.body.prefix).toMatch(/^mxa_[a-f0-9]{8}$/);
      expect(res.body.userId).toBe('user-1');
      expect(res.body.permissions).toEqual(['read', 'write']);
      expect(res.body.lastUsed).toBeNull();
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/api-keys')
        .set('x-test-user-id', 'user-1')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when name is empty string', async () => {
      const res = await request(app)
        .post('/api/v1/api-keys')
        .set('x-test-user-id', 'user-1')
        .send({ name: '   ' });

      expect(res.status).toBe(400);
    });

    it('accepts custom permissions', async () => {
      const res = await request(app)
        .post('/api/v1/api-keys')
        .set('x-test-user-id', 'user-1')
        .send({ name: 'Read-only key', permissions: ['read'] });

      expect(res.status).toBe(201);
      expect(res.body.permissions).toEqual(['read']);
    });

    it('generates unique keys for each request', async () => {
      const a = await request(app).post('/api/v1/api-keys').set('x-test-user-id', 'u').send({ name: 'a' });
      const b = await request(app).post('/api/v1/api-keys').set('x-test-user-id', 'u').send({ name: 'b' });
      expect(a.body.key).not.toBe(b.body.key);
    });
  });

  describe('GET /api/v1/api-keys', () => {
    it('returns empty list for new user', async () => {
      const res = await request(app)
        .get('/api/v1/api-keys')
        .set('x-test-user-id', 'user-1');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it('returns only keys for the requesting user', async () => {
      await request(app).post('/api/v1/api-keys').set('x-test-user-id', 'user-1').send({ name: 'a' });
      await request(app).post('/api/v1/api-keys').set('x-test-user-id', 'user-1').send({ name: 'b' });
      await request(app).post('/api/v1/api-keys').set('x-test-user-id', 'user-2').send({ name: 'c' });

      const res = await request(app)
        .get('/api/v1/api-keys')
        .set('x-test-user-id', 'user-1');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every((k: { userId: string }) => k.userId === 'user-1')).toBe(true);
    });
  });

  describe('DELETE /api/v1/api-keys/:id', () => {
    it('revokes an existing key', async () => {
      const created = await request(app)
        .post('/api/v1/api-keys')
        .set('x-test-user-id', 'user-1')
        .send({ name: 'to-delete' });

      const res = await request(app)
        .delete(`/api/v1/api-keys/${created.body.id}`)
        .set('x-test-user-id', 'user-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent key', async () => {
      const res = await request(app)
        .delete('/api/v1/api-keys/00000000-0000-0000-0000-000000000000')
        .set('x-test-user-id', 'user-1');

      expect(res.status).toBe(404);
    });

    it('cannot revoke another user\'s key', async () => {
      const created = await request(app)
        .post('/api/v1/api-keys')
        .set('x-test-user-id', 'user-1')
        .send({ name: 'mine' });

      const res = await request(app)
        .delete(`/api/v1/api-keys/${created.body.id}`)
        .set('x-test-user-id', 'user-2');

      expect(res.status).toBe(404);

      const list = await request(app)
        .get('/api/v1/api-keys')
        .set('x-test-user-id', 'user-1');
      expect(list.body.data).toHaveLength(1);
    });
  });
});
