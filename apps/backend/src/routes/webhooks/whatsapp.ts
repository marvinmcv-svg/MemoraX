import { Router, Request, Response } from 'express';
import { sendWhatsAppTextMessage, sendTutorResponse, sendHomeworkConfirmation } from '../../services/whatsapp-sender';
import { getOrCreateChannelUser } from '../../lib/channel-users';
import { schema, requireDb } from '../../lib/db';
import { eq, and } from '@memorax/db';

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
 * Format a date for display in WhatsApp messages.
 */
function formatDateForWhatsApp(dateStr: string | null): string {
  if (!dateStr) return 'No due date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

        // Handle family link commands
        const trimmed = (content || '').trim().toLowerCase();
        const acceptMatch = trimmed.match(/^accept\s+([a-zA-Z0-9]{8})$/);

        if (acceptMatch || trimmed === 'my code' || trimmed === 'link' || trimmed === 'family link') {
          const userId = await getOrCreateChannelUser('whatsapp', from);

          if (acceptMatch) {
            // Accept a family link code
            const code = acceptMatch[1].toUpperCase();
            try {
              const db = requireDb();
              const links = await db
                .select()
                .from(schema.familyGroups)
                .where(and(
                  eq(schema.familyGroups.linkCode, code),
                  eq(schema.familyGroups.status, 'pending')
                ))
                .limit(1);

              if (links.length === 0) {
                await sendWhatsAppTextMessage({ to: from, body: "That code doesn't work. Ask your parent to generate a new one from Settings → Family.", phoneNumberId });
              } else if (links[0].codeExpiresAt && new Date(links[0].codeExpiresAt) < new Date()) {
                await sendWhatsAppTextMessage({ to: from, body: "That code has expired. Ask your parent to generate a new one from Settings → Family.", phoneNumberId });
              } else {
                const [updated] = await db
                  .update(schema.familyGroups)
                  .set({
                    childId: userId,
                    status: 'active',
                    linkCode: null,
                    codeExpiresAt: null,
                    updatedAt: new Date(),
                  })
                  .where(eq(schema.familyGroups.id, links[0].id))
                  .returning();

                const parentRows = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, links[0].parentId)).limit(1);
                const parentName = parentRows[0]?.name ?? 'Your parent';
                await sendWhatsAppTextMessage({ to: from, body: `✅ You're now linked with ${parentName}! They'll be able to see your upcoming assignments.`, phoneNumberId });
              }
            } catch (err) {
              console.error('[whatsapp] accept code error:', err);
              await sendWhatsAppTextMessage({ to: from, body: "Something went wrong. Try again or ask your parent to generate a new code.", phoneNumberId });
            }
            continue;
          } else if (trimmed === 'my code') {
            // Check if user has a pending link code
            try {
              const db = requireDb();
              const pendingLinks = await db
                .select({ linkCode: schema.familyGroups.linkCode, codeExpiresAt: schema.familyGroups.codeExpiresAt })
                .from(schema.familyGroups)
                .where(and(
                  eq(schema.familyGroups.childId, userId),
                  eq(schema.familyGroups.status, 'pending')
                ))
                .limit(1);

              if (pendingLinks.length > 0 && pendingLinks[0].linkCode && pendingLinks[0].codeExpiresAt && new Date(pendingLinks[0].codeExpiresAt) > new Date()) {
                await sendWhatsAppTextMessage({ to: from, body: `Your link code is: ${pendingLinks[0].linkCode}\nThis code expires in 24 hours. Use it to link with your parent!`, phoneNumberId });
              } else {
                await sendWhatsAppTextMessage({ to: from, body: "You don't have a pending link code. Ask your parent to generate one from Settings → Family.", phoneNumberId });
              }
            } catch (err) {
              console.error('[whatsapp] my code error:', err);
              await sendWhatsAppTextMessage({ to: from, body: "Something went wrong. Try again.", phoneNumberId });
            }
            continue;
          } else {
            // "link" or "family link" — explain how to use the feature
            await sendWhatsAppTextMessage({
              to: from,
              body: "📎 Family Link\n\nThere are two ways to link with a parent:\n\n1️⃣ Get a code from your parent (Settings → Family) and send me: accept YOURCODE\n\n2️⃣ If you already have a code, just send: accept ABC12345",
              phoneNumberId
            });
            continue;
          }
        }

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

          if (captureRes.ok) {
            processedCount++;
            const captureData = await captureRes.json() as {
              intent: string;
              memory?: { content: string };
              homework?: { title: string; dueAt: string | null };
            };

            // Handle AI responses based on intent
            const intent = captureData.intent;
            if (intent === 'question' && captureData.memory) {
              // Generate and send tutor response
              const { generateTutorResponse } = await import('../../services/ai-tutor');
              const tutorResponse = await generateTutorResponse(
                captureData.memory.content,
                undefined
              );
              if (tutorResponse.answer) {
                await sendTutorResponse(from, tutorResponse.answer, phoneNumberId);
              }
            } else if (intent === 'homework' && captureData.homework) {
              // Send homework confirmation
              const hw = captureData.homework;
              await sendHomeworkConfirmation(
                from,
                hw.title,
                hw.dueAt ? formatDateForWhatsApp(hw.dueAt) : null,
                phoneNumberId
              );
            } else if (intent === 'question' || intent === 'homework') {
              // Intent detected but no full AI response (maybe AI not configured)
              // Send a simple acknowledgment
              const ackMessage = intent === 'question'
                ? "Got your question! I'm here to help. Our AI tutor is setting up — check your dashboard for full responses, or try again in a moment. 📚"
                : "Homework captured! 📝 Check your dashboard to see all your assignments and due dates.";
              await sendWhatsAppTextMessage({ to: from, body: ackMessage, phoneNumberId });
            }
          } else {
            console.error(`[whatsapp] capture failed: ${captureRes.status}`);
          }
        } catch (err) {
          console.error(`[whatsapp] capture error for ${messageId}:`, err);
        }
      }
    }
  }

  return res.json({ status: 'ok', processed: processedCount });
});

export { whatsappRoutes };