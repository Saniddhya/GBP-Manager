import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { z } from 'zod';
import {
  isMongooseValidationError,
  isZodError,
  mongooseErrorMessage,
  zodErrorMessage,
} from '@/lib/api-errors';

const PostProbe = z.object({
  topic: z.string().min(10, 'Topic must be at least 10 characters'),
});

describe('isZodError', () => {
  it('recognises a ZodError', () => {
    expect(isZodError(PostProbe.safeParse({ topic: 'short' }).error)).toBe(true);
  });

  it('rejects other error shapes', () => {
    expect(isZodError(new Error('boom'))).toBe(false);
    expect(isZodError(null)).toBe(false);
    expect(isZodError(undefined)).toBe(false);
    expect(isZodError({ issues: [] })).toBe(false);
  });
});

describe('zodErrorMessage', () => {
  it('returns the first issue message', () => {
    const error = PostProbe.safeParse({ topic: 'short' }).error as z.ZodError;
    expect(zodErrorMessage(error)).toBe('Topic must be at least 10 characters');
  });

  it('falls back when the error carries no issues', () => {
    // Zod v4 renamed `errors` to `issues`; reading the old property used to throw
    // `TypeError: Cannot read properties of undefined (reading '0')` and turned a
    // 400 into an empty 500.
    const error = new z.ZodError([]);
    expect(zodErrorMessage(error)).toBe('Invalid request data');
    expect(zodErrorMessage(error, 'Custom fallback')).toBe('Custom fallback');
  });

  it('still understands the Zod v3 `errors` array', () => {
    const legacy = {
      issues: undefined,
      errors: [{ message: 'Legacy message' }],
    } as unknown as z.ZodError;

    expect(zodErrorMessage(legacy)).toBe('Legacy message');
  });
});

describe('mongoose validation errors', () => {
  const schema = new mongoose.Schema({
    content: { type: String, required: [true, 'Content is required'] },
  });
  const Probe = mongoose.models.ValidationProbe ?? mongoose.model('ValidationProbe', schema);

  /** Runs document validation and returns the rejection it produces. */
  async function captureValidationError(): Promise<mongoose.Error.ValidationError> {
    try {
      await new Probe({}).validate();
    } catch (error) {
      if (!isMongooseValidationError(error)) {
        throw new Error('expected document validation to reject with a ValidationError');
      }
      return error;
    }

    throw new Error('expected document validation to fail');
  }

  it('recognises a ValidationError raised by schema validation', async () => {
    const error = await captureValidationError();
    expect(isMongooseValidationError(error)).toBe(true);
  });

  it('returns the first schema message', async () => {
    const error = await captureValidationError();
    expect(mongooseErrorMessage(error)).toBe('Content is required');
  });

  it('rejects other error shapes', () => {
    expect(isMongooseValidationError(new Error('boom'))).toBe(false);
    expect(isMongooseValidationError(null)).toBe(false);
    expect(isMongooseValidationError(undefined)).toBe(false);
  });
});
