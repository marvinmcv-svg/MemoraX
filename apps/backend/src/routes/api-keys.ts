import { Router, Request, Response } from 'express';
import { apiKeyStore } from '../lib/store';

const apiKeyRoutes: Router = Router();

apiKeyRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const keys = await apiKeyStore.findByUser(userId);
    return res.json({ data: keys });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to list API keys' });
  }
});

apiKeyRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { name, permissions } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    const apiKey = await apiKeyStore.create({
      userId,
      name: name.trim(),
      permissions: Array.isArray(permissions) ? permissions : undefined,
    });

    return res.status(201).json(apiKey);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create API key' });
  }
});

apiKeyRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const deleted = await apiKeyStore.delete(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'API key not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

export { apiKeyRoutes };
