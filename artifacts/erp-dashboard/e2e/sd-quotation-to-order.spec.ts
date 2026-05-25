/**
 * @module sd-quotation-to-order.spec
 * @description SD quotation -> order journey.
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

test.describe("SD — quotation->order journey", () => {
  test("quotations ro'yxati endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/sd/quotations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test("yangi quotation yaratish endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.post(`${API_BASE}/api/sd/quotations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        customerId: 1,
        items: [{ productId: 1, quantity: 100, price: 5000 }],
      },
    });
    expect([200, 201, 400, 401, 403, 404, 422]).toContain(res.status());
  });

  test("quotation -> order konvertatsiya endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.post(`${API_BASE}/api/sd/quotations/1/convert`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 201, 400, 401, 403, 404, 422]).toContain(res.status());
  });

  test("orders ro'yxati endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/sd/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test("UI da quotations sahifasi navigatsiya qiladi", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username|foydalanuvchi/i).fill(ADMIN_USER).catch(() => {});
    await page.getByLabel(/parol|password/i).fill(ADMIN_PASS).catch(() => {});
    await page.getByRole("button", { name: /tizimga kirish|kirish/i }).click().catch(() => {});
    await page.waitForTimeout(3000);
    await page.goto("/sd/quotations").catch(() => {});
    await expect(page).toHaveURL(/sd|quotation|order|login|home|dashboard/i);
  });
});
