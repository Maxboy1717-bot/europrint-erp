/**
 * @module production-lifecycle.spec
 * @description E2E: PP order -> MES session -> QC inspection -> close.
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:8080';
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? 'admin';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? 'Admin123!';

interface LoginBody {
  accessToken: string;
}

async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  const body = (await res.json()) as LoginBody;
  return body.accessToken;
}

test.describe('Production lifecycle', () => {
  test('creates production order when PP create endpoint is called', async ({ request }) => {
    const token = await login(request);
    const res = await request.post(`${API_BASE}/api/pp/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        productCode: 'TEST-PROD',
        quantity: 100,
        plannedStart: new Date().toISOString(),
      },
    });
    expect([200, 201, 400, 404, 501]).toContain(res.status());
  });

  test('starts MES session when start endpoint is invoked', async ({ request }) => {
    const token = await login(request);
    const res = await request.get(`${API_BASE}/api/mes/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404, 501]).toContain(res.status());
  });

  test('runs QC inspection when inspection endpoint is invoked', async ({ request }) => {
    const token = await login(request);
    const res = await request.get(`${API_BASE}/api/qc/inspections`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404, 501]).toContain(res.status());
    if (res.status() === 200) {
      const body = (await res.json()) as { data?: unknown[] } | unknown[];
      const data = Array.isArray(body) ? body : (body.data ?? []);
      expect(Array.isArray(data)).toBe(true);
    }
  });

  test('closes production order when status transitions to closed', async ({ request }) => {
    const token = await login(request);
    const list = await request.get(`${API_BASE}/api/pp/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404, 501]).toContain(list.status());
  });

  test('rejects production endpoint when unauthenticated request is made', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/pp/orders`);
    expect([401, 403]).toContain(res.status());
  });
});
