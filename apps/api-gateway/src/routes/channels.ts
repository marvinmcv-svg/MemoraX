import { Hono } from 'hono';
import type { AppContext } from '../types';

export const channelRoutes = new Hono<AppContext>();

channelRoutes.get('/', async (c) => {
  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/channels`, {
    headers: {
      Authorization: `Bearer ${c.get('authToken')}`,
    },
  });

  const result = await response.json();
  return c.json(result);
});

channelRoutes.post('/connect', async (c) => {
  const body = await c.req.json();
  const { channel, channelUserId } = body;

  if (!channel || !channelUserId) {
    return c.json({ error: 'channel and channelUserId are required' }, 400);
  }

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/channels/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.get('authToken')}`,
    },
    body: JSON.stringify({ channel, channelUserId }),
  });

  const result = await response.json();
  return c.json(result);
});

channelRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/channels/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${c.get('authToken')}`,
    },
  });

  const result = await response.json();
  return c.json(result);
});