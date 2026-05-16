/**
 * test/pp/get-mrp-report.handler.spec.ts
 *
 * Unit tests for GetMrpReportHandler. The `db` chainable from @shared/db is
 * mocked to return queued result sets in call order: production_orders →
 * boms → stock_items.
 */

interface FakeRow { [k: string]: unknown }

let queued: FakeRow[][] = [];

function nextRows(): FakeRow[] {
  return queued.shift() ?? [];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function makeChain(): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  const fn = jest.fn().mockImplementation(() => chain);
  chain.select = fn;
  chain.from = fn;
  chain.where = fn;
  chain.limit = jest.fn().mockImplementation(() => Promise.resolve(nextRows()));
  return chain;
}

jest.mock('@shared/db', () => ({
  db: makeChain(),
  production_orders: { id: 'id', status: 'status', bom_id: 'bom_id', sales_order_id: 'sales_order_id', scheduled_start: 'scheduled_start', scheduled_end: 'scheduled_end', created_at: 'created_at' },
  boms: { id: 'id' },
  stock_items: { sku: 'sku' },
}));

import { GetMrpReportHandler } from '../../src/modules/pp/application/queries/get-mrp-report.handler';
import { GetMrpReportQuery } from '../../src/modules/pp/application/queries/get-mrp-report.query';
import { db } from '@shared/db';

// Override the awaited path for `db.select().from(...).where(...)` (no .limit() at the end)
// because production_orders enumeration awaits the .where() chain directly.
const dbAny = db as unknown as { where: jest.Mock };
beforeEach(() => {
  queued = [];
  // Make `.where()` thenable — Drizzle queries can be awaited mid-chain.
  dbAny.where = jest.fn().mockImplementation(() => {
    const rows = nextRows();
    const p: Promise<FakeRow[]> & { where?: () => unknown; limit?: () => Promise<FakeRow[]> } = Promise.resolve(rows);
    p.where = () => p;
    p.limit = () => Promise.resolve(rows);
    return p;
  });
});

describe('GetMrpReportHandler', () => {
  it('returns empty shortage when no production orders are active', async () => {
    queued.push([]); // production_orders.where
    const handler = new GetMrpReportHandler();

    const r = await handler.execute(new GetMrpReportQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('returns shortage when bom items demand exceeds stock_items.quantity', async () => {
    queued.push([{ id: 1, order_number: 'PO-1', bom_id: 'b1', quantity: 10, unit: 'kg' }]); // POs
    queued.push([{ id: 'b1', product_name: 'X', items: [{ sku: 'SKU1', quantity: 2, name: 'Mat A' }] }]); // bom
    queued.push([{ sku: 'SKU1', quantity: 5, name: 'Mat A' }]); // stock = 5, needed = 2*10 = 20
    const handler = new GetMrpReportHandler();

    const r = await handler.execute(new GetMrpReportQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toHaveLength(1);
      const row = r.data[0] as Record<string, unknown>;
      expect(row.shortage).toBe(15);
      expect(row.required).toBe(20);
      expect(row.available).toBe(5);
    }
  });

  it('returns empty shortage when stock fully covers bom item demand', async () => {
    queued.push([{ id: 2, order_number: 'PO-2', bom_id: 'b1', quantity: 1, unit: 'kg' }]);
    queued.push([{ id: 'b1', items: [{ sku: 'SKU1', quantity: 1 }] }]);
    queued.push([{ sku: 'SKU1', quantity: 10, name: 'Mat A' }]); // 10 >= 1*1
    const handler = new GetMrpReportHandler();

    const r = await handler.execute(new GetMrpReportQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('skips orders without a bom reference (bom_id missing or not found)', async () => {
    queued.push([{ id: 3, order_number: 'PO-3', bom_id: null, quantity: 5 }]);
    const handler = new GetMrpReportHandler();

    const r = await handler.execute(new GetMrpReportQuery({}));

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual([]);
  });

  it('filters to a single production order when productionOrderId provided', async () => {
    queued.push([{ id: 7, order_number: 'PO-7', bom_id: 'b1', quantity: 4 }]); // single PO via .limit(1)
    queued.push([{ id: 'b1', items: [{ sku: 'SKU2', quantity: 3 }] }]);
    queued.push([{ sku: 'SKU2', quantity: 0, name: 'Mat B' }]); // 0 < 12 → shortage 12
    const handler = new GetMrpReportHandler();

    const r = await handler.execute(new GetMrpReportQuery({ productionOrderId: '7' }));

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toHaveLength(1);
      const row = r.data[0] as Record<string, unknown>;
      expect(row.shortage).toBe(12);
    }
  });
});
