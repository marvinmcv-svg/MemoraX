import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { aiPipeline } from '../services/ai-pipeline';
import { knowledgeGraph } from '../lib/knowledge-graph';

const aiRoutes: Router = Router();

aiRoutes.get('/status', async (req: Request, res: Response) => {
  const status = aiPipeline.getStatus();
  const kgStats = knowledgeGraph.getStats();

  return res.json({
    ...status,
    knowledgeGraph: kgStats,
    timestamp: new Date().toISOString(),
  });
});

aiRoutes.post('/classify', async (req: Request, res: Response) => {
  try {
    const { content, memoryId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const result = await aiPipeline.process({
      content,
      contentType: 'text',
      memoryId,
    });

    return res.json({
      intent: result.intent,
      confidence: 0.9,
      processingTime: result.processingTime,
      stages: result.stages,
    });
  } catch (error) {
    console.error('Error classifying intent:', error);
    return res.status(500).json({ error: 'Failed to classify intent' });
  }
});

aiRoutes.post('/extract', async (req: Request, res: Response) => {
  try {
    const { content, memoryId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const result = await aiPipeline.process({
      content,
      contentType: 'text',
      memoryId,
    });

    if (memoryId && result.entities.length > 0) {
      knowledgeGraph.addMemoryToGraph(memoryId, result.entities);
    }

    return res.json({
      entities: result.entities,
      processingTime: result.processingTime,
      stages: result.stages,
    });
  } catch (error) {
    console.error('Error extracting entities:', error);
    return res.status(500).json({ error: 'Failed to extract entities' });
  }
});

aiRoutes.post('/transcribe', async (req: Request, res: Response) => {
  try {
    return res.json({
      text: 'Transcription not configured - requires DEEPGRAM_API_KEY',
      confidence: 0,
      duration: 0,
      words: [],
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

export { aiRoutes };