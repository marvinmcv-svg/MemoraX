import { Request, Response, NextFunction } from 'express';
import Clerk from '@clerk/clerk-sdk-node';

const clerk = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

export async function authMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const session = await clerk.verifySession(token, req.headers['clerk-session-id'] as string);
        (req as any).userId = session.userId;
      } catch (err) {
        // Use mock user for demo
        (req as any).userId = 'demo-user';
      }
    } else {
      // Demo mode
      (req as any).userId = 'demo-user';
    }

    next();
  };
}
