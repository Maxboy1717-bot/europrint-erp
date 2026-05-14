/**
 * @module hr-assets.spec
 * @description Jest / Vitest test suite.
 */

import { test, expect } from '@playwright/test';

const API = process.env.API_BASE_URL ?? 'http://localhost:8080';

test.describe('HR Asset Tracking API', () => {
  test('GET /api/assets — autentifikatsiyasiz 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/assets`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('GET /api/assets?category=laptop — filtr bilan 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/assets?category=laptop`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('GET /api/assets/maintenance — texnik xizmat endpoint 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/assets/maintenance`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/assets — yangi asset yaratish uchun 401 qaytaradi', async ({ request }) => {
    const res = await request.post(`${API}/api/assets`, {
      data: { name: 'Test Noutbuk', type: 'laptop', serialNumber: 'SN-0001' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/departments — bo\'limlar ro\'yxati 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/departments`);
    expect(res.status()).toBe(401);
  });
});
