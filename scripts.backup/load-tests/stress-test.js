/**
 * k6 STRESS TEST — EuroPrint ERP
 *
 * Purpose: push the API past its design point (400 users) to find the
 * breaking point. Watch for the inflection where p95 or error rate climbs
 * sharply — that VU count is your practical ceiling.
 *
 * Profile (2 min per stage):
 *   100 → 200 → 400 → 600 → 0
 *   total runtime: ~10 min
 *
 * Run:
 *   k6 run scripts/load-tests/stress-test.js
 *
 *   With overrides:
 *     k6 run \
 *       -e BASE_URL=http://localhost:3000 \
 *       -e ADMIN_USER=admin \
 *       -e ADMIN_PASS='YourPassword!' \
 *       scripts/load-tests/stress-test.js
 *
 * Threshold:
 *   - http_req_duration p(95) < 5000 ms (RELAXED — we're stressing)
 *   - http_req_failed   rate  < 25%     (anything worse = system is dead)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const errorRate = new Rate('errors');

const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:3000';
const ADMIN_USER = __ENV.ADMIN_USER || 'admin';
const ADMIN_PASS = __ENV.ADMIN_PASS || 'Admin123!';

const ENDPOINTS = new SharedArray('endpoints', () => [
  { name: 'hr.employees',     path: '/api/hr/employees?limit=20' },
  { name: 'crm.leads',        path: '/api/crm/leads?limit=20' },
  { name: 'wms.stockBalance', path: '/api/warehouse/reports/stock-balance?limit=20' },
  { name: 'finance.cashflow', path: '/api/cashflow/transactions?period=month' },
  { name: 'pp.orders',        path: '/api/pp/orders?status=active' },
  { name: 'auth.me',          path: '/api/auth/me' },
]);

export const options = {
  // Ramp from 100 -> 600 in steps of 100/200, then drain.
  // Each stage is 2 min so you can clearly see when the system breaks.
  stages: [
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 400 },
    { duration: '2m', target: 600 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    // Relaxed because we're intentionally overloading.
    // If p95 stays under 5s even at 600 VUs, you have lots of headroom.
    http_req_duration: ['p(95)<5000'],
    http_req_failed:   ['rate<0.25'],
    errors:            ['rate<0.25'],
  },
  tags: { test: 'stress-600' },
};

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags:    { endpoint: 'auth.login', phase: 'setup' },
      timeout: '15s',
    },
  );

  const ok = check(loginRes, { 'login status 200': (r) => r.status === 200 });
  if (!ok) {
    throw new Error(
      `Login failed — status=${loginRes.status} body=${String(loginRes.body).slice(0, 200)}`,
    );
  }

  const accessCookie = (loginRes.cookies?.access_token || [])[0];
  if (accessCookie?.value) {
    return { token: accessCookie.value, cookieMode: true };
  }

  try {
    const parsed = JSON.parse(loginRes.body);
    if (parsed?.accessToken) return { token: parsed.accessToken, cookieMode: false };
  } catch (_) { /* swallow */ }

  throw new Error('No access_token cookie or body token returned by /api/auth/login');
}

export default function (data) {
  const jar = http.cookieJar();
  if (data?.cookieMode && data.token) {
    jar.set(BASE_URL, 'access_token', data.token, { path: '/' });
  }

  const headers = { 'Accept': 'application/json' };
  if (data && !data.cookieMode && data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }

  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];

  group(endpoint.name, function () {
    const res = http.get(`${BASE_URL}${endpoint.path}`, {
      headers,
      tags: { endpoint: endpoint.name, type: 'endpoint' },
      timeout: '60s',
    });

    const ok = check(res, {
      // We accept anything that is NOT a 5xx or timeout — stress test just
      // wants to know whether the server is still serving SOMETHING.
      'not 5xx':      (r) => r.status < 500,
      'has response': (r) => r.status !== 0,
    });

    errorRate.add(!ok);
  });

  // Shorter sleep than load-test.js — we want sustained pressure here.
  sleep(0.5 + Math.random());
}

export function handleSummary(data) {
  return { stdout: textSummary(data) };
}

function textSummary(data) {
  const m = data.metrics;
  const reqDur  = m.http_req_duration?.values || {};
  const reqFail = m.http_req_failed?.values   || {};
  const reqs    = m.http_reqs?.values          || {};

  const lines = [
    '',
    '=== EuroPrint ERP — Stress Test (100->600 VUs) Summary ===',
    `  http_reqs:           ${reqs.count ?? 0}`,
    `  http_reqs/sec:       ${(reqs.rate ?? 0).toFixed(2)}`,
    `  http_req_duration:`,
    `    avg:               ${(reqDur.avg ?? 0).toFixed(2)} ms`,
    `    p(95):             ${(reqDur['p(95)'] ?? 0).toFixed(2)} ms`,
    `    p(99):             ${(reqDur['p(99)'] ?? 0).toFixed(2)} ms`,
    `    max:               ${(reqDur.max ?? 0).toFixed(2)} ms`,
    `  http_req_failed:     ${((reqFail.rate ?? 0) * 100).toFixed(2)} %`,
    '',
    '  Look at the per-stage RPS curve in the live output to spot the',
    '  breaking point (where p95 jumps or error rate spikes). That VU count',
    '  is your practical ceiling.',
    '',
  ];
  return lines.join('\n');
}
