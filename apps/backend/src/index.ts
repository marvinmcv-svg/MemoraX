import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { memoryRoutes } from './routes/memories';
import { reminderRoutes } from './routes/reminders';
import { channelRoutes } from './routes/channels';
import { workspaceRoutes } from './routes/workspaces';
import { apiKeyRoutes } from './routes/api-keys';
import { aiRoutes } from './routes/ai';
import { briefingRoutes } from './routes/briefing';
import { captureRoutes } from './routes/capture';
import { webhookRoutes } from './routes/webhooks';
import { slackRoutes } from './routes/webhooks/slack';
import { telegramRoutes } from './routes/webhooks/telegram';
import { twilioRoutes } from './routes/webhooks/twilio';
import { whatsappRoutes } from './routes/webhooks/whatsapp';
import { discordRoutes } from './routes/webhooks/discord';
import { kgRoutes } from './routes/knowledge-graph';
import { serendipityRoutes } from './routes/serendipity';
import { authMiddleware } from './middleware/auth';
import { channelAuthMiddleware } from './middleware/channel-auth';
import { knowledgeGraph } from './lib/knowledge-graph';
import { startScheduler } from './services/scheduler';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// CORS allowlist. In production, set CORS_ORIGINS to a comma-separated list
// of allowed origins, e.g.
//   CORS_ORIGINS=https://memorax-web.up.railway.app,https://app.memorax.com
// Without this env var, only localhost dev origins are allowed.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS: origin not allowed'));
    },
    credentials: true,
  })
);

// Capture the raw request body in `req.rawBody` so middleware that needs to
// verify HMAC signatures (channel-auth, stripe webhooks) can use it.
app.use(
  express.json({
    limit: '10mb',
    verify: (req: Request, _res: Response, buf: Buffer) => {
      (req as any).rawBody = Buffer.from(buf);
    },
  })
);
app.use(express.urlencoded({ extended: true }));

app.use('/webhooks', webhookRoutes);
app.use('/webhooks/slack', slackRoutes);
app.use('/webhooks/telegram', telegramRoutes);
app.use('/webhooks/twilio', twilioRoutes);
app.use('/webhooks/whatsapp', whatsappRoutes);
app.use('/webhooks/discord', discordRoutes);

app.use('/api/v1/capture', channelAuthMiddleware, captureRoutes);

const auth = authMiddleware;
app.use('/api/v1/memories', auth, memoryRoutes);
app.use('/api/v1/reminders', auth, reminderRoutes);
app.use('/api/v1/channels', auth, channelRoutes);
app.use('/api/v1/workspaces', auth, workspaceRoutes);
app.use('/api/v1/api-keys', auth, apiKeyRoutes);
app.use('/api/v1/ai', auth, aiRoutes);
app.use('/api/v1/briefing', auth, briefingRoutes);
app.use('/api/v1/kg', auth, kgRoutes);
app.use('/api/v1/serendipity', auth, serendipityRoutes);

app.get('/health', (req, res) => {
  const dbConnected = !!process.env.DATABASE_URL;
  res.json({
    status: 'ok',
    db: dbConnected ? 'configured' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  const message = err?.message || 'Internal Server Error';
  if (message.startsWith('CORS:')) {
    res.status(403).json({ error: message });
    return;
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`MemoraX Backend running on port ${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  startScheduler();
});

export default app;
