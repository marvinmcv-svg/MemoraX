import { Hono } from 'hono';
import type { AppContext } from '../types';

export const aiRoutes = new Hono<AppContext>();

aiRoutes.post('/classify', async (c) => {
  const body = await c.req.json();
  const { content } = body;

  if (!content) {
    return c.json({ error: 'content is required' }, 400);
  }

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/ai/classify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.get('authToken')}`,
    },
    body: JSON.stringify({ content }),
  });

  const result = await response.json();
  return c.json(result);
});

aiRoutes.post('/extract', async (c) => {
  const body = await c.req.json();
  const { content } = body;

  if (!content) {
    return c.json({ error: 'content is required' }, 400);
  }

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/ai/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.get('authToken')}`,
    },
    body: JSON.stringify({ content }),
  });

  const result = await response.json();
  return c.json(result);
});

aiRoutes.post('/transcribe', async (c) => {
  const body = await c.req.arrayBuffer();

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/ai/transcribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.get('authToken')}`,
    },
    body,
  });

  const result = await response.json();
  return c.json(result);
});

aiRoutes.post('/briefing/generate', async (c) => {
  const response = await fetch(
    `${c.env.BACKEND_URL}/api/v1/ai/briefing/generate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.get('authToken')}`,
      },
    }
  );

  const result = await response.json();
  return c.json(result);
});

aiRoutes.get('/briefing/latest', async (c) => {
  const response = await fetch(
    `${c.env.BACKEND_URL}/api/v1/ai/briefing/latest`,
    {
      headers: {
        Authorization: `Bearer ${c.get('authToken')}`,
      },
    }
  );

  const result = await response.json();
  return c.json(result);
});