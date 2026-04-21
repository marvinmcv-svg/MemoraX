import { Router, Request, Response, Router as ExpressRouter } from 'express';

const aiRoutes: Router = Router();

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || '';

interface MiniMaxResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

async function callMiniMax(prompt: string, systemPrompt: string): Promise<string> {
  if (!MINIMAX_API_KEY) {
    throw new Error('MINIMAX_API_KEY not configured');
  }

  const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status}`);
  }

  const data: MiniMaxResponse = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

aiRoutes.post('/classify', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    if (!MINIMAX_API_KEY) {
      const lower = content.toLowerCase();
      let intent = 'unknown';

      if (lower.includes('remind') || lower.includes('remember to') || lower.includes('dont forget')) {
        intent = 'reminder';
      } else if (lower.includes('task') || lower.includes('todo') || lower.includes('should') || lower.includes('need to')) {
        intent = 'task';
      } else if (lower.includes('meeting') || lower.includes('appointment') || lower.includes('schedule')) {
        intent = 'event';
      } else if (lower.includes('?') || lower.includes('what') || lower.includes('how') || lower.includes('why')) {
        intent = 'question';
      } else {
        intent = 'note';
      }

      return res.json({
        intent,
        confidence: 0.8,
        reasoning: 'Fallback keyword-based classification (MiniMax not configured)',
      });
    }

    const result = await callMiniMax(
      `Classify this message into one of these categories: reminder, note, task, event, question, or serendipity.\n\nMessage: "${content}"\n\nRespond with just the category name and a confidence score (0-1) in this format: CATEGORY,0.XX`,
      'You are an intent classifier. Respond only with the category and confidence score.'
    );

    const [intent, confidenceStr] = result.split(',');
    const confidence = parseFloat(confidenceStr) || 0.7;

    return res.json({
      intent: intent?.trim().toLowerCase() || 'unknown',
      confidence,
      reasoning: 'MiniMax AI classification',
    });
  } catch (error) {
    console.error('Error classifying intent:', error);
    return res.status(500).json({ error: 'Failed to classify intent' });
  }
});

aiRoutes.post('/extract', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    if (!MINIMAX_API_KEY) {
      const entities: { type: string; value: string; confidence: number }[] = [];

      const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:today|tomorrow|yesterday|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi;
      const dates = content.match(dateRegex);
      if (dates) {
        dates.forEach(d => entities.push({ type: 'DATE', value: d, confidence: 0.9 }));
      }

      return res.json({
        entities,
        relationships: [],
        reasoning: 'Fallback regex extraction (MiniMax not configured)',
      });
    }

    const result = await callMiniMax(
      `Extract entities from this text. Identify: dates, times, people names, locations, and topics.\n\nText: "${content}"\n\nRespond in JSON format with "entities" array containing {type, value, confidence} objects.`,
      'You are an entity extraction AI. Always respond with valid JSON containing an "entities" array.'
    );

    let entities = [];
    try {
      const parsed = JSON.parse(result);
      entities = parsed.entities || [];
    } catch {
      const dateRegex = /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:today|tomorrow|yesterday|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi;
      const dates = content.match(dateRegex);
      if (dates) {
        entities = dates.map((d: string) => ({ type: 'DATE', value: d, confidence: 0.85 }));
      }
    }

    return res.json({
      entities,
      relationships: [],
      reasoning: 'MiniMax AI extraction',
    });
  } catch (error) {
    console.error('Error extracting entities:', error);
    return res.status(500).json({ error: 'Failed to extract entities' });
  }
});

aiRoutes.post('/transcribe', async (req: Request, res: Response) => {
  try {
    return res.json({
      text: 'Transcription not configured - requires DEEPGRAM_API_KEY',
      confidence: 0,
      duration: 0,
      words: [],
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

export { aiRoutes };