/**
 * @module director-dashboard.spec
 * @description Jest / Vitest test suite.
 */

import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "Admin123!";

test.describe("Director Dashboard API — autentifikatsiyasiz", () => {
  test("director dashboard endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/dashboard`);
    expect([401, 403]).toContain(res.status());
  });

  test("director summary endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/summary`);
    expect([401, 403]).toContain(res.status());
  });

  test("company-state endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/company-state`);
    expect([401, 403]).toContain(res.status());
  });

  test("company-state history endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/company-state/history`);
    expect([401, 403]).toContain(res.status());
  });

  test("director alerts endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/alerts`);
    expect([401, 403]).toContain(res.status());
  });

  test("director production endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/production`);
    expect([401, 403]).toContain(res.status());
  });

  test("ideal-vs-actual endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/ideal-vs-actual`);
    expect([401, 403]).toContain(res.status());
  });

  test("director-kpis endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/europrint-control/director-kpis`);
    expect([401, 403]).toContain(res.status());
  });
});

// Login ONCE and reuse token across all authenticated tests to avoid rate limiting
let cachedToken: string | null = null;

test.describe("Director Dashboard API — autentifikatsiyalangan", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeTruthy();
    cachedToken = body.accessToken as string;
  });

  test("admin login ishlaydi va token qaytaradi", async () => {
    expect(cachedToken).toBeTruthy();
    expect(typeof cachedToken).toBe("string");
  });

  test("director dashboard → 200 va to'g'ri schema", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/dashboard`, {
      headers: { Authorization: `Bearer ${cachedToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("orders");
    expect(body).toHaveProperty("production");
    expect(body).toHaveProperty("hr");
    expect(body.hr).toHaveProperty("total");
    expect(body.hr).toHaveProperty("attendanceRate");
  });

  test("company-state → 200 va state_key mavjud", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/company-state`, {
      headers: { Authorization: `Bearer ${cachedToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("state_key");
    expect(["GROWTH", "NORMAL", "RISK", "CRITICAL"]).toContain(body.state_key);
    expect(body).toHaveProperty("week_start");
    expect(body).toHaveProperty("perf_ratio");
    expect(body).toHaveProperty("profit_pct");
    expect(body).toHaveProperty("revenue_pct");
  });

  test("company-state history → 200 va history array", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/company-state/history`, {
      headers: { Authorization: `Bearer ${cachedToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("history");
    expect(Array.isArray(body.history)).toBe(true);
    if (body.history.length > 0) {
      const item = body.history[0];
      expect(item).toHaveProperty("week_label");
      expect(item).toHaveProperty("state_key");
      expect(["GROWTH", "NORMAL", "RISK", "CRITICAL"]).toContain(item.state_key);
    }
  });

  test("director summary → 200 va orders mavjud", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/summary`, {
      headers: { Authorization: `Bearer ${cachedToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("orders");
    expect(body.orders).toHaveProperty("today");
    expect(body.orders).toHaveProperty("monthTotal");
  });

  test("director hr → 200 va employees ma'lumotlari", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/hr`, {
      headers: { Authorization: `Bearer ${cachedToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("employees");
    expect(body.employees).toHaveProperty("total");
  });

  test("director finance → 200 va invoices mavjud", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/director/finance`, {
      headers: { Authorization: `Bearer ${cachedToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("totalReceivable");
  });
});
