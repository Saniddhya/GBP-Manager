import { NextRequest, NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import { getSession } from '@/lib/auth';
import { UpdatePostSchema } from '@/lib/validations';
import {
  isZodError,
  zodErrorMessage,
  isMongooseValidationError,
  mongooseErrorMessage,
} from '@/lib/api-errors';
import { invalidJsonResponse, isInvalidJsonBodyError, readJsonBody } from '@/lib/http';

/**
 * Guards every handler below. Without it a malformed id such as `abc` reached
 * Mongoose and surfaced as a `CastError` (HTTP 500) instead of a client error.
 */
function invalidIdResponse() {
  return NextResponse.json({ error: 'Invalid post id' }, { status: 400 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const post = await Post.findOne({ _id: id, userId: session.userId });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error('Get Post Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readJsonBody(req);

    // Previously the raw body went straight into `$set`, so a caller could rewrite
    // `userId` and hand a post to another account. Whichever keys are not part of
    // the schema are stripped before the update document is built.
    const updates = UpdatePostSchema.parse(body);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await dbConnect();

    const update: Record<string, unknown> = { ...updates };
    if (updates.status === 'PUBLISHED') {
      // The edit form publishes existing posts through this endpoint, so the
      // timestamp has to be stamped here as well (POST /api/posts does the same).
      update.publishedAt = new Date();
    }

    const post = await Post.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post, { status: 200 });
  } catch (error) {
    console.error('Update Post Error:', error);

    if (isInvalidJsonBodyError(error)) {
      return invalidJsonResponse();
    }

    if (isZodError(error)) {
      return NextResponse.json({ error: zodErrorMessage(error) }, { status: 400 });
    }

    if (isMongooseValidationError(error)) {
      return NextResponse.json({ error: mongooseErrorMessage(error) }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return invalidIdResponse();

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const result = await Post.deleteOne({ _id: id, userId: session.userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete Post Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
