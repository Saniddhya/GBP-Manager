import mongoose from 'mongoose';

type MongooseConnection = typeof mongoose;

interface MongooseCache {
  conn: MongooseConnection | null;
  promise: Promise<MongooseConnection> | null;
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
const globalForMongoose = globalThis as typeof globalThis & { __gbpMongooseCache?: MongooseCache };

const cached: MongooseCache = globalForMongoose.__gbpMongooseCache ?? { conn: null, promise: null };
globalForMongoose.__gbpMongooseCache = cached;

/**
 * Resolved lazily, on the first query, instead of at module scope.
 *
 * The previous `throw` at import time fired while `next build` collected the
 * API routes, so a missing env var produced a build failure rather than a clear
 * runtime error. Reading the URI here also avoids interpolating the connection
 * string (which embeds the database password) into the logs.
 */
function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env and add your MongoDB connection string.'
    );
  }

  return uri;
}

async function dbConnect(): Promise<MongooseConnection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Allow the next request to retry instead of caching a rejected promise.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect;

