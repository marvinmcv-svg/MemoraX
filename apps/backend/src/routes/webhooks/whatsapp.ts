import { Router, Request, Response } from 'express';

const whatsappRoutes: Router = Router();

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

const seenMessages = new Set<string>();

async function verifyWhatsAppSignature(
  body: string,
  signature: string,
  appSecret: string
): Promise<boolean> {
  if (!appSecret) return false;
  const encoder = new TextEncoder();
  const key = encoder.encode(appSecret);
  const data = encoder.encode(body);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const hex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256=${hex}` === signature;
}

function redactPII(phone: string): string {
  if (!phone || phone.length < 4) return '***';
  return phone.slice(0, 4) + '****' + phone.slice(-2);
}

/**
 * WhatsApp webhook handler (Meta Business API).
 *
 * Handles GET for webhook verification (hub.mode, hub.verify_token, hub.challenge).
 * Handles POST for incoming messages with HMAC-SHA256 signature verification.
 *
 * Returns 503 if WhatsApp app secret not configured.
 * Returns 401 on missing/invalid signature.
 * Returns 200 XML for valid TwiML-compatible responses.
 */
whatsappRoutes.get('/', (req: Request, res: Response) => {
  const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return res.type('text/plain').send(challenge || 'ok');
  }

  if (!WHATSAPP_VERIFY_TOKEN) {
    return res.status(503).json({ error: 'WhatsApp verify token not configured' });
  }

  return res.status(404).json({ error: 'Not found' });
});

whatsappRoutes.post('/', async (req: Request, res: Response) => {
  const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

  if (!WHATSAPP_APP_SECRET) {
    return res.status(503).json({ error: 'WhatsApp app secret not configured' });
  }

  const signature = req.headers['x-hub-signature-256'] as string || '';
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const rawBody = (req as any).rawBody?.toString() || JSON.stringify(req.body);

  if (!(await verifyWhatsAppSignature(rawBody, signature, WHATSAPP_APP_SECRET))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    return res.status(400).json({ error: 'Not a WhatsApp webhook' });
  }

  let processedCount = 0;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value?.messages) continue;

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
          console.log(`[whatsapp] unsupported msg type: ${msgType} from ${redactPII(from)}`);
          continue;
        }

        if (seenMessages.has(messageId)) {
          console.log(`[whatsapp] duplicate ${messageId}, skipping`);
          continue;
        }
        seenMessages.add(messageId);
        if (seenMessages.size > 10000) seenMessages.clear();

        console.log(`[whatsapp] msg=${messageId} from=${redactPII(from)} len=${content?.length ?? 0}`);

        try {
          const captureRes = await fetch(`${BACKEND_URL}/api/v1/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel: 'whatsapp',
              channelUserId: from,
              phoneNumberId,
              content: content || `[${msgType}]`,
              contentType,
              mediaUrl,
              metadata: { messageId, phoneNumberId, timestamp: message.timestamp },
            }),
          });
          if (captureRes.ok) processedCount++;
          else console.error(`[whatsapp] capture failed: ${captureRes.status}`);
        } catch (err) {
          console.error(`[whatsapp] capture error for ${messageId}:`, err);
        }
      }
    }
  }

  return res.json({ status: 'ok', processed: processedCount });
});

export { whatsappRoutes };