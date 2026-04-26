import { runAIPipeline, type AIPipelineResult } from '@memorax/ai';
import { knowledgeGraph, type Entity } from '../lib/knowledge-graph';
import type { IntentType, ContentType } from '@memorax/shared';

export interface AIPipelineConfig {
  content: string;
  contentType: ContentType;
  audioBuffer?: Buffer;
  memoryId?: string;
}

export interface AIPipelineResponse {
  intent: IntentType;
  entities: Array<{ type: string; value: string; confidence: number }>;
  embedding: number[];
  processingTime: number;
  stages: {
    classification: boolean;
    entityExtraction: boolean;
    embedding: boolean;
  };
}

class AIPipelineService {
  private isConfigured(): boolean {
    return !!(process.env.ANTHROPIC_API_KEY && process.env.OPENAI_API_KEY);
  }

  async process(config: AIPipelineConfig): Promise<AIPipelineResponse> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      return this.fallbackProcess(config);
    }

    try {
      const result: AIPipelineResult = await runAIPipeline(
        config.content,
        config.contentType,
        config.audioBuffer
      );

      if (config.memoryId && result.memory.entities.length > 0) {
        this.addEntitiesToGraph(config.memoryId, result.memory.entities);
      }

      return {
        intent: result.memory.intent,
        entities: result.memory.entities.map(e => ({
          type: e.entityType,
          value: e.entityValue,
          confidence: e.confidence ?? 0.8,
        })),
        embedding: result.memory.embedding,
        processingTime: Date.now() - startTime,
        stages: {
          classification: true,
          entityExtraction: true,
          embedding: true,
        },
      };
    } catch (error) {
      console.error('AI Pipeline error:', error);
      return this.fallbackProcess(config);
    }
  }

  private fallbackProcess(config: AIPipelineConfig): AIPipelineResponse {
    const startTime = Date.now();
    const content = config.content.toLowerCase();

    let intent: IntentType = 'unknown';
    if (content.includes('remind') || content.includes('remember to') || content.includes('dont forget')) {
      intent = 'reminder';
    } else if (content.includes('task') || content.includes('todo') || content.includes('should') || content.includes('need to')) {
      intent = 'task';
    } else if (content.includes('meeting') || content.includes('appointment') || content.includes('schedule')) {
      intent = 'event';
    } else if (content.includes('?')) {
      intent = 'question';
    } else {
      intent = 'note';
    }

    const entities: Array<{ type: string; value: string; confidence: number }> = [];
    const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:today|tomorrow|yesterday|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi;
    const dates = config.content.match(dateRegex);
    if (dates) {
      dates.forEach(d => entities.push({ type: 'DATE', value: d, confidence: 0.85 }));
    }

    if (config.memoryId && entities.length > 0) {
      this.addEntitiesToGraph(config.memoryId, entities.map(e => ({
        entityType: e.type as any,
        entityValue: e.value,
        confidence: e.confidence,
      })));
    }

    return {
      intent,
      entities,
      embedding: [],
      processingTime: Date.now() - startTime,
      stages: {
        classification: true,
        entityExtraction: true,
        embedding: false,
      },
    };
  }

  private addEntitiesToGraph(
    memoryId: string,
    entities: Array<{ entityType: string; entityValue: string; confidence: number | null }>
  ): void {
    const validEntities = entities
      .filter(e => e.entityValue && e.entityType)
      .map(e => ({
        type: e.entityType,
        value: e.entityValue,
        confidence: e.confidence ?? 0.8,
      }));

    if (validEntities.length > 0) {
      knowledgeGraph.addMemoryToGraph(memoryId, validEntities);
    }
  }

  getStatus(): { configured: boolean; availableStages: string[] } {
    return {
      configured: this.isConfigured(),
      availableStages: this.isConfigured()
        ? ['classification', 'entityExtraction', 'embedding', 'transcription']
        : ['fallback'],
    };
  }
}

export const aiPipeline = new AIPipelineService();