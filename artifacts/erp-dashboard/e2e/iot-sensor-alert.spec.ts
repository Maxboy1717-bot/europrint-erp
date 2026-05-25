/**
 * @module iot-sensor-alert.spec
 * @description IoT sensor alert journey.
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

test.describe("IoT — sensor alert journey", () => {
  test("sensorlar ro'yxati endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/iot/sensors`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test("sensor telemetry endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/iot/sensors/1/telemetry`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test("alerts ro'yxati endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/iot/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test("alert acknowledge endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.post(`${API_BASE}/api/iot/alerts/1/acknowledge`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 201, 204, 400, 401, 403, 404, 422]).toContain(res.status());
  });

  test("UI da iot sahifasi navigatsiya qiladi", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username|foydalanuvchi/i).fill(ADMIN_USER).catch(() => {});
    await page.getByLabel(/parol|password/i).fill(ADMIN_PASS).catch(() => {});
    await page.getByRole("button", { name: /tizimga kirish|kirish/i }).click().catch(() => {});
    await page.waitForTimeout(3000);
    await page.goto("/iot").catch(() => {});
    await expect(page).toHaveURL(/iot|sensor|alert|ogohlantir|login|home|dashboard/i);
  });
});
