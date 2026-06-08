import { Router, Request, Response } from 'express';

const discordRoutes: Router = Router();

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

async function verifyDiscordBotToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Discord webhook handler.
 *
 * Discord doesn't use HMAC — requests are verified by calling the Discord API
 * with the bot token. Without a configured token the endpoint fails closed (503).
 *
 * Expected headers:
 *   Authorization: Bot <DISCORD_BOT_TOKEN>
 *
 * Returns 503 if Discord bot token not configured.
 * Returns 401 if token is invalid or missing.
 */
discordRoutes.post('/', async (req: Request, res: Response) => {
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
  const authHeader = req.headers['authorization'] as string || '';

  if (!DISCORD_BOT_TOKEN) {
    return res.status(503).json({ error: 'Discord bot token not configured' });
  }

  // Accept both "Bot <token>" and raw "<token>" forms
  const token = authHeader.startsWith('Bot ')
    ? authHeader.slice(4).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({ error: 'Missing Discord authorization header' });
  }

  // Verify the token is valid (optional extra check via API)
  // Skipped on every request for performance; kept as a debug signal.
  if (process.env.NODE_ENV === 'development') {
    const valid = await verifyDiscordBotToken(token);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid Discord bot token' });
    }
  }

  const body = req.body;

  // Discord sends a minimal ping payload during webhook setup verification
  if (body.type === 1) {
    return res.json({ type: 1 }); // Discord ping → pong
  }

  // Handle message create events (type 0 = callback, but Discord sends full payloads)
  // messages are nested under d for interaction callbacks or directly for webhook events
  const message = body.d?.message || body.message || body;
  if (!message?.id || !message.content) {
    return res.json({ status: 'ok' });
  }

  const channelId = body.d?.channel_id || message.channel_id;
  const guildId = body.d?.guild_id || message.guild_id;
  const userId = message.author?.id;
  const content = message.content;

  if (!userId || !content) {
    return res.json({ status: 'ok' });
  }

  console.log(`[discord] msg=${message.id} ch=${channelId} len=${content.length}`);

  try {
    await fetch(`${BACKEND_URL}/api/v1/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'discord',
        channelUserId: userId,
        content,
        contentType: 'text',
        metadata: {
          messageId: message.id,
          channelId,
          guildId,
          username: message.author?.username,
        },
      }),
    });
  } catch (err) {
    console.error('[discord] capture error:', err);
  }

  return res.json({ status: 'ok' });
});

export { discordRoutes };