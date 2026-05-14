/**
 * e2e/_fixtures/api-mock.ts
 *
 * Helper for stubbing API responses in Playwright tests. Intercepts /api/**
 * routes and returns canned JSON. Useful for E2E flows that need deterministic
 * data without a running backend.
 */

import type { Page, Route } from '@playwright/test';

export interface ApiStub {
  url: string | RegExp;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function mockApi(page: Page, stubs: ApiStub[]): Promise<void> {
  for (const stub of stubs) {
    await page.route(stub.url, async (route: Route) => {
      const method = stub.method ?? 'GET';
      if (route.request().method() !== method) return route.fallback();
      return route.fulfill({
        status: stub.status ?? 200,
        contentType: 'application/json',
        headers: stub.headers ?? {},
        body: JSON.stringify(stub.body ?? { ok: true, data: [] }),
      });
    });
  }
}

/** Capture every request matching a pattern; useful for asserting headers/body. */
export function recordRequests(page: Page, pattern: string | RegExp) {
  const calls: Array<{ url: string; method: string; headers: Record<string, string>; body: string }> = [];
  page.on('request', (req) => {
    const url = req.url();
    const matches =
      typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url);
    if (matches) {
      calls.push({
        url,
        method: req.method(),
        headers: req.headers(),
        body: req.postData() ?? '',
      });
    }
  });
  return calls;
}

/** Make every /api/** call return a 500 with a generic error payload. */
export async function mockApiError(page: Page, status = 500): Promise<void> {
  await page.route(/\/api\//, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: { code: 'INTERNAL', message: 'mocked error' } }),
    });
  });
}
