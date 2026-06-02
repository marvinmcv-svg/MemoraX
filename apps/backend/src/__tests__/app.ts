import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { memoryRoutes } from '../routes/memories';
import { reminderRoutes } from '../routes/reminders';
import { channelRoutes } from '../routes/channels';
import { workspaceRoutes } from '../routes/workspaces';
import { aiRoutes } from '../routes/ai';
import { briefingRoutes } from '../routes/briefing';
import { captureRoutes } from '../routes/capture';
import { webhookRoutes } from '../routes/webhooks';
import { kgRoutes } from '../routes/knowledge-graph';
import { serendipityRoutes } from '../routes/serendipity';
import { __resetStoreForTesting } from '../lib/store';

export function createTestApp(): Express {
  __resetStoreForTesting();

  const app: Express = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use((req: Request, _res: Response, next: NextFunction) => {
    const headerUserId = req.header('x-test-user-id');
    if (headerUserId) {
      (req as any).userId = headerUserId;
    }
    next();
  });

  app.use('/webhooks', webhookRoutes);
  app.use('/api/v1/capture', captureRoutes);
  app.use('/api/v1/memories', memoryRoutes);
  app.use('/api/v1/reminders', reminderRoutes);
  app.use('/api/v1/channels', channelRoutes);
  app.use('/api/v1/workspaces', workspaceRoutes);
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
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}

export default createTestApp;
