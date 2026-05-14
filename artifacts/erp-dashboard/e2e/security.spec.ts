/**
 * @module security.spec
 * @description Jest / Vitest test suite.
 */

import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

test.describe("Security Headers", () => {
  test("API should return security headers", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBeDefined();
    expect(headers["referrer-policy"]).toBeDefined();
  });

  test("should not expose server information", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    const headers = response.headers();
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});

test.describe("Authentication Security", () => {
  test("protected endpoints should return 401 without token", async ({ request }) => {
    const endpoints = [
      "/api/auth/me",
      "/api/crm/customers",
      "/api/hr/employees",
      "/api/fi-comprehensive/accounts",
      "/api/pp/orders",
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(`${API_BASE}${endpoint}`);
      expect([401, 403]).toContain(response.status());
    }
  });

  test("admin login should require valid credentials", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/admin/login`, {
      data: { username: "wrong_user", password: "wrong_pass" },
    });
    expect([401, 400]).toContain(response.status());
  });

  test("should not return sensitive data in error messages", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/admin/login`, {
      data: { username: "'; DROP TABLE users; --", password: "test" },
    });
    const body = await response.text();
    expect(body).not.toContain("SQL");
    expect(body).not.toContain("syntax error");
    expect(body).not.toContain("relation");
  });
});
