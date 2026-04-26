import Anthropic from '@anthropic-ai/sdk';
import type { EntityType, MemoryEntity } from '@memorax/shared';

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

const ENTITY_EXTRACTOR_PROMPT = `You are an entity extractor for MemoraX, an AI memory OS. Extract entities from the user's message.

Entity types to extract:
- PERSON: Names of people
- PLACE: Locations, addresses, places
- DATE: Specific dates, times, date ranges
- TOPIC: Topics, themes, subjects
- ORG: Organizations, companies, institutions
- EVENT: Events, occasions, celebrations

Return ONLY a JSON array of entities with this structure:
[{"type": "ENTITY_TYPE", "value": "entity name", "confidence": 0.0-1.0}]

Example:
Input: "Meeting with Sarah at the office on March 15th"
Output: [{"type": "PERSON", "value": "Sarah", "confidence": 0.95}, {"type": "PLACE", "value": "office", "confidence": 0.85}, {"type": "DATE", "value": "March 15th", "confidence": 0.9}]

Now extract entities from this message:
`;

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  relationships: Array<{
    source: string;
    target: string;
    relation: string;
  }>;
}

export async function extractEntities(content: string): Promise<EntityExtractionResult> {
  const client = getAnthropicClient();
  if (!client) {
    return { entities: [], relationships: [] };
  }

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `${ENTITY_EXTRACTOR_PROMPT}${content}`,
      },
    ],
  });

  const resultText = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const parsed = JSON.parse(resultText);
    return {
      entities: parsed || [],
      relationships: [],
    };
  } catch {
    return {
      entities: [],
      relationships: [],
    };
  }
}

export function convertToMemoryEntities(
  memoryId: string,
  extractedEntities: ExtractedEntity[]
): Omit<MemoryEntity, 'id' | 'memoryId'>[] {
  return extractedEntities.map((entity) => ({
    entityType: entity.type,
    entityValue: entity.value,
    confidence: entity.confidence,
    neo4jNodeId: null,
  }));
}
