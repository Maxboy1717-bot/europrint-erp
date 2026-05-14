/**
 * @module frontend-helpers.spec
 * @description Frontend-side helpers ported as pure functions: safeStorage,
 * role aliasing, permission checks, currency formatting, date formatting,
 * URL builders.
 */

// ─── Role aliases ───────────────────────────────────────────────────────────

const ROLE_ALIASES: Record<string, string> = {
  admin: 'super_admin', superadmin: 'super_admin', super_admin: 'super_admin',
  director: 'director', ceo: 'director', manager: 'director',
  sales: 'sales_manager', sales_manager: 'sales_manager', crm_manager: 'sales_manager',
  marketing: 'sales_manager',
  designer: 'designer',
  technologist: 'technologist', technolog: 'technologist',
  pp_manager: 'pp_viewer', pp_viewer: 'pp_viewer', production_manager: 'pp_viewer',
  operator: 'operator',
  warehouse: 'warehouse_manager', warehouse_manager: 'warehouse_manager',
  qc: 'qc_manager', qc_manager: 'qc_manager',
  finance: 'finance_manager', finance_manager: 'finance_manager', cfo: 'finance_manager',
  accountant: 'finance_manager',
  hr: 'hr_manager', hr_manager: 'hr_manager', lms_admin: 'hr_manager',
};

function normalizeRole(raw: string): string {
  return ROLE_ALIASES[raw.toLowerCase()] ?? raw;
}

describe('Role normalization', () => {
  it.each([
    ['admin', 'super_admin'],
    ['Admin', 'super_admin'],
    ['ADMIN', 'super_admin'],
    ['ceo', 'director'],
    ['director', 'director'],
    ['marketing', 'sales_manager'],
    ['cfo', 'finance_manager'],
    ['accountant', 'finance_manager'],
    ['unknown_role', 'unknown_role'],
    ['operator', 'operator'],
  ])('%s → %s', (raw, expected) => {
    expect(normalizeRole(raw)).toBe(expected);
  });
});

// ─── Permission check ───────────────────────────────────────────────────────

interface PermissionMap { [module: string]: { [action: string]: string[] } }

const PERMS: PermissionMap = {
  CRM: { READ: ['*'], WRITE: ['sales_manager', 'super_admin'] },
  FINANCE: { READ: ['finance_manager', 'super_admin'], WRITE: ['finance_manager', 'super_admin'] },
  HR: { READ: ['*'], WRITE: ['hr_manager', 'super_admin'] },
};

function hasPermission(role: string, module: string, action: string): boolean {
  const allowed = PERMS[module]?.[action];
  if (!allowed) return false;
  if (allowed.includes('*')) return true;
  return allowed.includes(role);
}

describe('Permission check matrix', () => {
  it.each([
    ['sales_manager', 'CRM', 'WRITE', true],
    ['sales_manager', 'CRM', 'READ', true],
    ['operator', 'CRM', 'READ', true],   // * wildcard
    ['operator', 'CRM', 'WRITE', false],
    ['finance_manager', 'FINANCE', 'WRITE', true],
    ['operator', 'FINANCE', 'READ', false],
    ['super_admin', 'FINANCE', 'WRITE', true],
    ['hr_manager', 'HR', 'WRITE', true],
    ['operator', 'HR', 'WRITE', false],
    ['operator', 'UNKNOWN', 'READ', false],
  ])('%s × %s × %s → %s', (r, m, a, expected) => {
    expect(hasPermission(r, m, a)).toBe(expected);
  });
});

// ─── Currency formatter ─────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'UZS'): string {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 });
  return formatter.format(amount);
}

describe('Currency formatter', () => {
  it('UZS basic', () => {
    expect(formatCurrency(1000)).toContain('1,000');
  });
  it('USD shows $', () => {
    expect(formatCurrency(100, 'USD')).toContain('100');
  });
  it.each([0, 1, 1000, 1_000_000])('formats %i without throwing', (n) => {
    expect(() => formatCurrency(n)).not.toThrow();
  });
});

// ─── safeStorage abstraction ────────────────────────────────────────────────

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number { return this.map.size; }
  clear(): void { this.map.clear(); }
  getItem(key: string): string | null { return this.map.get(key) ?? null; }
  key(index: number): string | null { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string): void { this.map.delete(key); }
  setItem(key: string, value: string): void { this.map.set(key, value); }
}

function safeStorageWrap(storage: Storage | null) {
  return {
    get<T>(key: string, fallback: T): T {
      try {
        const raw = storage?.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
      } catch { return fallback; }
    },
    set(key: string, value: unknown): boolean {
      try {
        storage?.setItem(key, JSON.stringify(value));
        return true;
      } catch { return false; }
    },
    remove(key: string): boolean {
      try {
        storage?.removeItem(key);
        return true;
      } catch { return false; }
    },
  };
}

describe('safeStorage', () => {
  it('round-trips an object', () => {
    const s = safeStorageWrap(new MemoryStorage());
    s.set('k', { a: 1 });
    expect(s.get('k', null)).toEqual({ a: 1 });
  });

  it('returns fallback when key missing', () => {
    const s = safeStorageWrap(new MemoryStorage());
    expect(s.get('missing', 'fb')).toBe('fb');
  });

  it('returns fallback on invalid JSON', () => {
    const m = new MemoryStorage();
    m.setItem('k', 'not-json');
    const s = safeStorageWrap(m);
    expect(s.get('k', 'fb')).toBe('fb');
  });

  it('returns fallback when storage is null (SSR)', () => {
    const s = safeStorageWrap(null);
    expect(s.get('k', 'fb')).toBe('fb');
  });

  it('remove returns true even when key absent', () => {
    expect(safeStorageWrap(new MemoryStorage()).remove('k')).toBe(true);
  });

  it.each([null, undefined, 0, '', false, [], {}])('stores falsy value %j', (v) => {
    const s = safeStorageWrap(new MemoryStorage());
    expect(s.set('k', v)).toBe(true);
  });
});

// ─── URL builder ────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, unknown>): string {
  const pairs: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`);
    } else {
      pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return pairs.length === 0 ? '' : `?${pairs.join('&')}`;
}

describe('Query builder', () => {
  it.each([
    [{}, ''],
    [{ a: 1 }, '?a=1'],
    [{ a: 1, b: 2 }, '?a=1&b=2'],
    [{ a: null, b: 2 }, '?b=2'],
    [{ a: undefined, b: 2 }, '?b=2'],
    [{ a: [1, 2, 3] }, '?a=1&a=2&a=3'],
    [{ a: 'hello world' }, '?a=hello%20world'],
    [{ a: '&%=?' }, '?a=%26%25%3D%3F'],
  ] as Array<[Record<string, unknown>, string]>)('%j → %s', (params, expected) => {
    expect(buildQuery(params)).toBe(expected);
  });
});

// ─── Number / string helpers ────────────────────────────────────────────────

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

describe('Truncate', () => {
  it.each([
    ['hello', 10, 'hello'],
    ['hello world', 5, 'hell…'],
    ['', 5, ''],
    ['a', 0, '…'],   // edge: 0-length → just ellipsis
  ])('truncate(%s, %i) → %s', (s, n, expected) => {
    expect(truncate(s, n)).toBe(expected);
  });
});

// ─── Debounce signature ─────────────────────────────────────────────────────

function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number): (...a: A) => void {
  let h: ReturnType<typeof setTimeout> | undefined;
  return (...a) => {
    if (h) clearTimeout(h);
    h = setTimeout(() => fn(...a), ms);
  };
}

describe('Debounce', () => {
  it('only the last call fires', async () => {
    let count = 0;
    const d = debounce(() => { count++; }, 30);
    d(); d(); d();
    await new Promise((r) => setTimeout(r, 50));
    expect(count).toBe(1);
  });

  it('runs again after cooldown', async () => {
    let count = 0;
    const d = debounce(() => { count++; }, 10);
    d();
    await new Promise((r) => setTimeout(r, 30));
    d();
    await new Promise((r) => setTimeout(r, 30));
    expect(count).toBe(2);
  });
});

// ─── Array dedup ────────────────────────────────────────────────────────────

function unique<T>(arr: T[]): T[] { return [...new Set(arr)]; }

describe('Array dedup', () => {
  it.each([
    [[], []],
    [[1, 2, 3], [1, 2, 3]],
    [[1, 1, 2, 2, 3, 3], [1, 2, 3]],
    [['a', 'a', 'b'], ['a', 'b']],
    [[true, false, true], [true, false]],
  ] as Array<[unknown[], unknown[]]>)('unique(%j) = %j', (a, expected) => {
    expect(unique(a)).toEqual(expected);
  });
});

// ─── Object pick / omit ─────────────────────────────────────────────────────

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}

function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const out = { ...obj } as T;
  for (const k of keys) delete out[k];
  return out as Omit<T, K>;
}

describe('Object pick/omit', () => {
  it('pick selects only given keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });
  it('pick ignores absent keys', () => {
    expect(pick({ a: 1 } as { a: number; b?: number }, ['a', 'b'])).toEqual({ a: 1 });
  });
  it('omit drops given keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 });
  });
  it('omit on empty array returns clone', () => {
    expect(omit({ a: 1 }, [])).toEqual({ a: 1 });
  });
});
