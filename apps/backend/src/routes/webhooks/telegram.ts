import { Router, Request, Response } from 'express';

const telegramRoutes: Router = Router();

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

function verifyTelegramSecret(
  provided: string,
  configured: string
): { ok: boolean; reason?: 'unconfigured' | 'missing' | 'mismatch' } {
  if (!configured) return { ok: false, reason: 'unconfigured' };
  if (!provided) return { ok: false, reason: 'missing' };
  if (provided.length !== configured.length) return { ok: false, reason: 'mismatch' };
  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ configured.charCodeAt(i);
  }
  return mismatch === 0 ? { ok: true } : { ok: false, reason: 'mismatch' };
}

async function verifyTelegramToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { method: 'GET' });
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

/**
 * Telegram webhook handler.
 *
 * Verifies X-Telegram-Bot-Api-Secret-Token header.
 * Extracts message text and forwards to /api/v1/capture.
 *
 * Returns 503 if secret token not configured.
 * Returns 401 on missing/invalid secret token.
 */
telegramRoutes.post('/', async (req: Request, res: Response) => {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN || '';
  const provided = req.headers['x-telegram-bot-api-secret-token'] as string || '';

  const telegramSecretCheck = verifyTelegramSecret(provided, TELEGRAM_SECRET_TOKEN);
  if (!telegramSecretCheck.ok) {
    if (telegramSecretCheck.reason === 'unconfigured') {
      return res.status(503).json({ error: 'Telegram secret token not configured' });
    }
    return res.status(401).json({ error: 'Invalid secret token' });
  }

  const body = req.body;

  const message = body.message || body.edited_message || body.callback_query?.message;
  if (!message) {
    return res.json({ status: 'ok' });
  }

  const chatId = message.chat?.id;
  const content = message.text || message.caption || '';

  if (!chatId || !content) {
    return res.json({ status: 'ok' });
  }

  if (TELEGRAM_BOT_TOKEN) {
    const isValid = await verifyTelegramToken(TELEGRAM_BOT_TOKEN);
    if (!isValid) {
      console.warn('[telegram] bot token validation failed');
    }
  }

  console.log(`[telegram] msg=${message.message_id ?? 'n/a'} len=${content.length}`);

  try {
    await fetch(`${BACKEND_URL}/api/v1/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'telegram',
        channelUserId: String(chatId),
        content,
        contentType: 'text',
        metadata: {
          messageId: message.message_id,
          chatId: chatId,
        },
      }),
    });
  } catch (err) {
    console.error('[telegram] capture error:', err);
  }

  return res.json({ status: 'ok' });
});

export { telegramRoutes };