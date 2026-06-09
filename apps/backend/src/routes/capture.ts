import { Router, Request, Response } from 'express';
import { memoryStore, homeworkStore } from '../lib/store';
import { knowledgeGraph } from '../lib/knowledge-graph';
import { aiPipeline } from '../services/ai-pipeline';
import { getOrCreateChannelUser } from '../lib/channel-users';
import type { ContentType, ChannelType } from '../types';
import type { HomeworkSource } from '@memorax/shared';

const captureRoutes: Router = Router();

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
      userId = await getOrCreateChannelUser(channel, channelUserId);
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

    // If intent is 'homework', create a homework entry
    let homeworkEntry = null;
    if (aiResult.intent === 'homework') {
      const entities = aiResult.entities;
      const titleEntity = entities.find(e => e.type === 'TOPIC' || e.type === 'SUBJECT')?.value;
      const dateEntity = entities.find(e => e.type === 'DATE')?.value;

      let dueAt: Date | null = null;
      if (dateEntity) {
        try {
          dueAt = new Date(dateEntity);
          if (isNaN(dueAt.getTime())) dueAt = null;
        } catch {
          dueAt = null;
        }
      }

      const subjectEntity = entities.find(e => e.type === 'SUBJECT')?.value ?? null;

      homeworkEntry = await homeworkStore.create({
        userId,
        title: titleEntity ?? content.slice(0, 100),
        description: content,
        subject: subjectEntity,
        dueAt,
        status: 'pending',
        priority: 'medium',
        source: (channel as HomeworkSource) ?? 'whatsapp',
        courseId: null,
        classroomAssignmentId: null,
        metadata: { memoryId: memory.id, capturedVia: channel },
      });
    }

    return res.status(201).json({
      success: true,
      memory: updated ?? memory,
      intent: aiResult.intent,
      entities: aiResult.entities,
      processingTime: aiResult.processingTime,
      aiStages: aiResult.stages,
      homework: homeworkEntry,
    });
  } catch (error) {
    console.error('Error capturing message:', error);
    return res.status(500).json({ error: 'Failed to capture message' });
  }
});

export { captureRoutes };
