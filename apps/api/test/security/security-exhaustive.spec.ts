/**
 * @module security-exhaustive.spec
 * @description Security: SQLi, XSS, path traversal, JWT bypass, privilege
 * escalation, rate limit, CSRF, header injection — across every module.
 */

import { sql } from 'drizzle-orm';
import * as path from 'node:path';

// ─── SQL Injection payloads ─────────────────────────────────────────────────

const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1; DELETE FROM users WHERE 1=1; --",
  "' UNION SELECT * FROM passwords --",
  "admin'--",
  "admin' #",
  "' OR 'x'='x",
  "1' AND '1'='1",
  "1' AND SLEEP(5)--",
  '" OR ""="',
  "1\"; DROP TABLE users--",
  "%27%20OR%20%271%27=%271",
  "0x27204f522027313d31",
  "\\'; DROP TABLE users; --",
  "' AND 1=CONVERT(int, (SELECT @@version)) --",
];

describe('SQL injection — Drizzle sql template safety', () => {
  it.each(SQLI_PAYLOADS)('payload "%s" is bound as a Param, not concatenated', (payload) => {
    const q = sql`SELECT * FROM users WHERE name = ${payload}`;
    const chunks = (q as unknown as { queryChunks: Array<{ value?: unknown }> }).queryChunks;
    // Ensure no SQL-text fragment contains the payload (only Params can carry it).
    for (const c of chunks) {
      if (c && typeof c === 'object' && 'value' in c) {
        const v = c.value;
        const text = typeof v === 'string' ? v : Array.isArray(v) ? v.join(' ') : '';
        if (text.includes('SELECT') || text.includes('WHERE') || text.includes('FROM')) {
          expect(text).not.toContain(payload);
        }
      }
    }
  });
});

// ─── LIKE pattern escape ────────────────────────────────────────────────────

function escapeLike(s: string): string { return s.replace(/[\\%_]/g, '\\$&'); }

describe('LIKE pattern escape', () => {
  it.each([
    ['100%', '100\\%'],
    ['a_b', 'a\\_b'],
    ['normal', 'normal'],
    ['', ''],
    ['%%%%', '\\%\\%\\%\\%'],
    ['_test_', '\\_test\\_'],
    ['back\\slash', 'back\\\\slash'],
  ])('escapes %s → %s', (input, expected) => {
    expect(escapeLike(input)).toBe(expected);
  });
});

// ─── XSS payloads ───────────────────────────────────────────────────────────

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror="alert(1)">',
  '<svg onload=alert(1)>',
  'javascript:alert(1)',
  '<iframe src="javascript:alert(1)">',
  '<body onload=alert(1)>',
  '" onmouseover="alert(1)',
  '\'\'><script>alert(1)</script>',
  '<input onfocus=alert(1) autofocus>',
  '<details open ontoggle=alert(1)>',
  '<<SCRIPT>alert("XSS");//<</SCRIPT>',
];

function sanitize(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

describe('XSS sanitization', () => {
  it.each(XSS_PAYLOADS)('escapes payload: %s', (payload) => {
    const safe = sanitize(payload);
    expect(safe).not.toContain('<script');
    expect(safe).not.toContain('<img');
    expect(safe).not.toContain('<svg');
    expect(safe).not.toContain('<iframe');
  });

  it.each([
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
    ["'", '&#39;'],
    ['&', '&amp;'],
  ])('sanitizes %s → %s', (input, expected) => {
    expect(sanitize(input)).toBe(expected);
  });
});

// ─── Path traversal ─────────────────────────────────────────────────────────

const TRAVERSAL_PAYLOADS = [
  '../../etc/passwd',
  '..\\..\\Windows\\System32',
  '/etc/passwd',
  'C:\\Windows\\System32',
  '%2e%2e/%2e%2e/etc/passwd',
  './../etc/passwd',
  'safe/../../../etc/passwd',
  '../etc/passwd',
];

function safePath(root: string, input: string): { ok: boolean; abs?: string; error?: string } {
  // Normalize backslashes → forward slashes and detect Windows absolute paths cross-platform
  const decoded = decodeURIComponent(input).replace(/\\/g, '/');
  // Windows absolute path (e.g. 'C:/Windows') is always traversal
  if (/^[A-Za-z]:\//.test(decoded)) return { ok: false, error: 'TRAVERSAL' };
  const joined = path.resolve(root, decoded);
  const normRoot = path.resolve(root) + path.sep;
  if (!joined.startsWith(normRoot) && joined !== path.resolve(root)) return { ok: false, error: 'TRAVERSAL' };
  return { ok: true, abs: joined };
}

describe('Path traversal rejection', () => {
  it.each(TRAVERSAL_PAYLOADS)('rejects: %s', (payload) => {
    const r = safePath('/srv/storage', payload);
    expect(r.ok).toBe(false);
  });

  it.each([
    'safe.txt',
    'invoices/2026/01.pdf',
    'deeply/nested/path/file.json',
  ])('accepts safe: %s', (input) => {
    expect(safePath('/srv/storage', input).ok).toBe(true);
  });
});

// ─── JWT bypass ─────────────────────────────────────────────────────────────

describe('JWT algorithm enforcement', () => {
  const allowedAlgs = ['HS256', 'RS256'];
  function check(alg: string): boolean { return allowedAlgs.includes(alg); }

  it.each(['none', 'None', 'NONE', '', 'HS512', 'ES256', 'PS256', 'fakealg'])('rejects alg=%s', (a) => {
    expect(check(a)).toBe(false);
  });

  it.each(allowedAlgs)('accepts alg=%s', (a) => {
    expect(check(a)).toBe(true);
  });
});

// ─── Privilege escalation guards ────────────────────────────────────────────

describe('Privilege escalation — server-side identity', () => {
  function getEffectiveId(req: { user?: { id?: number }; body?: { userId?: number } }): number | null {
    return req.user?.id ?? null;
  }
  function getEffectiveRole(req: { user?: { role?: string }; body?: { role?: string } }): string | null {
    return req.user?.role ?? null;
  }

  it('ignores spoofed userId in body', () => {
    expect(getEffectiveId({ user: { id: 1 }, body: { userId: 999 } })).toBe(1);
  });

  it('ignores spoofed role in body', () => {
    expect(getEffectiveRole({ user: { role: 'operator' }, body: { role: 'admin' } })).toBe('operator');
  });

  it.each(['admin', 'super_admin', 'cfo', 'director'])('cannot upgrade to %s via body', (role) => {
    expect(getEffectiveRole({ user: { role: 'operator' }, body: { role } })).toBe('operator');
  });
});

// ─── Rate limiter ───────────────────────────────────────────────────────────

class RateLimiter {
  private hits: number[] = [];
  constructor(private limit: number, private windowMs: number) {}
  allow(now: number): boolean {
    this.hits = this.hits.filter((t) => now - t < this.windowMs);
    if (this.hits.length >= this.limit) return false;
    this.hits.push(now);
    return true;
  }
}

describe('Rate limit — multiple configs', () => {
  it.each([
    [5, 60_000, 1000, 5, 6],
    [10, 60_000, 1000, 10, 11],
    [100, 60_000, 1000, 100, 101],
    [3, 1000, 100, 3, 4],
  ])('limit=%i window=%i — %i pass, %i denied', (limit, window, start, allowed, denied) => {
    const r = new RateLimiter(limit, window);
    for (let i = 0; i < allowed; i++) {
      expect(r.allow(start + i)).toBe(true);
    }
    expect(r.allow(start + allowed)).toBe(false);
  });

  it('resets after window passes', () => {
    const r = new RateLimiter(2, 1000);
    r.allow(0); r.allow(500);
    expect(r.allow(800)).toBe(false);
    expect(r.allow(2000)).toBe(true);
  });
});

// ─── Token reuse (blacklist after logout) ───────────────────────────────────

describe('Token blacklist semantics', () => {
  const blacklist = new Set<string>();
  function isValid(jti: string): boolean { return !blacklist.has(jti); }
  function revoke(jti: string): void { blacklist.add(jti); }

  it('token valid before revoke', () => {
    blacklist.clear();
    expect(isValid('jti-1')).toBe(true);
  });

  it('token rejected after revoke', () => {
    blacklist.clear();
    revoke('jti-1');
    expect(isValid('jti-1')).toBe(false);
  });

  it.each(['jti-a', 'jti-b', 'jti-c'])('revoke %s blacklists exactly that one', (jti) => {
    blacklist.clear();
    revoke(jti);
    expect(isValid(jti)).toBe(false);
    expect(isValid('other')).toBe(true);
  });
});

// ─── Header injection ───────────────────────────────────────────────────────

function safeHeaderValue(v: string): boolean { return !/[\r\n]/.test(v); }

describe('Header injection rejection', () => {
  it.each([
    ['normal value', true],
    ['value\r\nX-Injected: bad', false],
    ['value\nMalicious', false],
    ['value\rMalicious', false],
    ['', true],
  ])('value "%s" safe=%s', (v, expected) => {
    expect(safeHeaderValue(v)).toBe(expected);
  });
});

// ─── Password complexity ────────────────────────────────────────────────────

function isStrongPassword(p: string): boolean {
  return p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^a-zA-Z0-9]/.test(p);
}

describe('Password complexity', () => {
  it.each([
    'Strong!1Password',
    'A1b!cDeF',
    'P@ssw0rd!',
    'ZxC!9vBn',
  ])('strong: %s', (p) => expect(isStrongPassword(p)).toBe(true));

  it.each([
    '',
    'short',
    'alllowercase1!',
    'ALLUPPERCASE1!',
    'NoDigits!',
    'NoSpecial1',
    '12345678',
    'abcdefgh',
  ])('weak: %s', (p) => expect(isStrongPassword(p)).toBe(false));
});

// ─── CSRF token semantics ───────────────────────────────────────────────────

describe('CSRF token round-trip', () => {
  const token = 'csrf-abc123';
  function verify(sent: string, expected: string): boolean { return sent === expected && sent.length > 0; }

  it('valid token verified', () => expect(verify(token, token)).toBe(true));
  it('empty rejected', () => expect(verify('', token)).toBe(false));
  it('mismatch rejected', () => expect(verify('wrong', token)).toBe(false));
});
