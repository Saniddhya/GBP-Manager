import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';
import { CreatePostSchema, PostListQuerySchema } from '@/lib/validations';
import { buildSearchFilter } from '@/lib/search';
import { invalidJsonResponse, isInvalidJsonBodyError, readJsonBody } from '@/lib/http';
import {
  isZodError,
  zodErrorMessage,
  isMongooseValidationError,
  mongooseErrorMessage,
} from '@/lib/api-errors';

/** Hard cap so one tenant cannot request an unbounded payload. */
const MAX_POSTS_PER_REQUEST = 100;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const { search, status, sort } = PostListQuerySchema.parse({
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
    });

    await dbConnect();

    // Always scoped to the session owner, so one tenant can never list another's posts.
    const query: Record<string, unknown> = { userId: session.userId };

    if (status !== 'ALL') {
      query.status = status;
    }

    // The search term is escaped before it reaches `$regex` (see lib/search.ts).
    const searchFilter = buildSearchFilter(search);
    if (searchFilter) {
      Object.assign(query, searchFilter);
    }

    const sortOption: Record<string, 1 | -1> =
      sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const posts = await Post.find(query).sort(sortOption).limit(MAX_POSTS_PER_REQUEST);

    return NextResponse.json(posts, { status: 200 });
  } catch (error) {
    if (isZodError(error)) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }

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

    const body = await readJsonBody(req);
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

    if (isInvalidJsonBodyError(error)) {
      return invalidJsonResponse();
    }

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
