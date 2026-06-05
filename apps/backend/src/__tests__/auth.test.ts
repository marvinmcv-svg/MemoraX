import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@clerk/clerk-sdk-node', () => ({
  verifyToken: vi.fn(),
}));

import { verifyToken } from '@clerk/clerk-sdk-node';
import { authMiddleware } from '../middleware/auth';

const originalNodeEnv = process.env.NODE_ENV;
const originalClerkSecret = process.env.CLERK_SECRET_KEY;
const originalBypass = process.env.AUTH_BYPASS_HEADER;

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
}

function restoreEnv(key: 'NODE_ENV' | 'CLERK_SECRET_KEY' | 'AUTH_BYPASS_HEADER', original: string | undefined) {
  if (original === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = original;
  }
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'production';
    process.env.CLERK_SECRET_KEY = 'test_clerk_secret';
    delete process.env.AUTH_BYPASS_HEADER;
  });

  afterEach(() => {
    restoreEnv('NODE_ENV', originalNodeEnv);
    restoreEnv('CLERK_SECRET_KEY', originalClerkSecret);
    restoreEnv('AUTH_BYPASS_HEADER', originalBypass);
  });

  it('test bypass: NODE_ENV=test with x-test-user-id header sets req.userId and calls next', async () => {
    process.env.NODE_ENV = 'test';
    const req = { headers: { 'x-test-user-id': 'tester-1' } } as any;
    const res = makeRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(req.userId).toBe('tester-1');
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('returns 401 with "Authentication required" when no Authorization header is present', async () => {
    const req = { headers: {} } as any;
    const res = makeRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with "Invalid or expired token" when Bearer token verification fails', async () => {
    vi.mocked(verifyToken).mockRejectedValueOnce(new Error('Token signature mismatch'));
    const req = { headers: { authorization: 'Bearer invalid_token' } } as any;
    const res = makeRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith('invalid_token', {
      secretKey: 'test_clerk_secret',
    });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('dev bypass: NODE_ENV=development + AUTH_BYPASS_HEADER=true + x-dev-user-id header sets req.userId and calls next', async () => {
    process.env.NODE_ENV = 'development';
    process.env.AUTH_BYPASS_HEADER = 'true';
    const req = { headers: { 'x-dev-user-id': 'dev-1' } } as any;
    const res = makeRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(req.userId).toBe('dev-1');
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('returns 503 "Authentication not configured" when CLERK_SECRET_KEY is missing', async () => {
    delete process.env.CLERK_SECRET_KEY;
    const req = { headers: { authorization: 'Bearer some_token' } } as any;
    const res = makeRes();
    const next = vi.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication not configured' });
    expect(next).not.toHaveBeenCalled();
  });
});
