import { Context } from 'hono';
import type { AppContext } from '../types';

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

          if (msgType !== 'text') {
            console.log(`Skipping non-text message type: ${msgType} from ${from}`);
            continue;
          }

          const content = message.text?.body || '';

          if (seenMessages.has(messageId)) {
            console.log(`Duplicate message ${messageId}, skipping`);
            continue;
          }
          seenMessages.add(messageId);

          if (seenMessages.size > 10000) {
            seenMessages.clear();
          }

          console.log(`WhatsApp message from ${from}: ${content}`);

          try {
            const captureRes = await fetch(`${c.env.BACKEND_URL}/api/v1/capture`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channel: 'whatsapp',
                channelUserId: from,
                phoneNumberId,
                content,
                contentType: 'text',
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
