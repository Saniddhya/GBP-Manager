import * as jose from 'jose';
import bcryptjs from 'bcryptjs';
import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'auth-token';
const AUTH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** HS256 secrets shorter than this are brute forceable. */
const MIN_SECRET_LENGTH = 32;

/**
 * Resolves the JWT signing secret on every call.
 *
 * The previous implementation fell back to the hardcoded string
 * `'fallback-secret-do-not-use-in-prod'`. Anybody reading the repository could
 * therefore mint a `auth-token` and impersonate every user of a deployment that
 * was missing `AUTH_SECRET`. Failing loudly is the only safe behaviour.
 */
export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error(
      'AUTH_SECRET is not set. Add a long random value (32+ characters) to your .env file.'
    );
  }

  if (process.env.NODE_ENV === 'production' && secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production.`);
  }

  return new TextEncoder().encode(secret);
}

/** Cookie attributes shared by login (set) and logout (delete). */
export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: AUTH_TOKEN_TTL_SECONDS,
    path: '/',
  };
}

const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;
const OBJECT_ID_FIELDS = ['i0', 'i1', 'i2', 'i3'] as const;

/**
 * Returns the 24 character hex id for an ObjectId-like value, otherwise null.
 *
 * `jose` deep clones JWT payloads with `structuredClone`, which drops class
 * prototypes. A Mongoose/BSON `ObjectId` only exposes its bytes as the own
 * enumerable properties `i0..i3`, so it used to be signed as
 * `{"userId":{"i0":6992121,"i1":5140632,"i2":9403395,"i3":10645379}}` and later
 * failed with "Cast to ObjectId failed for value ... at path userId".
 */
function toObjectIdString(value: unknown): string | null {
  if (typeof value === 'string') {
    return OBJECT_ID_PATTERN.test(value) ? value : null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown> & { toHexString?: () => string };

  // An ObjectId that still has its prototype (payload built in-process).
  if (typeof candidate.toHexString === 'function') {
    const hex = candidate.toHexString();
    return typeof hex === 'string' && OBJECT_ID_PATTERN.test(hex) ? hex : null;
  }

  // A structured cloned ObjectId: four 3 byte chunks holding 12 bytes in total.
  if (OBJECT_ID_FIELDS.every((field) => Number.isInteger(candidate[field]))) {
    const hex = OBJECT_ID_FIELDS.map((field) =>
      (candidate[field] as number).toString(16).padStart(6, '0')
    ).join('');
    return OBJECT_ID_PATTERN.test(hex) ? hex : null;
  }

  // A raw 12 byte binary id (Buffer / Uint8Array).
  if (value instanceof Uint8Array && value.length === 12) {
    return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  return null;
}

/**
 * Replaces payload values that cannot survive `structuredClone` /
 * `JSON.stringify` round-trips, so a token can never carry a mangled ObjectId.
 */
function sanitizeTokenPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return payload.map(sanitizeTokenPayload);
  }

  if (payload === null || typeof payload !== 'object' || payload instanceof Date) {
    return payload;
  }

  const objectId = toObjectIdString(payload);
  if (objectId) {
    return objectId;
  }

  if (payload instanceof Uint8Array) {
    return Array.from(payload);
  }

  if (ArrayBuffer.isView(payload)) {
    return Array.from(new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    sanitized[key] = sanitizeTokenPayload(value);
  }

  return sanitized;
}

export async function signToken(payload: Record<string, unknown>) {
  return await new jose.SignJWT(sanitizeTokenPayload(payload) as jose.JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getAuthSecret());
}

export async function verifyToken(token: string): Promise<jose.JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getAuthSecret());
    return payload;
  } catch (e) {
    // A misconfigured AUTH_SECRET also lands here: the failure is logged loudly
    // while callers keep receiving a 401 instead of a leaked stack trace.
    console.error('JWT Verification Error:', e instanceof Error ? e.message : e);
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcryptjs.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcryptjs.compare(password, hash);
}

/** Verified session attached to a request. */
export interface Session {
  userId: string;
  /** JWT `iat` (seconds since epoch) when present. */
  issuedAt?: number;
  /** JWT `exp` (seconds since epoch) when present. */
  expiresAt?: number;
}

/**
 * Reads the session cookie and returns the verified owner id, or `null` when the
 * request is anonymous / the token is invalid.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  // `userId` is normalized instead of spread through: spreading the raw payload
  // last used to overwrite the string id with the mangled ObjectId clone.
  const userId = toObjectIdString(decoded.userId);
  if (!userId) return null;

  return {
    userId,
    issuedAt: typeof decoded.iat === 'number' ? decoded.iat : undefined,
    expiresAt: typeof decoded.exp === 'number' ? decoded.exp : undefined,
  };
}

