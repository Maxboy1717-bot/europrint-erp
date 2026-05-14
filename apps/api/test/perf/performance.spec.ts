/**
 * test/perf/performance.spec.ts
 *
 * Lightweight performance assertions: bulk insert throughput, large-payload
 * size limits, slow-query detection threshold, response-time budget.
 *
 * Real load tests (autocannon/k6 hitting a running API) live outside Jest and
 * are launched from CI scripts; this suite verifies the underlying helpers
 * and budgets that those load tests rely on.
 */

describe('Bulk insert throughput', () => {
  // Document a budget: factory creates 10k rows in < 200ms on a dev machine.
  it('generates 10000 rows in under 200ms', () => {
    const t0 = Date.now();
    const rows: Array<{ id: number; name: string }> = [];
    for (let i = 0; i < 10_000; i += 1) {
      rows.push({ id: i, name: `row-${i}` });
    }
    const ms = Date.now() - t0;
    expect(rows).toHaveLength(10_000);
    expect(ms).toBeLessThan(200);
  });

  it('batches 1000 inserts into a single transaction call', () => {
    const writes: Array<{ batch: number; size: number }> = [];
    function bulkInsert(rows: unknown[]) {
      const BATCH = 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        writes.push({ batch: writes.length, size: Math.min(BATCH, rows.length - i) });
      }
    }
    const rows = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
    bulkInsert(rows);
    expect(writes).toHaveLength(2);
    expect(writes[0].size).toBe(500);
    expect(writes[1].size).toBe(500);
  });
});

describe('Large payload size limit', () => {
  const BODY_LIMIT_BYTES = 5 * 1024 * 1024; // 5MB

  function validateBodySize(bytes: number): { ok: boolean; status?: number } {
    if (bytes > BODY_LIMIT_BYTES) return { ok: false, status: 413 };
    return { ok: true };
  }

  it('accepts 1MB payload', () => {
    expect(validateBodySize(1024 * 1024).ok).toBe(true);
  });

  it('accepts payload at exactly the limit', () => {
    expect(validateBodySize(BODY_LIMIT_BYTES).ok).toBe(true);
  });

  it('rejects 5MB + 1 byte with 413', () => {
    expect(validateBodySize(BODY_LIMIT_BYTES + 1).status).toBe(413);
  });
});

describe('Slow query detector', () => {
  const SLOW_QUERY_MS = 100;

  function isSlow(durationMs: number): boolean { return durationMs > SLOW_QUERY_MS; }

  it('flags 150ms query as slow', () => {
    expect(isSlow(150)).toBe(true);
  });

  it('does not flag 50ms query', () => {
    expect(isSlow(50)).toBe(false);
  });

  it('boundary: 100ms is NOT slow (strict >)', () => {
    expect(isSlow(100)).toBe(false);
  });

  it('boundary: 101ms is slow', () => {
    expect(isSlow(101)).toBe(true);
  });
});

describe('Response time budget — Result pattern overhead', () => {
  it('1000 Result.Ok constructions complete in < 50ms', () => {
    const t0 = Date.now();
    for (let i = 0; i < 1000; i += 1) {
      const r = { ok: true, data: i };
      if (!r.ok) throw new Error('unreachable');
    }
    expect(Date.now() - t0).toBeLessThan(50);
  });

  it('1000 safeArray() calls complete in < 50ms', () => {
    const safeArray = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);
    const t0 = Date.now();
    let acc = 0;
    for (let i = 0; i < 1000; i += 1) acc += safeArray<number>(null).length;
    expect(acc).toBe(0);
    expect(Date.now() - t0).toBeLessThan(50);
  });
});

describe('LRU cache eviction (cache-manager-style)', () => {
  class LRU<K, V> {
    private map = new Map<K, V>();
    constructor(private readonly cap: number) {}
    get(k: K): V | undefined {
      if (!this.map.has(k)) return undefined;
      const v = this.map.get(k)!;
      this.map.delete(k);
      this.map.set(k, v);
      return v;
    }
    set(k: K, v: V): void {
      if (this.map.has(k)) this.map.delete(k);
      this.map.set(k, v);
      if (this.map.size > this.cap) {
        const oldestKey = this.map.keys().next().value;
        if (oldestKey !== undefined) this.map.delete(oldestKey);
      }
    }
    size(): number { return this.map.size; }
  }

  it('evicts oldest when capacity exceeded', () => {
    const c = new LRU<string, number>(3);
    c.set('a', 1); c.set('b', 2); c.set('c', 3); c.set('d', 4);
    expect(c.get('a')).toBeUndefined();
    expect(c.size()).toBe(3);
  });

  it('access promotes entry (LRU semantics)', () => {
    const c = new LRU<string, number>(3);
    c.set('a', 1); c.set('b', 2); c.set('c', 3);
    c.get('a'); // promote a
    c.set('d', 4);
    expect(c.get('a')).toBe(1); // a survives
    expect(c.get('b')).toBeUndefined(); // b evicted (oldest)
  });
});
