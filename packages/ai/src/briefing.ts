import Anthropic from '@anthropic-ai/sdk';
import type { Memory, Briefing, Reminder } from '@memorax/shared';

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

export interface BriefingContext {
  recentMemories: Memory[];
  upcomingReminders: Reminder[];
  userName: string | null;
  timezone: string;
}

const BRIEFING_PROMPT = `You are MemoraX, an AI memory assistant. Generate a personalized daily briefing for the user.

Today's briefing should include:
1. **Good morning summary** - A warm, concise greeting
2. **Recent memories** - Any important memories from the past few days they might want to revisit
3. **Today's reminders** - Any reminders scheduled for today
4. **Serendipity moment** - A random memory from the past that might be interesting to revisit
5. **Quick stats** - How many memories captured, streak info

Keep it conversational, warm, and helpful. Format with light markdown.

Example format:
---
🌅 **Good morning, [Name]!**

**📝 Recent Memories**
- [Memory 1]
- [Memory 2]

**⏰ Today's Schedule**
- [Reminder 1 at time]
- [Reminder 2 at time]

**✨ Serendipity**
[An interesting past memory worth revisiting]

**📊 Your Stats**
• 12 memories this week
• 5-day streak
---

Now generate a briefing based on this data:
`;

export async function generateBriefing(context: BriefingContext): Promise<string> {
  const client = getAnthropicClient();
  if (!client) {
    return 'AI briefing not available. Configure ANTHROPIC_API_KEY for personalized briefings.';
  }

  const memoriesText = context.recentMemories
    .slice(0, 5)
    .map((m) => `- "${m.content}" (${formatRelativeTime(m.createdAt, context.timezone)})`)
    .join('\n');

  const remindersText = context.upcomingReminders
    .map((r) => `- "${r.memoryId}" at ${formatTime(r.remindAt, context.timezone)}`)
    .join('\n');

  const userName = context.userName || 'there';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: `${BRIEFING_PROMPT}

User: ${userName}
Timezone: ${context.timezone}

Recent Memories:
${memoriesText || 'No recent memories'}

Today's Reminders:
${remindersText || 'No reminders for today'}

Generate the briefing now:`,
      },
    ],
  });

  const briefingText = response.content[0].type === 'text' ? response.content[0].text : '';

  return briefingText;
}

function formatRelativeTime(date: Date, timezone: string): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function formatTime(date: Date, timezone: string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  });
}
