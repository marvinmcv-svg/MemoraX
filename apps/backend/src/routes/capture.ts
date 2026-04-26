import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { memoryStore } from '../lib/store';
import { knowledgeGraph } from '../lib/knowledge-graph';
import { aiPipeline } from '../services/ai-pipeline';
import { v4 as uuid } from 'uuid';
import type { ContentType, IntentType, ChannelType } from '../types';

const captureRoutes: Router = Router();

captureRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { channel, channelUserId, content, contentType, mediaUrl, metadata } = req.body;

    if (!channel || !channelUserId || !content) {
      return res.status(400).json({ error: 'channel, channelUserId, and content are required' });
    }

    const userId = `channel-${channel}-${channelUserId}`;

    const memory = memoryStore.create({
      userId,
      content,
      contentType: (contentType || 'text') as ContentType,
      intent: 'unknown',
      sourceChannel: channel as ChannelType,
      mediaUrl: mediaUrl || null,
      metadata: metadata || { capturedVia: channel },
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

    if (aiResult.entities.length > 0) {
      knowledgeGraph.addMemoryToGraph(memory.id, aiResult.entities);
    }

    return res.status(201).json({
      success: true,
      memory,
      intent: aiResult.intent,
      entities: aiResult.entities,
      processingTime: aiResult.processingTime,
      aiStages: aiResult.stages,
    });
  } catch (error) {
    console.error('Error capturing message:', error);
    return res.status(500).json({ error: 'Failed to capture message' });
  }
});

export { captureRoutes };