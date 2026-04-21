import { Request, Response, NextFunction } from 'express';

export function authMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      (req as any).userId = 'user-' + token.substring(0, 8);
    }

    next();
  };
}
