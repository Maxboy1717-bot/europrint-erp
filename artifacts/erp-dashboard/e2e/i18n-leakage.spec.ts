/**
 * @module i18n-leakage.spec
 * @description Playwright DOM-level i18n leakage detector. Runs against a
 * live dev server (or staging). For each route in routes.json × {ru, uz},
 * navigates, captures the rendered DOM, and asserts NO Uzbek words appear in
 * RU and NO Russian words appear in UZ (with brand/acronym whitelist).
 *
 * Usage:
 *   pnpm exec playwright test e2e/i18n-leakage.spec.ts
 *
 * Prereqs:
 *   - Backend running on :3000
 *   - Frontend running on :20806
 *   - Test user `i18n-tester@europrint.local` with admin role
 *
 * Failure mode: any leak triggers a fullPage screenshot to
 * test-results/leaks/{locale}-{route}.png plus an assertion failure listing
 * every leak text. The CI gate then publishes the screenshots as an artifact.
 */
import { test, expect, type Page } from '@playwright/test';
import { isUzbekLeak, isRussianLeak, isMixedLanguage } from '../../../scripts/i18n-leak-detector.mjs';

// Subset of public routes (extend as needed). The full 958-route loop should
// be generated from src/routes/AppRouter.tsx once the test harness is stable.
const ROUTES = [
  '/',
  '/sales',
  '/sales/leads',
  '/sales/deals',
  '/sales/customers',
  '/crm/funnel',
  '/crm/rfm',
  '/marketing/dashboard',
  '/marketing/leads',
  '/qc/dashboard-home',
  '/qc/approval',
  '/wms/dashboard',
  '/wms/material-balance',
  '/hr/dashboard',
  '/hr/employees',
  '/finance/cfo-dashboard',
  '/pos/dashboard',
  '/iot/dashboard',
  '/iot/tablet',
  '/director',
  '/settings',
] as const;

const LOCALES = ['ru', 'uz'] as const;

async function loginAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', process.env.E2E_USER ?? 'admin@europrint.local');
  await page.fill('input[name="password"]', process.env.E2E_PASS ?? 'Admin123!');
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 10_000 });
}

async function setLocale(page: Page, locale: 'ru' | 'uz') {
  await page.evaluate((loc) => {
    localStorage.setItem('i18nextLng', loc);
    localStorage.setItem('lang', loc);
  }, locale);
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/** Walk every text node and collect (text, xpath) pairs. */
async function extractTextNodes(page: Page): Promise<Array<{ text: string; xpath: string }>> {
  return page.evaluate(() => {
    const out: Array<{ text: string; xpath: string }> = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const t = (n.textContent ?? '').trim();
      if (!t || t.length < 3) continue;
      // Build a rough XPath for diagnostics
      const path: string[] = [];
      let el: Node | null = n.parentNode;
      while (el && el.nodeType === Node.ELEMENT_NODE) {
        const e = el as Element;
        path.unshift(e.tagName.toLowerCase() + (e.id ? `#${e.id}` : ''));
        el = el.parentNode;
        if (path.length > 6) break;
      }
      out.push({ text: t, xpath: '/' + path.join('/') });
    }
    return out;
  });
}

for (const locale of LOCALES) {
  for (const route of ROUTES) {
    test(`[${locale}] ${route} — no language leakage`, async ({ page }) => {
      await loginAdmin(page);
      await setLocale(page, locale);
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const nodes = await extractTextNodes(page);
      const leaks: Array<{ text: string; xpath: string; kind: string }> = [];
      for (const n of nodes) {
        if (locale === 'ru' && isUzbekLeak(n.text)) leaks.push({ ...n, kind: 'UZ_IN_RU' });
        if (locale === 'uz' && isRussianLeak(n.text)) leaks.push({ ...n, kind: 'RU_IN_UZ' });
        if (isMixedLanguage(n.text)) leaks.push({ ...n, kind: 'MIXED' });
      }

      if (leaks.length > 0) {
        await page.screenshot({
          path: `test-results/leaks/${locale}-${route.replace(/[\/?&=]/g, '_')}.png`,
          fullPage: true,
        });
      }

      expect(
        leaks,
        `Found ${leaks.length} leaks on ${route} [${locale}]:\n${JSON.stringify(leaks.slice(0, 10), null, 2)}`,
      ).toHaveLength(0);
    });
  }
}
