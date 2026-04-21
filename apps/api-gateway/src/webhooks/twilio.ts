import { Context } from 'hono';
import type { AppContext } from '../types';

export async function handleTwilioWebhook(c: Context<AppContext>) {
  const body = await c.req.formData();

  const from = body.get('From') as string;
  const content = body.get('Body') as string;

  if (!from || !content) {
    return c.json({ status: 'ok' });
  }

  console.log(`SMS from ${from}: ${content}`);

  await fetch(`${c.env.BACKEND_URL}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'sms',
      channelUserId: from,
      content,
      contentType: 'text',
    }),
  });

  return c.text(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, 200, {
    'Content-Type': 'text/xml',
  });
}
