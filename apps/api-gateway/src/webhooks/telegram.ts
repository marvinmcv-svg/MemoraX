import { Context } from 'hono';
import type { AppContext } from '../types';

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

  console.log(`Telegram message from ${chatId}: ${content}`);

  await fetch(`${c.env.BACKEND_URL}/api/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'telegram',
      channelUserId: String(chatId),
      content,
      contentType: 'text',
    }),
  });

  return c.json({ status: 'ok' });
}
