import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

/**
 * Route handlers and the auth helpers read these variables from the environment.
 * Pinning them here keeps the suite independent from whatever the developer has in
 * their local `.env`, and guarantees the JSON Web Tokens stay verifiable.
 */
process.env.AUTH_SECRET = 'test-auth-secret-long-enough-for-hs256-signing';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/gbp-manager-test';

// React Testing Library only auto-registers its teardown when `globals` is on,
// so component tests would leak mounts between cases without this.
afterEach(() => {
  cleanup();
});
