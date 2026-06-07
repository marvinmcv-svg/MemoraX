import { Router, Request, Response } from 'express';
import { v5 as uuidv5 } from 'uuid';
import { memoryStore } from '../lib/store';
import { knowledgeGraph } from '../lib/knowledge-graph';
import { aiPipeline } from '../services/ai-pipeline';
import type { ContentType, ChannelType } from '../types';

const captureRoutes: Router = Router();

const UUID_NAMESPACE = '1a95fc97-c4ae-0725-5356-edb3f06d42b9';

function channelUserIdToUuid(channel: string, channelUserId: string): string {
  return uuidv5(`${channel}:${channelUserId}`, UUID_NAMESPACE);
}

captureRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { channel, channelUserId, content, contentType, mediaUrl, metadata } = req.body;

    if (!channel || !channelUserId) {
      return res.status(400).json({ error: 'channel and channelUserId are required' });
    }

    if (!content || content.trim() === '') {
      return res.status(200).json({ success: true, message: 'No content to capture' });
    }

    const channelVerified = (req as any).channelVerified === true;
    const authedUserId = (req as any).userId as string | undefined;

    let userId: string;
    if (channelVerified) {
      userId = channelUserIdToUuid(channel, channelUserId);
    } else if (typeof authedUserId === 'string' && authedUserId.length > 0) {
      userId = authedUserId;
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const memory = await memoryStore.create({
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

    const updated = await memoryStore.setIntentAndEmbedding(
      memory.id,
      aiResult.intent,
      aiResult.embedding.length > 0 ? aiResult.embedding : null
    );

    if (aiResult.entities.length > 0) {
      knowledgeGraph.addMemoryToGraph(updated?.id ?? memory.id, aiResult.entities);
    }

    return res.status(201).json({
      success: true,
      memory: updated ?? memory,
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
