import { Router, Request, Response } from 'express';
import { reminderStore, memoryStore } from '../lib/store';
import { extractReminderDate } from '../lib/date-parser';
import { v4 as uuid } from 'uuid';
import type { ChannelType } from '../types';

const reminderRoutes: Router = Router();

reminderRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { memoryId, remindAt, rrule, deliveryChannel } = req.body;

    if (!memoryId || !remindAt) {
      return res.status(400).json({ error: 'memoryId and remindAt are required' });
    }

    const reminder = reminderStore.create({
      userId,
      memoryId,
      remindAt: new Date(remindAt),
      rrule: rrule || null,
      status: 'pending',
      deliveryChannel: deliveryChannel as ChannelType | null,
    });

    return res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    return res.status(500).json({ error: 'Failed to create reminder' });
  }
});

/**
 * POST /api/v1/reminders/nl
 * Body: { text: "remind me to submit my essay tomorrow at 9am", deliveryChannel?: "whatsapp" }
 * Creates a memory + reminder from natural language. Returns both.
 */
reminderRoutes.post('/nl', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { text, deliveryChannel, memoryId: existingMemoryId } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'text is required' });
    }

    const parsed = extractReminderDate(text);

    if (!parsed) {
      return res.status(422).json({
        error: 'Could not extract a date/time from the text',
        hint: 'Try phrases like "tomorrow at 3pm", "next Monday", "in 2 hours"',
      });
    }

    if (parsed.date <= new Date()) {
      return res.status(422).json({
        error: 'Parsed date is in the past',
        parsed: parsed.date.toISOString(),
      });
    }

    // Create a memory for this reminder if one isn't provided
    let memoryId = existingMemoryId;
    if (!memoryId) {
      const memory = memoryStore.create({
        userId,
        content: text,
        contentType: 'text',
        intent: 'reminder',
        sourceChannel: null,
        mediaUrl: null,
        metadata: { createdFrom: 'nl-reminder' },
        embedding: null,
      });
      memoryId = memory.id;
    }

    const reminder = reminderStore.create({
      userId,
      memoryId,
      remindAt: parsed.date,
      rrule: null,
      status: 'pending',
      deliveryChannel: (deliveryChannel as ChannelType) || null,
    });

    return res.status(201).json({
      reminder,
      parsedDate: parsed.date.toISOString(),
      confidence: parsed.confidence,
      matchedText: parsed.original,
    });
  } catch (error) {
    console.error('Error creating NL reminder:', error);
    return res.status(500).json({ error: 'Failed to create reminder from natural language' });
  }
});

reminderRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { status } = req.query;

    let reminders = reminderStore.findByUser(userId);

    if (status) {
      reminders = reminders.filter(r => r.status === status);
    }

    return res.json({ data: reminders });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to list reminders' });
  }
});

reminderRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const reminder = reminderStore.findById(req.params.id, userId);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    return res.json(reminder);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get reminder' });
  }
});

reminderRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const reminder = reminderStore.update(req.params.id, userId, req.body);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    return res.json(reminder);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update reminder' });
  }
});

reminderRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const deleted = reminderStore.delete(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

reminderRoutes.post('/:id/snooze', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { minutes = 15 } = req.body;

    const reminder = reminderStore.update(req.params.id, userId, {
      remindAt: new Date(Date.now() + minutes * 60000),
      status: 'pending',
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    return res.json(reminder);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to snooze reminder' });
  }
});

export { reminderRoutes };
