/**
 * e2e/_fixtures/auth.fixture.ts
 *
 * Playwright fixture that seeds a JWT into localStorage under the canonical
 * `access_token` key (and `refresh_token`), bypassing the login UI for tests
 * that aren't testing the login flow itself.
 */

import { test as base, Page } from '@playwright/test';

export interface SeededAuth {
  accessToken: string;
  refreshToken: string;
  role: string;
  username: string;
}

type AuthFixtures = {
  authenticatedPage: Page;
  seededAuth: SeededAuth;
};

function makeFakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString('base64url');
  return `${header}.${body}.test-signature`;
}

export const test = base.extend<AuthFixtures>({
  seededAuth: async ({}, use) => {
    const role = process.env.E2E_ROLE ?? 'admin';
    const username = `e2e-${role}`;
    const accessToken = makeFakeJwt({ sub: 999, username, role });
    const refreshToken = makeFakeJwt({ sub: 999, username, role, type: 'refresh' });
    await use({ accessToken, refreshToken, role, username });
  },

  authenticatedPage: async ({ page, seededAuth }, use) => {
    await page.addInitScript(({ access, refresh, user }) => {
      try {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(user));
      } catch {
        /* storage may be locked in private mode */
      }
    }, {
      access: seededAuth.accessToken,
      refresh: seededAuth.refreshToken,
      user: { id: 999, username: seededAuth.username, role: seededAuth.role },
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
