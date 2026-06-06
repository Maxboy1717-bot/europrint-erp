/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - NOT EXISTS (SELECT 1 FROM three_way_match_log WHERE movement_id = pm.id)
 *     anti-join for findUnmatchedCompleted() — Drizzle's notInArray() requires
 *     materialising the full subquery result, defeating the planner's
 *     hash-anti-join optimisation for large match-log tables.
 *   - Correlated scalar subquery `(SELECT SUM(quantity)::numeric FROM
 *     pos_movement_lines WHERE movement_id = pm.id) AS qty` projected as a
 *     column alongside the parent row — Drizzle requires aggregates to be
 *     joined via groupBy() which would change the parent query shape.
 *   - Snake_case → camelCase column aliasing on a 14-column projection
 *     (movementId, movementNumber, purchaseOrderNo, qtyVariance, amountVariance,
 *     matchStatus, etc.) consumed directly by the typedExecute<T> contract.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module three-way-match.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Result } from '@common/result';

@Injectable()
export class ThreeWayMatchRepository {
  async findByMovement(movementId: number): Promise<Result<{ id: number } | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<{ id: number }>(sql`
        SELECT id FROM three_way_match_log WHERE movement_id = ${movementId} LIMIT 1
      `);
      return rows[0] ?? null;
    }, 'DB_ERROR');
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
  }): Promise<Result<void>> {
    return safeCall(async () => {
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
    }, 'DB_ERROR');
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
  }): Promise<Result<number>> {
    return safeCall(async () => {
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
    }, 'DB_ERROR');
  }

  async listVariances(): Promise<Result<unknown[]>> {
    return safeCall(async () => typedExecute<unknown>(sql`
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
    `), 'DB_ERROR');
  }

  async findUnmatchedCompleted(): Promise<Result<Array<{
    id: number; movement_number: string;
    purchase_order_id: string | null; invoice_id: string | null;
    total_amount: string | number; qty: string | number;
  }>>> {
    return safeCall(async () => typedExecute<{
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
    `), 'DB_ERROR');
  }
}
