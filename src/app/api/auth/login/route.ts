import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { LoginSchema } from '@/lib/validations';
import { AUTH_COOKIE_NAME, comparePassword, getAuthCookieOptions, signToken } from '@/lib/auth';
import { isZodError, zodErrorMessage } from '@/lib/api-errors';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { invalidJsonResponse, isInvalidJsonBodyError, readJsonBody } from '@/lib/http';

/** 10 attempts per 15 minutes per IP: enough for typos, too slow to spray. */
const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`login:${getClientIp(req.headers)}`, LOGIN_RATE_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await readJsonBody(req);
    const validatedData = LoginSchema.parse(body);

    await dbConnect();

    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    const isPasswordCorrect = await comparePassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 400 }
      );
    }

    const token = await signToken({ userId: user._id.toString() });

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    return NextResponse.json(
      { message: 'Logged in successfully', user: { name: user.name, email: user.email } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login Error:', error);

    if (isInvalidJsonBodyError(error)) {
      return invalidJsonResponse();
    }

    if (isZodError(error)) {
      return NextResponse.json(
        { error: zodErrorMessage(error) },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
