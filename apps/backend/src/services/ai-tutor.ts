import { GoogleGenerativeAI } from '@google/generative-ai';

let genaiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genaiClient) {
    genaiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genaiClient;
}

export interface TutorResponse {
  answer: string;
  confidence: number;
  sources: string[];
  suggestedFollowUps: string[];
}

const TUTOR_SYSTEM_PROMPT = `You are an AI tutor for a student. Your goal is to help them understand concepts, answer homework questions, and guide them through learning. Be clear, encouraging, and break down complex topics into simple parts. Use examples when helpful. If you don't know something, say so honestly.

Guidelines:
- Be friendly and supportive
- Break down complex problems into steps
- Use simple language appropriate for a student
- If the question is unclear, ask a clarifying question
- Provide examples and analogies when helpful
- If you need more context to answer, say what you need
`;

export async function generateTutorResponse(
  question: string,
  context?: string
): Promise<TutorResponse> {
  const client = getGeminiClient();

  if (!client) {
    return {
      answer: "I'm sorry, the AI tutor is not available right now. Please try again later or contact your teacher.",
      confidence: 0,
      sources: [],
      suggestedFollowUps: [],
    };
  }

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
      },
    });

    let prompt = `${TUTOR_SYSTEM_PROMPT}\n\n`;
    if (context) {
      prompt += `Context from previous messages: ${context}\n\n`;
    }
    prompt += `Student question: ${question}\n\nPlease provide a helpful, educational answer.`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return {
      answer,
      confidence: 0.85,
      sources: [],
      suggestedFollowUps: [
        'Can you explain this in more detail?',
        'Can you give me an example?',
        'How is this different from...',
      ],
    };
  } catch (error) {
    console.error('Tutor response error:', error);
    return {
      answer: "I'm sorry, I had trouble answering that. Can you try rephrasing your question?",
      confidence: 0.5,
      sources: [],
      suggestedFollowUps: [],
    };
  }
}

export async function extractHomeworkDetails(content: string): Promise<{
  title: string;
  subject: string | null;
  dueAt: Date | null;
  description: string;
}> {
  const client = getGeminiClient();

  if (!client) {
    // Fallback: simple parsing
    return {
      title: content.slice(0, 80),
      subject: null,
      dueAt: null,
      description: content,
    };
  }

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 300,
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Extract homework details from this message. Return a JSON object with:
- title: short name for the assignment (max 80 chars)
- subject: the subject/topic if identifiable, otherwise null
- dueAt: ISO date string if a due date is mentioned, otherwise null
- description: the full assignment description

Message: ${content}

Return ONLY the JSON object, no extra text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Try to parse JSON
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error('Failed to parse homework details');
      }
    }

    return {
      title: parsed.title ?? content.slice(0, 80),
      subject: parsed.subject ?? null,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
      description: parsed.description ?? content,
    };
  } catch (error) {
    console.error('Homework extraction error:', error);
    return {
      title: content.slice(0, 80),
      subject: null,
      dueAt: null,
      description: content,
    };
  }
}