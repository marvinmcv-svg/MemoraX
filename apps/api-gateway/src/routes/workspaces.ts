import { Hono } from 'hono';
import type { AppContext } from '../types';

export const workspaceRoutes = new Hono<AppContext>();

workspaceRoutes.get('/', async (c) => {
  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/workspaces`, {
    headers: {
      Authorization: `Bearer ${c.get('authToken')}`,
    },
  });

  const result = await response.json();
  return c.json(result);
});

workspaceRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const { name, description, teamId } = body;

  if (!name) {
    return c.json({ error: 'name is required' }, 400);
  }

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/workspaces`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.get('authToken')}`,
    },
    body: JSON.stringify({ name, description, teamId }),
  });

  const result = await response.json();
  return c.json(result);
});

workspaceRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/workspaces/${id}`, {
    headers: {
      Authorization: `Bearer ${c.get('authToken')}`,
    },
  });

  const result = await response.json();
  return c.json(result);
});

workspaceRoutes.post('/:id/memories', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { memoryId } = body;

  if (!memoryId) {
    return c.json({ error: 'memoryId is required' }, 400);
  }

  const response = await fetch(
    `${c.env.BACKEND_URL}/api/v1/workspaces/${id}/memories`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${c.get('authToken')}`,
      },
      body: JSON.stringify({ memoryId }),
    }
  );

  const result = await response.json();
  return c.json(result);
});

workspaceRoutes.delete('/:id/memories/:memoryId', async (c) => {
  const { id, memoryId } = c.req.param();

  const response = await fetch(
    `${c.env.BACKEND_URL}/api/v1/workspaces/${id}/memories/${memoryId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${c.get('authToken')}`,
      },
    }
  );

  const result = await response.json();
  return c.json(result);
});