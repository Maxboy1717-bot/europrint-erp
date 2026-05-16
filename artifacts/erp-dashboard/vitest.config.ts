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
      include: ['src/lib/**', 'src/hooks/**', 'src/components/**', 'src/pages/**'],
      exclude: [
        'src/lib/i18n/__tests__/**',
        'src/lib/__tests__/**',
        'src/**/*.d.ts',
        'src/**/*.types.ts',
        'src/**/generated/**',
      ],
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      // Threshold step-up plan (TESTING_PROMPT.md §2):
      //   Current = 25 (baseline) → S3 = 50 → S5 = 70 → S6 final = 80.
      // Coverage cannot regress: PR's reducing % gets blocked.
      thresholds: {
        lines: 25,
        functions: 25,
        branches: 20,
        statements: 25,
        autoUpdate: false,
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
