/**
 * test/pos/pos-inventory-count-query.service.bulk-record-transaction.spec.ts
 *
 * C-5.5 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): PosInventoryCountQueryService
 * .bulkRecordActualQty() used to loop over dto.lines calling recordActualQty() once
 * per line -- each line's find + update ran through the bare `db` handle, i.e. its
 * OWN implicit one-statement transaction. A failure partway through a batch (e.g.
 * line 2 of 3 not found) left the earlier lines already persisted -- a
 * partially-applied bulk inventory count (Q-40 "ishlaydi != to'g'ri").
 *
 * Fix: the whole loop now runs inside ONE db.transaction, via
 * PosInventoryCountQueryRepository#runInTransaction. recordActualQty() accepts an
 * optional `executor` (the shared `tx`) and threads it through
 * findLine/checkBarcode/updateCountLine -- same `Tx`-alias convention already used by
 * warehouse-config.service.ts#receiveStock (C-5.4) and
 * pos-warehouse-integration-movement.service.ts.
 *
 * Strategy: mock @workspace/db with an in-memory TWO-TIER store (a "committed" map +
 * a per-transaction "staged" clone) that mirrors real Postgres transaction semantics:
 * writes issued via the `tx` handle only land in the committed store if the whole
 * transaction callback resolves; if the callback throws, the staged clone is
 * discarded and the committed store is left untouched. This directly proves lines
 * 1..N-1's writes do NOT persist when line N fails -- not merely that a single
 * db.transaction call was made (mirrors test/pos/warehouse-config.service
 * .receive-stock-transaction.spec.ts and test/mm/drizzle-material-duplicate.repo
 * .spec.ts's `.select().from().where()` / `.update().set().where()` mocking style).
 */

type Row = Record<string, unknown>;

let mockCommitted: Map<number, Row>;

function mockMakeExecutor(store: Map<number, Row>) {
  return {
    select: () => ({
      from: (_table: unknown) => ({
        where: (cond: { val: number }) => {
          const row = store.get(cond.val);
          return Promise.resolve(row ? [{ ...row }] : []);
        },
      }),
    }),
    update: (_table: unknown) => ({
      set: (updates: Row) => ({
        where: (cond: { val: number }) => {
          const existing = store.get(cond.val);
          if (existing) store.set(cond.val, { ...existing, ...updates });
          return Promise.resolve(undefined);
        },
      }),
    }),
    execute: (_q: unknown) => Promise.resolve({ rows: [] }),
  };
}

/**
 * Faithful stand-in for a real Postgres transaction: the callback receives a `tx`
 * bound to a CLONE of the committed store. If the callback resolves, the clone is
 * merged back ("commit"). If it throws, we simply never merge ("rollback") -- the
 * rejection propagates untouched, exactly like db.transaction(async (tx) => ...)
 * rejecting when Drizzle/pg aborts the real transaction.
 */
const mockTransaction = jest.fn(async (fn: (tx: ReturnType<typeof mockMakeExecutor>) => Promise<unknown>) => {
  const staged = new Map(mockCommitted);
  const tx = mockMakeExecutor(staged);
  const result = await fn(tx);
  staged.forEach((v, k) => mockCommitted.set(k, v));
  return result;
});

jest.mock('@workspace/db', () => ({
  db: {
    select: (...args: unknown[]) => (mockMakeExecutor(mockCommitted).select as (...a: unknown[]) => unknown)(...args),
    update: (...args: unknown[]) => (mockMakeExecutor(mockCommitted).update as (...a: unknown[]) => unknown)(...args),
    execute: (_q: unknown) => Promise.resolve({ rows: [] }),
    transaction: (fn: never) => mockTransaction(fn),
  },
  eq: (_col: unknown, val: unknown) => ({ val }),
  and: (...args: unknown[]) => ({ args }),
  desc: (col: unknown) => ({ col }),
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
  posInventoryCounts: { id: 'id', status: 'status', warehouseId: 'warehouseId', createdAt: 'createdAt' },
  posInventoryCountLines: { id: 'id' },
}));

import { NotFoundException } from '@nestjs/common';
import { PosInventoryCountQueryService } from '../../src/modules/pos/application/services/pos-inventory-count-query.service';
import { PosInventoryCountQueryRepository } from '../../src/modules/pos/infrastructure/repositories/pos-inventory-count-query.repository';

const i18n = { t: jest.fn(async (key: string) => key) } as never;

function seedLine(id: number, overrides: Partial<Row> = {}): void {
  mockCommitted.set(id, { id, materialCardId: 100 + id, systemQty: 5, binLocation: `BIN-${id}`, actualQty: null, ...overrides });
}

describe('PosInventoryCountQueryService.bulkRecordActualQty — C-5.5 transaction atomicity', () => {
  let service: PosInventoryCountQueryService;

  beforeEach(() => {
    mockCommitted = new Map<number, Row>();
    mockTransaction.mockClear();
    const repo = new PosInventoryCountQueryRepository();
    service = new PosInventoryCountQueryService(repo, i18n);
  });

  it('wraps the whole bulk batch in exactly ONE db.transaction call and persists all lines on success', async () => {
    seedLine(1);
    seedLine(2);
    seedLine(3);

    const results = await service.bulkRecordActualQty(
      { countId: 1, lines: [{ lineId: 1, actualQty: 7 }, { lineId: 2, actualQty: 9 }, { lineId: 3, actualQty: 3 }] },
      42,
    );

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(3);
    expect(mockCommitted.get(1)?.['actualQty']).toBe(7);
    expect(mockCommitted.get(2)?.['actualQty']).toBe(9);
    expect(mockCommitted.get(3)?.['actualQty']).toBe(3);
  });

  it('rolls back the ENTIRE batch when line 2 of 3 fails (not found): line 1\'s already-applied write does NOT persist', async () => {
    seedLine(1);
    // line 2 intentionally NOT seeded -> findLine returns null -> NotFoundException
    seedLine(3);

    await expect(
      service.bulkRecordActualQty(
        { countId: 1, lines: [{ lineId: 1, actualQty: 7 }, { lineId: 2, actualQty: 9 }, { lineId: 3, actualQty: 3 }] },
        42,
      ),
    ).rejects.toThrow(NotFoundException);

    // Exactly one transaction attempt -- not one per line.
    expect(mockTransaction).toHaveBeenCalledTimes(1);

    // Line 1's update ran first inside the (still-open) transaction and would have
    // been visible in the STAGED clone, but since the callback threw on line 2, the
    // staged clone was discarded and never merged into the committed store. Its
    // actualQty must still be the original seed value (null), proving the WHOLE
    // batch rolled back -- not just the failing line.
    expect(mockCommitted.get(1)?.['actualQty']).toBeNull();

    // Line 3 was never even reached (loop stops at the line-2 failure), and since
    // it also lives only in the discarded staged clone's untouched copy, it must
    // remain at its original value too.
    expect(mockCommitted.get(3)?.['actualQty']).toBeNull();
  });

  it('rolls back the ENTIRE batch when the LAST line (3 of 3) fails: lines 1 and 2\'s writes do NOT persist', async () => {
    seedLine(1);
    seedLine(2);
    // line 3 intentionally NOT seeded -> fails last

    await expect(
      service.bulkRecordActualQty(
        { countId: 1, lines: [{ lineId: 1, actualQty: 11 }, { lineId: 2, actualQty: 13 }, { lineId: 3, actualQty: 1 }] },
        42,
      ),
    ).rejects.toThrow(NotFoundException);

    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // Both lines 1 and 2 succeeded inside the transaction BEFORE line 3 blew up --
    // proving this is a true all-or-nothing rollback, not a lucky single-line case.
    expect(mockCommitted.get(1)?.['actualQty']).toBeNull();
    expect(mockCommitted.get(2)?.['actualQty']).toBeNull();
  });
});
