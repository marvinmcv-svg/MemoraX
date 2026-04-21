import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { memoryStore } from '../lib/store';
import { knowledgeGraph } from '../lib/knowledge-graph';
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

    const lower = content.toLowerCase();
    let intent: IntentType = 'unknown';
    if (lower.includes('remind') || lower.includes('remember')) {
      intent = 'reminder';
    } else if (lower.includes('?')) {
      intent = 'question';
    }

    const memory = memoryStore.create({
      userId,
      content,
      contentType: (contentType || 'text') as ContentType,
      intent,
      sourceChannel: channel as ChannelType,
      mediaUrl: mediaUrl || null,
      metadata: metadata || { capturedVia: channel },
      embedding: null,
    });

    const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:today|tomorrow|yesterday|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi;
    const dates = content.match(dateRegex);
    if (dates) {
      const entities = dates.map((d: string) => ({ type: 'DATE', value: d, confidence: 0.9 }));
      knowledgeGraph.addMemoryToGraph(memory.id, entities);
    }

    return res.status(201).json({
      success: true,
      memory,
      intent,
    });
  } catch (error) {
    console.error('Error capturing message:', error);
    return res.status(500).json({ error: 'Failed to capture message' });
  }
});

export { captureRoutes };