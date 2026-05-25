/**
 * @module api-health.spec
 * @description Jest / Vitest test suite.
 */

import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

test.describe("API Health Checks", () => {
  test("API server should be running", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/health`);
    expect(response.ok()).toBeTruthy();
  });

  test("Finance accounting endpoint should require auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/accounting/accounts`);
    expect([401, 403]).toContain(response.status());
  });

  test("WMS warehouses endpoint should require auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/wms/warehouses`);
    expect([401, 403]).toContain(response.status());
  });

  test("GL accounts endpoint should require auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/gl/accounts`);
    expect([401, 403]).toContain(response.status());
  });

  test("Security incidents endpoint should require auth", async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/security`);
    expect([401, 403]).toContain(response.status());
  });
});
