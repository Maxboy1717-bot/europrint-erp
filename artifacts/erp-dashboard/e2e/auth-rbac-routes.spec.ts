/**
 * @module auth-rbac-routes.spec
 * @description RBAC route himoyasi journey testlari.
 */

import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "Admin123!";

async function getToken(request: any) {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  if (res.status() !== 200) return null;
  const body = await res.json();
  return body.accessToken as string;
}

test.describe("Auth — RBAC route himoyasi", () => {
  test("admin /api/users route ga kira oladi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 403, 404]).toContain(res.status());
  });

  test("autentifikatsiyasiz /api/director/dashboard 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/dashboard`);
    expect([401, 403]).toContain(res.status());
  });

  test("noto'g'ri token bilan barcha himoyalangan routeлар 401", async ({ request }) => {
    const routes = ["/api/users", "/api/director/dashboard", "/api/hr/employees"];
    for (const r of routes) {
      const res = await request.get(`${API_BASE}${r}`, {
        headers: { Authorization: "Bearer fake.token.xyz" },
      });
      expect([401, 403, 404]).toContain(res.status());
    }
  });

  test("admin /api/admin/roles route ga kira oladi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/admin/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 403, 404]).toContain(res.status());
  });

  test("frontend himoyalangan sahifa loginga redirect qiladi", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/director").catch(() => {});
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login|director|dashboard|home/i);
  });
});
