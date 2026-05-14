/**
 * @module qc-certificates.spec
 * @description Jest / Vitest test suite.
 */

import { test, expect } from '@playwright/test';

const API = process.env.API_BASE_URL ?? 'http://localhost:8080';

test.describe('QC Sertifikatlar API', () => {
  test('GET /api/qc/certificates — autentifikatsiyasiz 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/qc/certificates`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('GET /api/qc/lab-tests — autentifikatsiyasiz 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/qc/lab-tests`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('GET /api/qc/checkpoints — autentifikatsiyasiz 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/qc/checkpoints`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('GET /api/qc/dashboard — endpoint mavjud va 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/qc/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/qc/control-charts/1 — SPC UCL/LCL endpoint mavjud va 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/qc/control-charts/1?n=10`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/qc/spc/control-chart — eski SPC endpoint 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/qc/spc/control-chart?parameterId=1`);
    expect(res.status()).toBe(401);
  });
});
