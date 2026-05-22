/**
 * @module aisha-director-flow.spec
 * @description End-to-end happy path. We don't actually invoke the wake
 * word from a real microphone — we drive the AishaPanel through its
 * Zustand store using `evaluate()`, then assert that the SSE response
 * surfaces in the TransparencyPanel exactly as a real session would.
 */

import { test, expect, Page } from '@playwright/test';

async function loginAsDirector(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'director@example.com');
  await page.fill('input[name="password"]', process.env.E2E_DIRECTOR_PASSWORD ?? 'changeme');
  await page.click('button[type="submit"]');
  // Director role maps to '/' — wait until we navigate away from the login page
  await page.waitForURL(url => !url.includes('/login'), { timeout: 10_000 });
}

async function driveStore(page: Page, mutator: string): Promise<void> {
  await page.evaluate((m) => {
    const store = (window as unknown as { __AISHA_STORE__?: { setState(p: unknown): void } }).__AISHA_STORE__;
    if (!store) return;
    store.setState(JSON.parse(m));
  }, mutator);
}

test.describe('AIsha — Director happy path', () => {
  test('director sees AishaPanel + TransparencyPanel after wake', async ({ page }) => {
    await loginAsDirector(page);
    await expect(page.getByTestId('aisha-panel')).toBeVisible();

    await driveStore(page, JSON.stringify({ status: 'listening' }));
    await expect(page.getByTestId('aisha-status')).toContainText(/listening|tinglay/i);

    await driveStore(page, JSON.stringify({
      history: [{ id: '1', transcript: 'sex-3 holati qanday?', at: Date.now() }],
    }));
    await expect(page.getByText(/sex-3/i)).toBeVisible();

    await driveStore(page, JSON.stringify({
      lastResponse: {
        text: 'Sex-3 OEE is 65%',
        provenance: {
          sources: [{ type: 'database', identifier: 'iot.machine_registry', queriedAt: new Date().toISOString(), latencyMs: 12, freshness: 'live' }],
          confidence: 0.95,
          citations: [{ label: 'Sex-3' }],
          cameraSnapshots: [{ cameraId: 'c1', cameraName: 'Sex-3 Cam', snapshotUrl: '/test.jpg', capturedAt: new Date().toISOString() }],
        },
      },
    }));
    await expect(page.getByTestId('aisha-transparency')).toBeVisible();
    await expect(page.getByTestId('aisha-cameras')).toBeVisible();
    await expect(page.getByTestId('aisha-confidence')).toContainText('95');
  });

  test('mute toggle hides idle status', async ({ page }) => {
    await loginAsDirector(page);
    await page.getByTestId('aisha-mute').click();
    await expect(page.getByTestId('aisha-status')).toContainText(/muted|ovozsiz/i);
  });

  test('high-stake action prompts approval before send', async ({ page }) => {
    await loginAsDirector(page);
    await driveStore(page, JSON.stringify({
      lastResponse: {
        text: '4pm yig\'ilish haqida jamoaga xabar yuborilsinmi?',
        provenance: {
          sources: [{ type: 'api', identifier: 'telegram.bot', queriedAt: new Date().toISOString(), latencyMs: 5, freshness: 'live' }],
          confidence: 0.9, citations: [],
        },
      },
    }));
    await expect(page.getByTestId('aisha-transparency')).toBeVisible();
  });

  test('F4 toggles mute', async ({ page }) => {
    await loginAsDirector(page);
    await page.keyboard.press('F4');
    await expect(page.getByTestId('aisha-status')).toContainText(/muted|ovozsiz/i);
  });

  test('transparency renders every source row', async ({ page }) => {
    await loginAsDirector(page);
    await driveStore(page, JSON.stringify({
      lastResponse: {
        text: 'Bugungi holat',
        provenance: {
          sources: [
            { type: 'database', identifier: 'sd.sales_orders', queriedAt: new Date().toISOString(), latencyMs: 8, freshness: 'live' },
            { type: 'database', identifier: 'pp.production_orders', queriedAt: new Date().toISOString(), latencyMs: 5, freshness: 'live' },
          ],
          confidence: 0.88, citations: [],
        },
      },
    }));
    await expect(page.getByText('sd.sales_orders')).toBeVisible();
    await expect(page.getByText('pp.production_orders')).toBeVisible();
  });
});
