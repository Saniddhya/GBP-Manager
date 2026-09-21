import { afterEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';

// `getSession` reads the request cookie through `next/headers`, so the mock lets
// each test decide which cookie - if any - is present.
const { cookiesMock } = vi.hoisted(() => ({ cookiesMock: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));

import {
  AUTH_COOKIE_NAME,
  comparePassword,
  getAuthCookieOptions,
  getAuthSecret,
  getSession,
  hashPassword,
  signToken,
  verifyToken,
} from '@/lib/auth';
import { VALID_OBJECT_ID } from '../helpers/request';

const PASSWORD = 'correct-horse-battery';

/** Minimal `cookies()` stand-in: only `get(name)?.value` is used by the code. */
function cookieStoreWith(token?: string) {
  return {
    get: (name: string) =>
      name === AUTH_COOKIE_NAME && token !== undefined ? { name, value: token } : undefined,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  cookiesMock.mockReset();
});

describe('getAuthSecret', () => {
  it('returns the configured secret', () => {
    expect(new TextDecoder().decode(getAuthSecret())).toBe(process.env.AUTH_SECRET);
  });

  it('fails fast when AUTH_SECRET is missing', () => {
    // The old implementation fell back to a hardcoded secret that is published in
    // this repository, which let anybody forge a session token.
    vi.stubEnv('AUTH_SECRET', '');

    expect(() => getAuthSecret()).toThrow(/AUTH_SECRET is not set/);
  });

  it('rejects a short secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', 'too-short');

    expect(() => getAuthSecret()).toThrow(/at least 32 characters/);
  });

  it('tolerates a short secret outside production', () => {
    vi.stubEnv('AUTH_SECRET', 'too-short');

    expect(new TextDecoder().decode(getAuthSecret())).toBe('too-short');
  });
});

describe('getAuthCookieOptions', () => {
  it('marks the session cookie http-only, lax and long lived', () => {
    expect(getAuthCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
  });

  it('requires HTTPS in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(getAuthCookieOptions().secure).toBe(true);
  });
});

describe('signToken / verifyToken', () => {
  it('round-trips the payload and sets an expiry', async () => {
    const token = await signToken({ userId: VALID_OBJECT_ID });
    const payload = await verifyToken(token);

    expect(payload?.userId).toBe(VALID_OBJECT_ID);
    expect(typeof payload?.exp).toBe('number');
  });

  it('returns null for a malformed token', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await verifyToken('not-a-jwt')).toBeNull();
    expect(errorLog).toHaveBeenCalled();
  });

  it('returns null for a tampered signature', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const token = await signToken({ userId: VALID_OBJECT_ID });

    expect(await verifyToken(`${token.slice(0, -4)}AAAA`)).toBeNull();
  });

  it('returns null when verified with a different secret', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('AUTH_SECRET', 'a-completely-different-secret-value-32');
    const foreignToken = await signToken({ userId: VALID_OBJECT_ID });

    vi.unstubAllEnvs();

    expect(await verifyToken(foreignToken)).toBeNull();
  });
});

describe('token payload sanitisation', () => {
  it('serialises a BSON ObjectId as a hex string', async () => {
    // `jose` deep clones the payload with `structuredClone`, which strips the
    // ObjectId prototype. The token used to carry `{i0,i1,i2,i3}` and every later
    // query failed with "Cast to ObjectId failed for value ... at path userId".
    const objectId = new mongoose.Types.ObjectId(VALID_OBJECT_ID);

    const payload = await verifyToken(await signToken({ userId: objectId }));

    expect(payload?.userId).toBe(VALID_OBJECT_ID);
    expect(typeof payload?.userId).toBe('string');
  });

  it('serialises an already cloned ObjectId', async () => {
    const cloned = structuredClone(new mongoose.Types.ObjectId(VALID_OBJECT_ID));

    const payload = await verifyToken(await signToken({ userId: cloned }));

    expect(payload?.userId).toBe(VALID_OBJECT_ID);
  });

  it('keeps unrelated values intact', async () => {
    const payload = await verifyToken(
      await signToken({ userId: VALID_OBJECT_ID, role: 'owner', flags: [1, 2, 3] })
    );

    expect(payload).toMatchObject({ role: 'owner', flags: [1, 2, 3] });
  });
});

describe('password hashing', () => {
  it('stores a bcrypt hash instead of the plaintext password', async () => {
    const hash = await hashPassword(PASSWORD);

    expect(hash).not.toBe(PASSWORD);
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('accepts the correct password', async () => {
    const hash = await hashPassword(PASSWORD);
    expect(await comparePassword(PASSWORD, hash)).toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hash = await hashPassword(PASSWORD);
    expect(await comparePassword('wrong-password', hash)).toBe(false);
  });

  it('produces a different hash for the same password (salted)', async () => {
    const [first, second] = await Promise.all([hashPassword(PASSWORD), hashPassword(PASSWORD)]);
    expect(first).not.toBe(second);
  });
});

describe('getSession', () => {
  it('returns null when the cookie is absent', async () => {
    cookiesMock.mockResolvedValue(cookieStoreWith(undefined));

    expect(await getSession()).toBeNull();
  });

  it('returns the owner id for a valid token', async () => {
    const token = await signToken({ userId: VALID_OBJECT_ID });
    cookiesMock.mockResolvedValue(cookieStoreWith(token));

    const session = await getSession();

    expect(session?.userId).toBe(VALID_OBJECT_ID);
    expect(typeof session?.issuedAt).toBe('number');
    expect(typeof session?.expiresAt).toBe('number');
  });

  it('returns null for an invalid token', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    cookiesMock.mockResolvedValue(cookieStoreWith('tampered-token'));

    expect(await getSession()).toBeNull();
  });

  it('returns null when the token carries a malformed user id', async () => {
    // A forged but correctly signed token must not reach Mongoose.
    cookiesMock.mockResolvedValue(cookieStoreWith(await signToken({ userId: 'not-an-object-id' })));

    expect(await getSession()).toBeNull();
  });

  it('returns null when the token has no user id at all', async () => {
    cookiesMock.mockResolvedValue(cookieStoreWith(await signToken({ role: 'owner' })));

    expect(await getSession()).toBeNull();
  });
});
