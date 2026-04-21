import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { knowledgeGraph, type Entity } from '../lib/knowledge-graph';

const kgRoutes: Router = Router();

kgRoutes.post('/entities', async (req: Request, res: Response) => {
  try {
    const { type, value, memoryId, metadata } = req.body;

    if (!type || !value) {
      return res.status(400).json({ error: 'type and value are required' });
    }

    const entity = knowledgeGraph.createEntity({
      type,
      value,
      memoryId,
      metadata,
    });

    return res.status(201).json(entity);
  } catch (error) {
    console.error('Error creating entity:', error);
    return res.status(500).json({ error: 'Failed to create entity' });
  }
});

kgRoutes.get('/entities', async (req: Request, res: Response) => {
  try {
    const { type, value } = req.query;

    let entities: Entity[] = [];
    if (type) {
      entities = knowledgeGraph.findEntitiesByType(type as string);
    } else if (value) {
      entities = knowledgeGraph.findEntitiesByValue(value as string);
    }

    return res.json({ data: entities, count: entities.length });
  } catch (error) {
    console.error('Error listing entities:', error);
    return res.status(500).json({ error: 'Failed to list entities' });
  }
});

kgRoutes.get('/entities/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const related = knowledgeGraph.findRelatedEntities(id);

    return res.json({ entity: related[0] || null, related });
  } catch (error) {
    console.error('Error getting entity:', error);
    return res.status(500).json({ error: 'Failed to get entity' });
  }
});

kgRoutes.post('/entities/batch', async (req: Request, res: Response) => {
  try {
    const { memoryId, entities } = req.body;

    if (!memoryId || !entities || !Array.isArray(entities)) {
      return res.status(400).json({ error: 'memoryId and entities array are required' });
    }

    knowledgeGraph.addMemoryToGraph(memoryId, entities);

    return res.json({ success: true, count: entities.length });
  } catch (error) {
    console.error('Error batch creating entities:', error);
    return res.status(500).json({ error: 'Failed to create entities' });
  }
});

kgRoutes.post('/relationships', async (req: Request, res: Response) => {
  try {
    const { sourceId, targetId, type, weight, metadata } = req.body;

    if (!sourceId || !targetId || !type) {
      return res.status(400).json({ error: 'sourceId, targetId, and type are required' });
    }

    const relationship = knowledgeGraph.createRelationship({
      sourceId,
      targetId,
      type,
      weight: weight || 0.5,
      metadata,
    });

    return res.status(201).json(relationship);
  } catch (error) {
    console.error('Error creating relationship:', error);
    return res.status(500).json({ error: 'Failed to create relationship' });
  }
});

kgRoutes.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = knowledgeGraph.getStats();
    return res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
});

kgRoutes.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const query = (q as string).toLowerCase();
    const parts = query.split(/\s+/);
    const results: { entity: Entity; score: number }[] = [];

    for (const part of parts) {
      if (part.length < 2) continue;

      const entities = knowledgeGraph.findEntitiesByValue(part);
      for (const entity of entities) {
        const existing = results.find(r => r.entity.id === entity.id);
        if (!existing) {
          results.push({ entity, score: 1 });
        } else {
          existing.score += 0.5;
        }
      }
    }

    results.sort((a, b) => b.score - a.score);

    return res.json({
      query: q,
      results: results.slice(0, 20),
      total: results.length,
    });
  } catch (error) {
    console.error('Error searching knowledge graph:', error);
    return res.status(500).json({ error: 'Failed to search' });
  }
});

export { kgRoutes };