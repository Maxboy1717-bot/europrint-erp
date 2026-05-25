/**
 * @module login-dashboard.spec
 * @description E2E: Login -> Dashboard -> Sidebar visibility -> Logout.
 */

import { test, expect } from '@playwright/test';

const ADMIN_USER = process.env.TEST_ADMIN_USER ?? 'admin';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? 'Admin123!';

test.describe('Login -> Dashboard flow', () => {
  test('navigates to login page when /login is requested', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
  });

  test('fills credentials and submits form when login form is visible', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/username|foydalanuvchi/i).fill(ADMIN_USER);
    await page.getByLabel(/parol|password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: /tizimga kirish|login|kirish/i }).click();
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 10000 });
  });

  test('redirects to dashboard route when admin credentials succeed', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/username|foydalanuvchi/i).fill(ADMIN_USER);
    await page.getByLabel(/parol|password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: /tizimga kirish|login|kirish/i }).click();
    await expect(page).toHaveURL(/dashboard|analytics|home|director|\//, {
      timeout: 10000,
    });
  });

  test('shows sidebar items when authenticated session is active', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/username|foydalanuvchi/i).fill(ADMIN_USER);
    await page.getByLabel(/parol|password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: /tizimga kirish|login|kirish/i }).click();
    await page.waitForLoadState('networkidle');
    const sidebar = page.locator('[data-testid^="nav-menu-item-"]').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('returns to login when logout button is clicked', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/username|foydalanuvchi/i).fill(ADMIN_USER);
    await page.getByLabel(/parol|password/i).fill(ADMIN_PASS);
    await page.getByRole('button', { name: /tizimga kirish|login|kirish/i }).click();
    await page.waitForLoadState('networkidle');
    const logout = page.getByRole('button', { name: /chiqish|logout/i }).first();
    await logout.click();
    await expect(page).toHaveURL(/login|\/$/, { timeout: 10000 });
  });
});
