/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   nested scalar subqueries in SELECT for multi-source KPI rollup (active
 *   warehouses, total stock qty, total stock value, low-stock alerts, today's
 *   movements in one round-trip), COUNT(*) FILTER (WHERE ...) aggregate-filter
 *   tallies for goods-receipt status breakdown, conditional ${param ?? null}::int
 *   IS NULL OR column = ${param} optional-filter pattern, and INSERT ...
 *   ON CONFLICT DO NOTHING for pos_sync_events idempotency.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module wms-warehouse-gateway.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;

@Injectable()
export class WmsWarehouseGatewayRepo {
  async getDashboardKpis(): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      SELECT
        (SELECT COUNT(*)::int FROM wms_warehouses WHERE is_active = true) AS active_warehouses,
        COALESCE((SELECT SUM(quantity) FROM warehouse_stock), 0)::numeric AS total_stock_qty,
        0::numeric(15,2) AS total_stock_value,
        (SELECT COUNT(*)::int FROM warehouse_stock WHERE quantity <= reorder_point AND reorder_point > 0) AS low_stock_alerts,
        (SELECT COUNT(*)::int FROM wms_transactions WHERE DATE(created_at) = CURRENT_DATE) AS today_movements
    `);
    return (rows.rows[0] ?? {}) as Row;
  }

  async getWarehouseOccupancy(): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT w.id, w.name, w.location,
             COALESCE(SUM(ws.quantity), 0)::numeric AS total_qty,
             0::numeric(15,2) AS total_value,
             COUNT(DISTINCT ws.material_id)::int AS material_count
      FROM wms_warehouses w LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
      WHERE w.is_active = true GROUP BY w.id, w.name, w.location ORDER BY w.name
    `);
    return rows.rows as Row[];
  }

  async getWarehouses(): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM wms_warehouses WHERE is_active = true ORDER BY name`);
    return rows.rows as Row[];
  }

  async getStock(warehouseId?: number, materialId?: number): Promise<{ stock: Row[]; total: number }> {
    const rows = await runQuery<Row>(sql`
      SELECT ws.*, mc.xom_ashyo AS material_name, mc.unit_of_measure, mc.kod AS sku, w.name AS warehouse_name
      FROM warehouse_stock ws
      JOIN material_cards mc ON mc.id = ws.material_id
      JOIN wms_warehouses w ON w.id = ws.warehouse_id
      WHERE (${warehouseId ?? null}::int IS NULL OR ws.warehouse_id = ${warehouseId ?? null})
        AND (${materialId ?? null}::int IS NULL OR ws.material_id = ${materialId ?? null})
      ORDER BY mc.xom_ashyo
    `);
    return { stock: rows.rows as Row[], total: rows.rows.length };
  }

  async getLots(materialId?: number, warehouseId?: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT b.*, mc.xom_ashyo AS material_name, w.name AS warehouse_name
      FROM wms_stock_batches b
      JOIN material_cards mc ON mc.id = b.material_id
      JOIN wms_warehouses w ON w.id = b.warehouse_id
      WHERE b.quantity_on_hand > 0
        AND (${materialId ?? null}::int IS NULL OR b.material_id = ${materialId ?? null})
        AND (${warehouseId ?? null}::int IS NULL OR b.warehouse_id = ${warehouseId ?? null})
      ORDER BY b.received_at ASC
    `);
    return rows.rows as Row[];
  }

  async getTransfers(status?: string): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT t.*, e.full_name AS requested_by_name, wf.name AS from_warehouse_name, wt.name AS to_warehouse_name
      FROM wms_transfers t
      LEFT JOIN employees e ON e.id = t.requested_by
      LEFT JOIN wms_warehouses wf ON wf.id = t.from_warehouse_id
      LEFT JOIN wms_warehouses wt ON wt.id = t.to_warehouse_id
      WHERE (${status ?? null}::text IS NULL OR t.status = ${status ?? null})
      ORDER BY t.created_at DESC LIMIT ${MAX_QUERY_LIMIT}
    `);
    return rows.rows as Row[];
  }

  async createTransfer(body: Row, userId: number | null): Promise<Row> {
    const fromWh = parseInt(String(body.fromWarehouseId ?? body.from_warehouse_id ?? 0), 10);
    const toWh = parseInt(String(body.toWarehouseId ?? body.to_warehouse_id ?? 0), 10);
    const transferNum = `TRF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const transferDate = new Date().toISOString().split('T')[0];
    const rows = await runQuery<Row>(sql`
      INSERT INTO stock_transfers (transfer_number, transfer_date, from_warehouse_id, to_warehouse_id,
        status, total_items, total_value, requested_by, notes, requested_at, created_at)
      VALUES (${transferNum}, ${transferDate}, ${fromWh}, ${toWh},
        'pending', ${body.items ? parseInt(String(body.items),10) : 1},
        ${body.totalValue ? Number(body.totalValue) : 0},
        ${userId}, ${body.notes ?? null}, NOW(), NOW())
      RETURNING id::text AS id, transfer_number AS "transferNumber", transfer_date AS "transferDate",
                from_warehouse_id AS "fromWarehouseId", to_warehouse_id AS "toWarehouseId",
                status, created_at AS "createdAt"
    `);
    return (rows.rows[0] ?? {}) as Row;
  }

  async getInternalRequests(status?: string): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT ir.*, e.full_name AS requested_by_name, w.name AS warehouse_name
      FROM wms_internal_requests ir
      LEFT JOIN employees e ON e.id = ir.requested_by
      LEFT JOIN wms_warehouses w ON w.id = ir.warehouse_id
      WHERE (${status ?? null}::text IS NULL OR ir.status = ${status ?? null})
      ORDER BY ir.created_at DESC LIMIT ${MAX_QUERY_LIMIT}
    `);
    return rows.rows as Row[];
  }

  async createInternalRequest(body: Row, userId: number | null): Promise<Row> {
    const whId = parseInt(String(body.warehouseId ?? body.warehouse_id ?? 0), 10);
    const matId = parseInt(String(body.materialId ?? body.material_id ?? 0), 10);
    const rows = await runQuery<Row>(sql`
      INSERT INTO wms_internal_requests (warehouse_id, material_id, quantity, requested_by, notes, status)
      VALUES (${whId}, ${matId}, ${body.quantity ?? 0}, ${userId}, ${body.notes ?? null}, 'pending')
      RETURNING *
    `);
    return (rows.rows[0] ?? {}) as Row;
  }

  async getGoodsReceipts(status?: string): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT gr.*, po.reference_number AS po_number, e.full_name AS received_by_name
      FROM mm_goods_receipts gr
      LEFT JOIN mm_purchase_orders po ON po.id = gr.purchase_order_id
      LEFT JOIN employees e ON e.id = gr.received_by
      WHERE (${status ?? null}::text IS NULL OR gr.status = ${status ?? null})
      ORDER BY gr.created_at DESC LIMIT ${MAX_QUERY_LIMIT}
    `);
    return rows.rows as Row[];
  }

  async createGoodsReceipt(body: Row, userId: number | null): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO mm_goods_receipts (purchase_order_id, received_by, status, notes, received_at)
      VALUES (${body.purchaseOrderId ?? body.purchase_order_id ?? null}, ${userId}, 'draft', ${body.notes ?? null}, NOW())
      RETURNING *
    `);
    return (rows.rows[0] ?? {}) as Row;
  }

  async getGoodsReceiptStats(): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      SELECT
        COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE)::int AS today_count
      FROM mm_goods_receipts
    `);
    return (rows.rows[0] ?? {}) as Row;
  }

  async getGoodsReceiptLines(receiptId: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT grl.*, mc.xom_ashyo AS material_name, mc.unit_of_measure
      FROM mm_goods_receipt_lines grl JOIN material_cards mc ON mc.id = grl.material_id
      WHERE grl.goods_receipt_id = ${receiptId} ORDER BY grl.id
    `);
    return rows.rows as Row[];
  }

  async addGoodsReceiptLine(receiptId: number, body: Row): Promise<Row> {
    const materialId = body.materialId ?? body.material_id ?? null;
    const quantity   = body.quantity ?? 0;
    const unitCost   = body.unitCost ?? body.unit_cost ?? 0;
    // receipt_id is NOT NULL; goods_receipt_id is what getGoodsReceiptLines() filters on -> set both.
    // received_quantity is NOT NULL -> fall back to quantity.
    const rows = await runQuery<Row>(sql`
      INSERT INTO mm_goods_receipt_lines (receipt_id, goods_receipt_id, material_id, received_quantity, quantity, unit_cost, created_at)
      VALUES (${receiptId}, ${receiptId}, ${materialId}, ${quantity}, ${quantity}, ${unitCost}, NOW())
      RETURNING *
    `);
    return (rows.rows[0] ?? {}) as Row;
  }

  async qcLine(lineId: number, passed: boolean, notes: string | null, userId: number | null): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      UPDATE mm_goods_receipt_lines SET qc_status = ${passed ? 'passed' : 'failed'}, qc_notes = ${notes}, qc_by = ${userId}, qc_at = NOW()
      WHERE id = ${lineId} RETURNING *
    `);
    return (rows.rows[0] ?? {}) as Row;
  }

  // NOTE: legacy completeGoodsReceipt() (status='completed', no QC check) REMOVED
  // 2026-06-19. It bypassed the karantin gate (DRAFT→KARANTIN→QC_PASS→MAIN) and
  // let stock be posted while in quarantine. Completion now flows ONLY through
  // WmsQuarantineGateService.releaseToMain (QC_PASS → MAIN, enforced). Q-46: dead
  // bypass writer removed rather than left as a second un-gated path.

  async getLowStock(): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT ws.*, mc.xom_ashyo AS material_name, mc.unit_of_measure, w.name AS warehouse_name,
             (ws.reorder_point - ws.quantity) AS shortage
      FROM warehouse_stock ws
      JOIN material_cards mc ON mc.id = ws.material_id
      JOIN wms_warehouses w ON w.id = ws.warehouse_id
      WHERE ws.quantity <= ws.reorder_point AND ws.reorder_point > 0
      ORDER BY (ws.reorder_point - ws.quantity) DESC
    `);
    return rows.rows as Row[];
  }

  async barcodeScan(barcode: string): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      SELECT b.*, mc.xom_ashyo AS material_name, mc.unit_of_measure, w.name AS warehouse_name
      FROM wms_stock_batches b JOIN material_cards mc ON mc.id = b.material_id JOIN wms_warehouses w ON w.id = b.warehouse_id
      WHERE b.batch_number = ${barcode} OR mc.barcode = ${barcode} OR mc.kod = ${barcode} LIMIT 1
    `);
    return (rows.rows[0] ?? { found: false, barcode }) as Row;
  }

  /**
   * true agar `warehouseId` yoki `code` bo'yicha faol ombor topilsa.
   * Q20 fix: sync-pos endpoint haqiqiy omborni tekshirishi kerak — noto'g'ri
   * ID/kod jim yutilib "ok:true" qaytarilmasligi uchun.
   */
  async warehouseExists(numericId: number | null, code: string | number): Promise<boolean> {
    const rows = await runQuery<{ id: number }>(sql`
      SELECT id FROM wms_warehouses
      WHERE is_active = true
        AND (
          (${numericId}::int IS NOT NULL AND id = ${numericId})
          OR code = ${String(code)}
        )
      LIMIT 1
    `);
    return rows.rows.length > 0;
  }

  /**
   * `pos_sync_events`ga audit yozuvi qo'shadi. Xato bo'lsa YUTILMAYDI — chaqiruvchi
   * (controller) haqiqiy xatoni ko'rishi va foydalanuvchiga to'g'ri javob qaytarishi
   * uchun exception yuqoriga uzatiladi (Q20 — soxta ok:true taqiqlangan).
   */
  async logPosSyncEvent(warehouseId: number | null, userId: number | null): Promise<void> {
    await runQuery(sql`
      INSERT INTO pos_sync_events (warehouse_id, event_type, triggered_by, created_at)
      VALUES (${warehouseId}, 'WAREHOUSE_SYNC', ${userId}, NOW())
      ON CONFLICT DO NOTHING
    `);
  }
}
