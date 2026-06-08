import { Router, Request, Response } from 'express';

const slackRoutes: Router = Router();

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

async function verifySlackSignature(
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

/**
 * Slack webhook handler.
 *
 * Handles:
 * - GET ?hub.mode=subscribe&hub.verify_token=X&hub.challenge=Y → URL verification
 * - POST → event callback (message events only)
 *
 * Returns 503 if Slack signing secret not configured.
 * Returns 401 on missing/invalid signature.
 */
slackRoutes.get('/', (req: Request, res: Response) => {
  const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';

  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (mode === 'subscribe' && token === SLACK_SIGNING_SECRET) {
    return res.type('text/plain').send(challenge || 'ok');
  }

  if (!SLACK_SIGNING_SECRET) {
    return res.status(503).json({ error: 'Slack signing secret not configured' });
  }

  return res.status(404).json({ error: 'Not found' });
});

slackRoutes.post('/', async (req: Request, res: Response) => {
  const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';
  const timestamp = req.headers['x-slack-request-timestamp'] as string || '';
  const signature = req.headers['x-slack-signature'] as string || '';

  if (!SLACK_SIGNING_SECRET) {
    return res.status(503).json({ error: 'Slack signing secret not configured' });
  }

  if (!timestamp || !signature) {
    return res.status(401).json({ error: 'Missing Slack signature headers' });
  }

  // Replay attack protection: reject requests older than 5 minutes
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return res.status(400).json({ error: 'Request too old' });
  }

  const rawBody = (req as any).rawBody?.toString() || JSON.stringify(req.body);

  if (!(await verifySlackSignature(rawBody, timestamp, signature, SLACK_SIGNING_SECRET))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const data = req.body;

  // URL verification challenge
  if (data.type === 'url_verification') {
    return res.json({ challenge: data.challenge });
  }

  const event = data.event;
  if (!event || (event.type === 'message' && event.subtype !== 'bot_message')) {
    return res.json({ status: 'ok' });
  }

  const userId = event.user;
  const content = event.text || '';

  if (!userId || !content) {
    return res.json({ status: 'ok' });
  }

  console.log(`[slack] msg=${event.event_ts || event.ts || 'n/a'} len=${content.length}`);

  try {
    await fetch(`${BACKEND_URL}/api/v1/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'slack',
        channelUserId: userId,
        content,
        contentType: 'text',
      }),
    });
  } catch (err) {
    console.error('[slack] capture error:', err);
  }

  return res.json({ status: 'ok' });
});

export { slackRoutes };