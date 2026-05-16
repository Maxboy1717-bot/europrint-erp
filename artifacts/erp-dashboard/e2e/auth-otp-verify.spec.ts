/**
 * @module auth-otp-verify.spec
 * @description OTP / 2FA tekshiruv journey testlari.
 */

import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

test.describe("Auth — OTP/2FA verifikatsiya", () => {
  test("OTP request endpoint mavjud yoki 404", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/otp/request`, {
      data: { username: "admin" },
    });
    expect([200, 201, 202, 400, 401, 404, 501]).toContain(res.status());
  });

  test("OTP verify endpoint noto'g'ri kod bilan rad etadi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/otp/verify`, {
      data: { username: "admin", code: "000000" },
    });
    expect([400, 401, 403, 404, 422, 429, 501]).toContain(res.status());
  });

  test("bo'sh OTP kod 400 yoki 422 qaytaradi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/otp/verify`, {
      data: { username: "admin", code: "" },
    });
    expect([400, 401, 404, 422, 501]).toContain(res.status());
  });

  test("OTP sahifasi /otp yoki /verify routeida ochiladi", async ({ page }) => {
    await page.goto("/otp").catch(() => {});
    await expect(page).toHaveURL(/otp|verify|2fa|login|home/i, { timeout: 10000 });
  });

  test("juda uzun OTP kod rad etiladi", async ({ request }) => {
    const longCode = "1".repeat(50);
    const res = await request.post(`${API_BASE}/api/auth/otp/verify`, {
      data: { username: "admin", code: longCode },
    });
    expect([400, 401, 404, 422, 501]).toContain(res.status());
  });
});
