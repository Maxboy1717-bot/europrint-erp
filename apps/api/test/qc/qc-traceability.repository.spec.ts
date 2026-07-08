/**
 * test/qc/qc-traceability.repository.spec.ts
 *
 * VISION-3340 #40 — QcNewRepository.getProductionOrderTrace() multi-hop
 * material→QC→delivery traceability.
 *
 * Strategy (mirrors auth/card-gate-precheck.service.spec.ts): mock ONLY
 * @shared/db.runQuery and render the real parameterised SQL through drizzle-orm's
 * PgDialect (the same conversion Drizzle performs before the pg driver). We assert:
 *   1. each hop query joins on the REAL live FK/reference columns
 *      (production_orders → sales_orders → qc_inspections → wms_transactions FG
 *      'IN' ledger → warehouse_stock → deliveries), with the QC-/MES- batch trace;
 *   2. the un-linkable raw-material hop is NOT joined (no mm_goods_receipts in any
 *      SQL) and is surfaced in missingHops as Guruh-B;
 *   3. a structured trace object is assembled from the mocked rows;
 *   4. a missing production order → NOT_FOUND (→ 404);
 *   5. when the order has no sales_order_id / product_id, the FG-stock / delivery
 *      hops are skipped (no fabricated join) rather than run.
 */

import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

const runQueryMock = jest.fn();
jest.mock('@shared/db', () => ({
  runQuery: (q: SQL) => runQueryMock(q),
}));

import { QcNewRepository } from '../../src/modules/qc/infrastructure/repositories/qc-new.repository';

const dialect = new PgDialect();
const render = (q: SQL): string => dialect.sqlToQuery(q).sql.replace(/\s+/g, ' ').trim();

/** Default full-chain mock: dispatch mocked rows by the table each SQL reads from. */
function wireFullChain(seen: string[]): void {
  runQueryMock.mockImplementation((q: SQL) => {
    const s = render(q);
    seen.push(s);
    if (/from production_orders po/i.test(s)) {
      return { rows: [{
        production_order_id: 48, production_order_number: 'PO-48', product_id: 7,
        product_name: 'Gofrokarton', production_status: 'in_progress',
        planned_quantity: 100, confirmed_quantity: 90, sales_order_id: 12,
        sales_order_number: 'SO-12', customer_id: 3, customer_name: 'ACME',
        sales_order_status: 'confirmed', delivery_status: 'pending', fg_warehouse_entry_at: null,
      }] };
    }
    if (/from qc_inspections qi/i.test(s)) {
      return { rows: [{
        id: 60, status: 'pending', result: null, pass_count: 0, fail_count: 0, total_count: 0,
        items_checked: 0, items_passed: 0, items_failed: 0, sort_grade: null, inspected_at: null,
        fg_batch_ref: 'QC-60',
      }] };
    }
    if (/from production_sessions ps/i.test(s)) {
      return { rows: [{
        id: 35, session_number: 'S-35', status: 'completed', actual_quantity: 90,
        produced_qty: 90, ended_at: null, fg_batch_ref: 'MES-35',
      }] };
    }
    if (/from warehouse_stock ws/i.test(s)) {
      return { rows: [{ warehouse_id: 1, material_id: 7, quantity: 90, available_quantity: 90, reserved_quantity: 0 }] };
    }
    if (/from wms_transactions wt/i.test(s)) {
      return { rows: [{
        transaction_id: 500, material_id: 7, warehouse_id: 1, quantity: 90, unit_cost: null,
        batch_number: null, reference_id: 12, notes: 'FG receipt QC-60', created_at: null,
      }] };
    }
    if (/from deliveries d/i.test(s)) {
      return { rows: [{
        id: 9, delivery_number: 'DL-9', delivery_status: 'delivered', status: 'delivered',
        dispatched_at: null, delivered_at: null, driver_name: 'Ali', vehicle_number: '01A123BC',
      }] };
    }
    return { rows: [] };
  });
}

describe('QcNewRepository.getProductionOrderTrace — VISION-3340 #40 traceability', () => {
  let repo: QcNewRepository;

  beforeEach(() => {
    runQueryMock.mockReset();
    repo = new QcNewRepository();
  });

  it('builds the expected multi-join chain query on the REAL live links', async () => {
    const seen: string[] = [];
    wireFullChain(seen);

    const r = await repo.getProductionOrderTrace(48);
    expect(r.ok).toBe(true);

    const all = seen.join('\n');

    // Spine: production_orders LEFT JOIN sales_orders on the real FK, filtered by PK.
    const anchor = seen.find((s) => /from production_orders po/i.test(s)) ?? '';
    expect(anchor).toMatch(/left join sales_orders so on so\.id = po\.sales_order_id/i);
    expect(anchor).toMatch(/where po\.id = \$1/i);

    // QC inspection hop: order_id = PO id AND reference_type='production_order' + QC- batch trace.
    const insp = seen.find((s) => /from qc_inspections qi/i.test(s)) ?? '';
    expect(insp).toMatch(/qi\.order_id = \$1/i);
    expect(insp).toMatch(/reference_type = 'production_order'/i);
    expect(insp).toMatch(/'QC-' \|\| qi\.id/i);

    // MES session hop: production_order_id = PO id + MES- batch trace.
    const sess = seen.find((s) => /from production_sessions ps/i.test(s)) ?? '';
    expect(sess).toMatch(/ps\.production_order_id = \$1/i);
    expect(sess).toMatch(/'MES-' \|\| ps\.id/i);

    // FG receipt ledger hop: wms_transactions 'IN' keyed by sales order + FG material.
    const fg = seen.find((s) => /from wms_transactions wt/i.test(s)) ?? '';
    expect(fg).toMatch(/wt\.type = 'IN'/i);
    expect(fg).toMatch(/wt\.reference_id = \$1/i);
    expect(fg).toMatch(/wt\.material_id = \$2/i);

    // Current FG on-hand hop: warehouse_stock by FG material.
    const stock = seen.find((s) => /from warehouse_stock ws/i.test(s)) ?? '';
    expect(stock).toMatch(/ws\.material_id = \$1/i);

    // Final hop: deliveries by sales order.
    const del = seen.find((s) => /from deliveries d/i.test(s)) ?? '';
    expect(del).toMatch(/d\.sales_order_id = \$1/i);

    // Guruh-B: the un-linkable raw-material hop is NEVER joined on an invented column.
    expect(all).not.toMatch(/mm_goods_receipts/i);
  });

  it('assembles a structured trace object with the QC-/MES- batch refs and Guruh-B gap', async () => {
    wireFullChain([]);

    const r = await repo.getProductionOrderTrace(48);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const t = r.data;

    expect(t.productionOrder).toMatchObject({ id: 48, productId: 7, salesOrderId: 12, status: 'in_progress' });
    expect(t.salesOrder).toMatchObject({ id: 12, orderNumber: 'SO-12', customerName: 'ACME' });

    expect(t.qcInspections).toHaveLength(1);
    expect(t.qcInspections[0]).toMatchObject({ id: 60, fgBatchRef: 'QC-60' });

    expect(t.productionSessions).toHaveLength(1);
    expect(t.productionSessions[0]).toMatchObject({ id: 35, fgBatchRef: 'MES-35' });

    expect(t.fgReceipts).toHaveLength(1);
    expect(t.fgReceipts[0]).toMatchObject({ transactionId: 500, referenceId: 12, notes: 'FG receipt QC-60' });

    expect(t.currentStock).toHaveLength(1);
    expect(t.currentStock[0]).toMatchObject({ warehouseId: 1, materialId: 7, quantity: 90 });

    expect(t.deliveries).toHaveLength(1);
    expect(t.deliveries[0]).toMatchObject({ id: 9, deliveryNumber: 'DL-9', status: 'delivered' });

    // Guruh-B missing hop is surfaced (not fabricated).
    expect(t.missingHops).toHaveLength(1);
    expect(t.missingHops[0].group).toBe('B');
    expect(t.missingHops[0].hop).toMatch(/mm_goods_receipts/i);
  });

  it('returns NOT_FOUND (→404) when the production order does not exist', async () => {
    runQueryMock.mockResolvedValue({ rows: [] });

    const r = await repo.getProductionOrderTrace(999);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect((r.error as { code?: string }).code).toBe('NOT_FOUND');
  });

  it('returns VALIDATION for a non-positive / non-numeric id', async () => {
    const bad = await repo.getProductionOrderTrace(0);
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect((bad.error as { code?: string }).code).toBe('VALIDATION');
    // The repo must not even touch the DB for an invalid id.
    expect(runQueryMock).not.toHaveBeenCalled();
  });

  it('skips the FG-stock / receipt / delivery hops when sales_order_id + product_id are absent (no fabricated join)', async () => {
    const seen: string[] = [];
    runQueryMock.mockImplementation((q: SQL) => {
      const s = render(q);
      seen.push(s);
      if (/from production_orders po/i.test(s)) {
        return { rows: [{
          production_order_id: 50, production_order_number: 'PO-50', product_id: null,
          product_name: null, production_status: 'pending', planned_quantity: 10,
          confirmed_quantity: null, sales_order_id: null, sales_order_number: null,
          customer_id: null, customer_name: null, sales_order_status: null,
          delivery_status: null, fg_warehouse_entry_at: null,
        }] };
      }
      return { rows: [] };
    });

    const r = await repo.getProductionOrderTrace(50);
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // salesOrder is null and the linkable-but-empty collections stay empty.
    expect(r.data.salesOrder).toBeNull();
    expect(r.data.fgReceipts).toEqual([]);
    expect(r.data.currentStock).toEqual([]);
    expect(r.data.deliveries).toEqual([]);

    // The FG-stock / receipt / delivery queries must NOT have been issued at all.
    const joined = seen.join('\n');
    expect(joined).not.toMatch(/from warehouse_stock ws/i);
    expect(joined).not.toMatch(/from wms_transactions wt/i);
    expect(joined).not.toMatch(/from deliveries d/i);
    // ...but the production-order-keyed hops (inspections, sessions) still run.
    expect(joined).toMatch(/from qc_inspections qi/i);
    expect(joined).toMatch(/from production_sessions ps/i);
  });
});
