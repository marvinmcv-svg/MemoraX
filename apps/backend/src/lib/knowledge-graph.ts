import { v4 as uuid } from 'uuid';

export interface Entity {
  id: string;
  type: string;
  value: string;
  memoryId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  weight: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface KnowledgeGraph {
  entities: Map<string, Entity>;
  relationships: Map<string, Relationship>;
  entityIndex: Map<string, string[]>;
}

class KnowledgeGraphStore {
  private entities: Map<string, Entity> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private entityIndex: Map<string, string[]> = new Map();

  createEntity(data: Omit<Entity, 'id' | 'createdAt'>): Entity {
    const entity: Entity = {
      id: uuid(),
      ...data,
      createdAt: new Date(),
    };
    this.entities.set(entity.id, entity);
    this.indexEntity(entity);
    return entity;
  }

  createRelationship(data: Omit<Relationship, 'id' | 'createdAt'>): Relationship {
    const relationship: Relationship = {
      id: uuid(),
      ...data,
      createdAt: new Date(),
    };
    this.relationships.set(relationship.id, relationship);
    return relationship;
  }

  private indexEntity(entity: Entity): void {
    const key = `${entity.type}:${entity.value.toLowerCase()}`;
    const existing = this.entityIndex.get(key) || [];
    existing.push(entity.id);
    this.entityIndex.set(key, existing);
  }

  findEntitiesByType(type: string): Entity[] {
    const results: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (entity.type === type) {
        results.push(entity);
      }
    }
    return results;
  }

  findEntitiesByValue(value: string): Entity[] {
    const key = `*:${value.toLowerCase()}`;
    const ids = this.entityIndex.get(key) || [];
    return ids.map(id => this.entities.get(id)).filter(Boolean) as Entity[];
  }

  findRelatedEntities(entityId: string, depth: number = 1): Entity[] {
    const visited = new Set<string>();
    const queue: Array<{ id: string; currentDepth: number }> = [{ id: entityId, currentDepth: 0 }];
    const related: Entity[] = [];

    while (queue.length > 0) {
      const { id, currentDepth } = queue.shift()!;
      if (visited.has(id) || currentDepth > depth) continue;
      visited.add(id);

      if (id !== entityId) {
        const entity = this.entities.get(id);
        if (entity) related.push(entity);
      }

      if (currentDepth < depth) {
        for (const rel of this.relationships.values()) {
          if (rel.sourceId === id && !visited.has(rel.targetId)) {
            queue.push({ id: rel.targetId, currentDepth: currentDepth + 1 });
          }
          if (rel.targetId === id && !visited.has(rel.sourceId)) {
            queue.push({ id: rel.sourceId, currentDepth: currentDepth + 1 });
          }
        }
      }
    }

    return related;
  }

  findEntitiesByMemory(memoryId: string): Entity[] {
    const results: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (entity.memoryId === memoryId) {
        results.push(entity);
      }
    }
    return results;
  }

  addMemoryToGraph(memoryId: string, entities: Array<{ type: string; value: string; confidence?: number }>): void {
    const memoryEntities: Entity[] = [];

    for (const e of entities) {
      const entity = this.createEntity({
        type: e.type,
        value: e.value,
        memoryId,
        metadata: { confidence: e.confidence || 0.8 },
      });
      memoryEntities.push(entity);
    }

    for (let i = 0; i < memoryEntities.length; i++) {
      for (let j = i + 1; j < memoryEntities.length; j++) {
        const e1 = memoryEntities[i];
        const e2 = memoryEntities[j];
        if (e1.type !== e2.type) {
          this.createRelationship({
            sourceId: e1.id,
            targetId: e2.id,
            type: 'co_occurs_with',
            weight: 0.5,
          });
        }
      }
    }
  }

  getStats(): { entities: number; relationships: number; types: string[] } {
    const types = new Set<string>();
    for (const entity of this.entities.values()) {
      types.add(entity.type);
    }
    return {
      entities: this.entities.size,
      relationships: this.relationships.size,
      types: Array.from(types),
    };
  }
}

export const knowledgeGraph = new KnowledgeGraphStore();