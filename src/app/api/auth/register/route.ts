import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { RegisterSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';
import { isZodError, zodErrorMessage } from '@/lib/api-errors';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { invalidJsonResponse, isInvalidJsonBodyError, readJsonBody } from '@/lib/http';

/** Sign ups are rare: 5 per hour per IP is enough and blocks scripted abuse. */
const REGISTER_RATE_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`register:${getClientIp(req.headers)}`, REGISTER_RATE_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many accounts created from this network. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await readJsonBody(req);
    const validatedData = RegisterSchema.parse(body);

    await dbConnect();

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(validatedData.password);

    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
    });

    // The document is echoed back so a client can immediately continue with the
    // created account, and the assignment above keeps that contract explicit.
    return NextResponse.json(
      { message: 'User registered successfully', userId: String(user._id) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration Error:', error);

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
