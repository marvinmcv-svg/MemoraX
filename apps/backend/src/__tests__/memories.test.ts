import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './app';

describe('Memories API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/v1/memories', () => {
    it('creates a memory with valid content', async () => {
      const res = await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({ content: 'Buy groceries tomorrow' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('memory');
      expect(res.body.memory).toHaveProperty('id');
      expect(res.body.memory.content).toBe('Buy groceries tomorrow');
      expect(res.body.memory.userId).toBe('user-1');
    });

    it('returns 400 when content is missing', async () => {
      const res = await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/memories', () => {
    it('lists memories for the authenticated user', async () => {
      await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({ content: 'first memory' });
      await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({ content: 'second memory' });

      const res = await request(app)
        .get('/api/v1/memories')
        .set('x-test-user-id', 'user-1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('separates memories between users', async () => {
      await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({ content: 'alice private note' });
      await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-2')
        .send({ content: 'bob private note' });

      const res1 = await request(app)
        .get('/api/v1/memories')
        .set('x-test-user-id', 'user-1');
      const res2 = await request(app)
        .get('/api/v1/memories')
        .set('x-test-user-id', 'user-2');

      expect(res1.body.data).toHaveLength(1);
      expect(res1.body.data[0].userId).toBe('user-1');
      expect(res1.body.data[0].content).toBe('alice private note');

      expect(res2.body.data).toHaveLength(1);
      expect(res2.body.data[0].userId).toBe('user-2');
      expect(res2.body.data[0].content).toBe('bob private note');
    });
  });

  describe('GET /api/v1/memories/:id', () => {
    it('returns 200 with the memory', async () => {
      const created = await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({ content: 'find me' });
      const id = created.body.memory.id;

      const res = await request(app)
        .get(`/api/v1/memories/${id}`)
        .set('x-test-user-id', 'user-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
      expect(res.body.content).toBe('find me');
      expect(res.body.userId).toBe('user-1');
    });

    it('returns 404 if the memory does not exist', async () => {
      const res = await request(app)
        .get('/api/v1/memories/00000000-0000-0000-0000-000000000000')
        .set('x-test-user-id', 'user-1');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/v1/memories/:id', () => {
    it('updates the memory content', async () => {
      const created = await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({ content: 'original content' });
      const id = created.body.memory.id;

      const res = await request(app)
        .put(`/api/v1/memories/${id}`)
        .set('x-test-user-id', 'user-1')
        .send({ content: 'updated content' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
      expect(res.body.content).toBe('updated content');
      expect(res.body.userId).toBe('user-1');
    });
  });

  describe('DELETE /api/v1/memories/:id', () => {
    it('returns success when the memory is deleted', async () => {
      const created = await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({ content: 'to be deleted' });
      const id = created.body.memory.id;

      const res = await request(app)
        .delete(`/api/v1/memories/${id}`)
        .set('x-test-user-id', 'user-1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const after = await request(app)
        .get(`/api/v1/memories/${id}`)
        .set('x-test-user-id', 'user-1');
      expect(after.status).toBe(404);
    });

    it('returns 404 when deleting a non-existent memory', async () => {
      const res = await request(app)
        .delete('/api/v1/memories/00000000-0000-0000-0000-000000000000')
        .set('x-test-user-id', 'user-1');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/memories/search', () => {
    it('searches memories by query string', async () => {
      await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({ content: 'Buy groceries tomorrow' });
      await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({ content: 'Call dentist Monday' });
      await request(app)
        .post('/api/v1/memories')
        .set('x-test-user-id', 'user-1')
        .send({ content: 'Pick up groceries after work' });

      const res = await request(app)
        .post('/api/v1/memories/search')
        .set('x-test-user-id', 'user-1')
        .send({ query: 'groceries' });

      expect(res.status).toBe(200);
      expect(res.body.query).toBe('groceries');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
      for (const hit of res.body.data) {
        expect(hit.memory.content.toLowerCase()).toContain('groceries');
        expect(hit.memory.userId).toBe('user-1');
      }
    });
  });
});
