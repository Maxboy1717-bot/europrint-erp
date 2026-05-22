/**
 * @module playwright.config
 * @description Configuration loader. Wraps env vars via @nestjs/config ConfigService.
 */

import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const MOCK_API_PORT = process.env.MOCK_API_PORT ?? "8080";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["html"],
    ["junit", { outputFile: "test-results/playwright-junit.xml" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  webServer: [
    // 1. Zero-dependency mock NestJS backend (no DB / real API required)
    {
      command: "node e2e/mock-backend.mjs",
      url: `http://localhost:${MOCK_API_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        MOCK_API_PORT,
      },
    },
    // 2. Vite dev server proxying /api/* → mock backend
    {
      command: "pnpm run dev",
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: "5173",
        // Route frontend API proxy to mock backend instead of real NestJS
        NEST_API_URL: `http://localhost:${MOCK_API_PORT}`,
        API_URL: `http://localhost:${MOCK_API_PORT}`,
        // Serve at root so Playwright page.goto('/login') resolves correctly
        BASE_PATH: "/",
      },
    },
  ],
});
