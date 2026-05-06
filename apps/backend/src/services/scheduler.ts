import cron from 'node-cron';
import { reminderStore, memoryStore, channelStore, briefingStore } from '../lib/store';
import { sendMessage, buildReminderText } from './outbound';
import type { ChannelType } from '../types';

// ---------------------------------------------------------------------------
// Reminder delivery
// ---------------------------------------------------------------------------
async function processReminders(): Promise<void> {
  const due = reminderStore.findDue();
  if (due.length === 0) return;

  console.log(`[scheduler] Processing ${due.length} due reminder(s)`);

  for (const reminder of due) {
    try {
      // Look up the associated memory for content
      const memory = memoryStore.findById(reminder.memoryId, reminder.userId);
      const memoryContent = memory?.content ?? 'You have a reminder!';

      // Determine delivery channel: explicit > last known channel > app fallback
      let deliveryChannel: ChannelType = reminder.deliveryChannel ?? 'app';
      let channelUserId = reminder.userId;

      // Try to resolve a real channel identifier for the user
      const channels = channelStore.findByUser(reminder.userId);

      // Prefer the reminder's requested channel, else pick the first active channel
      const preferredChannel = channels.find(
        c => c.isActive && c.channel === deliveryChannel
      ) ?? channels.find(c => c.isActive);

      if (preferredChannel) {
        deliveryChannel = preferredChannel.channel;
        channelUserId = preferredChannel.channelUserId;
      }

      const text = buildReminderText(memoryContent);

      const result = await sendMessage({
        channel: deliveryChannel,
        channelUserId,
        text,
        metadata: { reminderId: reminder.id, memoryId: reminder.memoryId },
      });

      if (result.success) {
        reminderStore.update(reminder.id, reminder.userId, { status: 'sent' });
        console.log(`[scheduler] Reminder ${reminder.id} sent via ${deliveryChannel} (msgId=${result.messageId})`);
      } else {
        console.error(`[scheduler] Failed to send reminder ${reminder.id}: ${result.error}`);
        // Keep status as pending — will retry on next tick
      }

      // Handle RRULE: schedule next occurrence if recurring
      if (reminder.rrule && result.success) {
        scheduleNextRRuleOccurrence(reminder);
      }
    } catch (err) {
      console.error(`[scheduler] Unexpected error for reminder ${reminder.id}:`, err);
    }
  }
}

function scheduleNextRRuleOccurrence(reminder: {
  id: string;
  userId: string;
  memoryId: string;
  remindAt: Date;
  rrule: string | null;
  status: string;
  deliveryChannel: ChannelType | null;
}): void {
  if (!reminder.rrule) return;

  try {
    // Basic RRULE frequency parsing (daily/weekly/monthly)
    // Full RRULE parsing would require the rrule library, which is in deps.
    // For now support: FREQ=DAILY, FREQ=WEEKLY, FREQ=MONTHLY + INTERVAL
    const freqMatch = reminder.rrule.match(/FREQ=(DAILY|WEEKLY|MONTHLY)/i);
    const intervalMatch = reminder.rrule.match(/INTERVAL=(\d+)/i);

    if (!freqMatch) return;

    const freq = freqMatch[1].toUpperCase();
    const interval = intervalMatch ? parseInt(intervalMatch[1], 10) : 1;
    const nextDate = new Date(reminder.remindAt);

    switch (freq) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7 * interval);
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      default:
        return;
    }

    reminderStore.create({
      userId: reminder.userId,
      memoryId: reminder.memoryId,
      remindAt: nextDate,
      rrule: reminder.rrule,
      status: 'pending',
      deliveryChannel: reminder.deliveryChannel,
    });

    console.log(`[scheduler] Scheduled next RRULE occurrence for reminder ${reminder.id} at ${nextDate.toISOString()}`);
  } catch (err) {
    console.error(`[scheduler] Failed to schedule next RRULE occurrence:`, err);
  }
}

// ---------------------------------------------------------------------------
// Daily briefing generation
// ---------------------------------------------------------------------------
async function generateDailyBriefings(): Promise<void> {
  console.log('[scheduler] Generating daily briefings...');

  // Collect unique user IDs that have active channels
  const allChannels = (channelStore as any)._all ? (channelStore as any)._all() : [];
  // Since channelStore doesn't expose all users, we derive from memoryStore
  // In a real DB-backed system this would be a simple query
  const userIds = new Set<string>();

  // Walk the reminder store for users with pending reminders (proxy for active users)
  const due = reminderStore.findDue();
  due.forEach(r => userIds.add(r.userId));

  if (userIds.size === 0) {
    console.log('[scheduler] No active users found for briefings');
    return;
  }

  for (const userId of userIds) {
    try {
      const memories = memoryStore.findByUser(userId).slice(0, 10);
      const upcomingReminders = reminderStore.findByUser(userId).filter(r => r.status === 'pending');

      const briefingContent = buildFallbackBriefing(memories, upcomingReminders);

      briefingStore.create({
        userId,
        content: briefingContent,
        memoriesCount: memories.length,
        remindersCount: upcomingReminders.length,
      });

      // Deliver briefing via the user's primary channel
      const channels = channelStore.findByUser(userId);
      const activeChannel = channels.find(c => c.isActive);

      if (activeChannel) {
        await sendMessage({
          channel: activeChannel.channel,
          channelUserId: activeChannel.channelUserId,
          text: briefingContent,
        });
        console.log(`[scheduler] Briefing delivered to user ${userId} via ${activeChannel.channel}`);
      }
    } catch (err) {
      console.error(`[scheduler] Briefing generation failed for user ${userId}:`, err);
    }
  }
}

function buildFallbackBriefing(
  memories: Array<{ content: string; intent: string | null }>,
  reminders: Array<{ remindAt: Date }>
): string {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const memorySummary = memories.length > 0
    ? memories.slice(0, 5).map(m => `• ${m.content.slice(0, 80)}`).join('\n')
    : '• No recent memories';
  const reminderSummary = reminders.length > 0
    ? reminders
        .slice(0, 3)
        .map(r => `• ${r.remindAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`)
        .join('\n')
    : '• No upcoming reminders';

  return `🌅 Good morning! Here's your MemoraX briefing for ${today}

📝 Recent Memories:
${memorySummary}

⏰ Upcoming Reminders:
${reminderSummary}

Have a productive day! Reply anytime to capture a memory.`;
}

// ---------------------------------------------------------------------------
// Scheduler entry point
// ---------------------------------------------------------------------------
export function startScheduler(): void {
  console.log('[scheduler] Starting MemoraX Scheduler...');

  // Check for due reminders every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processReminders();
    } catch (err) {
      console.error('[scheduler] Reminder check error:', err);
    }
  });

  // Generate daily briefings at 7:00 AM server time
  cron.schedule('0 7 * * *', async () => {
    try {
      await generateDailyBriefings();
    } catch (err) {
      console.error('[scheduler] Daily briefing error:', err);
    }
  });

  console.log('[scheduler] Started — checking reminders every minute, briefings at 07:00 daily');
}
