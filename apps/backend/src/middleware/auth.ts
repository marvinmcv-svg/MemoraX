import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/clerk-sdk-node';

export async function authMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
        (req as any).userId = payload.sub;
      } catch (err) {
        (req as any).userId = 'demo-user';
      }
    } else {
      (req as any).userId = 'demo-user';
    }

    next();
  };
}
