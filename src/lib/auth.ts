import * as jose from 'jose';
import bcryptjs from 'bcryptjs';
import { cookies } from 'next/headers';

const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-do-not-use-in-prod';
const encodedSecret = new TextEncoder().encode(AUTH_SECRET);

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
    .sign(encodedSecret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, encodedSecret);
    return payload;
  } catch (e) {
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

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  const userId = toObjectIdString(decoded.userId);
  if (!userId) return null;

  // `userId` is assigned after the spread on purpose: spreading `decoded` last
  // used to overwrite the normalized string with the raw token value.
  return {
    ...decoded,
    userId,
  };
}
