import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { verifyToken } from '@clerk/backend';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';
import { verifyWhatsAppSignature, handleWhatsAppWebhook } from './webhooks/whatsapp';
import { handleTelegramUpdate } from './webhooks/telegram';
import { handleSlackWebhook } from './webhooks/slack';
import { handleTwilioWebhook } from './webhooks/twilio';
import { handleEmailWebhook } from './webhooks/email';
import { memoryRoutes } from './routes/memories';
import { reminderRoutes } from './routes/reminders';
import { channelRoutes } from './routes/channels';
import { workspaceRoutes } from './routes/workspaces';
import { aiRoutes } from './routes/ai';
import type { AppContext } from './types';

const app = new Hono<AppContext>();

const redis = new Redis({
  url: 'TODO', // Set via wrangler secrets
  token: 'TODO',
});

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
});

app.use('*', logger());

app.use('*', cors({
  origin: ['https://memorax.ai', 'http://localhost:3000'],
  credentials: true,
}));

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    c.set('authToken', token);
  }

  await next();
});

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.post('/webhooks/whatsapp', verifyWhatsAppSignature, handleWhatsAppWebhook);
app.post('/webhooks/telegram', handleTelegramUpdate);
app.post('/webhooks/slack', handleSlackWebhook);
app.post('/webhooks/twilio', handleTwilioWebhook);
app.post('/webhooks/email', handleEmailWebhook);

app.route('/api/v1/memories', memoryRoutes);
app.route('/api/v1/reminders', reminderRoutes);
app.route('/api/v1/channels', channelRoutes);
app.route('/api/v1/workspaces', workspaceRoutes);
app.route('/api/v1/ai', aiRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;
