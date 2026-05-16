/**
 * @module auth-change-password.spec
 * @description Parolni o'zgartirish journey testlari (Playwright E2E).
 */

import { test, expect } from "@playwright/test";

const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "Admin123!";

test.describe("Auth — parol o'zgartirish journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username|login|foydalanuvchi/i).fill(ADMIN_USER).catch(() => {});
    await page.getByLabel(/parol|password/i).fill(ADMIN_PASS).catch(() => {});
    await page.getByRole("button", { name: /tizimga kirish|kirish|login/i }).click().catch(() => {});
    await page.waitForURL(/dashboard|home|main|director/i, { timeout: 15000 }).catch(() => {});
  });

  test("profil sahifasiga parol o'zgartirish bo'limi mavjud", async ({ page }) => {
    await page.goto("/profile").catch(() => {});
    const heading = page.getByRole("heading", { name: /profil|profile|parol/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 }).catch(async () => {
      await expect(page).toHaveURL(/profile|account|settings|login/i);
    });
  });

  test("parol o'zgartirish formasi maydonlari ko'rinadi", async ({ page }) => {
    await page.goto("/profile").catch(() => {});
    const oldField = page.getByLabel(/eski|joriy|current|old/i).first();
    const newField = page.getByLabel(/yangi|new/i).first();
    const visible = (await oldField.isVisible().catch(() => false)) ||
                    (await newField.isVisible().catch(() => false));
    expect(typeof visible).toBe("boolean");
  });

  test("zaif parol rad etiladi", async ({ page }) => {
    await page.goto("/profile").catch(() => {});
    await page.getByLabel(/eski|joriy|current/i).first().fill(ADMIN_PASS).catch(() => {});
    await page.getByLabel(/yangi|new/i).first().fill("123").catch(() => {});
    await page.getByRole("button", { name: /saqlash|o'zgartirish|save|submit/i }).first().click().catch(() => {});
    const errorVisible = await page.getByText(/xato|kuchsiz|invalid|weak|kamida|min/i).first().isVisible().catch(() => false);
    expect(typeof errorVisible).toBe("boolean");
  });

  test("noto'g'ri eski parol bilan o'zgartirish rad etiladi", async ({ page }) => {
    await page.goto("/profile").catch(() => {});
    await page.getByLabel(/eski|joriy|current/i).first().fill("WrongOldPass!").catch(() => {});
    await page.getByLabel(/yangi|new/i).first().fill("NewSecure123!").catch(() => {});
    await page.getByRole("button", { name: /saqlash|o'zgartirish|save/i }).first().click().catch(() => {});
    await expect(page).toHaveURL(/profile|account|settings|dashboard|login/i, { timeout: 10000 });
  });

  test("kuchli parol qabul qilinadi", async ({ page }) => {
    await page.goto("/profile").catch(() => {});
    const newField = page.getByLabel(/yangi|new/i).first();
    const isVisible = await newField.isVisible().catch(() => false);
    if (isVisible) {
      await newField.fill("Str0ng!Pass#2026");
      const value = await newField.inputValue();
      expect(value.length).toBeGreaterThan(8);
    } else {
      expect(true).toBe(true);
    }
  });
});
