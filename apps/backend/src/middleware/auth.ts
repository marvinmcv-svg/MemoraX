import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/clerk-sdk-node';

let warnedMissingClerkSecret = false;

/**
 * Auth middleware.
 *
 * Behavior:
 *  - No Authorization header                   -> 401 { error: "Authentication required" }
 *  - Invalid/expired Bearer token              -> 401 { error: "Invalid or expired token" }
 *  - CLERK_SECRET_KEY not set                  -> 503 { error: "Authentication not configured" }
 *  - Valid Bearer token + valid Clerk secret   -> req.userId = payload.sub, next()
 *
 * Test bypass (NODE_ENV === 'test'):
 *  If the request carries an `x-test-user-id` header, that value is used as
 *  the user id and the request is allowed through without contacting Clerk.
 *  The test app (`__tests__/app.ts`) injects this header before routes, so
 *  unit tests can exercise protected endpoints without standing up a Clerk
 *  issuer. This branch MUST never activate in production.
 *
 * Dev bypass (NODE_ENV === 'development' AND AUTH_BYPASS_HEADER === 'true'):
 *  For local curl/manual testing, set AUTH_BYPASS_HEADER=true in the
 *  environment and pass `-H "x-dev-user-id: my-user-id"` to skip Clerk.
 *  This is an opt-in escape hatch, NOT a default. It is gated on both
 *  NODE_ENV=development and the explicit env var so a misconfigured
 *  production deploy cannot accidentally bypass authentication.
 */
export async function authMiddleware(
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

  if (
    process.env.NODE_ENV === 'development' &&
    process.env.AUTH_BYPASS_HEADER === 'true'
  ) {
    const devUserId = req.headers['x-dev-user-id'];
    if (typeof devUserId === 'string' && devUserId.length > 0) {
      (req as any).userId = devUserId;
      return next();
    }
  }

  if (!process.env.CLERK_SECRET_KEY) {
    if (!warnedMissingClerkSecret) {
      console.warn(
        '[auth] CLERK_SECRET_KEY is not set. All protected requests will return 503 until it is configured.'
      );
      warnedMissingClerkSecret = true;
    }
    res.status(503).json({ error: 'Authentication not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    (req as any).userId = payload.sub;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
