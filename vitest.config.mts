import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration.
 *
 * - `node` is the default environment on purpose: the API route handlers need the
 *   real `Request` / `Response` / `Headers` globals that Next.js builds on.
 *   Component tests opt into jsdom with a `// @vitest-environment jsdom` docblock.
 * - The `@` alias mirrors the `paths` entry of tsconfig.json so the tests import
 *   the exact same specifiers as the application code.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      // Thin presentation shells: no branching logic to assert on.
      exclude: ['src/**/*.d.ts', 'src/app/layout.tsx', 'src/app/(dashboard)/layout.tsx'],
    },
  },
});
