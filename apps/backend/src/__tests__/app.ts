import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { memoryRoutes } from '../routes/memories';
import { reminderRoutes } from '../routes/reminders';
import { channelRoutes } from '../routes/channels';
import { workspaceRoutes } from '../routes/workspaces';
import { apiKeyRoutes } from '../routes/api-keys';
import { aiRoutes } from '../routes/ai';
import { briefingRoutes } from '../routes/briefing';
import { captureRoutes } from '../routes/capture';
import { webhookRoutes } from '../routes/webhooks';
import { kgRoutes } from '../routes/knowledge-graph';
import { serendipityRoutes } from '../routes/serendipity';
import { channelAuthMiddleware } from '../middleware/channel-auth';
import { __resetStoreForTesting } from '../lib/store';

export interface TestAppOptions {
  allowedOrigins?: string[];
}

export function createTestApp(options: TestAppOptions = {}): Express {
  __resetStoreForTesting();

  const allowedOrigins = options.allowedOrigins ?? [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  const app: Express = express();
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
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: Request, _res: Response, buf: Buffer) => {
        (req as any).rawBody = Buffer.from(buf);
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  app.use((req: Request, _res: Response, next: NextFunction) => {
    const headerUserId = req.header('x-test-user-id');
    if (headerUserId) {
      (req as any).userId = headerUserId;
    }
    next();
  });

  app.use('/webhooks', webhookRoutes);
  app.use('/api/v1/capture', channelAuthMiddleware, captureRoutes);
  app.use('/api/v1/memories', memoryRoutes);
  app.use('/api/v1/reminders', reminderRoutes);
  app.use('/api/v1/channels', channelRoutes);
  app.use('/api/v1/workspaces', workspaceRoutes);
  app.use('/api/v1/api-keys', apiKeyRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/briefing', briefingRoutes);
  app.use('/api/v1/kg', kgRoutes);
  app.use('/api/v1/serendipity', serendipityRoutes);

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      db: process.env.DATABASE_URL ? 'configured' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const message = err?.message || 'Internal Server Error';
    if (message.startsWith('CORS:')) {
      res.status(403).json({ error: message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

export default createTestApp;
