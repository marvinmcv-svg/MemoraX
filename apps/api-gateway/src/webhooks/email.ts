import { Context } from 'hono';
import type { AppContext } from '../types';

export async function handleEmailWebhook(c: Context<AppContext>) {
  const body = await c.req.json();

  const from = body.From || body.from;
  const subject = body.Subject || body.subject;
  const content = body.TextBody || body.HtmlBody || body.content || '';

  if (!from || !content) {
    return c.json({ status: 'ok' });
  }

  console.log(`Email from ${from}: ${subject}`);

  const fullContent = subject ? `[Subject: ${subject}]\n${content}` : content;

  await fetch(`${c.env.BACKEND_URL}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'email',
      channelUserId: from,
      content: fullContent,
      contentType: 'text',
    }),
  });

  return c.json({ status: 'ok' });
}
