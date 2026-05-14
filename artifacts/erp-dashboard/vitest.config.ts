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
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/hooks/**', 'src/components/**', 'src/pages/**'],
      exclude: ['src/lib/i18n/__tests__/**', 'src/lib/__tests__/**'],
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 25,
        functions: 25,
        branches: 20,
        statements: 25,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
