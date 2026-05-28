/**
 * @module hr-smoke.spec
 * @description HR module smoke tests — verifies key endpoints are reachable
 * and return auth errors (401/403) rather than server errors (500/503).
 *
 * WHY THIS EXISTS:
 * Before the 2026-05-28 QA sprint, 9+ HR endpoints returned 503 because
 * unwrapOrInternal() was used for list GET endpoints. These tests catch any
 * regression to that state: a 503 means the handler crashed before the
 * JWT guard ran, which indicates a service-layer error, not an auth error.
 *
 * RULE: Unauthenticated requests to HR endpoints MUST return 401 or 403.
 *       They must NEVER return 500 or 503.
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:8080';

/** HR endpoints that were 503-ing before P0 fix. Must not 503 after fix. */
const HR_LIST_ENDPOINTS = [
  '/api/hr/employees',
  '/api/hr/birthdays',
  '/api/hr/birthdays/today',
  '/api/hr/birthdays/upcoming',
  '/api/hr/leave-requests',
  '/api/hr/safety/incidents',
  '/api/hr/safety/trainings',
  '/api/hr/safety/hazard-zones',
  '/api/hr/safety/ppe-compliance',
  '/api/hr/gamification/leaderboard/monthly',
  '/api/hr/milestones/generate',
  '/api/hr/skills',
  '/api/users',
];

test.describe('HR API — smoke (P0 regression guard)', () => {
  for (const endpoint of HR_LIST_ENDPOINTS) {
    test(`${endpoint} returns 401/403 not 500/503`, async ({ request }) => {
      const response = await request.get(`${API_BASE}${endpoint}`);
      const status = response.status();
      expect(
        [401, 403],
        `Expected auth error from ${endpoint} but got ${status}. ` +
        `A 500/503 means the handler crashed — likely unwrapOrInternal() regression.`,
      ).toContain(status);
    });
  }
});

test.describe('HR API — health', () => {
  test('/auth/health returns 200', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/auth/health`);
    expect(response.ok()).toBeTruthy();
  });
});
