import type { Context } from 'hono';
import type { AppContext } from '../types';

export interface WhatsAppMessage {
  to: string;
  body: string;
  messageId?: string;
}

export interface WhatsAppMediaMessage {
  to: string;
  mediaUrl: string;
  caption?: string;
 messageId?: string;
}

export async function sendWhatsAppMessage(
  c: Context<AppContext>,
  message: WhatsAppMessage
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const WHATSAPP_ACCESS_TOKEN = c.env.WHATSAPP_ACCESS_TOKEN || '';
  const WHATSAPP_PHONE_ID = c.env.WHATSAPP_PHONE_ID || '';

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_ID) {
    return { success: false, error: 'WhatsApp credentials not configured' };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.to,
          type: 'text',
          text: {
            body: message.body,
          },
        }),
      }
    );

    const data = await res.json() as { error?: { message: string }; messages?: Array<{ id: string }> };

    if (data.error) {
      console.error('WhatsApp send error:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    console.error('WhatsApp send exception:', err);
    return { success: false, error: String(err) };
  }
}

export async function sendWhatsAppMediaMessage(
  c: Context<AppContext>,
  message: WhatsAppMediaMessage
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const WHATSAPP_ACCESS_TOKEN = c.env.WHATSAPP_ACCESS_TOKEN || '';
  const WHATSAPP_PHONE_ID = c.env.WHATSAPP_PHONE_ID || '';

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_ID) {
    return { success: false, error: 'WhatsApp credentials not configured' };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.to,
          type: 'image',
          image: {
            link: message.mediaUrl,
            caption: message.caption,
          },
        }),
      }
    );

    const data = await res.json() as { error?: { message: string }; messages?: Array<{ id: string }> };

    if (data.error) {
      console.error('WhatsApp media send error:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    console.error('WhatsApp media send exception:', err);
    return { success: false, error: String(err) };
  }
}

export async function verifyWhatsAppCredentials(
  accessToken: string,
  phoneId: string
): Promise<{ valid: boolean; phoneNumber?: string; error?: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}?fields=id,display_phone_number,verified`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await res.json() as { error?: { message: string }; display_phone_number?: string };

    if (data.error) {
      return { valid: false, error: data.error.message };
    }

    return { valid: true, phoneNumber: data.display_phone_number };
  } catch (err) {
    return { valid: false, error: String(err) };
  }
}
