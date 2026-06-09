/**
 * WhatsApp Business API sender.
 * Sends template and text messages via Meta's WhatsApp Business API.
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

interface SendTextMessageParams {
  to: string; // Phone number with country code
  body: string;
  phoneNumberId: string;
}

interface SendTemplateParams {
  to: string;
  templateName: string;
  phoneNumberId: string;
  languageCode?: string;
}

export async function sendWhatsAppTextMessage(params: SendTextMessageParams): Promise<boolean> {
  const { to, body, phoneNumberId } = params;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('[whatsapp-sender] WHATSAPP_ACCESS_TOKEN not configured');
    return false;
  }

  if (!phoneNumberId) {
    console.error('[whatsapp-sender] phoneNumberId not provided');
    return false;
  }

  try {
    const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[whatsapp-sender] Send failed:', response.status, error);
      return false;
    }

    console.log('[whatsapp-sender] Message sent successfully');
    return true;
  } catch (error) {
    console.error('[whatsapp-sender] Send error:', error);
    return false;
  }
}

export async function sendWhatsAppTemplateMessage(params: SendTemplateParams): Promise<boolean> {
  const { to, templateName, phoneNumberId, languageCode = 'en' } = params;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('[whatsapp-sender] WHATSAPP_ACCESS_TOKEN not configured');
    return false;
  }

  try {
    const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[whatsapp-sender] Template send failed:', response.status, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[whatsapp-sender] Template send error:', error);
    return false;
  }
}

/**
 * Format a tutor response for WhatsApp (max 4096 chars per message).
 * Split into multiple messages if needed.
 */
export function formatTutorResponseForWhatsApp(answer: string): string[] {
  const MAX_LENGTH = 4096;
  if (answer.length <= MAX_LENGTH) return [answer];

  // Split by sentences to keep message coherent
  const sentences = answer.split(/([.!?]\s+)/);
  const messages: string[] = [];
  let current = '';

  for (const part of sentences) {
    if ((current + part).length > MAX_LENGTH) {
      if (current) messages.push(current.trim());
      current = part;
    } else {
      current += part;
    }
  }
  if (current) messages.push(current.trim());
  return messages;
}

/**
 * Send a tutor response as multiple WhatsApp messages.
 */
export async function sendTutorResponse(
  to: string,
  answer: string,
  phoneNumberId: string
): Promise<boolean> {
  const messages = formatTutorResponseForWhatsApp(answer);
  let allSent = true;

  for (let i = 0; i < messages.length; i++) {
    const delay = i * 1500; // 1.5s delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, delay));
    const sent = await sendWhatsAppTextMessage({ to, body: messages[i], phoneNumberId });
    if (!sent) allSent = false;
  }

  return allSent;
}

/**
 * Send a homework confirmation message.
 */
export async function sendHomeworkConfirmation(
  to: string,
  title: string,
  dueDate: string | null,
  phoneNumberId: string
): Promise<boolean> {
  let body = `✅ Homework captured!\n\n"${title}"`;
  if (dueDate) {
    body += `\n📅 Due: ${dueDate}`;
  }
  body += '\n\nView all your homework at: memorax.app/dashboard/homework';
  body += '\n\nAsk me if you need help with your homework!';

  return sendWhatsAppTextMessage({ to, body, phoneNumberId });
}