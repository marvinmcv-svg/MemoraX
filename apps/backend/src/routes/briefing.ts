import { Router, Request, Response, Router as ExpressRouter } from 'express';
import { briefingStore, memoryStore, reminderStore } from '../lib/store';
import { v4 as uuid } from 'uuid';

const briefingRoutes: Router = Router();

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';

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
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status}`);
  }

  const data: MiniMaxResponse = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

briefingRoutes.post('/generate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';

    const memories = memoryStore.findByUser(userId).slice(0, 10);
    const upcomingReminders = reminderStore.findByUser(userId).filter(r => r.status === 'pending');

    let briefingContent: string;

    if (MINIMAX_API_KEY) {
      const memoriesSummary = memories.map(m => `- "${m.content.substring(0, 100)}"`).join('\n') || 'No recent memories';
      const remindersSummary = upcomingReminders.map(r => `- ${r.remindAt.toLocaleString()}`).join('\n') || 'No upcoming reminders';

      const prompt = `Generate a personalized daily briefing for the user based on their recent memories and upcoming reminders.\n\nRecent Memories:\n${memoriesSummary}\n\nUpcoming Reminders:\n${remindersSummary}\n\nFormat the briefing in a friendly, conversational tone. Include a greeting, summary of recent memories, upcoming reminders, and end with an interesting observation or suggestion.`;

      try {
        briefingContent = await callMiniMax(
          prompt,
          'You are a helpful AI assistant that generates personalized daily briefings. Keep the briefing concise but informative, around 150-200 words.'
        );
      } catch (aiError) {
        console.warn('MiniMax briefing generation failed, using fallback:', aiError);
        briefingContent = `Good morning! Here's your daily briefing:\n\nRecent Memories (${memories.length}):\n${memoriesSummary}\n\nUpcoming Reminders (${upcomingReminders.length}):\n${remindersSummary}`;
      }
    } else {
      briefingContent = `Good morning! Here's your daily briefing:

Recent Memories (${memories.length}):
${memories.map(m => `- "${m.content.substring(0, 100)}..."`).join('\n') || 'No recent memories'}

Upcoming Reminders (${upcomingReminders.length}):
${upcomingReminders.map(r => `- ${r.remindAt.toLocaleString()}`).join('\n') || 'No upcoming reminders'}

Add MINIMAX_API_KEY for AI-powered personalized briefings.`;
    }

    const briefing = briefingStore.create({
      userId,
      content: briefingContent,
      memoriesCount: memories.length,
      remindersCount: upcomingReminders.length,
    });

    return res.status(201).json(briefing);
  } catch (error) {
    console.error('Error generating briefing:', error);
    return res.status(500).json({ error: 'Failed to generate briefing' });
  }
});

briefingRoutes.get('/latest', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';
    const briefing = briefingStore.findLatestByUser(userId);

    if (!briefing) {
      return res.status(404).json({ error: 'No briefing found' });
    }

    return res.json(briefing);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get latest briefing' });
  }
});

briefingRoutes.get('/', async (req: Request, res: Response) => {
  try {
    return res.json({ data: [] });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to list briefings' });
  }
});

export { briefingRoutes };