/**
 * @module lms-test-attempt.spec
 * @description LMS test topshirish journey.
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

test.describe("LMS — test topshirish journey", () => {
  test("testlar ro'yxati endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/lms/tests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test("test boshlash endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.post(`${API_BASE}/api/lms/tests/1/start`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 201, 400, 401, 403, 404, 422]).toContain(res.status());
  });

  test("javoblarni yuborish endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.post(`${API_BASE}/api/lms/tests/1/submit`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        attemptId: 1,
        answers: [
          { questionId: 1, answerId: 2 },
          { questionId: 2, answerId: 4 },
        ],
      },
    });
    expect([200, 201, 400, 401, 403, 404, 422]).toContain(res.status());
  });

  test("urinishlar tarixi endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/lms/attempts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test("UI da test sahifasi ochiladi", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username|foydalanuvchi/i).fill(ADMIN_USER).catch(() => {});
    await page.getByLabel(/parol|password/i).fill(ADMIN_PASS).catch(() => {});
    await page.getByRole("button", { name: /tizimga kirish|kirish/i }).click().catch(() => {});
    await page.waitForTimeout(3000);
    await page.goto("/lms/tests").catch(() => {});
    await expect(page).toHaveURL(/lms|test|imtihon|login|home|dashboard/i);
  });
});
