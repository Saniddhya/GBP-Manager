import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Post from '@/models/Post';
import Location from '@/models/Location';
import { getSession } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIdString = String(session.userId);
    if (!mongoose.Types.ObjectId.isValid(userIdString)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    await dbConnect();
    const userId = new mongoose.Types.ObjectId(userIdString);

    // Fetch all metrics in parallel for better performance
    const [totalPosts, draftPosts, publishedPosts, totalLocations, recentPosts] = await Promise.all([
      Post.countDocuments({ userId }),
      Post.countDocuments({ userId, status: 'DRAFT' }),
      Post.countDocuments({ userId, status: 'PUBLISHED' }),
      Location.countDocuments({ userId }),
      Post.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(5)
    ]);

    return NextResponse.json({
      metrics: {
        totalLocations,
        totalPosts,
        draftPosts,
        publishedPosts,
      },
      recentPosts,
    }, { status: 200 });
  } catch (error) {
    // The driver message used to be returned in a `details` field, which leaked
    // collection names and connection hints to the browser.
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
