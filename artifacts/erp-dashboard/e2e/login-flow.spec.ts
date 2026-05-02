import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "admin123";

test.describe("Login Flow — muvaffaqiyatli autentifikatsiya", () => {
  test("admin login → 200, accessToken va admin obyekti qaytaradi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/admin/login`, {
      data: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.accessToken).toBeTruthy();
    expect(typeof body.accessToken).toBe("string");
    expect(body.admin).toBeTruthy();
    expect(body.admin.username).toBe(ADMIN_USER);
  });

  test("token bilan himoyalangan route → 200", async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/admin/login`, {
      data: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    const { accessToken } = await loginRes.json();
    const res = await request.get(`${API_BASE}/api/director/dashboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
  });

  test("refresh token ham qaytariladi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/admin/login`, {
      data: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    const body = await res.json();
    expect(body.refreshToken).toBeTruthy();
    expect(typeof body.refreshToken).toBe("string");
  });
});

test.describe("Login Flow — xato credentials rad etiladi", () => {
  test("bo'sh credentials bilan login 400 qaytaradi", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/admin/login`, {
      data: {},
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("noto'g'ri password bilan 401 qaytaradi", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/admin/login`, {
      data: { username: ADMIN_USER, password: "wrong_password_xyz_123" },
    });
    expect(response.status()).toBe(401);
  });

  test("noto'g'ri username bilan 401 qaytaradi", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/admin/login`, {
      data: { username: "nonexistent_user_xyz", password: ADMIN_PASS },
    });
    expect(response.status()).toBe(401);
  });

  test("user login endpoint noto'g'ri credentials bilan rad etadi", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: "nonexistent_xyz", password: "badpass_xyz" },
    });
    expect([400, 401, 403, 404]).toContain(response.status());
  });

  test("himoyalangan route autentifikatsiyasiz 401 qaytaradi", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/director/dashboard`);
    expect([401, 403]).toContain(response.status());
  });

  test("noto'g'ri JWT token bilan himoyalangan routedan 401/403", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/users`, {
      headers: { Authorization: "Bearer invalid.jwt.token.here" },
    });
    expect([401, 403]).toContain(response.status());
  });
});
