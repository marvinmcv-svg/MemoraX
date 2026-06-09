import { Router, Request, Response } from 'express';
import { homeworkStore } from '../lib/store';
import type { HomeworkStatus, HomeworkPriority, HomeworkSource } from '@memorax/shared';

const homeworkRoutes: Router = Router();

homeworkRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { title, description, subject, dueAt, status, priority, source, courseId, classroomAssignmentId, metadata } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title is required and must be a non-empty string' });
    }

    const hw = await homeworkStore.create({
      userId,
      title: title.trim(),
      description: description ?? null,
      subject: subject ?? null,
      dueAt: dueAt ? new Date(dueAt) : null,
      status: (status as HomeworkStatus) ?? 'pending',
      priority: (priority as HomeworkPriority) ?? 'medium',
      source: (source as HomeworkSource) ?? 'manual',
      courseId: courseId ?? null,
      classroomAssignmentId: classroomAssignmentId ?? null,
      metadata: metadata ?? {},
    });

    return res.status(201).json({ homework: hw });
  } catch (error) {
    console.error('Error creating homework:', error);
    return res.status(500).json({ error: 'Failed to create homework' });
  }
});

homeworkRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const homework = await homeworkStore.findByUser(userId);
    return res.json({
      data: homework,
      total: homework.length,
    });
  } catch (error) {
    console.error('Error listing homework:', error);
    return res.status(500).json({ error: 'Failed to list homework' });
  }
});

homeworkRoutes.get('/pending', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const pending = await homeworkStore.findPending(userId);
    return res.json({ data: pending, total: pending.length });
  } catch (error) {
    console.error('Error listing pending homework:', error);
    return res.status(500).json({ error: 'Failed to list pending homework' });
  }
});

homeworkRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const hw = await homeworkStore.findById(req.params.id, userId);

    if (!hw) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    return res.json(hw);
  } catch (error) {
    console.error('Error getting homework:', error);
    return res.status(500).json({ error: 'Failed to get homework' });
  }
});

homeworkRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { title, description, subject, dueAt, status, priority, metadata } = req.body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (subject !== undefined) updateData.subject = subject;
    if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : null;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (metadata !== undefined) updateData.metadata = metadata;

    const updated = await homeworkStore.update(req.params.id, userId, updateData);

    if (!updated) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    return res.json({ homework: updated });
  } catch (error) {
    console.error('Error updating homework:', error);
    return res.status(500).json({ error: 'Failed to update homework' });
  }
});

homeworkRoutes.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { status } = req.body;

    if (!status || !['pending', 'in_progress', 'completed', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'status must be one of: pending, in_progress, completed, overdue' });
    }

    const updated = await homeworkStore.update(req.params.id, userId, { status: status as HomeworkStatus });

    if (!updated) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    return res.json({ homework: updated });
  } catch (error) {
    console.error('Error updating homework status:', error);
    return res.status(500).json({ error: 'Failed to update homework status' });
  }
});

homeworkRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const deleted = await homeworkStore.delete(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting homework:', error);
    return res.status(500).json({ error: 'Failed to delete homework' });
  }
});

export { homeworkRoutes };