import cron from 'node-cron';
import { homeworkStore } from '../lib/store';
import { sendWhatsAppTextMessage } from './whatsapp-sender';
import { syncClassroomForUser } from './classroom-sync';
import { getGoogleTokens, updateGoogleAccessToken } from '../lib/google-tokens';
import { refreshAccessToken, needsRefresh } from './google-oauth';
import { eq } from '@memorax/db';
import { schema, requireDb } from '../lib/db';

interface HomeworkReminderData {
  id: string;
  title: string;
  dueAt: Date | null;
  source: string;
}

async function checkHomeworkReminders() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.log('[scheduler] DATABASE_URL not set, skipping homework checks');
    return;
  }

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(DATABASE_URL);

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const pendingHomework = await sql`
      SELECT h.id, h.user_id, h.title, h.due_at, h.subject, h.metadata
      FROM homework h
      WHERE h.status IN ('pending', 'in_progress')
        AND h.due_at IS NOT NULL
        AND h.due_at <= ${in24Hours.toISOString()}
        AND h.due_at > ${now.toISOString()}
        AND h.metadata->>'reminder_sent' IS NULL
      LIMIT 50
    `;

    for (const hw of pendingHomework) {
      try {
        const channels = await sql`
          SELECT channel_user_id
          FROM user_channels
          WHERE user_id = ${hw.user_id}
            AND channel = 'whatsapp'
            AND is_active = true
          LIMIT 1
        `;

        if (channels.length === 0) {
          continue;
        }

        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
        const whatsappId = channels[0].channel_user_id;

        const dueDate = new Date(hw.due_at!);
        const hoursUntilDue = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));

        let body = `⏰ Homework reminder!\n\n"${hw.title}"`;
        if (hw.subject) body += `\n📚 Subject: ${hw.subject}`;
        if (hoursUntilDue <= 24) {
          body += `\n⏱️ Due in ${hoursUntilDue} hour${hoursUntilDue !== 1 ? 's' : ''}`;
        } else {
          body += `\n📅 Due: ${dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
        }
        body += '\n\nNeed help? Just send me a question! 📝';

        await sendWhatsAppTextMessage({ to: whatsappId, body, phoneNumberId });

        const currentMetadata = (hw.metadata as Record<string, unknown>) || {};
        await sql`
          UPDATE homework
          SET metadata = ${JSON.stringify({ ...currentMetadata, reminder_sent: true, reminder_sent_at: now.toISOString() })}
          WHERE id = ${hw.id}
        `;

        console.log(`[scheduler] Sent homework reminder for "${hw.title}" to ${whatsappId}`);
      } catch (err) {
        console.error(`[scheduler] Failed to send reminder for homework ${hw.id}:`, err);
      }
    }
  } catch (error) {
    console.error('[scheduler] Homework reminder check failed:', error);
  }
}

async function markOverdueHomework() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) return;

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(DATABASE_URL);

    const now = new Date();
    await sql`
      UPDATE homework
      SET status = 'overdue', updated_at = NOW()
      WHERE status IN ('pending', 'in_progress')
        AND due_at IS NOT NULL
        AND due_at < ${now.toISOString()}
    `;
  } catch (error) {
    console.error('[scheduler] Mark overdue homework failed:', error);
  }
}

async function syncAllClassroomAccounts() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) return;

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(DATABASE_URL);

    // Get all users with Google tokens
    const users = await sql`
      SELECT user_id, access_token, refresh_token, token_expiry
      FROM google_oauth_tokens
    `;

    for (const user of users) {
      try {
        let accessToken = user.access_token;
        const refreshToken = user.refresh_token;
        const tokenExpiry = new Date(user.token_expiry);

        // Refresh token if needed
        if (needsRefresh(tokenExpiry)) {
          const refreshed = await refreshAccessToken(refreshToken);
          accessToken = refreshed.access_token;
          await updateGoogleAccessToken(user.user_id, refreshed.access_token, new Date(Date.now() + refreshed.expires_in * 1000));
          console.log(`[scheduler] Refreshed Google token for user ${user.user_id}`);
        }

        // Sync Classroom data
        const result = await syncClassroomForUser(
          user.user_id,
          accessToken,
          refreshToken,
          tokenExpiry
        );

        if (result.assignmentsCreated > 0 || result.assignmentsUpdated > 0) {
          console.log(
            `[scheduler] Classroom sync for user ${user.user_id}: ` +
            `${result.assignmentsCreated} created, ${result.assignmentsUpdated} updated`
          );
        }
      } catch (err) {
        console.error(`[scheduler] Classroom sync failed for user ${user.user_id}:`, err);
      }
    }
  } catch (error) {
    console.error('[scheduler] Classroom sync batch failed:', error);
  }
}

export function startScheduler() {
  console.log('Starting MemoraX Scheduler...');

  // Check reminders every minute
  cron.schedule('* * * * *', async () => {
    console.log('Checking reminders...');
  });

  // Check homework reminders every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('[scheduler] Running homework reminder check...');
    await checkHomeworkReminders();
  });

  // Mark overdue homework every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[scheduler] Marking overdue homework...');
    await markOverdueHomework();
  });

  // Sync Google Classroom every 2 hours for all connected users
  cron.schedule('0 */2 * * *', async () => {
    console.log('[scheduler] Running Google Classroom sync...');
    await syncAllClassroomAccounts();
  });

  // Daily briefing generation at 7am
  cron.schedule('0 7 * * *', async () => {
    console.log('Daily briefing generation...');
  });

  console.log('Scheduler started');
}
