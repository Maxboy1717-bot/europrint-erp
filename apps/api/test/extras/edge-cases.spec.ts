/**
 * @module edge-cases.spec
 * @description Cross-cutting edge cases: null/undefined/empty inputs, integer
 * overflow boundaries, date parsing oddities, regex matchers, JSON round-trip,
 * deep object equality, encoding/decoding.
 */

// ─── Null-safety patterns ───────────────────────────────────────────────────

function safeArray<T>(x: unknown): T[] { return Array.isArray(x) ? (x as T[]) : []; }
function safeNumber(x: unknown, fb = 0): number {
  if (x === null || x === undefined) return fb;
  const n = Number(x);
  return Number.isFinite(n) ? n : fb;
}
function safeString(x: unknown, fb = ''): string {
  return typeof x === 'string' ? x : fb;
}

describe('safeArray', () => {
  it.each([
    [null, []],
    [undefined, []],
    [{}, []],
    ['string', []],
    [42, []],
    [true, []],
    [[], []],
    [[1, 2], [1, 2]],
    [['a', 'b'], ['a', 'b']],
  ] as Array<[unknown, unknown[]]>)('safeArray(%j) = %j', (input, expected) => {
    expect(safeArray(input)).toEqual(expected);
  });

  it.each([null, undefined, {}, false])('does not throw on .map after safeArray(%j)', (x) => {
    expect(() => safeArray<number>(x).map((n) => n * 2)).not.toThrow();
  });
});

describe('safeNumber', () => {
  it.each([
    [0, 0],
    [42, 42],
    [-1, -1],
    [1.5, 1.5],
    ['42', 42],
    ['1.5', 1.5],
    [null, 0],
    [undefined, 0],
    ['not-a-number', 0],
    [NaN, 0],
    [Infinity, 0],
    [-Infinity, 0],
    ['', 0],
    [true, 1],
    [false, 0],
  ] as Array<[unknown, number]>)('safeNumber(%j) = %s', (input, expected) => {
    expect(safeNumber(input)).toBe(expected);
  });

  it.each([
    [null, 99, 99],
    [undefined, -1, -1],
    ['bad', 'fb', 'fb'],
  ] as Array<[unknown, number | string, number | string]>)('uses fallback %j → %j', (input, fb, expected) => {
    expect(safeNumber(input, fb as number)).toBe(expected as number);
  });
});

describe('safeString', () => {
  it.each([
    ['hello', 'hello'],
    ['', ''],
    [null, ''],
    [undefined, ''],
    [42, ''],
    [{}, ''],
    [[], ''],
    [true, ''],
  ] as Array<[unknown, string]>)('safeString(%j) = "%s"', (input, expected) => {
    expect(safeString(input)).toBe(expected);
  });
});

// ─── Integer boundaries ─────────────────────────────────────────────────────

describe('Integer boundary handling', () => {
  it.each([
    [Number.MAX_SAFE_INTEGER, true],
    [Number.MIN_SAFE_INTEGER, true],
    [Number.MAX_SAFE_INTEGER + 1, false],
    [Number.MIN_SAFE_INTEGER - 1, false],
    [0, true],
    [1, true],
  ])('Number.isSafeInteger(%s) = %s', (n, expected) => {
    expect(Number.isSafeInteger(n)).toBe(expected);
  });
});

// ─── Date parsing ───────────────────────────────────────────────────────────

describe('Date parsing edge cases', () => {
  it.each([
    ['2026-01-01', true],
    ['2026-12-31', true],
    ['2026-02-29', false],          // not a leap year
    ['2024-02-29', true],           // leap year
    ['invalid', false],
    ['', false],
  ])('"%s" parses=%s', (input, expectedValid) => {
    const d = new Date(input);
    const valid = !isNaN(d.getTime()) && d.getDate() === Number(input.split('-')[2]);
    expect(valid).toBe(expectedValid);
  });
});

// ─── Regex matchers (common patterns) ───────────────────────────────────────

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?\d{9,15}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL = /^https?:\/\/.+$/i;

describe('Email regex', () => {
  it.each([
    ['user@example.com', true],
    ['user.name@example.co.uk', true],
    ['no-at-sign', false],
    ['@no-local.com', false],
    ['no-domain@', false],
    ['', false],
    ['user@example', false],
  ])('%s → %s', (s, expected) => expect(EMAIL.test(s)).toBe(expected));
});

describe('Phone regex', () => {
  it.each([
    ['+998901234567', true],
    ['998901234567', true],
    ['123456789', true],            // exactly 9 digits
    ['12345678', false],            // 8 digits
    ['+1234567890123456', false],   // 16 digits
    ['+12345', false],
    ['abc', false],
  ])('%s → %s', (s, expected) => expect(PHONE.test(s)).toBe(expected));
});

describe('UUID regex', () => {
  it.each([
    ['00000000-0000-0000-0000-000000000000', true],
    ['ffffffff-ffff-ffff-ffff-ffffffffffff', true],
    ['FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF', true],
    ['not-a-uuid', false],
    ['00000000-0000-0000-0000-00000000000', false],   // short
    ['', false],
  ])('%s → %s', (s, expected) => expect(UUID.test(s)).toBe(expected));
});

describe('URL regex', () => {
  it.each([
    ['http://example.com', true],
    ['https://example.com', true],
    ['HTTP://EXAMPLE.COM', true],
    ['ftp://example.com', false],
    ['example.com', false],
    ['', false],
  ])('%s → %s', (s, expected) => expect(URL.test(s)).toBe(expected));
});

// ─── JSON round-trip ────────────────────────────────────────────────────────

describe('JSON round-trip preservation', () => {
  it.each([
    { a: 1, b: 'hello' },
    { nested: { deep: { value: 42 } } },
    [1, 2, 3, [4, 5, [6]]],
    null,
    [],
    {},
    { unicode: 'олег 🎉' },
  ])('preserves %j', (value) => {
    expect(JSON.parse(JSON.stringify(value))).toEqual(value);
  });

  it.each([
    [undefined, undefined],            // undefined becomes... undefined
    [{ a: undefined }, {}],            // undefined keys dropped
    [{ d: new Date('2026-01-01') }, { d: '2026-01-01T00:00:00.000Z' }],
  ] as Array<[unknown, unknown]>)('does not preserve %j (lossy)', (value, expected) => {
    const round = value === undefined ? undefined : JSON.parse(JSON.stringify(value));
    expect(round).toEqual(expected);
  });
});

// ─── Encoding ───────────────────────────────────────────────────────────────

describe('Base64 round-trip', () => {
  it.each([
    'hello',
    'with space',
    'Olег',
    '',
    'a'.repeat(1000),
  ])('round-trips: %s', (s) => {
    const enc = Buffer.from(s, 'utf-8').toString('base64');
    const dec = Buffer.from(enc, 'base64').toString('utf-8');
    expect(dec).toBe(s);
  });
});

describe('URL encoding round-trip', () => {
  it.each([
    'hello world',
    'a&b=c?',
    'оlег',
    '/path/with/slash',
    '%percent',
    '',
  ])('round-trips: %s', (s) => {
    expect(decodeURIComponent(encodeURIComponent(s))).toBe(s);
  });
});

// ─── Sorting stability ──────────────────────────────────────────────────────

describe('Stable sort', () => {
  it('preserves order for equal keys', () => {
    const items = [
      { id: 1, key: 'a' }, { id: 2, key: 'a' }, { id: 3, key: 'b' }, { id: 4, key: 'a' },
    ];
    const sorted = [...items].sort((a, b) => a.key.localeCompare(b.key));
    expect(sorted.map((x) => x.id)).toEqual([1, 2, 4, 3]);
  });

  it.each([
    [[3, 1, 2], [1, 2, 3]],
    [[], []],
    [[1], [1]],
    [[5, 5, 5], [5, 5, 5]],
  ])('sort %j → %j', (input, expected) => {
    expect([...input].sort((a, b) => a - b)).toEqual(expected);
  });
});

// ─── Promise patterns ───────────────────────────────────────────────────────

describe('Promise patterns', () => {
  it('Promise.race resolves with first', async () => {
    const r = await Promise.race([
      new Promise((r) => setTimeout(() => r(1), 10)),
      new Promise((r) => setTimeout(() => r(2), 30)),
    ]);
    expect(r).toBe(1);
  });

  it('Promise.all rejects on first failure', async () => {
    await expect(Promise.all([
      Promise.resolve(1),
      Promise.reject('boom'),
    ])).rejects.toBe('boom');
  });

  it('Promise.allSettled never rejects', async () => {
    const out = await Promise.allSettled([
      Promise.resolve(1),
      Promise.reject('x'),
      Promise.resolve(3),
    ]);
    expect(out.length).toBe(3);
    expect(out[1].status).toBe('rejected');
  });

  it('Promise.any returns first fulfilled', async () => {
    const r = await Promise.any([
      Promise.reject('a'),
      Promise.resolve('b'),
      Promise.reject('c'),
    ]);
    expect(r).toBe('b');
  });
});

// ─── Map/Set semantics ──────────────────────────────────────────────────────

describe('Map insertion order', () => {
  it('preserves insertion order on iteration', () => {
    const m = new Map();
    m.set('a', 1); m.set('b', 2); m.set('c', 3);
    expect([...m.keys()]).toEqual(['a', 'b', 'c']);
  });

  it('reinsertion does not change order', () => {
    const m = new Map();
    m.set('a', 1); m.set('b', 2);
    m.set('a', 99);
    expect([...m.keys()]).toEqual(['a', 'b']);
  });

  it.each<[unknown[], number]>([
    [[1, 2, 3], 3],
    [['a', 'b'], 2],
    [[true, false], 2],
  ])('size matches insertion count for %j', (items, expected) => {
    const s = new Set(items);
    expect(s.size).toBe(expected);
  });

  it('Set dedupes', () => {
    expect(new Set([1, 1, 1, 2]).size).toBe(2);
  });
});

// ─── Deep equality ──────────────────────────────────────────────────────────

describe('Deep equality (Jest toEqual)', () => {
  it.each([
    [{ a: 1 }, { a: 1 }],
    [[1, 2, 3], [1, 2, 3]],
    [{ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } }],
    [{ a: [1, 2] }, { a: [1, 2] }],
    [null, null],
    [undefined, undefined],
  ] as Array<[unknown, unknown]>)('%j === %j', (a, b) => {
    expect(a).toEqual(b);
  });

  it.each([
    [{ a: 1 }, { a: 2 }],
    [[1, 2], [1, 2, 3]],
    [{ a: 1 }, { b: 1 }],
  ] as Array<[unknown, unknown]>)('%j !== %j', (a, b) => {
    expect(a).not.toEqual(b);
  });
});
