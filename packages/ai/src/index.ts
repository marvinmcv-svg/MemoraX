export { classifyIntent, type IntentResult } from './intent';
export { extractEntities, convertToMemoryEntities, type ExtractedEntity, type EntityExtractionResult } from './entities';
export { createEmbedding, createEmbeddingsBatch, cosineSimilarity, type EmbeddingResult } from './embedding';
export { transcribeAudio, transcribeFromUrl, type TranscriptionResult } from './transcribe';
export { generateBriefing, type BriefingContext } from './briefing';

import { classifyIntent } from './intent';
import { extractEntities, convertToMemoryEntities } from './entities';
import { createEmbedding } from './embedding';
import { transcribeAudio, type TranscriptionResult } from './transcribe';
import type { Memory, MemoryEntity, IntentType } from '@memorax/shared';

export interface AIPipelineResult {
  memory: {
    intent: IntentType;
    entities: Omit<MemoryEntity, 'id' | 'memoryId'>[];
    embedding: number[];
  };
  transcription?: TranscriptionResult;
}

export async function runAIPipeline(
  content: string,
  contentType: 'text' | 'voice' | 'image' | 'link' = 'text',
  audioBuffer?: Buffer
): Promise<AIPipelineResult> {
  let processedContent = content;

  if (contentType === 'voice' && audioBuffer) {
    const transcription = await transcribeAudio(audioBuffer);
    processedContent = transcription.text;
  }

  const [intentResult, embeddingResult] = await Promise.all([
    classifyIntent(processedContent),
    createEmbedding(processedContent),
  ]);

  const entitiesResult = await extractEntities(processedContent);

  return {
    memory: {
      intent: intentResult.intent,
      entities: convertToMemoryEntities('', entitiesResult.entities),
      embedding: embeddingResult.embedding,
    },
    transcription: audioBuffer ? await transcribeAudio(audioBuffer) : undefined,
  };
}
