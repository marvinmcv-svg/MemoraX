import { Context } from 'hono';
import type { AppContext } from '../types';
import { logWebhook } from '../lib/log';

export async function verifyTwilioSignature(
  authToken: string,
  fullUrl: string,
  params: Record<string, string>,
  provided: string
): Promise<boolean> {
  if (!authToken || !provided) return false;
  const sortedKeys = Object.keys(params).sort();
  let toSign = fullUrl;
  for (const k of sortedKeys) toSign += k + params[k];
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(toSign));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return expected === provided;
}

export async function handleTwilioWebhook(c: Context<AppContext>) {
  const TWILIO_AUTH_TOKEN = c.env.TWILIO_AUTH_TOKEN || '';

  if (!TWILIO_AUTH_TOKEN) {
    return c.json({ error: 'Twilio auth token not configured' }, 503);
  }

  const provided = c.req.header('X-Twilio-Signature') || '';
  if (!provided) {
    return c.json({ error: 'Missing Twilio signature' }, 401);
  }

  const fullUrl = c.req.url;
  const form = await c.req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === 'string') params[k] = v;
  }

  if (!(await verifyTwilioSignature(TWILIO_AUTH_TOKEN, fullUrl, params, provided))) {
    return c.json({ error: 'Invalid Twilio signature' }, 401);
  }

  const from = params.From;
  const content = params.Body;

  if (!from || !content) {
    return c.json({ status: 'ok' });
  }

  logWebhook('sms', from, content);
  console.log(`[sms] msg=${params.MessageSid ?? 'n/a'} len=${content.length}`);

  await fetch(`${c.env.BACKEND_URL}/api/v1/capture`, {
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
