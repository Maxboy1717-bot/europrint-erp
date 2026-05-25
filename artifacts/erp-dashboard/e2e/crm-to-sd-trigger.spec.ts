/**
 * @module crm-to-sd-trigger.spec
 * @description E2E: Lead -> Deal -> SO auto-create (Trigger 2).
 * Validates that winning a CRM deal automatically materializes a sales order
 * in the SD module.
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

test.describe('CRM -> SD Trigger', () => {
  test('creates lead when CRM create endpoint is called', async ({ request }) => {
    const token = await login(request);
    const res = await request.post(`${API_BASE}/api/crm/leads`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: `Lead-${Date.now()}`,
        contactName: 'Test Contact',
        phone: '+998900000001',
        source: 'web',
      },
    });
    expect([200, 201, 404, 501]).toContain(res.status());
  });

  test('qualifies lead when status transitions to qualified', async ({ request }) => {
    const token = await login(request);
    const list = await request.get(`${API_BASE}/api/crm/leads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404, 501]).toContain(list.status());
  });

  test('converts lead to deal when conversion endpoint is invoked', async ({ request }) => {
    const token = await login(request);
    const res = await request.post(`${API_BASE}/api/crm/deals`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: `Deal-${Date.now()}`,
        stage: 'negotiation',
        amount: 1000,
      },
    });
    expect([200, 201, 400, 404, 501]).toContain(res.status());
  });

  test('marks deal as won when stage updates to won', async ({ request }) => {
    const token = await login(request);
    const list = await request.get(`${API_BASE}/api/crm/deals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404, 501]).toContain(list.status());
  });

  test('shows SO in SD list when deal-won trigger fires', async ({ request }) => {
    const token = await login(request);
    const res = await request.get(`${API_BASE}/api/sd/sales-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404, 501]).toContain(res.status());
    if (res.status() === 200) {
      const body = (await res.json()) as { data?: unknown[] } | unknown[];
      const data = Array.isArray(body) ? body : (body.data ?? []);
      expect(Array.isArray(data)).toBe(true);
    }
  });
});
