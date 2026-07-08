/**
 * test/wms/qc-failed-fg.listener.spec.ts
 *
 * Unit tests for QcFailedFgListener — the QC-fail → WMS "route brak to scrap" reaction
 * (VISION-3340 #58). `@shared/db` runQuery is mocked (same style as rop-trigger.handler.spec).
 *
 * Proves:
 *   • on an actionable QC-failed event (fail_count > 0, scrap warehouse resolved, FG line
 *     present) the listener writes the scrap movement for the FAILED quantity — a
 *     `wms_transactions` 'IN' ledger row into the scrap warehouse + a `warehouse_stock` UPSERT;
 *   • it is a no-op (logs, no write) when the payload lacks a movable quantity: no inspection
 *     row, fail_count <= 0, no scrap warehouse configured, or no FG lines on the order;
 *   • it is idempotent (an existing scrap movement makes a re-fire a no-op);
 *   • runQuery failures are swallowed (best-effort / non-fatal — the QC flow is not broken).
 */

jest.mock('@shared/db', () => ({
  runQuery: jest.fn(),
}));

import { QcFailedFgListener } from '../../src/modules/wms/infrastructure/event-handlers/qc-failed-fg.listener';
import { QcFailedEvent } from '../../src/modules/qc/domain/events';
import { runQuery } from '@shared/db';

const mockRun = runQuery as jest.MockedFunction<typeof runQuery>;

/**
 * Extract the interpolated parameter values from a Drizzle SQL object (queryChunks).
 * In drizzle-orm, a `sql` template stores string literals as StringChunk objects
 * (`{ value: string[] }`) and interpolated `${x}` values as RAW primitives placed directly
 * in `queryChunks` (e.g. the number 30, the string 'x'); nested SQL carries `.queryChunks`.
 * Collect everything that is NOT a StringChunk / nested SQL — i.e. the interpolated params —
 * so we can assert the FAILED quantity + scrap warehouse id flow into a write, without
 * depending on compiled SQL text.
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

describe('QcFailedFgListener', () => {
  let listener: QcFailedFgListener;

  beforeEach(() => {
    jest.clearAllMocks();
    listener = new QcFailedFgListener();
  });

  const SCRAP_WH = 5;
  const MATERIAL = 42;
  const FAIL_QTY = 30;
  const ORDER_ID = 900;

  function event(): QcFailedEvent {
    return new QcFailedEvent('101', ORDER_ID, 'razryad brak');
  }

  it('routes the FAILED quantity to scrap: wms_transactions IN + warehouse_stock UPSERT', async () => {
    mockRun
      // 1: inspection lookup → fail_count + scrap warehouse
      .mockResolvedValueOnce({ rows: [{ fail_count: FAIL_QTY, scrap_warehouse_id: SCRAP_WH }] } as never)
      // 2: FG lines
      .mockResolvedValueOnce({ rows: [{ material_id: MATERIAL }] } as never)
      // 3: idempotency guard → none exists
      .mockResolvedValueOnce({ rows: [{ cnt: 0 }] } as never)
      // 4: wms_transactions INSERT (ledger, written first)
      .mockResolvedValueOnce({ rows: [] } as never)
      // 5: warehouse_stock UPSERT
      .mockResolvedValueOnce({ rows: [] } as never);

    await listener.handle(event());

    // resolution(1) + lines(2) + guard(3) + ledger(4) + stock(5)
    expect(mockRun).toHaveBeenCalledTimes(5);

    // ledger row carries the FAILED quantity + the scrap warehouse
    const ledgerCalls = callsMatching('wms_transactions');
    const ledgerInsert = ledgerCalls.find((c) => JSON.stringify(c).includes('INSERT INTO'));
    expect(ledgerInsert).toBeDefined();
    const ledgerParams = paramValues(ledgerInsert);
    expect(ledgerParams).toContain(FAIL_QTY);
    expect(ledgerParams).toContain(SCRAP_WH);
    expect(ledgerParams).toContain(MATERIAL);

    // warehouse_stock UPSERT carries the FAILED quantity into the scrap warehouse
    const stockInsert = callsMatching('warehouse_stock').find((c) =>
      JSON.stringify(c).includes('INSERT INTO'),
    );
    expect(stockInsert).toBeDefined();
    const stockParams = paramValues(stockInsert);
    expect(stockParams).toContain(FAIL_QTY);
    expect(stockParams).toContain(SCRAP_WH);
  });

  it('is a no-op when the inspection row is missing', async () => {
    mockRun.mockResolvedValueOnce({ rows: [] } as never);

    await listener.handle(event());

    expect(mockRun).toHaveBeenCalledTimes(1); // only the inspection lookup, no write
    expect(callsMatching('INSERT INTO')).toHaveLength(0);
  });

  it('is a no-op when nothing failed (fail_count <= 0)', async () => {
    mockRun.mockResolvedValueOnce({
      rows: [{ fail_count: 0, scrap_warehouse_id: SCRAP_WH }],
    } as never);

    await listener.handle(event());

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(callsMatching('INSERT INTO')).toHaveLength(0);
  });

  it('is a no-op (no fabrication) when no scrap warehouse is configured', async () => {
    mockRun.mockResolvedValueOnce({
      rows: [{ fail_count: FAIL_QTY, scrap_warehouse_id: null }],
    } as never);

    await listener.handle(event());

    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(callsMatching('INSERT INTO')).toHaveLength(0);
  });

  it('is a no-op when the order has no FG lines', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [{ fail_count: FAIL_QTY, scrap_warehouse_id: SCRAP_WH }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never); // no sales_order_items lines

    await listener.handle(event());

    expect(mockRun).toHaveBeenCalledTimes(2); // resolution + lines, no write
    expect(callsMatching('INSERT INTO')).toHaveLength(0);
  });

  it('is idempotent: an existing scrap movement makes a re-fire a no-op', async () => {
    mockRun
      .mockResolvedValueOnce({ rows: [{ fail_count: FAIL_QTY, scrap_warehouse_id: SCRAP_WH }] } as never)
      .mockResolvedValueOnce({ rows: [{ material_id: MATERIAL }] } as never)
      .mockResolvedValueOnce({ rows: [{ cnt: 1 }] } as never); // guard: already scrapped

    await listener.handle(event());

    expect(mockRun).toHaveBeenCalledTimes(3); // resolution + lines + guard, NO write
    expect(callsMatching('INSERT INTO')).toHaveLength(0);
  });

  it('swallows and logs errors thrown by runQuery (best-effort / non-fatal)', async () => {
    mockRun.mockRejectedValueOnce(new Error('db down'));

    await expect(listener.handle(event())).resolves.toBeUndefined();
  });
});
