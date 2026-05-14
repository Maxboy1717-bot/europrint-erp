/**
 * @module three-way-match.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';

@Injectable()
export class ThreeWayMatchRepository {
  async findByMovement(movementId: number): Promise<{ id: number } | null> {
    try {
      const rows = await typedExecute<{ id: number }>(sql`
        SELECT id FROM three_way_match_log WHERE movement_id = ${movementId} LIMIT 1
      `);
      return rows[0] ?? null;
    } catch (e) {
      throw new Error(`threeWayMatch.findByMovement: ${String(e)}`);
    }
  }

  async update(id: number, data: {
    purchaseOrderNo?: string | null;
    receiptNo?:       string | null;
    invoiceNo?:       string | null;
    poQuantity?:      number | null;
    receivedQuantity?: number | null;
    invoicedQuantity?: number | null;
    poAmount?:        number | null;
    invoiceAmount?:   number | null;
    status:           string;
    matchedBy?:       number | null;
  }): Promise<void> {
    await db.execute(sql`
      UPDATE three_way_match_log
         SET purchase_order_no = ${data.purchaseOrderNo ?? null},
             receipt_no        = ${data.receiptNo       ?? null},
             invoice_no        = ${data.invoiceNo       ?? null},
             po_quantity       = ${data.poQuantity      ?? null},
             received_quantity = ${data.receivedQuantity ?? null},
             invoiced_quantity = ${data.invoicedQuantity ?? null},
             po_amount         = ${data.poAmount        ?? null},
             invoice_amount    = ${data.invoiceAmount   ?? null},
             match_status      = ${data.status},
             matched_at        = NOW(),
             matched_by        = ${data.matchedBy ?? null}
       WHERE id = ${id}
    `);
  }

  async insert(data: {
    movementId:       number;
    purchaseOrderNo?: string | null;
    receiptNo?:       string | null;
    invoiceNo?:       string | null;
    poQuantity?:      number | null;
    receivedQuantity?: number | null;
    invoicedQuantity?: number | null;
    poAmount?:        number | null;
    invoiceAmount?:   number | null;
    status:           string;
    matchedBy?:       number | null;
  }): Promise<number> {
    const rows = await typedExecute<{ id: number }>(sql`
      INSERT INTO three_way_match_log
        (movement_id, purchase_order_no, receipt_no, invoice_no,
         po_quantity, received_quantity, invoiced_quantity,
         po_amount, invoice_amount, match_status,
         matched_at, matched_by, created_at)
      VALUES
        (${data.movementId},   ${data.purchaseOrderNo ?? null},
         ${data.receiptNo ?? null},    ${data.invoiceNo   ?? null},
         ${data.poQuantity ?? null},   ${data.receivedQuantity ?? null},
         ${data.invoicedQuantity ?? null},
         ${data.poAmount ?? null},     ${data.invoiceAmount ?? null},
         ${data.status}, NOW(), ${data.matchedBy ?? null}, NOW())
      RETURNING id
    `);
    return rows[0]?.id ?? 0;
  }

  async listVariances(): Promise<unknown[]> {
    return typedExecute<unknown>(sql`
      SELECT
        twm.id,
        twm.movement_id              AS "movementId",
        pm.movement_number           AS "movementNumber",
        twm.purchase_order_no        AS "purchaseOrderNo",
        twm.receipt_no               AS "receiptNo",
        twm.invoice_no               AS "invoiceNo",
        twm.po_quantity              AS "poQuantity",
        twm.received_quantity        AS "receivedQuantity",
        twm.invoiced_quantity        AS "invoicedQuantity",
        twm.qty_variance             AS "qtyVariance",
        twm.amount_variance          AS "amountVariance",
        twm.po_amount                AS "poAmount",
        twm.invoice_amount           AS "invoiceAmount",
        twm.match_status             AS "matchStatus",
        twm.matched_at               AS "matchedAt",
        twm.created_at               AS "createdAt"
      FROM three_way_match_log twm
      LEFT JOIN pos_movements pm ON pm.id = twm.movement_id
      WHERE twm.match_status IN ('VARIANCE', 'FAILED')
      ORDER BY twm.created_at DESC
      LIMIT 200
    `);
  }

  async findUnmatchedCompleted(): Promise<Array<{
    id: number; movement_number: string;
    purchase_order_id: string | null; invoice_id: string | null;
    total_amount: string | number; qty: string | number;
  }>> {
    return typedExecute<{
      id: number; movement_number: string;
      purchase_order_id: string | null; invoice_id: string | null;
      total_amount: string | number; qty: string | number;
    }>(sql`
      SELECT pm.id, pm.movement_number, pm.purchase_order_id, pm.invoice_id,
             pm.total_amount::numeric AS total_amount,
             (SELECT SUM(quantity)::numeric FROM pos_movement_lines WHERE movement_id = pm.id) AS qty
      FROM pos_movements pm
      WHERE pm.movement_type = 'EXTERNAL_IN'
        AND pm.status IN ('approved', 'completed')
        AND NOT EXISTS (SELECT 1 FROM three_way_match_log WHERE movement_id = pm.id)
        AND pm.deleted_at IS NULL
      LIMIT 100
    `);
  }
}
