import { Router, Request, Response } from 'express';
import { memoryStore, reminderStore, channelStore } from '../lib/store';
import { knowledgeGraph } from '../lib/knowledge-graph';
import { aiPipeline } from '../services/ai-pipeline';
import { sendMessage, buildReminderText } from '../services/outbound';
import { extractReminderDate } from '../lib/date-parser';
import type { ContentType, ChannelType } from '../types';

const captureRoutes: Router = Router();

captureRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const {
      channel,
      channelUserId,
      content,
      contentType,
      mediaUrl,
      metadata,
      phoneNumberId,
    } = req.body;

    if (!channel || !channelUserId) {
      return res.status(400).json({ error: 'channel and channelUserId are required' });
    }

    if (!content || content.trim() === '') {
      return res.status(200).json({ success: true, message: 'No content to capture' });
    }

    const userId = `channel-${channel}-${channelUserId}`;

    // Ensure this user/channel combination is tracked
    const existingChannel = channelStore.findByChannelAndUserId(channel, channelUserId);
    if (!existingChannel) {
      channelStore.create({
        userId,
        channel: channel as ChannelType,
        channelUserId,
        isActive: true,
      });
    }

    const memory = memoryStore.create({
      userId,
      content,
      contentType: (contentType || 'text') as ContentType,
      intent: 'unknown',
      sourceChannel: channel as ChannelType,
      mediaUrl: mediaUrl || null,
      metadata: {
        capturedVia: channel,
        phoneNumberId: phoneNumberId || undefined,
        ...(metadata || {}),
      },
      embedding: null,
    });

    // Run the AI pipeline (intent, entities, embedding)
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

    // -----------------------------------------------------------------------
    // Auto-create reminder when intent is 'reminder' or 'task' with a date
    // -----------------------------------------------------------------------
    let autoReminder = null;
    if (aiResult.intent === 'reminder' || aiResult.intent === 'task') {
      const parsed = extractReminderDate(content);

      if (parsed && parsed.date > new Date()) {
        autoReminder = reminderStore.create({
          userId,
          memoryId: memory.id,
          remindAt: parsed.date,
          rrule: null,
          status: 'pending',
          deliveryChannel: channel as ChannelType,
        });

        console.log(`[capture] Auto-created reminder at ${parsed.date.toISOString()} for memory ${memory.id}`);

        // Send an immediate confirmation back to the user
        const confirmText = `✅ Got it! I'll remind you about this on ${parsed.date.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}.`;

        await sendMessage({
          channel: channel as ChannelType,
          channelUserId,
          text: confirmText,
        }).catch(err => {
          // Non-fatal — confirmation delivery failure shouldn't break the capture
          console.warn('[capture] Failed to send reminder confirmation:', err);
        });
      }
    }

    // Acknowledge notes/tasks without dates
    if ((aiResult.intent === 'note' || aiResult.intent === 'task') && !autoReminder) {
      const ackText = `📝 Saved! Memory captured: "${content.slice(0, 60)}${content.length > 60 ? '...' : ''}"`;
      await sendMessage({
        channel: channel as ChannelType,
        channelUserId,
        text: ackText,
      }).catch(() => undefined);
    }

    return res.status(201).json({
      success: true,
      memory,
      intent: aiResult.intent,
      entities: aiResult.entities,
      processingTime: aiResult.processingTime,
      aiStages: aiResult.stages,
      autoReminder,
    });
  } catch (error) {
    console.error('Error capturing message:', error);
    return res.status(500).json({ error: 'Failed to capture message' });
  }
});

export { captureRoutes };
