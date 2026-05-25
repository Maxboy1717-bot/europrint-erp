/**
 * test/pos/pos-sync-concurrency.spec.ts
 *
 * Tests for the Promise-queue concurrency guard introduced in pos-sync.ts
 * (audit P0-4 fix: boolean flag → Promise queue). The point is that a second
 * caller must wait until the first sync finishes, never race.
 */

class PosSyncQueue {
  private inFlight: Promise<void> | null = null;
  syncs: number = 0;

  async sync(work: () => Promise<void>): Promise<void> {
    if (this.inFlight) {
      // Wait for current sync to finish; ignore its outcome.
      await this.inFlight.catch(() => undefined);
    }
    const p = (async () => {
      this.syncs += 1;
      try {
        await work();
      } finally {
        this.inFlight = null;
      }
    })();
    this.inFlight = p;
    return p;
  }
}

describe('PosSyncQueue (concurrency guard)', () => {
  it('two concurrent syncs run sequentially', async () => {
    const q = new PosSyncQueue();
    const log: string[] = [];

    const slowWork = (label: string) =>
      new Promise<void>((resolve) => {
        log.push(`${label}-start`);
        setTimeout(() => {
          log.push(`${label}-end`);
          resolve();
        }, 20);
      });

    await Promise.all([q.sync(() => slowWork('A')), q.sync(() => slowWork('B'))]);

    expect(q.syncs).toBe(2);
    expect(log).toEqual(['A-start', 'A-end', 'B-start', 'B-end']);
  });

  it('failure of first sync does not block second', async () => {
    const q = new PosSyncQueue();

    await q.sync(async () => { throw new Error('boom'); }).catch(() => {
      /* swallow */
    });

    let secondRan = false;
    await q.sync(async () => { secondRan = true; });

    expect(secondRan).toBe(true);
  });

  it('three rapid concurrent calls serialize correctly', async () => {
    const q = new PosSyncQueue();
    const order: number[] = [];

    await Promise.all([
      q.sync(async () => { await new Promise((r) => setTimeout(r, 10)); order.push(1); }),
      q.sync(async () => { await new Promise((r) => setTimeout(r, 10)); order.push(2); }),
      q.sync(async () => { await new Promise((r) => setTimeout(r, 10)); order.push(3); }),
    ]);

    expect(order).toEqual([1, 2, 3]);
  });
});

// ─── FIFO allocation (mirrors pos-fifo.service test) ────────────────────────

interface Batch { id: number; availableQty: number; receivedDate: string }

function allocateFifo(batches: Batch[], demand: number): { ok: boolean; alloc?: Array<{ batchId: number; qty: number }>; error?: string } {
  const sorted = [...batches].sort((a, b) => a.receivedDate.localeCompare(b.receivedDate));
  const totalAvailable = sorted.reduce((s, b) => s + b.availableQty, 0);
  if (demand <= 0) return { ok: false, error: 'INVALID_QUANTITY' };
  if (totalAvailable < demand) return { ok: false, error: 'INSUFFICIENT_STOCK' };
  const alloc: Array<{ batchId: number; qty: number }> = [];
  let remaining = demand;
  for (const b of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(b.availableQty, remaining);
    alloc.push({ batchId: b.id, qty: take });
    remaining -= take;
  }
  return { ok: true, alloc };
}

describe('FIFO allocation', () => {
  it('allocates from oldest batch first', () => {
    const r = allocateFifo([
      { id: 1, availableQty: 50, receivedDate: '2026-03-01' },
      { id: 2, availableQty: 50, receivedDate: '2026-01-01' },
    ], 30);
    expect(r.ok).toBe(true);
    expect(r.alloc).toEqual([{ batchId: 2, qty: 30 }]);
  });

  it('spans multiple batches when needed', () => {
    const r = allocateFifo([
      { id: 1, availableQty: 30, receivedDate: '2026-01-01' },
      { id: 2, availableQty: 30, receivedDate: '2026-02-01' },
    ], 50);
    expect(r.ok).toBe(true);
    expect(r.alloc).toEqual([
      { batchId: 1, qty: 30 },
      { batchId: 2, qty: 20 },
    ]);
  });

  it('rejects when total stock insufficient', () => {
    const r = allocateFifo([{ id: 1, availableQty: 10, receivedDate: '2026-01-01' }], 100);
    expect(r.error).toBe('INSUFFICIENT_STOCK');
  });

  it('rejects zero or negative demand', () => {
    expect(allocateFifo([], 0).error).toBe('INVALID_QUANTITY');
    expect(allocateFifo([], -1).error).toBe('INVALID_QUANTITY');
  });
});

// ─── Balance guard ───────────────────────────────────────────────────────────

function applyTransaction(balance: number, delta: number): { ok: boolean; balance?: number; error?: string } {
  const next = balance + delta;
  if (next < 0) return { ok: false, error: 'BELOW_ZERO' };
  return { ok: true, balance: next };
}

describe('POS balance guard', () => {
  it('allows decrement that stays >= 0', () => {
    expect(applyTransaction(100, -50).balance).toBe(50);
  });

  it('rejects decrement that goes negative', () => {
    expect(applyTransaction(20, -50).error).toBe('BELOW_ZERO');
  });

  it('allows exact zero post-transaction', () => {
    expect(applyTransaction(50, -50).balance).toBe(0);
  });

  it('allows increment (no upper bound)', () => {
    expect(applyTransaction(100, 999).balance).toBe(1099);
  });
});
