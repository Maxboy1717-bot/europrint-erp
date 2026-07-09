/**
 * @module delivery-request-fulfillment.service
 * @description Batch 3 Item B, GATE 2 — POS "zayavka bajarildi" capture (SHADOW-only).
 *   Warehouse staff mark an APPROVED DELIVERY_REQUEST (cc_documents) zayavka as physically issued.
 *   This ONLY writes the delivery_request_fulfillment_shadow record — it does NOT touch
 *   warehouse_stock, does NOT touch warehouse_stock_fg, does NOT touch the #51 listener, and does
 *   NOT reuse the existing stock-decrementing endpoints (pos/operations/issue, pos/movements). Gate 4
 *   (later, on owner go-ahead) will turn this same capture into the real decrement + disable #51.
 *   STEP B (owner decision #4): the shadow is keyed by product_id (finished good) — the SAME id space
 *   as the real FG delivery (#51, delivery_items.material_id -> products) and warehouse_stock_fg — so
 *   the Gate 3 shadow-compare is finally apples-to-apples. Raw parametrized SQL; Result<T>.
 *
 *   GATE 3 (Variant A): the shadow now stores a structured sales_order_id (resolved from the request
 *   or the zayavka's sales_order_ref ai-answer), and compareShadowVsActual() compares, per sales order,
 *   the shadow would_decrement_qty against #51's ACTUAL warehouse_stock_fg decrement (read from the
 *   wms_transactions EXTERNAL_OUT ledger) and logs the diff. Still SHADOW-only: NO balance writes.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, Result, AppError } from '@common/result';

type Row = Record<string, unknown>;

export interface FulfillLine { productId: number; quantity: number; }
export interface ShadowRow {
  id: number; documentId: string; documentRef: string | null;
  warehouseId: number | null; productId: number | null; salesOrderId: number | null;
  wouldDecrementQty: number; gate: string; capturedAt: string;
}
/** Gate 3 shadow-compare: per finished-good product, would (shadow) vs actual (#51) + diff. */
export interface CompareRow { productId: number; wouldQty: number; actualQty: number; diff: number; matched: boolean; }
/** Gate 4 real fulfillment: per line — requested, decremented, and the outcome status. */
export interface FulfillLiveResult {
  productId: number; requested: number; decremented: number;
  status: 'decremented' | 'insufficient' | 'no_fg_stock' | 'already_fulfilled';
}

@Injectable()
export class DeliveryRequestFulfillmentService {
  private readonly logger = new Logger(DeliveryRequestFulfillmentService.name);

  /**
   * Record the shadow fulfillment for an approved DELIVERY_REQUEST zayavka. Gates on:
   *   - the cc_documents row exists,
   *   - its template code is DELIVERY_REQUEST,
   *   - its workflow_state is 'approved' (fully approved by MANAGER_OF_SENDER).
   * Writes ONE shadow row per line. Never touches warehouse_stock.
   */
  async fulfillShadow(
    documentId: string,
    warehouseId: number | null,
    salesOrderId: number | null,
    lines: FulfillLine[],
    capturedBy: number | null,
  ): Promise<Result<{ shadow: ShadowRow[] }, AppError>> {
    try {
      if (!Array.isArray(lines) || lines.length === 0) {
        return Err({ code: 'VALIDATION', message: 'Kamida bitta qator kerak' });
      }
      const v = await this._verifyAndResolve(documentId, salesOrderId);
      if (!v.ok) return Err(v.error);
      const { ref, resolvedSoId } = v.data;
      const out: ShadowRow[] = [];
      for (const line of lines) {
        const r = (await runQuery<Row>(sql`
          INSERT INTO delivery_request_fulfillment_shadow
            (document_id, document_ref, warehouse_id, product_id, sales_order_id, would_decrement_qty, captured_by, gate)
          VALUES (${documentId}::uuid, ${ref}, ${warehouseId ?? null}, ${line.productId}, ${resolvedSoId ?? null}, ${line.quantity}, ${capturedBy ?? null}, 'shadow')
          RETURNING id, document_id, document_ref, warehouse_id, product_id, sales_order_id, would_decrement_qty, gate, captured_at`)).rows[0];
        if (r) {
          out.push({
            id: Number(r.id), documentId: String(r.document_id), documentRef: (r.document_ref as string | null) ?? null,
            warehouseId: r.warehouse_id != null ? Number(r.warehouse_id) : null,
            productId: r.product_id != null ? Number(r.product_id) : null,
            salesOrderId: r.sales_order_id != null ? Number(r.sales_order_id) : null,
            wouldDecrementQty: Number(r.would_decrement_qty), gate: String(r.gate), capturedAt: String(r.captured_at),
          });
        }
      }
      return Ok({ shadow: out });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  /**
   * Verify an APPROVED DELIVERY_REQUEST zayavka + resolve its structured sales order link (the explicit
   * request value wins, else the zayavka's free-text sales_order_ref ai-answer against sales_orders by
   * order_number or numeric id; NULL if neither resolves — Q-40, not fabricated). Shared by fulfillShadow
   * (Gate 2/3) and fulfillReal (Gate 4).
   */
  private async _verifyAndResolve(
    documentId: string,
    salesOrderId: number | null,
  ): Promise<Result<{ ref: string | null; resolvedSoId: number | null }, AppError>> {
    const docRows = (await runQuery<Row>(sql`
      SELECT d.id, d.document_number, d.workflow_state, t.code AS template_code,
             d.ai_answers->>'sales_order_ref' AS sales_order_ref
      FROM cc_documents d
      LEFT JOIN cc_document_templates t ON t.id = d.template_id
      WHERE d.id = ${documentId}::uuid
      LIMIT 1`)).rows;
    const doc = docRows[0];
    if (!doc) return Err({ code: 'NOT_FOUND', message: 'Zayavka topilmadi' });
    if (String(doc.template_code) !== 'DELIVERY_REQUEST') {
      return Err({ code: 'BUSINESS_RULE_VIOLATION', message: 'Hujjat DELIVERY_REQUEST turida emas' });
    }
    if (String(doc.workflow_state) !== 'approved') {
      return Err({ code: 'BUSINESS_RULE_VIOLATION', message: `Zayavka tasdiqlanmagan (holat: ${String(doc.workflow_state)})` });
    }
    let resolvedSoId: number | null = salesOrderId ?? null;
    if (resolvedSoId == null) {
      const soRef = doc.sales_order_ref != null ? String(doc.sales_order_ref).trim() : '';
      if (soRef !== '') {
        const soRows = (await runQuery<Row>(sql`
          SELECT id FROM sales_orders WHERE order_number = ${soRef} OR id::text = ${soRef} LIMIT 1`)).rows;
        if (soRows[0]?.id != null) resolvedSoId = Number(soRows[0].id);
      }
    }
    return Ok({ ref: (doc.document_number as string | null) ?? null, resolvedSoId });
  }

  /**
   * GATE 4 (real cutover): the approved-zayavka fulfillment REALLY decrements warehouse_stock_fg — guarded
   * so it can NEVER go below zero (available_quantity >= qty) — writes the FG EXTERNAL_OUT audit ledger
   * (wms_transactions 'OUT', decision #7 style), and records a gate='live' capture. This is the NEW FG
   * stock-out path; the #51 delivery-goods-issued listener is DISABLED (kept, one-line reversible). Idempotent
   * per (document, product) via the gate='live' capture. Q-40: insufficient / missing FG stock is FLAGGED,
   * never fabricated (no negative balance, no invented row).
   */
  async fulfillReal(
    documentId: string,
    warehouseId: number | null,
    salesOrderId: number | null,
    lines: FulfillLine[],
    capturedBy: number | null,
  ): Promise<Result<{ results: FulfillLiveResult[] }, AppError>> {
    try {
      if (!Array.isArray(lines) || lines.length === 0) {
        return Err({ code: 'VALIDATION', message: 'Kamida bitta qator kerak' });
      }
      const v = await this._verifyAndResolve(documentId, salesOrderId);
      if (!v.ok) return Err(v.error);
      const { ref, resolvedSoId } = v.data;

      // Resolve the finished-goods warehouse the stock leaves from (explicit value, else the FG warehouse).
      let fgWarehouseId = warehouseId ?? 0;
      if (!fgWarehouseId) {
        const whRows = (await runQuery<Row>(sql`
          SELECT id FROM warehouses WHERE type = 'finished_goods' ORDER BY id LIMIT 1`)).rows;
        fgWarehouseId = whRows[0]?.id != null ? Number(whRows[0].id) : 0;
      }
      if (!fgWarehouseId) return Err({ code: 'BUSINESS_RULE_VIOLATION', message: 'Tayyor-mahsulot ombori topilmadi' });

      const results: FulfillLiveResult[] = [];
      for (const line of lines) {
        const productId = line.productId;
        const qty = line.quantity;

        // Idempotency: a gate='live' capture for this (document, product) already exists → no re-decrement.
        const dup = (await runQuery<Row>(sql`
          SELECT 1 FROM delivery_request_fulfillment_shadow
          WHERE document_id = ${documentId}::uuid AND product_id = ${productId} AND gate = 'live' LIMIT 1`)).rows;
        if (dup.length > 0) { results.push({ productId, requested: qty, decremented: 0, status: 'already_fulfilled' }); continue; }

        // Guarded REAL decrement — NEVER below zero. If insufficient/absent, the UPDATE touches 0 rows.
        const dec = (await runQuery<Row>(sql`
          UPDATE warehouse_stock_fg
          SET quantity = quantity - ${qty}, available_quantity = available_quantity - ${qty},
              last_movement_at = NOW(), last_updated_at = NOW()
          WHERE warehouse_id = ${fgWarehouseId} AND product_id = ${productId} AND available_quantity >= ${qty}
          RETURNING id`)).rows;
        if (dec.length === 0) {
          const exists = (await runQuery<Row>(sql`
            SELECT 1 FROM warehouse_stock_fg WHERE warehouse_id = ${fgWarehouseId} AND product_id = ${productId} LIMIT 1`)).rows;
          results.push({ productId, requested: qty, decremented: 0, status: exists.length ? 'insufficient' : 'no_fg_stock' });
          continue;
        }

        // FG EXTERNAL_OUT audit ledger (unified "what left the warehouse" report, decision #7) + gate='live' capture.
        const notes = `Zayavka-${ref ?? documentId} FG_OUT`;
        await runQuery(sql`
          INSERT INTO wms_transactions
            (warehouse_id, material_id, type, quantity, unit_cost, reference_id, created_by, notes, created_at)
          VALUES
            (${fgWarehouseId}, ${productId}, 'OUT', ${qty}, NULL, ${resolvedSoId ?? null}, ${capturedBy ?? null}, ${notes}, NOW())`);
        await runQuery(sql`
          INSERT INTO delivery_request_fulfillment_shadow
            (document_id, document_ref, warehouse_id, product_id, sales_order_id, would_decrement_qty, captured_by, gate)
          VALUES
            (${documentId}::uuid, ${ref}, ${fgWarehouseId}, ${productId}, ${resolvedSoId ?? null}, ${qty}, ${capturedBy ?? null}, 'live')`);
        results.push({ productId, requested: qty, decremented: qty, status: 'decremented' });
      }

      this.logger.log(
        { documentId, salesOrderId: resolvedSoId, results },
        'Gate 4 LIVE fulfillment — FG stock decremented via zayavka path (warehouse_stock_fg); #51 disabled',
      );
      return Ok({ results });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  /**
   * GATE 3 shadow-compare (SHADOW-only, read-only): for one sales order, compare — per finished-good
   * product — the shadow's would_decrement_qty (SUM over this order's shadow rows) against #51's ACTUAL
   * warehouse_stock_fg decrement, read from the wms_transactions EXTERNAL_OUT ledger of that order's
   * deliveries (type='OUT', notes 'Delivery-<id> EXTERNAL_OUT', reference_id = delivery id). A FULL OUTER
   * JOIN surfaces products present on only one side (would-without-actual = over, actual-without-would =
   * under). Logs the result; NEVER writes warehouse_stock or warehouse_stock_fg (Gate 4 does the cutover).
   */
  async compareShadowVsActual(
    salesOrderId: number,
  ): Promise<Result<{ salesOrderId: number; comparison: CompareRow[]; hasMismatch: boolean }, AppError>> {
    try {
      const rows = (await runQuery<Row>(sql`
        WITH would AS (
          SELECT product_id, COALESCE(SUM(would_decrement_qty), 0) AS would_qty
          FROM delivery_request_fulfillment_shadow
          WHERE sales_order_id = ${salesOrderId} AND gate = 'shadow' AND product_id IS NOT NULL
          GROUP BY product_id
        ),
        actual AS (
          SELECT wt.material_id AS product_id, COALESCE(SUM(wt.quantity), 0) AS actual_qty
          FROM wms_transactions wt
          JOIN deliveries d ON d.id = wt.reference_id
          WHERE d.sales_order_id = ${salesOrderId}
            AND wt.type = 'OUT' AND wt.notes LIKE 'Delivery-%EXTERNAL_OUT'
            AND wt.deleted_at IS NULL
          GROUP BY wt.material_id
        )
        SELECT COALESCE(w.product_id, a.product_id) AS product_id,
               COALESCE(w.would_qty, 0)  AS would_qty,
               COALESCE(a.actual_qty, 0) AS actual_qty
        FROM would w FULL OUTER JOIN actual a ON a.product_id = w.product_id
        ORDER BY 1`)).rows;

      const comparison: CompareRow[] = (Array.isArray(rows) ? rows : []).map((r) => {
        const wouldQty = Number(r.would_qty ?? 0);
        const actualQty = Number(r.actual_qty ?? 0);
        const diff = Math.round((wouldQty - actualQty) * 10000) / 10000;
        return { productId: Number(r.product_id), wouldQty, actualQty, diff, matched: diff === 0 };
      });
      const hasMismatch = comparison.some((c) => !c.matched);

      // Gate 3: log the comparison (shadow-only diagnostic; no balance writes).
      this.logger.log(
        { salesOrderId, hasMismatch, comparison },
        hasMismatch
          ? 'Gate 3 shadow-compare: MISMATCH — shadow would-decrement differs from #51 actual warehouse_stock_fg decrement'
          : 'Gate 3 shadow-compare: MATCH — shadow would-decrement equals #51 actual decrement (0 diff)',
      );
      return Ok({ salesOrderId, comparison, hasMismatch });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }
}
