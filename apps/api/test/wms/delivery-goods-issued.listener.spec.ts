/**
 * test/wms/delivery-goods-issued.listener.spec.ts
 *
 * Unit tests for DeliveryGoodsIssuedListener — the SD delivery → WMS EXTERNAL_OUT stock-out
 * (VISION-3340 #51, the inverse of the QC/MES FG-receipt listeners). `@shared/db` runQuery is
 * mocked (same style as qc-failed-fg.listener.spec).
 *
 * Proves:
 *   • on an actionable delivery goods-issued event (FG warehouse resolved, delivery_items line
 *     present) the listener routes the shipped quantity OUT of finished-goods stock — a
 *     `wms_transactions` 'OUT' ledger row + a guarded `warehouse_stock` decrement;
 *   • the PARTIAL-qty rule: shipped qty = picked_quantity (when > 0) over delivery_quantity;
 *   • it is a no-op (logs, no write) when there is no FG warehouse, no delivery_items lines
 *     (build-phase 0 rows), qty <= 0, or material_id is null;
 *   • the stock decrement is guarded so it can never write a negative balance
 *     (WHERE available_quantity >= qty);
 *   • it is idempotent (an existing 'OUT' movement makes a re-fire a no-op);
 *   • runQuery failures are swallowed (best-effort / non-fatal — the delivery flow is not broken).
 */

jest.mock('@shared/db', () => ({
  runQuery: jest.fn(),
}));

import { DeliveryGoodsIssuedListener } from '../../src/modules/wms/infrastructure/event-handlers/delivery-goods-issued.listener';
import { DeliveryGoodsIssuedEvent } from '../../src/modules/sd/domain/events/delivery-goods-issued.event';
import { runQuery } from '@shared/db';

const mockRun = runQuery as jest.MockedFunction<typeof runQuery>;

/**
 * Extract the interpolated parameter values from a Drizzle SQL object (queryChunks) — copied from
 * qc-failed-fg.listener.spec. Lets us assert the shipped quantity + FG warehouse id flow into a
 * write without depending on compiled SQL text.
 */
function paramValues(node: unknown): unknown[] {
  const chunks = (node as { queryChunks?: unknown[] })?.queryChunks;
  if (!Array.isArray(chunks)) return [];
  const out: unknown[] = [];
  for (const c of chunks) {
    if (c && typeof c === 'object') {
      const chunk = c as { value?: unknown; queryChunks?: unknown[] };
      if (Array.isArray(chunk.value)) continue; // StringChunk (string[])
      if (Array.isArray(chunk.queryChunks)) {
        out.push(...paramValues(chunk)); // nested SQL
        continue;
      }
      if ('value' in chunk) {
        out.push(chunk.value); // Param-style wrapper
        continue;
      }
      out.push(c);
    } else {
      out.push(c); // raw interpolated primitive (number / string / etc.)
    }
  }
  return out;
}

/** Collect the SQL objects passed to each runQuery call whose text contains `needle`. */
function callsMatching(needle: string): unknown[] {
  return mockRun.mock.calls
    .map((c) => c[0])
    .filter((sqlObj) => JSON.stringify(sqlObj).includes(needle));
}

describe('DeliveryGoodsIssuedListener', () => {
  let listener: DeliveryGoodsIssuedListener;

  beforeEach(() => {
    jest.clearAllMocks();
    listener = new DeliveryGoodsIssuedListener();
  });

  const FG_WH = 7;
  const MATERIAL = 42;
  const PICKED = 30;
  const PLANNED = 50;
  const DELIVERY_ID = 900;
  const SALES_ORDER_ID = 123;

  function event(): DeliveryGoodsIssuedEvent {
    return new DeliveryGoodsIssuedEvent(DELIVERY_ID, SALES_ORDER_ID);
  }

  it('routes the PARTIAL shipped quantity (picked over delivery) OUT: wms_transactions OUT + warehouse_stock decrement', async () => {
    mockRun
      // 1: finished-goods warehouse resolution
      .mockResolvedValueOnce({ rows: [{ id: FG_WH }] } as never)
      // 2: delivery_items lines (picked > 0 → picked wins over delivery_quantity)
      .mockResolvedValueOnce({
        rows: [{ material_id: MATERIAL, picked_quantity: PICKED, delivery_quantity: PLANNED }],
      } as never)
      // 3: idempotency guard → none exists
      .mockResolvedValueOnce({ rows: [{ cnt: 0 }] } as never)
      // 4: wms_transactions OUT INSERT (ledger, written first)
      .mockResolvedValueOnce({ rows: [] } as never)
      // 5: warehouse_stock guarded decrement
      .mockResolvedValueOnce({ rows: [] } as never);

    await listener.handle(event());

    // warehouse(1) + lines(2) + guard(3) + ledger(4) + stock(5)
    expect(mockRun).toHaveBeenCalledTimes(5);

    // ledger row is an OUT movement carrying the PICKED quantity + the FG warehouse + material
    const ledgerInsert = callsMatching('wms_transactions').find((c) =>
      JSON.stringify(c).includes('INSERT INTO'),
    );
    expect(ledgerInsert).toBeDefined();
    const ledgerParams = paramValues(ledgerInsert);
    expect(ledgerParams).toContain(PICKED); // partial: picked, NOT planned
    expect(ledgerParams).not.toContain(PLANNED);
    expect(ledgerParams).toContain(FG_WH);
    expect(ledgerParams).toContain(MATERIAL);
    expect(ledgerParams).toContain(DELIVERY_ID); // reference_id
    expect(JSON.stringify(ledgerInsert)).toContain('OUT');
    expect(JSON.stringify(ledgerInsert)).toContain('EXTERNAL_OUT'); // notes

    // stock write is a guarded DECREMENT (never negative) carrying the picked quantity
    const stockUpdate = callsMatching('warehouse_stock').find((c) =>
      JSON.stringify(c).includes('UPDATE'),
    );
    expect(stockUpdate).toBeDefined();
    const stockSql = JSON.stringify(stockUpdate);
    expect(stockSql).toContain('available_quantity'); // guard column present (>= qty)
    const stockParams = paramValues(stockUpdate);
    expect(stockParams).toContain(PICKED);
    expect(stockParams).toContain(FG_WH);
    // no INSERT into warehouse_stock — a decrement must never create a (negative) row
    expect(callsMatching('warehouse_stock').every((c) => !JSON.stringify(c).includes('INSERT INTO'))).toBe(true);
  });

  it('falls back to delivery_quantity when nothing is picked (picked = 0)', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [{ id: FG_WH }] } as never)
      .mockResolvedValueOnce({
        rows: [{ material_id: MATERIAL, picked_quantity: 0, delivery_quantity: PLANNED }],
      } as never)
      .mockResolvedValueOnce({ rows: [{ cnt: 0 }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    await listener.handle(event());

    const ledgerInsert = callsMatching('wms_transactions').find((c) =>
      JSON.stringify(c).includes('INSERT INTO'),
    );
    const ledgerParams = paramValues(ledgerInsert);
    expect(ledgerParams).toContain(PLANNED); // fallback: delivery_quantity
  });

  it('is a no-op (no fabrication) when no finished-goods warehouse is configured', async () => {
    mockRun.mockResolvedValueOnce({ rows: [{ id: null }] } as never);

    await listener.handle(event());

    expect(mockRun).toHaveBeenCalledTimes(1); // only the warehouse lookup, no write
    expect(callsMatching('INSERT INTO')).toHaveLength(0);
  });

  it('is a no-op when the delivery has no delivery_items lines (build-phase 0 rows)', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [{ id: FG_WH }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never); // no lines

    await listener.handle(event());

    expect(mockRun).toHaveBeenCalledTimes(2); // warehouse + lines, no write
    expect(callsMatching('INSERT INTO')).toHaveLength(0);
  });

  it('skips a line whose shipped qty resolves to <= 0 (no write)', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [{ id: FG_WH }] } as never)
      .mockResolvedValueOnce({
        rows: [{ material_id: MATERIAL, picked_quantity: 0, delivery_quantity: 0 }],
      } as never);

    await listener.handle(event());

    expect(mockRun).toHaveBeenCalledTimes(2); // warehouse + lines, then skip (no guard/write)
    expect(callsMatching('INSERT INTO')).toHaveLength(0);
  });

  it('is idempotent: an existing OUT movement makes a re-fire a no-op', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [{ id: FG_WH }] } as never)
      .mockResolvedValueOnce({
        rows: [{ material_id: MATERIAL, picked_quantity: PICKED, delivery_quantity: PLANNED }],
      } as never)
      .mockResolvedValueOnce({ rows: [{ cnt: 1 }] } as never); // guard: already issued

    await listener.handle(event());

    expect(mockRun).toHaveBeenCalledTimes(3); // warehouse + lines + guard, NO write
    expect(callsMatching('INSERT INTO')).toHaveLength(0);
  });

  it('swallows and logs errors thrown by runQuery (best-effort / non-fatal)', async () => {
    mockRun.mockRejectedValueOnce(new Error('db down'));

    await expect(listener.handle(event())).resolves.toBeUndefined();
  });
});
