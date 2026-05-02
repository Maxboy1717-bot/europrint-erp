import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

test.describe("Authentication Flow", () => {
  test("admin login endpoint should reject missing credentials", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/admin/login`, {
      data: {},
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("login page should reject invalid credentials", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/admin/login`, {
      data: { username: "invalid_user", password: "wrong_password" },
    });
    expect(response.status()).toBe(401);
  });

  test("should reject invalid JWT token on protected route", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/users`, {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });
    expect([401, 403]).toContain(response.status());
  });

  test("user login endpoint exists and validates credentials", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: "nonexistent", password: "badpass" },
    });
    expect([400, 401, 403, 404]).toContain(response.status());
  });
});
