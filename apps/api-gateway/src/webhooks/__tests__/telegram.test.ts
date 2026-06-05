import { describe, it, expect } from 'vitest';
import { verifyTelegramSecret } from '../telegram';

describe('verifyTelegramSecret (fail-closed)', () => {
  it('rejects when secret is unconfigured (was: fail-open bug)', () => {
    const result = verifyTelegramSecret('some-provided-token', '');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('unconfigured');
  });

  it('rejects when no secret header is provided', () => {
    const result = verifyTelegramSecret('', 'configured-secret-1234');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('missing');
  });

  it('rejects when lengths differ (timing-safe short-circuit)', () => {
    const result = verifyTelegramSecret('short', 'much-longer-configured-secret');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('mismatch');
  });

  it('rejects when content differs (same length)', () => {
    const result = verifyTelegramSecret('aaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbb');
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('mismatch');
  });

  it('accepts when secrets match exactly', () => {
    const result = verifyTelegramSecret('shared-secret-xyz', 'shared-secret-xyz');
    expect(result.ok).toBe(true);
  });
});
