import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  return res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
}
