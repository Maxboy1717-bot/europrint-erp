import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

test.describe("API Health Checks", () => {
  test("API server should be running", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.ok()).toBeTruthy();
  });

  test("API should reject requests without token", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/fi-comprehensive/reports/health`);
    expect(response.status()).toBe(401);
  });

  test("POS inventory endpoint should require auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/pos/inventory/stats`);
    expect(response.status()).toBe(401);
  });

  test("GL engine health should require auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/fi-comprehensive/accounts`);
    expect(response.status()).toBe(401);
  });

  test("3-way match endpoint should require auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/supply-chain/three-way-match/stats`);
    expect(response.status()).toBe(401);
  });
});
