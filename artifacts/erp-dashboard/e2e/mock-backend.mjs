#!/usr/bin/env node
/**
 * e2e/mock-backend.mjs
 *
 * Zero-dependency Node.js HTTP mock server for Playwright E2E tests.
 * Runs on port 8080 and mimics the real NestJS backend for CI environments
 * where no real backend + database is available.
 *
 * Auth: cookie-based (Set-Cookie: access_token=...) to match production behavior.
 * All authenticated endpoints return minimal but structurally correct payloads.
 *
 * Credential validation:
 *   Admin:    MOCK_ADMIN_USER / MOCK_ADMIN_PASS  (default: admin / Admin123!)
 *   Director: MOCK_DIRECTOR_EMAIL / MOCK_DIRECTOR_PASS (default: director@example.com / changeme)
 * Override via env vars in playwright.config.ts webServer.env or CI secrets.
 */

import { createServer } from 'node:http';

const PORT = parseInt(process.env.MOCK_API_PORT ?? '8080', 10);
const MOCK_TOKEN = 'e2e-mock-access-token-valid';
const COOKIE_NAME = 'access_token';

// ── Mock users ────────────────────────────────────────────────────────────────

const MOCK_ADMIN_USER  = process.env.MOCK_ADMIN_USER    ?? process.env.TEST_ADMIN_USER     ?? 'admin';
const MOCK_ADMIN_PASS  = process.env.MOCK_ADMIN_PASS    ?? process.env.TEST_ADMIN_PASS     ?? 'Admin123!';
const MOCK_DIR_EMAIL   = process.env.MOCK_DIRECTOR_EMAIL ?? 'director@example.com';
const MOCK_DIR_PASS    = process.env.MOCK_DIRECTOR_PASS ?? process.env.E2E_DIRECTOR_PASSWORD ?? 'changeme';

const USERS = {
  admin: {
    credentials: { username: MOCK_ADMIN_USER, password: MOCK_ADMIN_PASS },
    profile: { id: 1, username: 'admin', email: 'admin@europrint.uz', role: 'admin',
               fullName: 'E2E Admin', firstName: 'E2E', lastName: 'Admin' },
  },
  director: {
    credentials: { username: MOCK_DIR_EMAIL, password: MOCK_DIR_PASS },
    profile: { id: 2, username: 'director', email: MOCK_DIR_EMAIL, role: 'director',
               fullName: 'E2E Director', firstName: 'E2E', lastName: 'Director' },
  },
};

function validateCredentials(username, password) {
  if (!username || !password) return null;
  for (const { credentials, profile } of Object.values(USERS)) {
    if (username === credentials.username && password === credentials.password) return profile;
  }
  return null;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function secHeaders(res) {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
  res.setHeader('x-xss-protection', '1; mode=block');
  // x-powered-by intentionally NOT set (security rule)
}

function json(res, status, body) {
  secHeaders(res);
  res.setHeader('content-type', 'application/json');
  res.writeHead(status);
  res.end(JSON.stringify(body));
}

function isAuthenticated(req) {
  const auth   = req.headers['authorization'] ?? '';
  const cookie = req.headers['cookie'] ?? '';
  const hasBearer = auth === `Bearer ${MOCK_TOKEN}`;
  const hasCookie = cookie.split(';').some(c => c.trim() === `${COOKIE_NAME}=${MOCK_TOKEN}`);
  return hasBearer || hasCookie;
}

async function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); }
    });
  });
}

// ── route helpers ─────────────────────────────────────────────────────────────

const routes = [];

function route(method, pattern, handler) {
  routes.push({ method, pattern, handler });
}

// ── Health ───────────────────────────────────────────────────────────────────

route('GET', /^\/(api\/)?health$/, (req, res) =>
  json(res, 200, { status: 'ok', timestamp: new Date().toISOString() }));

// ── Auth — login (validates credentials) ──────────────────────────────────────

async function handleLogin(req, res) {
  const body = await readBody(req);
  const user = validateCredentials(body.username, body.password);
  if (!user) return json(res, 401, { error: 'Invalid credentials' });
  res.setHeader('set-cookie', `${COOKIE_NAME}=${MOCK_TOKEN}; Path=/; HttpOnly; SameSite=Lax`);
  json(res, 200, { accessToken: MOCK_TOKEN, refreshToken: `${MOCK_TOKEN}-refresh`, user });
}

route('POST', '/api/auth/login',  handleLogin);
route('POST', '/api/admin/login', handleLogin);

// Auth — current user (requires cookie/token)
route('GET', '/api/auth/me', (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, USERS.admin.profile);
});

// Auth — refresh
route('POST', '/api/auth/refresh', (req, res) => {
  res.setHeader('set-cookie', `${COOKIE_NAME}=${MOCK_TOKEN}; Path=/; HttpOnly; SameSite=Lax`);
  json(res, 200, { accessToken: MOCK_TOKEN });
});

// Auth — logout
route('POST', '/api/auth/logout', (req, res) => {
  res.setHeader('set-cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  json(res, 200, { ok: true });
});

// ── OTP ──────────────────────────────────────────────────────────────────────

route('POST', '/api/auth/otp/request', (req, res) => json(res, 200, { ok: true }));
route('POST', '/api/auth/otp/verify', (req, res) => {
  res.setHeader('set-cookie', `${COOKIE_NAME}=${MOCK_TOKEN}; Path=/; HttpOnly; SameSite=Lax`);
  json(res, 200, { ok: true, user: USERS.admin.profile });
});

// ── Change password ───────────────────────────────────────────────────────────

route('POST', '/api/auth/change-password', async (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  const body = await readBody(req);
  if (!body.currentPassword || !body.newPassword) return json(res, 400, { error: 'Bad request' });
  json(res, 200, { ok: true });
});

// ── Director dashboard ────────────────────────────────────────────────────────

route('GET', '/api/director/dashboard', (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, {
    orders: { today: 5, monthTotal: 120, pending: 3 },
    production: { efficiency: 0.87, activeLines: 4 },
    hr: { total: 150, attendanceRate: 0.94 },
  });
});

route('GET', '/api/director/company-state', (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, { state_key: 'GROWTH', week_start: new Date().toISOString(),
                   perf_ratio: 1.12, profit_pct: 0.18, revenue_pct: 0.22 });
});

route('GET', '/api/director/company-state/history', (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, { history: [
    { week_label: 'W1', state_key: 'GROWTH' },
    { week_label: 'W2', state_key: 'NORMAL' },
  ]});
});

route('GET', '/api/director/summary', (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, { orders: { today: 5, monthTotal: 120 } });
});

route('GET', '/api/director/hr', (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, { employees: { total: 150 } });
});

route('GET', '/api/director/finance', (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, { totalReceivable: 50_000_000 });
});

// ── ZVS (exact level logic required by zvs-coordination.spec.ts) ──────────────

route('POST', '/api/hr/zvs', async (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  const body = await readBody(req);
  const amount = Number(body.amount ?? 0);
  const level  = amount < 500_000 ? 1 : amount < 5_000_000 ? 2 : 3;
  json(res, 201, { id: 1, level });
});

route('GET', /^\/api\/hr\/fp-cycle/, (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, { items: [], total: 0, today: 0 });
});

// ── Coordination councils ─────────────────────────────────────────────────────

route('GET', '/api/coordination/councils', (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, [
    { id: 1, name: 'Kengash 1', type: 'council' },
    { id: 2, name: 'Kengash 2', type: 'council' },
    { id: 3, name: 'Kengash 3', type: 'council' },
    { id: 4, name: 'Kengash 4', type: 'council' },
    { id: 5, name: 'Kengash 5', type: 'council' },
  ]);
});

route('POST', '/api/coordination/dokla', async (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  const body = await readBody(req);
  json(res, 201, { id: 1, subject: body.subject ?? 'Mock dokla subject' });
});

route('GET', '/api/coordination/dokla', (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, []);
});

route('POST', '/api/coordination/rasporyazhenie', async (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  const body = await readBody(req);
  json(res, 201, { id: 1, task: body.task ?? 'Mock rasporyazhenie task' });
});

route('GET', '/api/coordination/rasporyazhenie', (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, []);
});

// ── Employees ─────────────────────────────────────────────────────────────────

route('GET', /^\/api\/employees(\?.*)?$/, (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, { data: [{ id: 1, fullName: 'Test Employee', status: 'active' }], total: 1 });
});

route('GET', /^\/api\/employees\/\d+/, (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, { id: 1, fullName: 'Test Employee', status: 'active' });
});

route('GET', /^\/api\/departments(\?.*)?$/, (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, []);
});

route('GET', /^\/api\/positions(\?.*)?$/, (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, []);
});

route('GET', /^\/api\/hr\/gsd\/employees\/\d+\/history/, (req, res) => {
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Unauthorized' });
  json(res, 200, { history: [] });
});

// ── Catch-all: return 401 for unauthed, 200 empty for authed ──────────────────

createServer(async (req, res) => {
  const url     = (req.url ?? '/').split('?')[0];
  const urlFull = req.url ?? '/';
  const method  = req.method ?? 'GET';

  for (const r of routes) {
    if (r.method !== method && r.method !== '*') continue;
    if (typeof r.pattern === 'string') {
      if (urlFull !== r.pattern && !urlFull.startsWith(r.pattern + '?') && url !== r.pattern) continue;
    } else {
      if (!r.pattern.test(urlFull) && !r.pattern.test(url)) continue;
    }
    return r.handler(req, res);
  }

  // Default: auth check → 401 / 200 generic
  if (!isAuthenticated(req)) {
    return json(res, 401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
  }
  json(res, 200, { data: [], total: 0, ok: true });

// Gracefully reject WebSocket upgrade requests so vite's ws proxy does not
// get EPIPE errors when the mock backend is used in CI (no real NestJS/Socket.IO).
}).on('upgrade', (req, socket) => {
  // Send a proper HTTP 426 Upgrade Required rejection and close cleanly.
  // Without this handler vite's proxy writes to the socket after the server
  // closes it, producing hundreds of EPIPE/ECONNRESET log lines.
  socket.write(
    'HTTP/1.1 426 Upgrade Required\r\nContent-Length: 0\r\nConnection: close\r\n\r\n',
    () => socket.destroy(),
  );
}).listen(PORT, '0.0.0.0', () => {
  process.stdout.write(`[mock-backend] Listening on http://localhost:${PORT}\n`);
});
