import { Router, Request, Response, Router as ExpressRouter } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { briefingStore, memoryStore, reminderStore } from '../lib/store';
import { v4 as uuid } from 'uuid';

const briefingRoutes: Router = Router();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

async function callAnthropic(prompt: string, systemPrompt: string): Promise<string> {
  if (!anthropic) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  return '';
}

briefingRoutes.post('/generate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';

    const memories = (await memoryStore.findByUser(userId)).slice(0, 10);
    const upcomingReminders = (await reminderStore.findByUser(userId)).filter(r => r.status === 'pending');

    let briefingContent: string;

    if (ANTHROPIC_API_KEY) {
      const memoriesSummary = memories.map(m => `- "${m.content.substring(0, 100)}"`).join('\n') || 'No recent memories';
      const remindersSummary = upcomingReminders.map(r => `- ${r.remindAt.toLocaleString()}`).join('\n') || 'No upcoming reminders';

      const prompt = `Generate a personalized daily briefing for the user based on their recent memories and upcoming reminders.\n\nRecent Memories:\n${memoriesSummary}\n\nUpcoming Reminders:\n${remindersSummary}\n\nFormat the briefing in a friendly, conversational tone. Include a greeting, summary of recent memories, upcoming reminders, and end with an interesting observation or suggestion.`;

      try {
        briefingContent = await callAnthropic(
          prompt,
          'You are a helpful AI assistant that generates personalized daily briefings. Keep the briefing concise but informative, around 150-200 words.'
        );
      } catch (aiError) {
        console.warn('Anthropic briefing generation failed, using fallback:', aiError);
        briefingContent = `Good morning! Here's your daily briefing:\n\nRecent Memories (${memories.length}):\n${memoriesSummary}\n\nUpcoming Reminders (${upcomingReminders.length}):\n${remindersSummary}`;
      }
    } else {
      briefingContent = `Good morning! Here's your daily briefing:

Recent Memories (${memories.length}):
${memories.map(m => `- "${m.content.substring(0, 100)}..."`).join('\n') || 'No recent memories'}

Upcoming Reminders (${upcomingReminders.length}):
${upcomingReminders.map(r => `- ${r.remindAt.toLocaleString()}`).join('\n') || 'No upcoming reminders'}

Add ANTHROPIC_API_KEY for AI-powered personalized briefings.`;
    }

    const briefing = await briefingStore.create({
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
    const briefing = await briefingStore.findLatestByUser(userId);

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
