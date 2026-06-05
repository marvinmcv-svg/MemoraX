import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { redactPII, logWebhook } from '../log';

describe('redactPII', () => {
  it('returns empty string for empty input', () => {
    expect(redactPII('')).toBe('');
  });

  it('leaves plain text unchanged', () => {
    expect(redactPII('hello world')).toBe('hello world');
  });

  it('redacts a US-style phone number with dashes', () => {
    expect(redactPII('call me at 555-123-4567')).toBe('call me at [REDACTED_PHONE]');
  });

  it('redacts an email address', () => {
    expect(redactPII('email me at user@example.com')).toBe(
      'email me at [REDACTED_EMAIL]'
    );
  });

  it('redacts a 16-digit credit-card-like number', () => {
    expect(redactPII('card: 4111111111111111')).toBe('card: [REDACTED_NUM]');
  });

  it('truncates a long string and appends an ellipsis', () => {
    const out = redactPII('a'.repeat(200), 50);
    expect(out).toBe('a'.repeat(50) + '…');
  });

  it('does not redact short digit sequences (5 digits, below the 9-digit threshold)', () => {
    expect(redactPII('short 12345')).toBe('short 12345');
  });

  it('redacts a phone number with international prefix and formatting', () => {
    expect(redactPII('+1 (555) 123-4567 today')).toBe('[REDACTED_PHONE] today');
  });

  it('leaves plain text within the max length unchanged', () => {
    expect(redactPII('plain text with no PII at all', 100)).toBe(
      'plain text with no PII at all'
    );
  });
});

describe('logWebhook', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {}) as unknown as ReturnType<typeof vi.spyOn>;
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('emits a redacted log line with channel, sender, and content', () => {
    logWebhook('whatsapp', '+15551234567', 'hello there friend@example.com');
    expect(logSpy).toHaveBeenCalledTimes(1);
    const line = String(logSpy.mock.calls[0]?.[0] ?? '');
    expect(line).toContain('[whatsapp]');
    expect(line).toContain('[REDACTED_PHONE]');
    expect(line).toContain('[REDACTED_EMAIL]');
    expect(line).not.toContain('+15551234567');
    expect(line).not.toContain('friend@example.com');
  });
});
