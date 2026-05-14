/**
 * @module hr-employees.spec
 * @description Jest / Vitest test suite.
 */

import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "admin123";

async function getAdminToken(request: Parameters<Parameters<typeof test>[1]>[0]["request"]): Promise<string> {
  const res = await request.post(`${API_BASE}/api/admin/login`, {
    data: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  const body = await res.json();
  return body.accessToken as string;
}

test.describe("HR Employees API — autentifikatsiyasiz", () => {
  test("employees endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/employees`);
    expect([401, 403]).toContain(res.status());
  });

  test("employee profil endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/employees/1`);
    expect([401, 403]).toContain(res.status());
  });

  test("attendance endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/attendance/user/1`);
    expect([401, 403]).toContain(res.status());
  });

  test("GSD tarix endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/hr/gsd/employees/1/history`);
    expect([401, 403]).toContain(res.status());
  });

  test("GSD kiritish (POST) endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/hr/gsd/employees/1`, {
      data: { week_date: "2024-04-08", actual: 95 },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("payroll-summary endpoint 401 qaytaradi", async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/employees/1/payroll-summary`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe("HR Employees API — autentifikatsiyalangan", () => {
  test("employees ro'yxati → 200 va array qaytaradi", async ({ request }) => {
    const token = await getAdminToken(request);
    const res = await request.get(`${API_BASE}/api/employees?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      const emp = body.data[0];
      expect(emp).toHaveProperty("id");
      expect(emp).toHaveProperty("fullName");
      expect(emp).toHaveProperty("status");
    }
  });

  test("departments → 200 va array", async ({ request }) => {
    const token = await getAdminToken(request);
    const res = await request.get(`${API_BASE}/api/departments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("positions → 200 va array", async ({ request }) => {
    const token = await getAdminToken(request);
    const res = await request.get(`${API_BASE}/api/positions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("birinchi xodim profili → 200 va to'g'ri schema", async ({ request }) => {
    const token = await getAdminToken(request);
    const listRes = await request.get(`${API_BASE}/api/employees?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();

    if (listBody.data && listBody.data.length > 0) {
      const empId = listBody.data[0].id;
      const profileRes = await request.get(`${API_BASE}/api/employees/${empId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(profileRes.status()).toBe(200);
      const profile = await profileRes.json();
      expect(profile).toHaveProperty("id");
      expect(profile).toHaveProperty("fullName");
      expect(profile).toHaveProperty("role");
    }
  });

  test("birinchi xodim GSD tarixi → 200", async ({ request }) => {
    const token = await getAdminToken(request);
    const listRes = await request.get(`${API_BASE}/api/employees?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const listBody = await listRes.json();

    if (listBody.data && listBody.data.length > 0) {
      const empId = listBody.data[0].id;
      const gsdRes = await request.get(`${API_BASE}/api/hr/gsd/employees/${empId}/history?months=3`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(gsdRes.status()).toBe(200);
      const gsdBody = await gsdRes.json();
      expect(gsdBody).toHaveProperty("history");
      expect(Array.isArray(gsdBody.history)).toBe(true);
    }
  });

  test("FP cycle → 200 va haftalik holat", async ({ request }) => {
    const token = await getAdminToken(request);
    const res = await request.get(`${API_BASE}/api/hr/fp-cycle`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("today");
  });
});
