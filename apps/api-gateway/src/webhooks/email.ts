import { Context } from 'hono';
import type { AppContext } from '../types';
import { logWebhook } from '../lib/log';

export async function handleEmailWebhook(c: Context<AppContext>) {
  const body = await c.req.json();

  const from = body.From || body.from;
  const subject = body.Subject || body.subject;
  const content = body.TextBody || body.HtmlBody || body.content || '';

  if (!from || !content) {
    return c.json({ status: 'ok' });
  }

  logWebhook('email', from, subject || '(no subject)');
  console.log(`[email] msg=${(body.MessageID || body['Message-Id'] || body.messageId) || 'n/a'} len=${content?.length ?? 0}`);

  const fullContent = subject ? `[Subject: ${subject}]\n${content}` : content;

  await fetch(`${c.env.BACKEND_URL}/api/v1/capture`, {
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
