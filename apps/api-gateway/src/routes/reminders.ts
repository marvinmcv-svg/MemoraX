import { Hono } from 'hono';
import type { AppContext } from '../types';

export const reminderRoutes = new Hono<AppContext>();

reminderRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const { memoryId, remindAt, rrule, deliveryChannel } = body;

  if (!memoryId || !remindAt) {
    return c.json({ error: 'memoryId and remindAt are required' }, 400);
  }

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/reminders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.get('authToken')}`,
    },
    body: JSON.stringify({ memoryId, remindAt, rrule, deliveryChannel }),
  });

  const result = await response.json();
  return c.json(result);
});

reminderRoutes.get('/', async (c) => {
  const status = c.req.query('status');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const response = await fetch(
    `${c.env.BACKEND_URL}/api/v1/reminders?${params}`,
    {
      headers: {
        Authorization: `Bearer ${c.get('authToken')}`,
      },
    }
  );

  const result = await response.json();
  return c.json(result);
});

reminderRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/reminders/${id}`, {
    headers: {
      Authorization: `Bearer ${c.get('authToken')}`,
    },
  });

  const result = await response.json();
  return c.json(result);
});

reminderRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/reminders/${id}`, {
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

reminderRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const response = await fetch(`${c.env.BACKEND_URL}/api/v1/reminders/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${c.get('authToken')}`,
    },
  });

  const result = await response.json();
  return c.json(result);
});

reminderRoutes.post('/:id/snooze', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { minutes } = body;

  const response = await fetch(
    `${c.env.BACKEND_URL}/api/v1/reminders/${id}/snooze`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${c.get('authToken')}`,
      },
      body: JSON.stringify({ minutes }),
    }
  );

  const result = await response.json();
  return c.json(result);
});