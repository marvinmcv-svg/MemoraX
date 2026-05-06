/**
 * Outbound messaging service.
 * Sends reminder notifications back to users via WhatsApp, Telegram, SMS, or Email.
 */

export type OutboundChannel = 'whatsapp' | 'telegram' | 'sms' | 'email' | 'app';

export interface OutboundMessage {
  channel: OutboundChannel;
  channelUserId: string; // phone number, chat ID, email address, etc.
  text: string;
  metadata?: Record<string, unknown>;
}

export interface OutboundResult {
  success: boolean;
  channel: OutboundChannel;
  messageId?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// WhatsApp (Meta Business Cloud API)
// ---------------------------------------------------------------------------
async function sendWhatsApp(to: string, text: string): Promise<OutboundResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn('[outbound] WhatsApp not configured (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing)');
    return { success: false, channel: 'whatsapp', error: 'WhatsApp not configured' };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    const data = await res.json() as { messages?: Array<{ id: string }>; error?: { message: string } };

    if (!res.ok) {
      return { success: false, channel: 'whatsapp', error: data.error?.message || `HTTP ${res.status}` };
    }

    return { success: true, channel: 'whatsapp', messageId: data.messages?.[0]?.id };
  } catch (err) {
    return { success: false, channel: 'whatsapp', error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Telegram (Bot API)
// ---------------------------------------------------------------------------
async function sendTelegram(chatId: string, text: string): Promise<OutboundResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn('[outbound] Telegram not configured (TELEGRAM_BOT_TOKEN missing)');
    return { success: false, channel: 'telegram', error: 'Telegram not configured' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });

    const data = await res.json() as { ok: boolean; result?: { message_id: number }; description?: string };

    if (!data.ok) {
      return { success: false, channel: 'telegram', error: data.description };
    }

    return { success: true, channel: 'telegram', messageId: String(data.result?.message_id) };
  } catch (err) {
    return { success: false, channel: 'telegram', error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// SMS (Twilio)
// ---------------------------------------------------------------------------
async function sendSMS(to: string, text: string): Promise<OutboundResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    console.warn('[outbound] Twilio not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER missing)');
    return { success: false, channel: 'sms', error: 'Twilio not configured' };
  }

  try {
    const body = new URLSearchParams({ To: to, From: from, Body: text });
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );

    const data = await res.json() as { sid?: string; error_message?: string; status?: string };

    if (!res.ok) {
      return { success: false, channel: 'sms', error: data.error_message || `HTTP ${res.status}` };
    }

    return { success: true, channel: 'sms', messageId: data.sid };
  } catch (err) {
    return { success: false, channel: 'sms', error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Email (SMTP via SendGrid-compatible REST — or console fallback)
// ---------------------------------------------------------------------------
async function sendEmail(to: string, text: string): Promise<OutboundResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@memorax.ai';

  if (!apiKey) {
    // Graceful console fallback — useful in dev
    console.info(`[outbound/email] Would send to ${to}:\n${text}`);
    return { success: true, channel: 'email', messageId: 'console' };
  }

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: 'MemoraX' },
        subject: '⏰ MemoraX Reminder',
        content: [{ type: 'text/plain', value: text }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, channel: 'email', error: err };
    }

    return { success: true, channel: 'email' };
  } catch (err) {
    return { success: false, channel: 'email', error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Unified send function
// ---------------------------------------------------------------------------
export async function sendMessage(msg: OutboundMessage): Promise<OutboundResult> {
  const { channel, channelUserId, text } = msg;

  console.log(`[outbound] Sending via ${channel} to ${channelUserId}`);

  switch (channel) {
    case 'whatsapp':
      return sendWhatsApp(channelUserId, text);
    case 'telegram':
      return sendTelegram(channelUserId, text);
    case 'sms':
      return sendSMS(channelUserId, text);
    case 'email':
      return sendEmail(channelUserId, text);
    case 'app':
      // In-app: just log for now; real impl would push via websocket/FCM
      console.info(`[outbound/app] In-app notification for ${channelUserId}: ${text}`);
      return { success: true, channel: 'app', messageId: 'in-app' };
    default:
      return { success: false, channel, error: `Unknown channel: ${channel}` };
  }
}

/** Build a friendly reminder message from memory content. */
export function buildReminderText(memoryContent: string, userTimezone?: string): string {
  const preview = memoryContent.length > 200
    ? memoryContent.slice(0, 200) + '...'
    : memoryContent;

  return `⏰ *MemoraX Reminder*\n\n${preview}\n\n_Reply to capture a new memory or type SNOOZE to delay 15 minutes._`;
}
