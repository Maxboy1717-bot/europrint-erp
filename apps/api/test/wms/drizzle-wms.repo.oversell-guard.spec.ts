/**
 * test/wms/drizzle-wms.repo.oversell-guard.spec.ts
 *
 * C1.4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): reserveMaterial()/issueGoods() read a FEFO stock
 * snapshot (queryFefoStock), then previously wrote an ABSOLUTE new value with no guard — a
 * concurrent operation against the same row between the SELECT and the UPDATE could be silently
 * clobbered (oversell). The UPDATE is now a guarded, relative-delta write
 * (execUpdateStockReserved/execUpdateStockIssued in queries-wms.ts) that reports success/failure;
 * these tests prove the repo methods correctly treat a guard failure as "this row's capacity was
 * NOT actually available" — the amount is not deducted from `remainingAmount`, and (when no other
 * row can cover the shortfall) the overall call still correctly reports insufficient stock rather
 * than silently under-reserving/under-issuing.
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockRunQuery = jest.fn();
jest.mock('@shared/db', () => ({ runQuery: (...args: unknown[]) => mockRunQuery(...args), db: {} }));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
  eq: jest.fn(), isNull: jest.fn(), and: jest.fn(),
}));
// drizzle-wms.repo.ts pulls in `Database` purely for a constructor parameter-property TYPE
// annotation, but the real class transitively imports the FULL Drizzle schema tree (including
// drizzle-zod's createInsertSchema, which needs a real drizzle-orm runtime this test doesn't
// load) — stub it out so the import graph stays light, matching this test's actual scope
// (reserveMaterial/issueGoods never touch `this._db`).
jest.mock('@/infrastructure/database/database', () => ({ Database: class {} }));
jest.mock('@shared/db/schema-compat-2', () => ({ warehouses: {} }));
jest.mock('@shared/db/schema-compat-5', () => ({ wms_stock: {} }));
jest.mock('@common/database/queries-wms', () => {
  const actual = jest.requireActual('@common/database/queries-wms');
  return actual;
});

import { DrizzleWmsRepository } from '../../src/modules/wms/infrastructure/repositories/drizzle-wms.repo';

describe('DrizzleWmsRepository — C1.4 oversell guard', () => {
  let repo: DrizzleWmsRepository;

  beforeEach(() => {
    mockRunQuery.mockReset();
    repo = new DrizzleWmsRepository({} as never);
  });

  describe('reserveMaterial()', () => {
    it('does not deduct remainingAmount when the guarded UPDATE reports a lost race (0 rows)', async () => {
      // Single FEFO row, stale snapshot says 50 available, but the guarded UPDATE will report
      // failure (simulating a concurrent reservation that already consumed the row's capacity).
      mockRunQuery.mockImplementation(async (call: unknown) => {
        const text = sqlText(call);
        if (text.includes('SELECT') && text.includes('warehouse_stock')) {
          return { rows: [{ id: 1, quantity: '50', reserved_quantity: '0' }] };
        }
        if (text.includes('UPDATE warehouse_stock') && text.includes('reserved_quantity')) {
          return { rows: [] }; // guard failed — 0 rows affected
        }
        throw new Error(`Unexpected query: ${text}`);
      });

      const result = await repo.reserveMaterial(1, 1, 30);

      expect(result.ok).toBe(false); // the only row's capacity could not actually be applied
      if (!result.ok) expect(result.error.message).toMatch(/Yetarli stock/);
    });

    it('succeeds when the guarded UPDATE confirms the reservation applied', async () => {
      mockRunQuery.mockImplementation(async (call: unknown) => {
        const text = sqlText(call);
        if (text.includes('SELECT') && text.includes('warehouse_stock')) {
          return { rows: [{ id: 1, quantity: '50', reserved_quantity: '0' }] };
        }
        if (text.includes('UPDATE warehouse_stock') && text.includes('reserved_quantity')) {
          return { rows: [{ id: 1 }] }; // guard passed
        }
        throw new Error(`Unexpected query: ${text}`);
      });

      const result = await repo.reserveMaterial(1, 1, 30);
      expect(result.ok).toBe(true);
    });

    it('falls through to the next FEFO row when the first row loses the race', async () => {
      mockRunQuery.mockImplementation(async (call: unknown) => {
        const text = sqlText(call);
        if (text.includes('SELECT') && text.includes('warehouse_stock')) {
          return { rows: [
            { id: 1, quantity: '30', reserved_quantity: '0' },
            { id: 2, quantity: '30', reserved_quantity: '0' },
          ] };
        }
        if (text.includes('UPDATE warehouse_stock') && text.includes('reserved_quantity')) {
          // Row 1 loses the race; row 2 succeeds and alone covers the requested 20.
          if (text.includes(' 1 ')) return { rows: [] };
          return { rows: [{ id: 2 }] };
        }
        throw new Error(`Unexpected query: ${text}`);
      });

      const result = await repo.reserveMaterial(1, 1, 20);
      expect(result.ok).toBe(true);
    });
  });

  describe('issueGoods()', () => {
    it('ad-hoc issue: does not deduct remainingAmount when the guarded UPDATE reports a lost race', async () => {
      mockRunQuery.mockImplementation(async (call: unknown) => {
        const text = sqlText(call);
        if (text.includes('SELECT') && text.includes('warehouse_stock')) {
          return { rows: [{ id: 1, quantity: '50', reserved_quantity: '0' }] };
        }
        if (text.includes('UPDATE warehouse_stock') && text.includes('quantity')) {
          return { rows: [] };
        }
        throw new Error(`Unexpected query: ${text}`);
      });

      const result = await repo.issueGoods(1, 1, 30, null);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.message).toMatch(/Yetarli miqdor/);
    });

    it('reserved issue: succeeds when the guarded UPDATE confirms it applied', async () => {
      mockRunQuery.mockImplementation(async (call: unknown) => {
        const text = sqlText(call);
        if (text.includes('SELECT') && text.includes('warehouse_stock')) {
          return { rows: [{ id: 1, quantity: '50', reserved_quantity: '30' }] };
        }
        if (text.includes('UPDATE warehouse_stock') && text.includes('quantity')) {
          return { rows: [{ id: 1 }] };
        }
        throw new Error(`Unexpected query: ${text}`);
      });

      const result = await repo.issueGoods(1, 1, 30, 999);
      expect(result.ok).toBe(true);
    });
  });
});
