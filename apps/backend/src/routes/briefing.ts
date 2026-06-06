import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { briefingStore, memoryStore, reminderStore } from '../lib/store';
import { v4 as uuid } from 'uuid';

const briefingRoutes: Router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const genai = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const BRIEFING_MODEL = genai
  ? genai.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        'You are a helpful AI assistant that generates personalized daily briefings. Keep the briefing concise but informative, around 150-200 words.',
      generationConfig: { maxOutputTokens: 1024 },
    })
  : null;

async function callGemini(prompt: string): Promise<string> {
  if (!BRIEFING_MODEL) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  const result = await BRIEFING_MODEL.generateContent(prompt);
  return result.response.text();
}

briefingRoutes.post('/generate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId || 'anonymous';

    const memories = (await memoryStore.findByUser(userId)).slice(0, 10);
    const upcomingReminders = (await reminderStore.findByUser(userId)).filter(r => r.status === 'pending');

    let briefingContent: string;

    if (GEMINI_API_KEY) {
      const memoriesSummary = memories.map(m => `- "${m.content.substring(0, 100)}"`).join('\n') || 'No recent memories';
      const remindersSummary = upcomingReminders.map(r => `- ${r.remindAt.toLocaleString()}`).join('\n') || 'No upcoming reminders';

      const prompt = `Generate a personalized daily briefing for the user based on their recent memories and upcoming reminders.\n\nRecent Memories:\n${memoriesSummary}\n\nUpcoming Reminders:\n${remindersSummary}\n\nFormat the briefing in a friendly, conversational tone. Include a greeting, summary of recent memories, upcoming reminders, and end with an interesting observation or suggestion.`;

      try {
        briefingContent = await callGemini(prompt);
      } catch (aiError) {
        console.warn('Gemini briefing generation failed, using fallback:', aiError);
        briefingContent = `Good morning! Here's your daily briefing:\n\nRecent Memories (${memories.length}):\n${memoriesSummary}\n\nUpcoming Reminders (${upcomingReminders.length}):\n${remindersSummary}`;
      }
    } else {
      briefingContent = `Good morning! Here's your daily briefing:

Recent Memories (${memories.length}):
${memories.map(m => `- "${m.content.substring(0, 100)}..."`).join('\n') || 'No recent memories'}

Upcoming Reminders (${upcomingReminders.length}):
${upcomingReminders.map(r => `- ${r.remindAt.toLocaleString()}`).join('\n') || 'No upcoming reminders'}

Add GEMINI_API_KEY for AI-powered personalized briefings.`;
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
