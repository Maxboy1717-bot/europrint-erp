/**
 * @module zvs-coordination.spec
 * @description Jest / Vitest test suite.
 */

import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "Admin123!";

// ─── Unauthenticated — ZVS ───────────────────────────────────────────────────

test.describe("ZVS API — autentifikatsiyasiz", () => {
  test("ZVS ro'yxat endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/hr/zvs`);
    expect([401, 403]).toContain(res.status());
  });

  test("ZVS yuborish endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/hr/zvs`, {
      data: { purpose: "Test maqsad", amount: 100000 },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("ZVS tasdiqlash endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.patch(`${API_BASE}/api/hr/zvs/1/approve`);
    expect([401, 403]).toContain(res.status());
  });

  test("ZVS rad etish endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.patch(`${API_BASE}/api/hr/zvs/1/reject`);
    expect([401, 403]).toContain(res.status());
  });

  test("FP cycle endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/hr/fp-cycle`);
    expect([401, 403]).toContain(res.status());
  });
});

// ─── Authenticated — ZVS ─────────────────────────────────────────────────────
// Login ONCE and reuse token across all ZVS authenticated tests to avoid rate limiting

let zvsToken: string | null = null;

test.describe("ZVS API — autentifikatsiyalangan", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeTruthy();
    zvsToken = body.accessToken as string;
  });

  test("admin login ishlaydi va token mavjud", async () => {
    expect(zvsToken).toBeTruthy();
  });

  test("ZVS ariza yuborish → 201 yoki 200 va ID qaytaradi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/hr/zvs`, {
      headers: { Authorization: `Bearer ${zvsToken}` },
      data: {
        purpose: "E2E test ZVS arizasi",
        amount: 250000,
        priority: "normal",
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("level");
    expect(body.level).toBe(1);
  });

  test("Level-2 ZVS ariza yuborish (>500K) → level=2 qaytaradi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/hr/zvs`, {
      headers: { Authorization: `Bearer ${zvsToken}` },
      data: {
        purpose: "E2E test ZVS level-2",
        amount: 1_000_000,
        priority: "high",
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.level).toBe(2);
  });

  test("Level-3 ZVS ariza yuborish (>5M) → level=3 qaytaradi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/hr/zvs`, {
      headers: { Authorization: `Bearer ${zvsToken}` },
      data: {
        purpose: "E2E test ZVS level-3",
        amount: 10_000_000,
        priority: "urgent",
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.level).toBe(3);
  });

  test("FP cycle → 200 va items va total mavjud", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/hr/fp-cycle`, {
      headers: { Authorization: `Bearer ${zvsToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("items");
    expect(body).toHaveProperty("total");
  });
});

// ─── Unauthenticated — Coordination ─────────────────────────────────────────

test.describe("Coordination API — autentifikatsiyasiz", () => {
  test("coordination councils endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/coordination/councils`);
    expect([401, 403]).toContain(res.status());
  });

  test("dokla endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/coordination/dokla`);
    expect([401, 403]).toContain(res.status());
  });

  test("rasporyazhenie endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/coordination/rasporyazhenie`);
    expect([401, 403]).toContain(res.status());
  });
});

// ─── Authenticated — Coordination ────────────────────────────────────────────
// Login ONCE and reuse token across all Coordination authenticated tests

let coordToken: string | null = null;

test.describe("Coordination API — autentifikatsiyalangan", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeTruthy();
    coordToken = body.accessToken as string;
  });

  test("admin login ishlaydi va coordination token mavjud", async () => {
    expect(coordToken).toBeTruthy();
  });

  test("councils tuzilmasi → 200 va 5 ta kengash", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/coordination/councils`, {
      headers: { Authorization: `Bearer ${coordToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(5);
    // Response shape is { id, name, type } — sorted by id gives [1,2,3,4,5]
    const ids = body.map((c: { id: number }) => c.id).sort((a: number, b: number) => a - b);
    expect(ids).toEqual([1, 2, 3, 4, 5]);
  });

  test("dokla yaratish → 201 yoki 200 va ID qaytaradi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/coordination/dokla`, {
      headers: { Authorization: `Bearer ${coordToken}` },
      data: {
        subject: "E2E Test Доклад",
        problem: "Muammo tavsifi",
        result: "Natija",
        council_level: 3,
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("subject");
    expect(body.subject).toContain("E2E Test");
  });

  test("doklalar ro'yxati → 200 va array", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/coordination/dokla`, {
      headers: { Authorization: `Bearer ${coordToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("rasporyazhenie yaratish → 201 yoki 200 va ID qaytaradi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/coordination/rasporyazhenie`, {
      headers: { Authorization: `Bearer ${coordToken}` },
      data: {
        task: "E2E Test vazifasi",
        to_user: "Test Xodim",
        priority: "normal",
        deadline: "2026-06-30",
      },
    });
    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("id");
    expect(body).toHaveProperty("task");
  });

  test("rasporyazhenilar ro'yxati → 200 va array", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/coordination/rasporyazhenie`, {
      headers: { Authorization: `Bearer ${coordToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
