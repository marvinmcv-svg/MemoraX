import { Context } from 'hono';
import type { AppContext } from '../types';

function verifySlackSignature(body: string, timestamp: string, signature: string, secret: string): boolean {
  const baseString = `v0:${timestamp}:${body}`;
  const mySignature =
    'v0=' +
    Array.from(
      new Uint8Array(
        new TextEncoder().encode(baseString)
      )
    )
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  return mySignature === signature;
}

export async function handleSlackWebhook(c: Context<AppContext>) {
  const SLACK_SIGNING_SECRET = c.env.SLACK_SIGNING_SECRET || '';
  const timestamp = c.req.header('X-Slack-Request-Timestamp') || '';
  const signature = c.req.header('X-Slack-Signature') || '';

  const body = await c.req.text();

  if (Date.now() / 1000 - Number(timestamp) > 300) {
    return c.json({ error: 'Request too old' }, 400);
  }

  if (!verifySlackSignature(body, timestamp, signature, SLACK_SIGNING_SECRET)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const data = JSON.parse(body);

  if (data.type === 'url_verification') {
    return c.json({ challenge: data.challenge });
  }

  const event = data.event;
  if (!event || event.type === 'message' && event.subtype !== 'bot_message') {
    return c.json({ status: 'ok' });
  }

  const userId = event.user;
  const content = event.text || '';

  if (!userId || !content) {
    return c.json({ status: 'ok' });
  }

  console.log(`Slack message from ${userId}: ${content}`);

  await fetch(`${c.env.BACKEND_URL}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'slack',
      channelUserId: userId,
      content,
      contentType: 'text',
    }),
  });

  return c.json({ status: 'ok' });
}
