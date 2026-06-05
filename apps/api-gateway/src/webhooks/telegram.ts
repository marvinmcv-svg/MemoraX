import { Context } from 'hono';
import type { AppContext } from '../types';

async function verifyTelegramToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      method: 'GET',
    });
    const data = await res.json() as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function handleTelegramUpdate(c: Context<AppContext>) {
  const TELEGRAM_BOT_TOKEN = c.env.TELEGRAM_BOT_TOKEN || '';
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

  console.log(`Telegram message from ${chatId}: ${content}`);

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
