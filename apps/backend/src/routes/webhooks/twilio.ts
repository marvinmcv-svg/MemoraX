import { Router, Request, Response } from 'express';

const twilioRoutes: Router = Router();

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;

async function verifyTwilioSignature(
  authToken: string,
  fullUrl: string,
  params: Record<string, string>,
  provided: string
): Promise<boolean> {
  if (!authToken || !provided) return false;
  const sortedKeys = Object.keys(params).sort();
  let toSign = fullUrl;
  for (const k of sortedKeys) toSign += k + params[k];
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(toSign));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return expected === provided;
}

/**
 * Twilio SMS webhook handler.
 *
 * Verifies X-Twilio-Signature header.
 * Extracts From (phone number) and Body from form data.
 *
 * Returns 503 if Twilio auth token not configured.
 * Returns 401 on missing/invalid signature.
 * Returns 200 with empty TwiML response.
 */
twilioRoutes.post('/', async (req: Request, res: Response) => {
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';

  if (!TWILIO_AUTH_TOKEN) {
    return res.status(503).json({ error: 'Twilio auth token not configured' });
  }

  const provided = req.headers['x-twilio-signature'] as string || '';
  if (!provided) {
    return res.status(401).json({ error: 'Missing Twilio signature' });
  }

  // Build full URL from the request
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // req.body from urlencoded form comes as an object
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.body || {})) {
    if (typeof v === 'string') params[k] = v;
  }

  if (!(await verifyTwilioSignature(TWILIO_AUTH_TOKEN, fullUrl, params, provided))) {
    return res.status(401).json({ error: 'Invalid Twilio signature' });
  }

  const from = params.From;
  const content = params.Body;

  if (!from || !content) {
    return res.status(200).type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
  }

  console.log(`[sms] msg=${params.MessageSid ?? 'n/a'} len=${content.length}`);

  try {
    await fetch(`${BACKEND_URL}/api/v1/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'sms',
        channelUserId: from,
        content,
        contentType: 'text',
      }),
    });
  } catch (err) {
    console.error('[sms] capture error:', err);
  }

  // Return empty TwiML to Twilio
  return res.status(200).type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
});

export { twilioRoutes };