/**
 * test/pos/warehouse-config.service.receive-stock-transaction.spec.ts
 *
 * C-5.4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-07): WarehouseConfigService.receiveStock()
 * used to make 3 independent rawSql calls (warehouse_stock UPDATE-then-fallback-INSERT,
 * material_cards.current_stock UPDATE, material_movements INSERT) with NO transaction
 * wrap -- a crash/error between calls left a half-written state (e.g. stock incremented
 * but the movement never logged, or vice versa), and the warehouse_stock "upsert" itself
 * was a non-atomic UPDATE-check-then-INSERT-fallback (a TOCTOU race under concurrent
 * receives against a brand-new warehouse/material pair: both requests could see "no row
 * yet" and both attempt the INSERT).
 *
 * The write path is now a single `db.transaction(async (tx) => ...)` with all three
 * statements issued via `tx.execute(...)`, and the warehouse_stock write collapsed into
 * one atomic `INSERT ... ON CONFLICT (warehouse_id, material_id) DO UPDATE` -- the exact
 * pattern already established in
 * pos-warehouse-integration-movement.service.ts#increaseToWarehouseStock (same POS
 * domain, same prior CRITICAL-CORRECTNESS-AUDIT fix family, C1.5).
 *
 * Strategy: mock @shared/db (db.transaction + rawSql) and drizzle-orm's `sql` tag,
 * mirroring test/compatibility/pos-warehouse-integration-movement.service.oversell-guard.spec.ts
 * (same audit, same file family, same mocking approach for a raw-SQL service that has
 * no repository layer to swap for a real-DB integration test).
 */

function sqlText(call: unknown): string {
  const chunks = (call as { queryChunks?: unknown[] })?.queryChunks ?? [];
  return chunks
    .map((c) => (c && typeof c === 'object' && 'value' in (c as object) ? (c as { value: string[] }).value.join('') : ''))
    .join(' ');
}

const mockTxExecute = jest.fn();
const mockRawSql = jest.fn();
const mockTransaction = jest.fn(async (cb: (tx: { execute: typeof mockTxExecute }) => unknown) =>
  cb({ execute: mockTxExecute }),
);

jest.mock('@shared/db', () => ({
  db: { transaction: (cb: never) => mockTransaction(cb) },
  rawSql: (...args: unknown[]) => mockRawSql(...args),
}));
jest.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
    queryChunks: strings.flatMap((s, i) => [{ value: [s] }, ...(i < values.length ? [{ value: [String(values[i])] }] : [])]),
  }),
}));

import { WarehouseConfigService } from '../../src/modules/pos/application/services/warehouse-config.service';

const i18n = { t: jest.fn(async (key: string) => key) } as never;

describe('WarehouseConfigService.receiveStock — C-5.4 transaction atomicity', () => {
  let service: WarehouseConfigService;

  beforeEach(() => {
    mockTxExecute.mockReset();
    mockRawSql.mockReset();
    mockTransaction.mockClear();
    service = new WarehouseConfigService(i18n);
  });

  /** Stubs the two pre-transaction validation SELECTs (warehouses, material_cards). */
  function mockValidationLookups(): void {
    mockRawSql
      .mockResolvedValueOnce({ rows: [{ id: 10, code: 'RM-MAIN' }] })
      .mockResolvedValueOnce({ rows: [{ id: 5, kod: 'M-1', xom_ashyo: 'Karton', unit_of_measure: 'kg' }] });
  }

  function mockHappyPathTxExecute(stockRow: { quantity: string; available_quantity: string }, movementId: number): void {
    mockTxExecute.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('INSERT INTO warehouse_stock')) return { rows: [stockRow] };
      if (text.includes('UPDATE material_cards')) return { rows: [] };
      if (text.includes('INSERT INTO material_movements')) return { rows: [{ id: movementId }] };
      throw new Error(`Unexpected tx query: ${text}`);
    });
  }

  it('collapses the warehouse_stock upsert into ONE atomic INSERT ... ON CONFLICT statement (not UPDATE-then-fallback-INSERT)', async () => {
    mockValidationLookups();
    mockHappyPathTxExecute({ quantity: '15', available_quantity: '15' }, 900);

    const result = await service.receiveStock(10, { materialId: 5, quantity: 15 }, 1);

    expect(result.ok).toBe(true);
    // Exactly 3 tx statements total: stock upsert, current_stock update, movement insert.
    // (The old code could issue a 4th call — a fallback INSERT after a failed UPDATE.)
    expect(mockTxExecute).toHaveBeenCalledTimes(3);

    const calls = mockTxExecute.mock.calls.map((c) => sqlText(c[0]));
    const stockWrites = calls.filter((t) => t.includes('warehouse_stock') && t.includes('INSERT INTO'));
    expect(stockWrites).toHaveLength(1);
    expect(stockWrites[0]).toContain('ON CONFLICT (warehouse_id, material_id) DO UPDATE');
    expect(stockWrites[0]).toContain('quantity = warehouse_stock.quantity + EXCLUDED.quantity');
    expect(stockWrites[0]).toContain('available_quantity = warehouse_stock.available_quantity + EXCLUDED.quantity');
    // No separate bare "UPDATE warehouse_stock ... WHERE" statement remains.
    expect(calls.some((t) => /UPDATE\s+warehouse_stock\s+SET/.test(t))).toBe(false);
  });

  it('runs all 3 writes (stock upsert, current_stock update, movement insert) inside ONE db.transaction call, none of them escaping via a direct rawSql write', async () => {
    mockValidationLookups();
    mockHappyPathTxExecute({ quantity: '8', available_quantity: '8' }, 901);

    const result = await service.receiveStock(10, { materialId: 5, quantity: 8 }, 1);

    expect(result.ok).toBe(true);
    expect(mockTransaction).toHaveBeenCalledTimes(1);

    const txTexts = mockTxExecute.mock.calls.map((c) => sqlText(c[0]));
    expect(txTexts.some((t) => t.includes('INSERT INTO warehouse_stock'))).toBe(true);
    expect(txTexts.some((t) => t.includes('UPDATE material_cards') && t.includes('current_stock'))).toBe(true);
    expect(txTexts.some((t) => t.includes('INSERT INTO material_movements'))).toBe(true);

    // rawSql (outside the transaction) is used only for the pre-write validation
    // SELECTs, never for the 3 writes themselves.
    const rawSqlTexts = mockRawSql.mock.calls.map((c) => sqlText(c[0]));
    expect(rawSqlTexts.every((t) => t.trim().startsWith('SELECT'))).toBe(true);
  });

  it('if the movement insert fails mid-transaction, the failure propagates out of the single db.transaction call (Postgres rolls back the stock upsert + current_stock update together — no partial commit)', async () => {
    mockValidationLookups();
    mockTxExecute.mockImplementation(async (call: unknown) => {
      const text = sqlText(call);
      if (text.includes('INSERT INTO warehouse_stock')) return { rows: [{ quantity: '12', available_quantity: '12' }] };
      if (text.includes('UPDATE material_cards')) return { rows: [] };
      if (text.includes('INSERT INTO material_movements')) throw new Error('simulated material_movements failure');
      throw new Error(`Unexpected tx query: ${text}`);
    });

    const result = await service.receiveStock(10, { materialId: 5, quantity: 12 }, 1);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/simulated material_movements failure/);
    // Only ONE db.transaction attempt was made — the stock upsert and current_stock
    // update ran inside that same still-open transaction, so the thrown error rolls
    // Postgres back atomically instead of leaving them separately committed.
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('repeated receiveStock calls each send additive ON CONFLICT arithmetic (not an overwrite) — proving increments accumulate rather than duplicate/error', async () => {
    mockValidationLookups();
    mockValidationLookups();
    mockHappyPathTxExecute({ quantity: '5', available_quantity: '5' }, 902);

    const first = await service.receiveStock(10, { materialId: 5, quantity: 5 }, 1);
    const second = await service.receiveStock(10, { materialId: 5, quantity: 5 }, 1);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(mockTransaction).toHaveBeenCalledTimes(2);

    const stockWrites = mockTxExecute.mock.calls
      .map((c) => sqlText(c[0]))
      .filter((t) => t.includes('INSERT INTO warehouse_stock'));
    expect(stockWrites).toHaveLength(2);
    for (const t of stockWrites) {
      expect(t).toContain('ON CONFLICT (warehouse_id, material_id) DO UPDATE');
      expect(t).toContain('quantity = warehouse_stock.quantity + EXCLUDED.quantity');
    }
  });
});
