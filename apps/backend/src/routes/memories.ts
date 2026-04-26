import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { memoryStore } from '../lib/store';
import { serendipityEngine } from '../lib/serendipity';
import { aiPipeline } from '../services/ai-pipeline';
import { v4 as uuid } from 'uuid';
import type { ContentType, IntentType, ChannelType } from '../types';

const memoryRoutes: Router = Router();

memoryRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { content, contentType, sourceChannel, mediaUrl, metadata } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const memory = memoryStore.create({
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

    memory.intent = aiResult.intent;
    memory.embedding = aiResult.embedding.length > 0 ? aiResult.embedding : null;
    memory.updatedAt = new Date();

    serendipityEngine.recordMemory({
      id: memory.id,
      content: memory.content,
      intent: memory.intent,
      sourceChannel: memory.sourceChannel,
      createdAt: memory.createdAt.toISOString(),
    });

    return res.status(201).json({
      memory,
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
    const memories = memoryStore.findByUser(userId);
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
    const memory = memoryStore.findById(req.params.id, userId);

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
    const memory = memoryStore.findById(req.params.id, userId);

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    const { content, metadata } = req.body;
    if (content) memory.content = content;
    if (metadata) memory.metadata = { ...memory.metadata, ...metadata };
    memory.updatedAt = new Date();

    return res.json(memory);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update memory' });
  }
});

memoryRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const deleted = memoryStore.delete(req.params.id, userId);

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

    const results = memoryStore.search(userId, query);
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
