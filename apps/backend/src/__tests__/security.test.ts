import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createHmac } from 'crypto';
import { createTestApp } from './app';

const { mockConstructEvent, StripeMock } = vi.hoisted(() => {
  const mockConstructEvent = vi.fn();
  const StripeMock = vi.fn().mockImplementation(() => ({
    webhooks: { constructEvent: mockConstructEvent },
  }));
  return { mockConstructEvent, StripeMock };
});

vi.mock('stripe', () => ({
  default: StripeMock,
}));

const originalEnv = {
  NODE_ENV: process.env.NODE_ENV,
  CHANNEL_BYPASS: process.env.CHANNEL_BYPASS,
  CHANNEL_CAPTURE_SECRET: process.env.CHANNEL_CAPTURE_SECRET,
  WHATSAPP_CAPTURE_SECRET: process.env.WHATSAPP_CAPTURE_SECRET,
  TELEGRAM_CAPTURE_SECRET: process.env.TELEGRAM_CAPTURE_SECRET,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe('Security: /api/v1/capture channel authentication', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.CHANNEL_BYPASS;
    delete process.env.CHANNEL_CAPTURE_SECRET;
    delete process.env.WHATSAPP_CAPTURE_SECRET;
    delete process.env.TELEGRAM_CAPTURE_SECRET;
    app = createTestApp();
  });

  afterEach(() => {
    restoreEnv();
  });

  it('rejects POST with no auth and no signature in production → 401', async () => {
    const res = await request(app)
      .post('/api/v1/capture')
      .send({ channel: 'whatsapp', channelUserId: 'alice', content: 'hello' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Channel authentication required/);
  });

  it('accepts POST with a valid HMAC signature → 201 with channel-X-Y userId', async () => {
    process.env.CHANNEL_CAPTURE_SECRET = 'unit-test-channel-secret';
    app = createTestApp();

    const body = { channel: 'whatsapp', channelUserId: 'alice', content: 'hi from whatsapp' };
    const bodyJson = JSON.stringify(body);
    const sig = createHmac('sha256', 'unit-test-channel-secret')
      .update(bodyJson)
      .digest('hex');

    const res = await request(app)
      .post('/api/v1/capture')
      .set('Content-Type', 'application/json')
      .set('x-channel-signature', sig)
      .send(bodyJson);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.memory).toBeDefined();
    expect(res.body.memory.userId).toBe('channel-whatsapp-alice');
  });

  it('accepts POST with per-channel secret (WHATSAPP_CAPTURE_SECRET)', async () => {
    process.env.WHATSAPP_CAPTURE_SECRET = 'per-channel-secret';
    delete process.env.CHANNEL_CAPTURE_SECRET;
    app = createTestApp();

    const body = { channel: 'whatsapp', channelUserId: 'bob', content: 'per-channel test' };
    const bodyJson = JSON.stringify(body);
    const sig = createHmac('sha256', 'per-channel-secret').update(bodyJson).digest('hex');

    const res = await request(app)
      .post('/api/v1/capture')
      .set('Content-Type', 'application/json')
      .set('x-channel-signature', sig)
      .send(bodyJson);

    expect(res.status).toBe(201);
    expect(res.body.memory.userId).toBe('channel-whatsapp-bob');
  });

  it('accepts POST with x-test-user-id (test bypass) → 201, memory attributed to that user', async () => {
    process.env.NODE_ENV = 'test';
    app = createTestApp();

    const res = await request(app)
      .post('/api/v1/capture')
      .set('x-test-user-id', 'clerk-user-1')
      .send({ channel: 'whatsapp', channelUserId: 'alice', content: 'manual capture' });

    expect(res.status).toBe(201);
    expect(res.body.memory.userId).toBe('clerk-user-1');
  });

  it('rejects POST with a tampered signature → 401', async () => {
    process.env.CHANNEL_CAPTURE_SECRET = 'unit-test-channel-secret';
    app = createTestApp();

    const body = { channel: 'whatsapp', channelUserId: 'alice', content: 'tampered' };
    const bodyJson = JSON.stringify(body);
    const tamperedSig = createHmac('sha256', 'wrong-secret')
      .update(bodyJson)
      .digest('hex');

    const res = await request(app)
      .post('/api/v1/capture')
      .set('Content-Type', 'application/json')
      .set('x-channel-signature', tamperedSig)
      .send(bodyJson);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Invalid channel signature/);
  });

  it('rejects POST with a malformed signature → 401', async () => {
    process.env.CHANNEL_CAPTURE_SECRET = 'unit-test-channel-secret';
    app = createTestApp();

    const res = await request(app)
      .post('/api/v1/capture')
      .set('Content-Type', 'application/json')
      .set('x-channel-signature', 'not-hex-at-all')
      .send(JSON.stringify({ channel: 'whatsapp', channelUserId: 'alice', content: 'x' }));

    expect(res.status).toBe(401);
  });

  it('rejects POST with signature but no configured secret → 401', async () => {
    delete process.env.CHANNEL_CAPTURE_SECRET;
    app = createTestApp();

    const res = await request(app)
      .post('/api/v1/capture')
      .set('Content-Type', 'application/json')
      .set('x-channel-signature', 'a'.repeat(64))
      .send(JSON.stringify({ channel: 'whatsapp', channelUserId: 'alice', content: 'x' }));

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/No capture secret/);
  });

  it('dev bypass: NODE_ENV=development + CHANNEL_BYPASS=true allows unsigned requests', async () => {
    // The dev bypass is a manual-curl convenience, not a security-critical
    // production path. We test it with a direct middleware invocation
    // because the supertest+createTestApp combo interacts oddly with
    // vitest's NODE_ENV=test snapshot/restore cycle.
    const { channelAuthMiddleware: mw } = await import('../middleware/channel-auth');
    const prev = { NODE_ENV: process.env.NODE_ENV, CHANNEL_BYPASS: process.env.CHANNEL_BYPASS };
    process.env.NODE_ENV = 'development';
    process.env.CHANNEL_BYPASS = 'true';
    const next = (await import('vitest')).vi.fn();
    const req = { headers: {} } as any;
    const res = { status: () => res, json: () => res } as any;
    await mw(req, res, next);
    expect(next).toHaveBeenCalled();
    process.env.NODE_ENV = prev.NODE_ENV;
    process.env.CHANNEL_BYPASS = prev.CHANNEL_BYPASS;
  });
});

describe('Security: /webhooks/stripe signature verification', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_dummy_secret';
    mockConstructEvent.mockReset();
    app = createTestApp();
  });

  afterEach(() => {
    restoreEnv();
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await request(app)
      .post('/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send('{"id":"evt_1","type":"customer.subscription.created"}');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/stripe-signature/);
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it('returns 200 and logs the event when signature is valid (constructEvent mocked)', async () => {
    mockConstructEvent.mockReturnValueOnce({
      id: 'evt_test_1',
      type: 'customer.subscription.created',
    } as any);

    const res = await request(app)
      .post('/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1700000000,v1=deadbeef')
      .send('{"id":"evt_test_1","type":"customer.subscription.created"}');

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(res.body.type).toBe('customer.subscription.created');
    expect(res.body.id).toBe('evt_test_1');
    expect(mockConstructEvent).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when constructEvent throws (bad signature)', async () => {
    mockConstructEvent.mockImplementationOnce(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const res = await request(app)
      .post('/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1700000000,v1=invalid')
      .send('{"id":"evt_x","type":"x"}');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Webhook signature verification failed/);
  });

  it('returns 503 when STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    app = createTestApp();

    const res = await request(app)
      .post('/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1,v1=abc')
      .send('{}');

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/Stripe not configured/);
  });
});

describe('Security: CORS allowlist', () => {
  it('preflight from an allowed origin returns Access-Control-Allow-Origin', async () => {
    const app = createTestApp({ allowedOrigins: ['http://allowed.example'] });

    const res = await request(app)
      .options('/api/v1/memories')
      .set('Origin', 'http://allowed.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');

    expect(res.headers['access-control-allow-origin']).toBe('http://allowed.example');
  });

  it('preflight from a disallowed origin is rejected with 403', async () => {
    const app = createTestApp({ allowedOrigins: ['http://allowed.example'] });

    const res = await request(app)
      .options('/api/v1/memories')
      .set('Origin', 'http://evil.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');

    expect([403, 500]).toContain(res.status);
  });

  it('default test app allows localhost:3000 preflight', async () => {
    const app = createTestApp();
    const res = await request(app)
      .options('/api/v1/memories')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });
});
