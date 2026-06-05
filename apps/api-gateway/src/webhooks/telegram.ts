import { Context } from 'hono';
import type { AppContext } from '../types';
import { logWebhook } from '../lib/log';

export function verifyTelegramSecret(
  provided: string,
  configured: string
): { ok: boolean; reason?: 'unconfigured' | 'missing' | 'mismatch' } {
  // Fail closed: if no secret is configured, do NOT accept requests.
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
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      method: 'GET',
    });
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function handleTelegramUpdate(c: Context<AppContext>) {
  const TELEGRAM_BOT_TOKEN = c.env.TELEGRAM_BOT_TOKEN || '';
  const TELEGRAM_SECRET_TOKEN = c.env.TELEGRAM_SECRET_TOKEN || '';
  const provided = c.req.header('X-Telegram-Bot-Api-Secret-Token') || '';

  const telegramSecretCheck = verifyTelegramSecret(provided, TELEGRAM_SECRET_TOKEN);
  if (!telegramSecretCheck.ok) {
    if (telegramSecretCheck.reason === 'unconfigured') {
      return c.json({ error: 'Telegram secret token not configured' }, 503);
    }
    return c.json({ error: 'Invalid secret token' }, 401);
  }

  const body = await c.req.json();

  const message = body.message || body.edited_message || body.callback_query?.message;
  if (!message) {
    return c.json({ status: 'ok' });
  }

  const chatId = message.chat?.id;
  const content = message.text || message.caption || '';

  if (!chatId || !content) {
    return c.json({ status: 'ok' });
  }

  if (TELEGRAM_BOT_TOKEN) {
    const isValid = await verifyTelegramToken(TELEGRAM_BOT_TOKEN);
    if (!isValid) {
      console.warn('Telegram bot token validation failed');
    }
  }

  logWebhook('telegram', String(chatId), content);
  console.log(`[telegram] msg=${message.message_id ?? 'n/a'} len=${content.length}`);

  await fetch(`${c.env.BACKEND_URL}/api/v1/capture`, {
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

  return c.json({ status: 'ok' });
}
