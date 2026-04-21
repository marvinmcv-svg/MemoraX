import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export async function createEmbedding(content: string): Promise<EmbeddingResult> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: content,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const embedding = response.data[0].embedding;
  const tokens = response.usage?.total_tokens || 0;

  return {
    embedding,
    tokens,
  };
}

export async function createEmbeddingsBatch(contents: string[]): Promise<EmbeddingResult[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: contents,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data.map((item, index) => ({
    embedding: item.embedding,
    tokens: response.usage?.total_tokens
      ? Math.floor(response.usage.total_tokens / contents.length)
      : 0,
  }));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
