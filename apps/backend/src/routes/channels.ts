import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { channelStore } from '../lib/store';
import { v4 as uuid } from 'uuid';
import type { ChannelType } from '../types';

const channelRoutes: Router = Router();

channelRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const channels = channelStore.findByUser(userId);
    return res.json({ data: channels });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to list channels' });
  }
});

channelRoutes.post('/connect', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { channel, channelUserId } = req.body;

    if (!channel || !channelUserId) {
      return res.status(400).json({ error: 'channel and channelUserId are required' });
    }

    const existing = channelStore.findByChannelAndUserId(channel, channelUserId);
    if (existing) {
      return res.status(409).json({ error: 'Channel already connected' });
    }

    const newChannel = channelStore.create({
      userId,
      channel: channel as ChannelType,
      channelUserId,
      isActive: true,
    });

    return res.status(201).json(newChannel);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to connect channel' });
  }
});

channelRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const deleted = channelStore.delete(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to disconnect channel' });
  }
});

export { channelRoutes };
