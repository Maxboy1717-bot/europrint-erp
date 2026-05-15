/**
 * k6 SMOKE TEST — EuroPrint ERP
 *
 * Purpose: minimal "is it alive" check. Sends a steady, light stream of
 * requests against the public health endpoint to confirm the API is reachable
 * and responsive before running the heavier load/stress profiles.
 *
 * Run:
 *   k6 run scripts/load-tests/smoke-test.js
 *
 * Override base URL:
 *   k6 run -e BASE_URL=http://localhost:3000 scripts/load-tests/smoke-test.js
 *
 * Pass thresholds:
 *   - p95 < 500ms
 *   - http_req_failed rate < 1%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
// /api/auth/health is the only @Public() health route in this codebase.
// (Top-level /api/health does not exist; /api/system/health is role-guarded.)
const HEALTH_URL = `${BASE_URL}/api/auth/health`;

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01'],
    errors:            ['rate<0.01'],
  },
  // Tag the test run so InfluxDB/Cloud dashboards can filter by name.
  tags: { test: 'smoke' },
};

export default function () {
  const res = http.get(HEALTH_URL, {
    tags: { endpoint: 'health' },
    timeout: '10s',
  });

  const ok = check(res, {
    'status is 200':            (r) => r.status === 200,
    'body has status field':    (r) => typeof r.body === 'string' && r.body.includes('status'),
    'duration under 500ms':     (r) => r.timings.duration < 500,
  });

  errorRate.add(!ok);

  // Light think-time so we don't bombard the dev server at full throttle
  // with only 5 VUs — keeps RPS realistic for a "smoke" pass.
  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
  };
}

// Inlined to avoid the optional k6/x/summary extension dependency.
function textSummary(data) {
  const m = data.metrics;
  const reqDur = m.http_req_duration?.values || {};
  const reqFail = m.http_req_failed?.values || {};
  const iter = m.iterations?.values || {};
  const reqs = m.http_reqs?.values || {};

  const lines = [
    '',
    '=== EuroPrint ERP — Smoke Test Summary ===',
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
    '',
  ];
  return lines.join('\n');
}
