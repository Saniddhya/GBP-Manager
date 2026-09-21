import { NextResponse, type NextRequest } from 'next/server';

/** Thrown when a request body is not valid JSON. */
export class InvalidJsonBodyError extends Error {
  constructor() {
    super('Request body must be valid JSON');
    this.name = 'InvalidJsonBodyError';
  }
}

/**
 * Reads a JSON body and converts the parser failure into a typed error.
 *
 * A bare `await req.json()` threw a `SyntaxError` that fell through to the generic
 * 500 branch, so a malformed body looked like a server outage instead of a bad
 * request.
 */
export async function readJsonBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new InvalidJsonBodyError();
  }
}

export function isInvalidJsonBodyError(error: unknown): error is InvalidJsonBodyError {
  return error instanceof InvalidJsonBodyError;
}

/** Shared 400 response for every route that parses a JSON body. */
export function invalidJsonResponse() {
  return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
}
