import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    // `-passwordHash` keeps the credential material out of the response body.
    const user = await User.findById(session.userId).select('-passwordHash');

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Get Session User Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
