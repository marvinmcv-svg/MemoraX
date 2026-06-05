import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { authMiddleware } from './auth';

let warnedChannelBypass = false;

if (process.env.NODE_ENV === 'development' && process.env.CHANNEL_BYPASS === 'true') {
  if (!warnedChannelBypass) {
    console.warn(
      '[channel-auth] CHANNEL_BYPASS is active in development. The /api/v1/capture endpoint will accept unsigned requests from any origin. NEVER set CHANNEL_BYPASS=true in production.'
    );
    warnedChannelBypass = true;
  }
}

/**
 * Channel authentication middleware for /api/v1/capture.
 *
 * Accepts the request when EITHER of the following is true:
 *
 *   1. `X-Channel-Signature` header is present and the value matches
 *      HMAC-SHA256(rawBody, secret) for the channel named in the body's
 *      `channel` field (or the `X-Channel` header). The secret is looked up
 *      from one of:
 *        WHATSAPP_CAPTURE_SECRET
 *        TELEGRAM_CAPTURE_SECRET
 *        SLACK_CAPTURE_SECRET
 *        SMS_CAPTURE_SECRET
 *        EMAIL_CAPTURE_SECRET
 *        CHANNEL_CAPTURE_SECRET   (generic fallback)
 *      On success, `req.channelVerified = true` is set and `next()` is
 *      called. The capture route is then allowed to synthesize a
 *      `channel-<channel>-<channelUserId>` userId from the body.
 *
 *   2. `Authorization: Bearer ...` is present. The middleware delegates to
 *      the existing Clerk `authMiddleware`, which sets `req.userId` from
 *      the JWT. The capture route then attributes the memory to the
 *      authenticated user rather than a body-synthesized id.
 *
 *   3. NODE_ENV === 'test' and `x-test-user-id` header is present — test
 *      bypass mirroring `authMiddleware`'s test branch. Sets `req.userId`.
 *
 *   4. NODE_ENV === 'development' AND `CHANNEL_BYPASS === 'true'` — dev
 *      escape hatch for manual curl. Passes through with a startup warning.
 *
 * Any other case returns 401.
 */
export async function channelAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    const testUserId = req.headers['x-test-user-id'];
    if (typeof testUserId === 'string' && testUserId.length > 0) {
      (req as any).userId = testUserId;
      return next();
    }
  }

  const signatureHeader = req.headers['x-channel-signature'];
  if (typeof signatureHeader === 'string' && signatureHeader.length > 0) {
    const channelFromHeader = req.headers['x-channel'];
    const channelFromBody = (req.body && typeof req.body === 'object'
      ? (req.body as any).channel
      : undefined) as string | undefined;
    const channel = (typeof channelFromHeader === 'string' && channelFromHeader) ||
      (typeof channelFromBody === 'string' && channelFromBody) ||
      undefined;

    if (!channel) {
      res.status(401).json({ error: 'Channel signature present but channel name is missing' });
      return;
    }

    const secret = lookupChannelSecret(channel);
    if (!secret) {
      res.status(401).json({ error: 'No capture secret configured for channel' });
      return;
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody || rawBody.length === 0) {
      res.status(401).json({ error: 'Cannot verify channel signature: raw body unavailable' });
      return;
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest();
    let provided: Buffer;
    try {
      provided = Buffer.from(signatureHeader, 'hex');
    } catch {
      res.status(401).json({ error: 'Invalid channel signature format' });
      return;
    }

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      res.status(401).json({ error: 'Invalid channel signature' });
      return;
    }

    (req as any).channelVerified = true;
    (req as any).verifiedChannel = channel;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    await authMiddleware(req, res, next);
    return;
  }

  if (
    process.env.NODE_ENV === 'development' &&
    process.env.CHANNEL_BYPASS === 'true'
  ) {
    // Dev bypass: pretend the request is a verified channel so the
    // capture route synthesizes userId from the body. Production must
    // NEVER set CHANNEL_BYPASS=true.
    (req as any).channelVerified = true;
    return next();
  }

  res.status(401).json({ error: 'Channel authentication required' });
}

function lookupChannelSecret(channel: string): string | undefined {
  const normalized = channel.trim().toUpperCase();
  const perChannel = process.env[`${normalized}_CAPTURE_SECRET`];
  if (perChannel && perChannel.length > 0) return perChannel;
  const fallback = process.env.CHANNEL_CAPTURE_SECRET;
  return fallback && fallback.length > 0 ? fallback : undefined;
}
