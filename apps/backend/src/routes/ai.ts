import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { aiPipeline } from '../services/ai-pipeline';
import { knowledgeGraph } from '../lib/knowledge-graph';
import { transcribeAudio } from '@memorax/ai';

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
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Transcription not configured - DEEPGRAM_API_KEY required',
        text: '',
        confidence: 0,
        duration: 0,
        words: [],
      });
    }

    const { audioUrl, mimeType } = req.body;

    if (!audioUrl) {
      return res.status(400).json({ error: 'audioUrl is required' });
    }

    let audioBuffer: Buffer;
    let resolvedMimeType = mimeType || 'audio/webm';

    if (audioUrl.startsWith('data:')) {
      const base64Data = audioUrl.split(',')[1];
      audioBuffer = Buffer.from(base64Data, 'base64');
      const mimeMatch = audioUrl.match(/data:([^;]+)/);
      if (mimeMatch) resolvedMimeType = mimeMatch[1];
    } else {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        return res.status(400).json({ error: 'Failed to fetch audio from URL' });
      }
      audioBuffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type');
      if (contentType) resolvedMimeType = contentType;
    }

    const result = await transcribeAudio(audioBuffer, resolvedMimeType);

    return res.json({
      text: result.text,
      confidence: result.confidence,
      duration: result.duration,
      words: result.words,
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

export { aiRoutes };
