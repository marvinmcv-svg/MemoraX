import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { workspaceStore } from '../lib/store';
import { v4 as uuid } from 'uuid';

const workspaceRoutes: Router = Router();

workspaceRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const workspaces = workspaceStore.findByUser(userId);
    return res.json({ data: workspaces });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to list workspaces' });
  }
});

workspaceRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const { name, description, teamId } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const workspace = workspaceStore.create({
      teamId: teamId || uuid(),
      name,
      description: description || null,
    });

    return res.status(201).json(workspace);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create workspace' });
  }
});

workspaceRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const workspace = workspaceStore.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    return res.json(workspace);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get workspace' });
  }
});

workspaceRoutes.post('/:id/memories', async (req: Request, res: Response) => {
  try {
    const workspace = workspaceStore.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add memory to workspace' });
  }
});

workspaceRoutes.delete('/:id/memories/:memoryId', async (req: Request, res: Response) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove memory from workspace' });
  }
});

export { workspaceRoutes };
