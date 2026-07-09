/**
 * @module delivery-request-fulfillment.service
 * @description Batch 3 Item B, GATE 2 — POS "zayavka bajarildi" capture (SHADOW-only).
 *   Warehouse staff mark an APPROVED DELIVERY_REQUEST (cc_documents) zayavka as physically issued.
 *   This ONLY writes the delivery_request_fulfillment_shadow record — it does NOT touch
 *   warehouse_stock, does NOT touch the #51 listener, and does NOT reuse the existing
 *   stock-decrementing endpoints (pos/operations/issue, pos/movements). Gate 4 (later, on owner
 *   go-ahead) will turn this same capture into the real decrement + disable #51. Raw parametrized
 *   SQL (like the sibling POS repos); Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Ok, Err, Result, AppError } from '@common/result';

type Row = Record<string, unknown>;

export interface FulfillLine { materialCardId: number; quantity: number; }
export interface ShadowRow {
  id: number; documentId: string; documentRef: string | null;
  warehouseId: number | null; materialCardId: number | null;
  wouldDecrementQty: number; gate: string; capturedAt: string;
}

@Injectable()
export class DeliveryRequestFulfillmentService {
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
    lines: FulfillLine[],
    capturedBy: number | null,
  ): Promise<Result<{ shadow: ShadowRow[] }, AppError>> {
    try {
      // Verify the zayavka: exists, is a DELIVERY_REQUEST, and is fully approved.
      const docRows = (await runQuery<Row>(sql`
        SELECT d.id, d.document_number, d.workflow_state, t.code AS template_code
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

      const ref = (doc.document_number as string | null) ?? null;
      const out: ShadowRow[] = [];
      for (const line of lines) {
        const r = (await runQuery<Row>(sql`
          INSERT INTO delivery_request_fulfillment_shadow
            (document_id, document_ref, warehouse_id, material_card_id, would_decrement_qty, captured_by, gate)
          VALUES (${documentId}::uuid, ${ref}, ${warehouseId ?? null}, ${line.materialCardId}, ${line.quantity}, ${capturedBy ?? null}, 'shadow')
          RETURNING id, document_id, document_ref, warehouse_id, material_card_id, would_decrement_qty, gate, captured_at`)).rows[0];
        if (r) {
          out.push({
            id: Number(r.id), documentId: String(r.document_id), documentRef: (r.document_ref as string | null) ?? null,
            warehouseId: r.warehouse_id != null ? Number(r.warehouse_id) : null,
            materialCardId: r.material_card_id != null ? Number(r.material_card_id) : null,
            wouldDecrementQty: Number(r.would_decrement_qty), gate: String(r.gate), capturedAt: String(r.captured_at),
          });
        }
      }
      return Ok({ shadow: out });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }
}
