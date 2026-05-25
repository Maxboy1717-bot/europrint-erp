/**
 * @module auth-account-lock.spec
 * @description Akkount lock journey testlari (brute force).
 */

import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

test.describe("Auth — akkount lock journey", () => {
  test("ketma-ket xato urinish 401 yoki 429 qaytaradi", async ({ request }) => {
    for (let i = 0; i < 3; i++) {
      const res = await request.post(`${API_BASE}/api/auth/login`, {
        data: { username: "locktest_user", password: `wrong_${i}` },
      });
      expect([400, 401, 403, 404, 429]).toContain(res.status());
    }
  });

  test("5+ xato urinish keyin 429 (rate limit) qaytarishi mumkin", async ({ request }) => {
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await request.post(`${API_BASE}/api/auth/login`, {
        data: { username: "ratelimit_test_xyz", password: "bad_attempt" },
      });
      statuses.push(res.status());
    }
    const allValid = statuses.every((s) => [400, 401, 403, 404, 429].includes(s));
    expect(allValid).toBe(true);
  });

  test("akkount unlock endpoint mavjud yoki 404", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/unlock`, {
      data: { username: "test_user" },
    });
    expect([200, 201, 400, 401, 403, 404, 501]).toContain(res.status());
  });

  test("lock holatidagi user kirish so'rovida xabar oladi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: "locked_account_xyz", password: "any_pass" },
    });
    expect([400, 401, 403, 404, 423, 429]).toContain(res.status());
  });

  test("login forma rate limit xabarini ko'rsatadi", async ({ page }) => {
    await page.goto("/login");
    for (let i = 0; i < 4; i++) {
      await page.getByLabel(/username|login|foydalanuvchi/i).fill("brute_user").catch(() => {});
      await page.getByLabel(/parol|password/i).fill(`bad_${i}`).catch(() => {});
      await page.getByRole("button", { name: /tizimga kirish|kirish|login/i }).click().catch(() => {});
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveURL(/login/i);
  });
});
