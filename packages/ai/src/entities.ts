import { GoogleGenerativeAI } from '@google/generative-ai';
import type { EntityType, MemoryEntity } from '@memorax/shared';

let genaiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genaiClient) {
    genaiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genaiClient;
}

const ENTITY_MODEL = 'gemini-2.5-flash';

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
  const client = getGeminiClient();
  if (!client) {
    return { entities: [], relationships: [] };
  }

  const model = client.getGenerativeModel({
    model: ENTITY_MODEL,
    generationConfig: {
      maxOutputTokens: 500,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(`${ENTITY_EXTRACTOR_PROMPT}${content}`);
  const resultText = result.response.text();

  try {
    const parsed = JSON.parse(resultText);
    const entities: ExtractedEntity[] = Array.isArray(parsed) ? parsed : [];
    return {
      entities: entities.map((e: any) => ({
        type: e.type || 'TOPIC',
        value: e.value || '',
        confidence: typeof e.confidence === 'number' ? e.confidence : 0.8,
      })),
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
