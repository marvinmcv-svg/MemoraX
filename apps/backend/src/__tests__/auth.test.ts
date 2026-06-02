import { describe, it, expect, vi } from 'vitest';
import { authMiddleware } from '../middleware/auth';

describe('Auth Middleware', () => {
  it('sets userId to demo-user when no auth header is provided', async () => {
    const req = { headers: {} } as any;
    const res = {} as any;
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(req.userId).toBe('demo-user');
    expect(next).toHaveBeenCalled();
  });

  it('sets userId to demo-user for invalid auth tokens', async () => {
    const req = { headers: { authorization: 'Bearer invalid_token' } } as any;
    const res = {} as any;
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(req.userId).toBe('demo-user');
    expect(next).toHaveBeenCalled();
  });
});
