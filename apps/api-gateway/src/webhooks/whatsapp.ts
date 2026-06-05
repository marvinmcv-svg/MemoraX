import { Context } from 'hono';
import type { AppContext } from '../types';
import { logWebhook, redactPII } from '../lib/log';

const seenMessages = new Set<string>();

export async function verifyWhatsAppSignature(c: Context<AppContext>, next: () => Promise<void>) {
  const WHATSAPP_VERIFY_TOKEN = c.env.WHATSAPP_VERIFY_TOKEN || '';
  const WHATSAPP_APP_SECRET = c.env.WHATSAPP_APP_SECRET || '';

  const mode = c.req.query('hub.mode');
  const token = c.req.query('hub.verify_token');
  const challenge = c.req.query('hub.challenge');

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return c.text(challenge || 'ok');
  }

  const signature = c.req.header('x-hub-signature-256');
  if (!signature) {
    return c.json({ error: 'Missing signature' }, 401);
  }

  const body = await c.req.text();
  const encoder = new TextEncoder();
  const key = encoder.encode(WHATSAPP_APP_SECRET);
  const data = encoder.encode(body);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (`sha256=${expectedSignature}` !== signature) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  c.set('rawBody', body);
  await next();
}

export async function handleWhatsAppWebhook(c: Context<AppContext>) {
  const body = await c.req.json();

  if (body.object !== 'whatsapp_business_account') {
    return c.json({ error: 'Not a WhatsApp webhook' }, 400);
  }

  let processedCount = 0;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (value.messages) {
        for (const message of value.messages) {
          const messageId = message.id;
          const phoneNumberId = value.metadata?.phone_number_id;
          const from = message.from;
          const msgType = message.type;

          let content = '';
          let mediaUrl: string | undefined;
          let contentType = 'text';

          if (msgType === 'text') {
            content = message.text?.body || '';
          } else if (msgType === 'image') {
            mediaUrl = message.image?.id;
            contentType = 'image';
            content = message.image?.caption || '';
          } else if (msgType === 'video') {
            mediaUrl = message.video?.id;
            contentType = 'video';
            content = message.video?.caption || '';
          } else if (msgType === 'audio') {
            mediaUrl = message.audio?.id;
            contentType = 'audio';
          } else if (msgType === 'document') {
            mediaUrl = message.document?.id;
            contentType = 'document';
            content = message.document?.caption || message.document?.filename || '';
          } else {
            console.log(`Skipping unsupported message type: ${msgType} from ${redactPII(from)}`);
            continue;
          }

          if (seenMessages.has(messageId)) {
            console.log(`Duplicate message ${messageId}, skipping`);
            continue;
          }
          seenMessages.add(messageId);

          if (seenMessages.size > 10000) {
            seenMessages.clear();
          }

          logWebhook('whatsapp', from, content || `[${msgType}]`);
          console.log(`[whatsapp] msg=${messageId} len=${content?.length ?? 0}`);

          try {
            const captureRes = await fetch(`${c.env.BACKEND_URL}/api/v1/capture`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channel: 'whatsapp',
                channelUserId: from,
                phoneNumberId,
                content: content || `[${msgType}]`,
                contentType,
                mediaUrl,
                metadata: {
                  messageId,
                  phoneNumberId,
                  timestamp: message.timestamp,
                },
              }),
            });

            if (!captureRes.ok) {
              console.error(`Capture failed for message ${messageId}:`, await captureRes.text());
            } else {
              processedCount++;
            }
          } catch (err) {
            console.error(`Error capturing WhatsApp message ${messageId}:`, err);
          }
        }
      }
    }
  }

  return c.json({ status: 'ok', processed: processedCount });
}
