import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { serendipityEngine } from '../lib/serendipity';
import { memoryStore } from '../lib/store';

const serendipityRoutes: Router = Router();

serendipityRoutes.get('/discover', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const recentMemories = memoryStore.findByUser(userId).slice(0, 20).map(m => m.content);

    const scores = serendipityEngine.getScoreForContext({
      recentMemories,
      hourOfDay: new Date().getHours(),
    });

    return res.json({
      memories: scores,
      count: scores.length,
    });
  } catch (error) {
    console.error('Error in serendipity discover:', error);
    return res.status(500).json({ error: 'Failed to discover memories' });
  }
});

serendipityRoutes.post('/record', async (req: Request, res: Response) => {
  try {
    const { memoryId, content, intent, sourceChannel, createdAt } = req.body;

    if (!memoryId || !content) {
      return res.status(400).json({ error: 'memoryId and content are required' });
    }

    serendipityEngine.recordMemory({
      id: memoryId,
      content,
      intent: intent || 'unknown',
      sourceChannel: sourceChannel || null,
      createdAt: createdAt || new Date().toISOString(),
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error recording memory:', error);
    return res.status(500).json({ error: 'Failed to record memory' });
  }
});

serendipityRoutes.post('/mark-surfaced', async (req: Request, res: Response) => {
  try {
    const { memoryId } = req.body;

    if (!memoryId) {
      return res.status(400).json({ error: 'memoryId is required' });
    }

    serendipityEngine.markSurfaced(memoryId);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking surfaced:', error);
    return res.status(500).json({ error: 'Failed to mark memory as surfaced' });
  }
});

serendipityRoutes.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = serendipityEngine.getStats();
    return res.json(stats);
  } catch (error) {
    console.error('Error getting serendipity stats:', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
});

serendipityRoutes.patch('/config', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    serendipityEngine.setConfig(config);
    return res.json({ success: true, config });
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({ error: 'Failed to update config' });
  }
});

export { serendipityRoutes };