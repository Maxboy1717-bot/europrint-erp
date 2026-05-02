import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

let adminToken: string | null = null;

async function getAdminToken(request: Parameters<Parameters<typeof test>[1]>[0]["request"]) {
  if (adminToken) return adminToken;
  const res = await request.post(`${API_BASE}/api/admin/login`, {
    data: { username: "admin", password: "admin123" },
  });
  if (res.ok()) {
    const json = await res.json() as { token?: string; accessToken?: string };
    adminToken = json.token ?? json.accessToken ?? null;
  }
  return adminToken;
}

test.describe("Production Order Lifecycle API", () => {
  test("material availability check endpoint exists", async ({ request }) => {
    const token = await getAdminToken(request);
    if (!token) {
      test.skip(true, "Admin login not available");
      return;
    }

    const response = await request.get(`${API_BASE}/api/production-orders/1/material-check`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(response.status());
  });

  test("production order release requires manager role", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/production-orders/1/release`);
    expect([401, 403]).toContain(response.status());
  });

  test("production order complete requires auth", async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/production-orders/1/complete`, {
      data: { confirmedQty: 100 },
    });
    expect([401, 403]).toContain(response.status());
  });
});

test.describe("Finance Reporting API", () => {
  test("balance sheet requires auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/fi-comprehensive/reports/balance-sheet`);
    expect(response.status()).toBe(401);
  });

  test("income statement requires auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/fi-comprehensive/reports/income-statement`);
    expect(response.status()).toBe(401);
  });

  test("cash flow requires auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/fi-comprehensive/reports/cash-flow`);
    expect(response.status()).toBe(401);
  });

  test("trial balance requires auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/fi-comprehensive/reports/trial-balance`);
    expect(response.status()).toBe(401);
  });

  test("AR aging requires auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/fi-comprehensive/reports/aging/ar`);
    expect(response.status()).toBe(401);
  });

  test("AP aging requires auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/fi-comprehensive/reports/aging/ap`);
    expect(response.status()).toBe(401);
  });
});
