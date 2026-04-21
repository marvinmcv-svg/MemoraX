import express, { Express } from 'express';
import cors from 'cors';
import { memoryRoutes } from './routes/memories';
import { reminderRoutes } from './routes/reminders';
import { channelRoutes } from './routes/channels';
import { workspaceRoutes } from './routes/workspaces';
import { aiRoutes } from './routes/ai';
import { briefingRoutes } from './routes/briefing';
import { captureRoutes } from './routes/capture';
import { webhookRoutes } from './routes/webhooks';
import { kgRoutes } from './routes/knowledge-graph';
import { serendipityRoutes } from './routes/serendipity';
import { knowledgeGraph } from './lib/knowledge-graph';
import { startScheduler } from './services/scheduler';

const app: Express = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

app.get('/health', (req, res) => {
  const dbConnected = !!process.env.DATABASE_URL;
  res.json({
    status: 'ok',
    db: dbConnected ? 'configured' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`MemoraX Backend running on port ${PORT}`);
  startScheduler();
});

export default app;
