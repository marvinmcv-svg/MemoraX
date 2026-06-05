import { Context } from 'hono';
import type { AppContext } from '../types';
import { logWebhook } from '../lib/log';

export async function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!secret || !timestamp || !signature) return false;
  const baseString = `v0:${timestamp}:${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(baseString));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `v0=${hex}` === signature;
}

export async function handleSlackWebhook(c: Context<AppContext>) {
  const SLACK_SIGNING_SECRET = c.env.SLACK_SIGNING_SECRET || '';
  const timestamp = c.req.header('X-Slack-Request-Timestamp') || '';
  const signature = c.req.header('X-Slack-Signature') || '';

  const body = await c.req.text();

  if (!SLACK_SIGNING_SECRET) {
    return c.json({ error: 'Slack signing secret not configured' }, 503);
  }

  if (!timestamp || !signature) {
    return c.json({ error: 'Missing Slack signature headers' }, 401);
  }

  if (Date.now() / 1000 - Number(timestamp) > 300) {
    return c.json({ error: 'Request too old' }, 400);
  }

  if (!(await verifySlackSignature(body, timestamp, signature, SLACK_SIGNING_SECRET))) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const data = JSON.parse(body);

  if (data.type === 'url_verification') {
    return c.json({ challenge: data.challenge });
  }

  const event = data.event;
  if (!event || (event.type === 'message' && event.subtype !== 'bot_message')) {
    return c.json({ status: 'ok' });
  }

  const userId = event.user;
  const content = event.text || '';

  if (!userId || !content) {
    return c.json({ status: 'ok' });
  }

  logWebhook('slack', userId, content);
  console.log(`[slack] msg=${event.event_ts || event.ts || 'n/a'} len=${content.length}`);

  await fetch(`${c.env.BACKEND_URL}/api/v1/capture`, {
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
