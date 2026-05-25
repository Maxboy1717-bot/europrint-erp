/**
 * k6 LOAD TEST — EuroPrint ERP (400 concurrent users target)
 *
 * Profile:
 *   stage 1 — ramp 0 → 100 VUs over 2 min
 *   stage 2 — ramp 100 → 400 VUs over 5 min
 *   stage 3 — hold 400 VUs for 2 min
 *   stage 4 — ramp 400 → 0 VUs over 1 min
 *   total runtime: ~10 min
 *
 * Auth:
 *   - setup() POSTs to /api/auth/login once and extracts the
 *     `access_token` httpOnly cookie value.
 *   - Each VU re-seeds the cookie jar with that cookie so every request
 *     carries it automatically (cookies: { include: true } via the jar).
 *
 * Run:
 *   k6 run scripts/load-tests/load-test.js
 *
 *   With overrides:
 *     k6 run \
 *       -e BASE_URL=http://localhost:3000 \
 *       -e ADMIN_USER=admin \
 *       -e ADMIN_PASS='YourPassword!' \
 *       scripts/load-tests/load-test.js
 *
 * Pass thresholds:
 *   - http_req_duration p(95) < 2000 ms
 *   - http_req_duration p(99) < 5000 ms
 *   - http_req_failed   rate  < 5%
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const errorRate = new Rate('errors');
const loginTrend = new Trend('login_duration', true);

const BASE_URL    = __ENV.BASE_URL    || 'http://localhost:3000';
const ADMIN_USER  = __ENV.ADMIN_USER  || 'admin';
// NOTE: Default mirrors apps/api/src/database/seeds/admin.seed.ts fallback.
// In CI, pass ADMIN_PASS via the environment instead.
const ADMIN_PASS  = __ENV.ADMIN_PASS  || 'Admin123!';

// Real endpoints verified against apps/api/src/modules/**/*.controller.ts.
// Adjusted from the original brief:
//   /api/wms/stock-balance      -> /api/warehouse/reports/stock-balance
//   /api/finance/cashflow       -> /api/cashflow/transactions
//   (these are the controllers that actually exist in this codebase)
const ENDPOINTS = new SharedArray('endpoints', () => [
  { name: 'hr.employees',     path: '/api/hr/employees?limit=20' },
  { name: 'crm.leads',        path: '/api/crm/leads?limit=20' },
  { name: 'wms.stockBalance', path: '/api/warehouse/reports/stock-balance?limit=20' },
  { name: 'finance.cashflow', path: '/api/cashflow/transactions?period=month' },
  { name: 'pp.orders',        path: '/api/pp/orders?status=active' },
  { name: 'auth.me',          path: '/api/auth/me' },
]);

export const options = {
  // Stages match the spec: 0->100 (2m), 100->400 (5m), 400 (2m), 400->0 (1m).
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 400 },
    { duration: '2m', target: 400 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration:                  ['p(95)<2000', 'p(99)<5000'],
    'http_req_duration{type:endpoint}': ['p(95)<2000'],
    http_req_failed:                    ['rate<0.05'],
    errors:                             ['rate<0.05'],
    login_duration:                     ['p(95)<1500'],
  },
  // Don't let one failing iteration tank the whole run — k6 default aborts
  // on threshold breach; we still want the test to complete to see the curve.
  noConnectionReuse: false,
  tags: { test: 'load-400' },
};

/**
 * Runs once before VUs spin up. Performs login and returns the
 * access_token cookie value so every VU can seed its own jar.
 */
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

  loginTrend.add(loginRes.timings.duration);

  const ok = check(loginRes, {
    'login status 200':       (r) => r.status === 200,
    'login returns body':     (r) => !!r.body && r.body.length > 0,
  });

  if (!ok) {
    throw new Error(
      `Login failed — status=${loginRes.status} body=${String(loginRes.body).slice(0, 200)}`,
    );
  }

  // Extract httpOnly access_token cookie.
  // k6 returns cookies from the response in res.cookies.
  const accessCookie = (loginRes.cookies?.access_token || [])[0];
  if (!accessCookie || !accessCookie.value) {
    // Backward-compat fallback: the controller also returns the token in the
    // response body (`accessToken`) so older clients can use Bearer auth.
    try {
      const parsed = JSON.parse(loginRes.body);
      if (parsed?.accessToken) {
        return { token: parsed.accessToken, cookieMode: false };
      }
    } catch (_) { /* swallow */ }
    throw new Error('No access_token cookie or body token returned by /api/auth/login');
  }

  return { token: accessCookie.value, cookieMode: true };
}

/**
 * Each VU iteration:
 *   1. Seeds the per-VU cookie jar with the shared access_token.
 *   2. Picks a random endpoint from the rotation.
 *   3. Issues the request; checks status + duration.
 *   4. Sleeps 1-3 s to mimic real user pacing.
 */
export default function (data) {
  const jar = http.cookieJar();
  // setCookie scope: domain comes from BASE_URL; path '/' so every /api/* hit
  // carries the cookie. cookies: { include: true } is implied by jar use.
  if (data?.cookieMode && data.token) {
    jar.set(BASE_URL, 'access_token', data.token, { path: '/' });
  }

  const headers = { 'Accept': 'application/json' };
  // Bearer fallback for older clients / when cookie plugin isn't loaded.
  if (data && !data.cookieMode && data.token) {
    headers['Authorization'] = `Bearer ${data.token}`;
  }

  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];

  group(endpoint.name, function () {
    const res = http.get(`${BASE_URL}${endpoint.path}`, {
      headers,
      tags: { endpoint: endpoint.name, type: 'endpoint' },
      timeout: '30s',
    });

    const ok = check(res, {
      'status 2xx':             (r) => r.status >= 200 && r.status < 300,
      'duration < 2000ms (p95)': (r) => r.timings.duration < 2000,
    });

    errorRate.add(!ok);
  });

  // Realistic think-time keeps RPS in the same ballpark as 400 actual humans
  // clicking through the ERP UI (1-3 s between actions).
  sleep(1 + Math.random() * 2);
}

export function handleSummary(data) {
  return { stdout: textSummary(data) };
}

function textSummary(data) {
  const m = data.metrics;
  const reqDur  = m.http_req_duration?.values || {};
  const reqFail = m.http_req_failed?.values   || {};
  const iter    = m.iterations?.values         || {};
  const reqs    = m.http_reqs?.values          || {};
  const login   = m.login_duration?.values     || {};

  const lines = [
    '',
    '=== EuroPrint ERP — Load Test (400 VUs) Summary ===',
    `  iterations:          ${iter.count ?? 0}`,
    `  http_reqs:           ${reqs.count ?? 0}`,
    `  http_reqs/sec:       ${(reqs.rate ?? 0).toFixed(2)}`,
    `  http_req_duration:`,
    `    avg:               ${(reqDur.avg ?? 0).toFixed(2)} ms`,
    `    p(90):             ${(reqDur['p(90)'] ?? 0).toFixed(2)} ms`,
    `    p(95):             ${(reqDur['p(95)'] ?? 0).toFixed(2)} ms`,
    `    p(99):             ${(reqDur['p(99)'] ?? 0).toFixed(2)} ms`,
    `    max:               ${(reqDur.max ?? 0).toFixed(2)} ms`,
    `  http_req_failed:     ${((reqFail.rate ?? 0) * 100).toFixed(2)} %`,
    `  login_duration_p95:  ${(login['p(95)'] ?? 0).toFixed(2)} ms`,
    '',
  ];
  return lines.join('\n');
}
