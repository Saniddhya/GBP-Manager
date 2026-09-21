import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { connectMock } = vi.hoisted(() => ({ connectMock: vi.fn() }));

// `db.ts` only ever calls `mongoose.connect`, so a one-method stub is enough.
vi.mock('mongoose', () => ({ default: { connect: connectMock } }));

/** The connection cache lives on `globalThis` so hot reloads can reuse it. */
type CachedGlobal = typeof globalThis & { __gbpMongooseCache?: unknown };

/**
 * Re-imports the module with a clean cache. `db.ts` captures the cache object at
 * import time, so re-importing is the only way to exercise the cold path.
 */
async function loadDbModule() {
  delete (globalThis as CachedGlobal).__gbpMongooseCache;
  vi.resetModules();
  return (await import('@/lib/db')).default;
}

const connection = { connection: { readyState: 1 } };

beforeEach(() => {
  connectMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('dbConnect', () => {
  it('does not throw while the module is being imported', async () => {
    // Validating at module scope used to crash `next build` (routes are imported
    // while pages are collected) whenever the environment was incomplete.
    await expect(loadDbModule()).resolves.toBeTypeOf('function');
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('rejects with an actionable message when MONGODB_URI is missing', async () => {
    vi.stubEnv('MONGODB_URI', '');
    const dbConnect = await loadDbModule();

    await expect(dbConnect()).rejects.toThrow(/MONGODB_URI is not set/);
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('connects with the environment URI and disables command buffering', async () => {
    connectMock.mockResolvedValue(connection);
    const dbConnect = await loadDbModule();

    await dbConnect();

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledWith(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  });

  it('reuses the cached connection for subsequent calls', async () => {
    connectMock.mockResolvedValue(connection);
    const dbConnect = await loadDbModule();

    const first = await dbConnect();
    const second = await dbConnect();

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(connection);
    expect(second).toBe(connection);
  });

  it('does not cache a rejected connection attempt', async () => {
    connectMock.mockRejectedValueOnce(new Error('connection refused'));
    connectMock.mockResolvedValue(connection);
    const dbConnect = await loadDbModule();

    await expect(dbConnect()).rejects.toThrow('connection refused');

    // The next request must be able to retry instead of reusing a dead promise.
    await expect(dbConnect()).resolves.toBe(connection);
    expect(connectMock).toHaveBeenCalledTimes(2);
  });
});
