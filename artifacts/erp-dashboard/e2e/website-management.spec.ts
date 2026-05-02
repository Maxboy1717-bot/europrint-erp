import { test, expect } from '@playwright/test';

const API = process.env.API_BASE_URL ?? 'http://localhost:8080';

test.describe('Website Management API', () => {
  test('GET /api/marketing/website/blog — autentifikatsiyasiz 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/marketing/website/blog`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('GET /api/marketing/website/news — autentifikatsiyasiz 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/marketing/website/news`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('GET /api/marketing/website/portfolio — autentifikatsiyasiz 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/marketing/website/portfolio`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('message');
  });

  test('GET /api/marketing/stats — marketing statistikasi 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/marketing/stats`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/marketing/campaigns — kampaniyalar 401 qaytaradi', async ({ request }) => {
    const res = await request.get(`${API}/api/marketing/campaigns`);
    expect(res.status()).toBe(401);
  });
});
