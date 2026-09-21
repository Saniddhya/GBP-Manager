import type { NextRequest } from 'next/server';

/** A syntactically valid MongoDB ObjectId used across the route suites. */
export const VALID_OBJECT_ID = '507f1f77bcf86cd799439011';
/** A second valid id, used to prove cross-tenant access is refused. */
export const OTHER_OBJECT_ID = '507f1f77bcf86cd799439012';

/**
 * Builds the request object a route handler receives.
 *
 * A plain global `Request` is used instead of `NextRequest`: the handlers only
 * read `url`, `headers` and `json()`, and this keeps the suite decoupled from
 * Next.js internals.
 */
export function jsonRequest(
  url: string,
  body?: unknown,
  init: { method?: string; headers?: Record<string, string> } = {}
): NextRequest {
  const hasBody = body !== undefined;

  return new Request(url, {
    method: init.method ?? (hasBody ? 'POST' : 'GET'),
    headers: hasBody
      ? { 'Content-Type': 'application/json', ...(init.headers ?? {}) }
      : init.headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  }) as unknown as NextRequest;
}

/** Route context for the dynamic `/api/posts/[id]` style handlers. */
export function routeContext(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}
