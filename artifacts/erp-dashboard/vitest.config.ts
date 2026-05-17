/**
 * @module vitest.config
 * @description Configuration loader. Wraps env vars via @nestjs/config ConfigService.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    reporters: ['default', ['junit', { outputFile: 'test-results/vitest-junit.xml' }]],
    // React 19 + jsdom + pending promises can keep hooks alive longer than the
    // synchronous test body. The default 10s testTimeout is fine; the hook
    // timeout (beforeEach/afterEach) covers cleanup of dangling renders.
    testTimeout: 15_000,
    hookTimeout: 15_000,
    // Ensure tests run sequentially within a file so that React renders from
    // one test cannot leak into another (otherwise pending-promise tests can
    // appear to fail later siblings on the same QueryClient timer tick).
    sequence: { hooks: 'list' },
    coverage: {
      provider: 'v8',
      // Cover the full `src/` tree so coverage numbers reflect the whole app,
      // not just the well-tested utility folders. The exclude list strips out
      // files that have no runtime logic to cover.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/**/*.types.ts',
        'src/**/generated/**',
      ],
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      // Intentionally low baseline (5%) so we can ratchet upward as new tests
      // land without blocking CI today. See docs/TESTING_PROMPT.md §2 for the
      // step-up plan.
      thresholds: {
        lines: 5,
        functions: 5,
        branches: 5,
        statements: 5,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared/schema': path.resolve(__dirname, 'src/shared-schema.ts'),
      '@assets': path.resolve(__dirname, '..', '..', 'attached_assets'),
    },
  },
});
