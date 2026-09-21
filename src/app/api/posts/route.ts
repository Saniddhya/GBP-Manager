import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';
import { CreatePostSchema } from '@/lib/validations';
import {
  isZodError,
  zodErrorMessage,
  isMongooseValidationError,
  mongooseErrorMessage,
} from '@/lib/api-errors';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || 'ALL';
    const sort = searchParams.get('sort') || 'newest';

    await dbConnect();

    const query: any = { userId: session.userId };

    if (status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { topic: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOption: Record<string, 1 | -1> =
      sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const posts = await Post.find(query).sort(sortOption);

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    console.error('List Posts Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreatePostSchema.parse(body);

    await dbConnect();

    const post = await Post.create({
      ...validatedData,
      userId: session.userId,
      ...(validatedData.status === 'PUBLISHED' ? { publishedAt: new Date() } : {}),
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Create Post Error:', error);

    if (isZodError(error)) {
      return NextResponse.json(
        { error: zodErrorMessage(error) },
        { status: 400 }
      );
    }

    if (isMongooseValidationError(error)) {
      return NextResponse.json(
        { error: mongooseErrorMessage(error) },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
