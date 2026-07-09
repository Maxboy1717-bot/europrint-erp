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
      // Verify the zayavka: exists, is a DELIVERY_REQUEST, and is fully approved. Also read the
      // free-text sales_order_ref ai-answer as a fallback source for the structured sales order link.
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
      if (!Array.isArray(lines) || lines.length === 0) {
        return Err({ code: 'VALIDATION', message: 'Kamida bitta qator kerak' });
      }

      // GATE 3 (Variant A): resolve the structured sales order link. The explicit request value wins;
      // otherwise best-effort resolve the zayavka's free-text sales_order_ref ai-answer against a real
      // sales_orders row (by order_number or numeric id). If neither resolves, sales_order_id stays NULL
      // (Q-40: not fabricated) and the compare simply skips this shadow.
      let resolvedSoId: number | null = salesOrderId ?? null;
      if (resolvedSoId == null) {
        const refRaw = doc.sales_order_ref;
        const soRef = refRaw != null ? String(refRaw).trim() : '';
        if (soRef !== '') {
          const soRows = (await runQuery<Row>(sql`
            SELECT id FROM sales_orders WHERE order_number = ${soRef} OR id::text = ${soRef} LIMIT 1`)).rows;
          if (soRows[0]?.id != null) resolvedSoId = Number(soRows[0].id);
        }
      }

      const ref = (doc.document_number as string | null) ?? null;
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
