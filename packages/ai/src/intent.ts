import Anthropic from '@anthropic-ai/sdk';
import type { IntentType } from '@memorax/shared';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const INTENT_CLASSIFIER_PROMPT = `You are an intent classifier for MemoraX, an AI memory OS. Classify the user's message into one of these intent categories:

- reminder: User wants to be reminded about something at a specific time
- note: User is capturing information to remember later
- task: User has a task or action item to track
- event: User is capturing an event or appointment
- serendipity: User is sharing something interesting/worth revisiting
- question: User is asking a question
- unknown: Cannot determine intent

Return ONLY a JSON object with this structure:
{"intent": "the classified intent", "confidence": 0.0-1.0, "reasoning": "brief explanation"}

Example:
Input: "remind me to call mom tomorrow at 3pm"
Output: {"intent": "reminder", "confidence": 0.95, "reasoning": "User explicitly wants a reminder for a future action"}

Input: "The sunset was beautiful today"
Output: {"intent": "serendipity", "confidence": 0.88, "reasoning": "User is sharing a moment worth remembering"}

Now classify this message:
`;

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  reasoning: string;
}

export async function classifyIntent(content: string): Promise<IntentResult> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `${INTENT_CLASSIFIER_PROMPT}${content}`,
      },
    ],
  });

  const resultText = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const parsed = JSON.parse(resultText);
    return {
      intent: parsed.intent || 'unknown',
      confidence: parsed.confidence || 0.5,
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
