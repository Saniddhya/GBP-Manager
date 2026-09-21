import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { resetRateLimitStore } from '@/lib/rate-limit';
import { jsonRequest } from '../helpers/request';

const { findOneMock, createMock, hashPasswordMock } = vi.hoisted(() => ({
  findOneMock: vi.fn(),
  createMock: vi.fn(),
  hashPasswordMock: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/User', () => ({ default: { findOne: findOneMock, create: createMock } }));
// Only the expensive hashing is stubbed; every other auth helper stays real.
vi.mock('@/lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth')>()),
  hashPassword: hashPasswordMock,
}));

import { POST } from '@/app/api/auth/register/route';

const URL = 'http://localhost/api/auth/register';
const VALID_BODY = { name: 'Asha Rao', email: 'asha@example.com', password: 'secret123' };

beforeEach(() => {
  resetRateLimitStore();
  findOneMock.mockReset();
  createMock.mockReset();
  hashPasswordMock.mockReset();
  hashPasswordMock.mockResolvedValue('bcrypt-hash');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/auth/register', () => {
  it('hashes the password, creates the account and returns 201', async () => {
    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue({ _id: 'user-1' });

    const res = await POST(jsonRequest(URL, VALID_BODY));

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({
      message: 'User registered successfully',
      userId: 'user-1',
    });
    expect(hashPasswordMock).toHaveBeenCalledWith('secret123');

    const created = createMock.mock.calls[0][0] as Record<string, unknown>;
    expect(created).toEqual({
      name: 'Asha Rao',
      email: 'asha@example.com',
      passwordHash: 'bcrypt-hash',
    });
    // The plaintext password must never be persisted.
    expect(created).not.toHaveProperty('password');
  });

  it('rejects a duplicate email with 400 and does not create a second account', async () => {
    findOneMock.mockResolvedValue({ _id: 'existing' });

    const res = await POST(jsonRequest(URL, VALID_BODY));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Email already exists' });
    expect(createMock).not.toHaveBeenCalled();
    expect(hashPasswordMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid payload with the schema message', async () => {
    const res = await POST(jsonRequest(URL, { ...VALID_BODY, name: 'A' }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: 'Name must be at least 2 characters',
    });
    expect(findOneMock).not.toHaveBeenCalled();
  });

  it('answers a malformed JSON body with 400 instead of 500', async () => {
    const malformed = new Request(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ not json',
    });

    const res = await POST(malformed as unknown as NextRequest);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Request body must be valid JSON' });
  });

  it('returns a generic 500 without leaking the driver error', async () => {
    findOneMock.mockRejectedValue(new Error('MongoNetworkError: cluster0 unavailable'));

    const res = await POST(jsonRequest(URL, VALID_BODY));
    const body = (await res.json()) as { error: string };

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('cluster0');
  });

  it('rate limits repeated sign ups from the same IP', async () => {
    findOneMock.mockResolvedValue({ _id: 'existing' });
    const headers = { 'x-forwarded-for': '203.0.113.10' };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const allowed = await POST(jsonRequest(URL, VALID_BODY, { headers }));
      expect(allowed.status).toBe(400);
    }

    const blocked = await POST(jsonRequest(URL, VALID_BODY, { headers }));

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
    await expect(blocked.json()).resolves.toEqual({
      error: 'Too many accounts created from this network. Please try again later.',
    });
  });
});
