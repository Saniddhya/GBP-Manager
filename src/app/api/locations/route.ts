import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Location from '@/models/Location';
import { getSession } from '@/lib/auth';
// The schema lives next to the other Zod contracts so the API surface stays in one place.
import { LocationSchema } from '@/lib/validations';
import { isZodError, zodErrorMessage } from '@/lib/api-errors';
import { invalidJsonResponse, isInvalidJsonBodyError, readJsonBody } from '@/lib/http';


export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const locations = await Location.find({ userId: session.userId }).sort({ createdAt: -1 });

    return NextResponse.json(locations, { status: 200 });
  } catch (error) {
    console.error('List Locations Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readJsonBody(req);
    const validatedData = LocationSchema.parse(body);

    await dbConnect();
    const location = await Location.create({
      ...validatedData,
      userId: session.userId,
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Create Location Error:', error);

    if (isInvalidJsonBodyError(error)) {
      return invalidJsonResponse();
    }

    if (isZodError(error)) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
