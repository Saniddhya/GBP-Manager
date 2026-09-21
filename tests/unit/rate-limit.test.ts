import { beforeEach, describe, expect, it } from 'vitest';
import { getClientIp, rateLimit, resetRateLimitStore } from '@/lib/rate-limit';

const OPTIONS = { limit: 3, windowMs: 60_000 };

beforeEach(() => {
  resetRateLimitStore();
});

describe('rateLimit', () => {
  it('allows requests up to the limit and reports the remaining budget', () => {
    const now = 1_000_000;

    expect(rateLimit('login:1.2.3.4', OPTIONS, now)).toEqual({
      allowed: true,
      remaining: 2,
      retryAfterSeconds: 0,
    });
    expect(rateLimit('login:1.2.3.4', OPTIONS, now).remaining).toBe(1);

    const third = rateLimit('login:1.2.3.4', OPTIONS, now);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it('blocks the request that exceeds the limit and suggests a retry delay', () => {
    const now = 2_000_000;
    for (let attempt = 0; attempt < OPTIONS.limit; attempt += 1) {
      rateLimit('login:1.2.3.4', OPTIONS, now);
    }

    const blocked = rateLimit('login:1.2.3.4', OPTIONS, now);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(60);
  });

  it('starts a new window once the previous one expired', () => {
    const now = 3_000_000;
    for (let attempt = 0; attempt < OPTIONS.limit; attempt += 1) {
      rateLimit('register:1.1.1.1', OPTIONS, now);
    }
    expect(rateLimit('register:1.1.1.1', OPTIONS, now).allowed).toBe(false);

    const afterWindow = rateLimit('register:1.1.1.1', OPTIONS, now + OPTIONS.windowMs);

    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(OPTIONS.limit - 1);
  });

  it('counts each key independently', () => {
    const now = 4_000_000;
    for (let attempt = 0; attempt < OPTIONS.limit; attempt += 1) {
      rateLimit('login:10.0.0.1', OPTIONS, now);
    }

    expect(rateLimit('login:10.0.0.1', OPTIONS, now).allowed).toBe(false);
    expect(rateLimit('login:10.0.0.2', OPTIONS, now).allowed).toBe(true);
    expect(rateLimit('ai:user-1', OPTIONS, now).allowed).toBe(true);
  });

  it('never reports a negative remaining budget', () => {
    const result = rateLimit('login:9.9.9.9', { limit: 1, windowMs: 1000 }, 5_000_000);
    expect(result.remaining).toBe(0);
  });

  it('clears every counter through the test helper', () => {
    const now = 6_000_000;
    rateLimit('login:1.1.1.1', { limit: 1, windowMs: 1000 }, now);
    expect(rateLimit('login:1.1.1.1', { limit: 1, windowMs: 1000 }, now).allowed).toBe(false);

    resetRateLimitStore();

    expect(rateLimit('login:1.1.1.1', { limit: 1, windowMs: 1000 }, now).allowed).toBe(true);
  });
});

describe('getClientIp', () => {
  it('uses the first address of x-forwarded-for', () => {
    expect(getClientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe(
      '203.0.113.7'
    );
  });

  it('falls back to x-real-ip', () => {
    expect(getClientIp(new Headers({ 'x-real-ip': '198.51.100.9' }))).toBe('198.51.100.9');
  });

  it('falls back to a shared bucket when no proxy header is present', () => {
    expect(getClientIp(new Headers())).toBe('unknown');
  });
});
