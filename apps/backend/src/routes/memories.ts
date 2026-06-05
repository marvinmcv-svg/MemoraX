import { Router, Request, Response } from 'express';
import { memoryStore } from '../lib/store';
import { serendipityEngine } from '../lib/serendipity';
import { aiPipeline } from '../services/ai-pipeline';
import type { ContentType, IntentType, ChannelType } from '../types';

const memoryRoutes: Router = Router();

memoryRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { content, contentType, sourceChannel, mediaUrl, metadata } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const memory = await memoryStore.create({
      userId,
      content,
      contentType: (contentType || 'text') as ContentType,
      intent: 'unknown' as IntentType,
      sourceChannel: sourceChannel as ChannelType | null,
      mediaUrl: mediaUrl || null,
      metadata: metadata || {},
      embedding: null,
    });

    const aiResult = await aiPipeline.process({
      content,
      contentType: (contentType || 'text') as ContentType,
      memoryId: memory.id,
    });

    const updated = await memoryStore.setIntentAndEmbedding(
      memory.id,
      aiResult.intent,
      aiResult.embedding.length > 0 ? aiResult.embedding : null
    );

    serendipityEngine.recordMemory({
      id: memory.id,
      content: memory.content,
      intent: updated?.intent ?? memory.intent,
      sourceChannel: memory.sourceChannel,
      createdAt: memory.createdAt.toISOString(),
    });

    return res.status(201).json({
      memory: updated ?? memory,
      aiStages: aiResult.stages,
      processingTime: aiResult.processingTime,
    });
  } catch (error) {
    console.error('Error creating memory:', error);
    return res.status(500).json({ error: 'Failed to create memory' });
  }
});

memoryRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const memories = await memoryStore.findByUser(userId);
    return res.json({
      data: memories,
      total: memories.length,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
  } catch (error) {
    console.error('Error listing memories:', error);
    return res.status(500).json({ error: 'Failed to list memories' });
  }
});

memoryRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const memory = await memoryStore.findById(req.params.id, userId);

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    return res.json(memory);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get memory' });
  }
});

memoryRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { content, metadata } = req.body;
    const updated = await memoryStore.update(req.params.id, userId, { content, metadata });

    if (!updated) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update memory' });
  }
});

memoryRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const deleted = await memoryStore.delete(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete memory' });
  }
});

memoryRoutes.post('/search', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await memoryStore.search(userId, query);
    return res.json({
      data: results.map(m => ({ memory: m, score: 1.0 })),
      query,
    });
  } catch (error) {
    console.error('Error searching memories:', error);
    return res.status(500).json({ error: 'Failed to search memories' });
  }
});

export { memoryRoutes };
