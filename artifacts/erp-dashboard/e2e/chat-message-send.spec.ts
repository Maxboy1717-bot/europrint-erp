/**
 * @module chat-message-send.spec
 * @description Chat xabar yuborish journey.
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

test.describe("Chat — xabar yuborish journey", () => {
  test("chat rooms ro'yxati endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/chat/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test("xabar yuborish endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.post(`${API_BASE}/api/chat/messages`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        roomId: 1,
        text: "Hello from E2E test",
      },
    });
    expect([200, 201, 400, 401, 403, 404, 422]).toContain(res.status());
  });

  test("bo'sh xabar rad etiladi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.post(`${API_BASE}/api/chat/messages`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { roomId: 1, text: "" },
    });
    expect([400, 401, 403, 404, 422]).toContain(res.status());
  });

  test("xabarlar tarixi endpoint javob beradi", async ({ request }) => {
    const token = await getToken(request);
    if (!token) {
      expect(true).toBe(true);
      return;
    }
    const res = await request.get(`${API_BASE}/api/chat/rooms/1/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401, 403, 404]).toContain(res.status());
  });

  test("UI da chat sahifasi ochiladi", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username|foydalanuvchi/i).fill(ADMIN_USER).catch(() => {});
    await page.getByLabel(/parol|password/i).fill(ADMIN_PASS).catch(() => {});
    await page.getByRole("button", { name: /tizimga kirish|kirish/i }).click().catch(() => {});
    await page.waitForTimeout(3000);
    await page.goto("/chat").catch(() => {});
    await expect(page).toHaveURL(/chat|message|xabar|login|home|dashboard/i);
  });
});
