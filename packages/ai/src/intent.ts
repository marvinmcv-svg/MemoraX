import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IntentType } from '@memorax/shared';

let genaiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genaiClient) {
    genaiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genaiClient;
}

const INTENT_MODEL = 'gemini-2.0-flash';

const INTENT_CLASSIFIER_PROMPT = `You are an intent classifier for MemoraX, an AI memory OS. Classify the user's message into one of these intent categories:

- reminder: User wants to be reminded about something at a specific time
- note: User is capturing information to remember later
- task: User has a task or action item to track
- event: User is capturing an event or appointment
- serendipity: User is sharing something interesting/worth revisiting
- question: User is asking a question or wants help understanding something
- homework: User is capturing a homework assignment or assignment details (due date, subject, course, task description)
- unknown: Cannot determine intent

Return ONLY a JSON object with this structure:
{"intent": "the classified intent", "confidence": 0.0-1.0, "reasoning": "brief explanation"}

Example:
Input: "remind me to call mom tomorrow at 3pm"
Output: {"intent": "reminder", "confidence": 0.95, "reasoning": "User explicitly wants a reminder for a future action"}

Input: "The sunset was beautiful today"
Output: {"intent": "serendipity", "confidence": 0.88, "reasoning": "User is sharing a moment worth remembering"}

Input: "Math homework chapter 5 exercises 1-10 due Friday"
Output: {"intent": "homework", "confidence": 0.93, "reasoning": "User is capturing a homework assignment with subject and due date"}

Input: "What's the capital of France?"
Output: {"intent": "question", "confidence": 0.97, "reasoning": "User is asking a factual question"}

Now classify this message:
`;

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  reasoning: string;
}

export async function classifyIntent(content: string): Promise<IntentResult> {
  const client = getGeminiClient();
  if (!client) {
    return { intent: 'unknown', confidence: 0, reasoning: 'Gemini API key not configured' };
  }

  const model = client.getGenerativeModel({
    model: INTENT_MODEL,
    generationConfig: {
      maxOutputTokens: 300,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent(`${INTENT_CLASSIFIER_PROMPT}${content}`);
  const resultText = result.response.text();

  try {
    const parsed = JSON.parse(resultText);
    return {
      intent: parsed.intent || 'unknown',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      reasoning: parsed.reasoning || '',
    };
  } catch {
    return {
      intent: 'unknown',
      confidence: 0.5,
      reasoning: 'Failed to parse intent classification result',
    };
  }
}
