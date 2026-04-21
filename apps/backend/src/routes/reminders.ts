import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { reminderStore } from '../lib/store';
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
