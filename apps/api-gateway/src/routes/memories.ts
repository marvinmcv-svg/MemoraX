import { Hono } from 'hono';
import type { AppContext } from '../types';

export const memoryRoutes = new Hono<AppContext>();

memoryRoutes.post('/', async (c) => {
  const body = await c.req.json();

  const { content, contentType, sourceChannel, mediaUrl, metadata } = body;

  if (!content) {
    return c.json({ error: 'Content is required' }, 400);
  }

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/memories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.get('authToken')}`,
    },
    body: JSON.stringify({
      content,
      contentType: contentType || 'text',
      sourceChannel,
      mediaUrl,
      metadata,
    }),
  });

  const result = await response.json();
  return c.json(result);
});

memoryRoutes.get('/', async (c) => {
  const page = Number(c.req.query('page')) || 1;
  const pageSize = Number(c.req.query('pageSize')) || 20;
  const intent = c.req.query('intent');
  const channel = c.req.query('channel');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (intent) params.set('intent', intent);
  if (channel) params.set('channel', channel);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const response = await fetch(
    `${c.env.BACKEND_URL}/api/v1/memories?${params}`,
    {
      headers: {
        Authorization: `Bearer ${c.get('authToken')}`,
      },
    }
  );

  const result = await response.json();
  return c.json(result);
});

memoryRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/memories/${id}`, {
    headers: {
      Authorization: `Bearer ${c.get('authToken')}`,
    },
  });

  const result = await response.json();
  return c.json(result);
});

memoryRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/memories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.get('authToken')}`,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  return c.json(result);
});

memoryRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/memories/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${c.get('authToken')}`,
    },
  });

  const result = await response.json();
  return c.json(result);
});

memoryRoutes.post('/search', async (c) => {
  const body = await c.req.json();
  const { query, limit, filters } = body;

  if (!query) {
    return c.json({ error: 'Query is required' }, 400);
  }

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/memories/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.get('authToken')}`,
    },
    body: JSON.stringify({ query, limit, filters }),
  });

  const result = await response.json();
  return c.json(result);
});