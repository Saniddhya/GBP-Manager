/**
 * Minimal fixed-window rate limiter for the credential and AI endpoints.
 *
 * The counters live in the process memory, so the guarantee is "per server
 * instance". That is enough to stop a single client from running a password
 * spray or burning the OpenRouter quota. A multi-region or serverless
 * deployment should swap the store for Redis / Upstash (`@upstash/ratelimit`).
 */
export interface RateLimitOptions {
  /** Maximum number of requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds the caller should wait before retrying (0 when allowed). */
  retryAfterSeconds: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/** Guards against unbounded memory growth from unique keys. */
const MAX_TRACKED_KEYS = 5000;

const buckets = new Map<string, Bucket>();

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  options: RateLimitOptions,
  now: number = Date.now()
): RateLimitResult {
  const { limit, windowMs } = options;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      pruneExpired(now);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - existing.count), retryAfterSeconds: 0 };
}

/** Test helper: clears every counter so suites stay independent. */
export function resetRateLimitStore(): void {
  buckets.clear();
}

/**
 * Best-effort client identifier. Vercel and most proxies set `x-forwarded-for`;
 * local development has neither header, hence the shared `unknown` bucket.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return headers.get('x-real-ip')?.trim() || 'unknown';
}
