import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Zod v4 renamed `ZodError.errors` to `ZodError.issues`.
 * Reading `error.errors[0].message` inside a catch block therefore threw
 * `TypeError: Cannot read properties of undefined (reading '0')`, which escaped
 * the route handler and turned every validation failure into a 500 response
 * (with an empty body) instead of the intended 400.
 */
export function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

/**
 * First human readable validation message.
 * Reads `issues` (Zod v4) and falls back to `errors` (Zod v3) defensively.
 */
export function zodErrorMessage(error: z.ZodError, fallback = 'Invalid request data'): string {
  const issues: { message?: string }[] =
    error.issues ?? (error as unknown as { errors?: { message?: string }[] }).errors ?? [];

  return issues[0]?.message ?? fallback;
}

/** Schema level validation failures are caused by the request body, not by the server. */
export function isMongooseValidationError(
  error: unknown
): error is mongoose.Error.ValidationError {
  return error instanceof mongoose.Error.ValidationError;
}

/** First message from a Mongoose `ValidationError` (e.g. "Content is required"). */
export function mongooseErrorMessage(
  error: mongoose.Error.ValidationError,
  fallback = 'Invalid request data'
): string {
  const first = Object.values(error.errors)[0];
  return first?.message ?? fallback;
}
