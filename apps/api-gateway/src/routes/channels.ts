import { Hono } from 'hono';
import type { AppContext } from '../types';
import { verifyWhatsAppCredentials, sendWhatsAppMessage, sendWhatsAppMediaMessage } from '../lib/whatsapp';

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

channelRoutes.get('/health/:channel', async (c) => {
  const channel = c.req.param('channel');
  const TELEGRAM_BOT_TOKEN = c.env.TELEGRAM_BOT_TOKEN || '';
  const SLACK_BOT_TOKEN = c.env.SLACK_BOT_TOKEN || '';

  const health: Record<string, { status: string; latency?: number; error?: string }> = {
    whatsapp: { status: 'configured' },
    telegram: { status: 'unknown' },
    slack: { status: 'unknown' },
    sms: { status: 'configured' },
    email: { status: 'configured' },
  };

  if (channel === 'telegram' && TELEGRAM_BOT_TOKEN) {
    const start = Date.now();
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
      const data = await res.json();
      health.telegram = {
        status: data.ok ? 'connected' : 'error',
        latency: Date.now() - start,
        error: data.error_code ? `${data.error_code}: ${data.description}` : undefined,
      };
    } catch (err) {
      health.telegram = { status: 'error', error: String(err) };
    }
  }

  if (channel === 'slack' && SLACK_BOT_TOKEN) {
    const start = Date.now();
    try {
      const res = await fetch('https://slack.com/api/auth.test', {
        headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      });
      const data = await res.json();
      health.slack = {
        status: data.ok ? 'connected' : 'error',
        latency: Date.now() - start,
        error: data.error ? data.error : undefined,
      };
    } catch (err) {
      health.slack = { status: 'error', error: String(err) };
    }
  }

  if (channel === 'whatsapp') {
    const WHATSAPP_ACCESS_TOKEN = c.env.WHATSAPP_ACCESS_TOKEN || '';
    const WHATSAPP_PHONE_ID = c.env.WHATSAPP_PHONE_ID || '';
    if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_ID) {
      const start = Date.now();
      const result = await verifyWhatsAppCredentials(WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID);
      health.whatsapp = {
        status: result.valid ? 'connected' : 'error',
        latency: Date.now() - start,
        error: result.error,
      };
    } else {
      health.whatsapp = { status: 'not_configured' };
    }
  }

  if (channel === 'sms') {
    health.sms = { status: 'configured' };
  }

  if (channel === 'email') {
    health.email = { status: 'configured' };
  }

  return c.json(health[channel] || { status: 'unknown' });
});

channelRoutes.post('/send/whatsapp', async (c) => {
  const body = await c.req.json();
  const { to, body: msgBody, mediaUrl, caption } = body;

  if (!to || !msgBody) {
    return c.json({ error: 'to and body are required' }, 400);
  }

  if (mediaUrl) {
    const result = await sendWhatsAppMediaMessage(c as AppContext, { to, mediaUrl, caption });
    return c.json(result);
  }

  const result = await sendWhatsAppMessage(c as AppContext, { to, body: msgBody });
  return c.json(result);
});
