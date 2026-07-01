/**
 * @module quarantine-workflow.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import type { MovementStatus } from '../../application/services/quarantine-workflow.service';

@Injectable()
export class QuarantineWorkflowRepository {
  async findQcHoldWarehouse(): Promise<{ id: number } | null> {
    const rows = await typedExecute<{ id: number }>(sql`
      SELECT id FROM warehouses WHERE code = 'QC-HOLD' AND is_active = true LIMIT 1
    `);
    return rows[0] ?? null;
  }

  async findWarehousesByCode(codes: string[]): Promise<Array<{ id: number; code: string }>> {
    const codeList = sql.join(codes.map(c => sql`${c}`), sql`, `);
    return typedExecute<{ id: number; code: string }>(sql`
      SELECT id, code FROM warehouses
       WHERE code IN (${codeList}) AND is_active = true
    `);
  }

  /** KARANTIN→QC bosqichini OMBOR_MENEJER/AI_GL hodisalariga ulash uchun minimal movement ma'lumoti. */
  async findMovementBasic(movementId: number): Promise<{
    id: number; movement_number: string; movement_type: string; status: string; created_by: number | null;
  } | null> {
    const rows = await typedExecute<{
      id: number; movement_number: string; movement_type: string; status: string; created_by: number | null;
    }>(sql`
      SELECT id, movement_number, movement_type, status, created_by
      FROM pos_movements
      WHERE id = ${movementId}
    `);
    return rows[0] ?? null;
  }

  async updateMovementStatus(
    movementId: number,
    status: MovementStatus,
    extra?: {
      toWarehouseId?: number;
      quarantineRequired?: boolean;
      qcStatus?: string;
      qcCompletedAt?: boolean;
      qcCompletedBy?: number;
    },
  ): Promise<void> {
    const toWh   = extra?.toWarehouseId    != null ? sql`, to_warehouse_id    = ${extra.toWarehouseId}`   : sql``;
    const qcReq  = extra?.quarantineRequired != null ? sql`, quarantine_required = ${extra.quarantineRequired}` : sql``;
    const qcSt   = extra?.qcStatus          != null ? sql`, qc_status           = ${extra.qcStatus}`          : sql``;
    const qcAt   = extra?.qcCompletedAt               ? sql`, qc_completed_at    = NOW()`                       : sql``;
    const qcBy   = extra?.qcCompletedBy     != null ? sql`, qc_completed_by    = ${extra.qcCompletedBy}`   : sql``;
    await db.execute(sql`
      UPDATE pos_movements
         SET status = ${status}, updated_at = NOW()
             ${toWh} ${qcReq} ${qcSt} ${qcAt} ${qcBy}
       WHERE id = ${movementId}
    `);
  }

  async findMovementLines(movementId: number): Promise<Array<{
    material_card_id: number; quantity: string | number; unit: string;
  }>> {
    return typedExecute<{ material_card_id: number; quantity: string | number; unit: string }>(sql`
      SELECT pml.material_id AS material_card_id, pml.quantity::numeric AS quantity, pml.unit
      FROM pos_movement_lines pml
      WHERE pml.movement_id = ${movementId}
    `);
  }

  async upsertWarehouseStock(warehouseId: number, materialCardId: number, qty: number, unit: string | null): Promise<void> {
    await db.execute(sql`
      INSERT INTO warehouse_stock
        (warehouse_id, material_id, quantity, reserved_quantity, available_quantity, unit_of_measure, last_updated_at, created_at)
      VALUES (${warehouseId}, ${materialCardId}, ${qty}, 0, ${qty}, ${unit}, NOW(), NOW())
      ON CONFLICT (warehouse_id, material_id)
      DO UPDATE SET
        quantity           = warehouse_stock.quantity           + ${qty},
        available_quantity = warehouse_stock.available_quantity + ${qty},
        last_updated_at    = NOW()
    `);
  }

  async reduceWarehouseStock(warehouseId: number, materialCardId: number, qty: number): Promise<void> {
    await db.execute(sql`
      UPDATE warehouse_stock
         SET quantity           = GREATEST(quantity           - ${qty}, 0),
             available_quantity = GREATEST(available_quantity - ${qty}, 0),
             last_updated_at    = NOW()
       WHERE warehouse_id     = ${warehouseId}
         AND material_id = ${materialCardId}
    `);
  }

  async updateInventoryPassport(movementId: number, decision: string, qcNote: string | null): Promise<void> {
    try {
      await db.execute(sql`
        UPDATE pos_inventory_passport
           SET qc_result      = ${decision},
               qc_note        = ${qcNote},
               qc_started_at  = COALESCE(qc_started_at, NOW())
         WHERE movement_id = ${movementId}
      `);
    } catch { /* passport table may not exist — intentionally swallowed */ }
  }

  async escalateExpiredQuarantine(): Promise<Array<{ id: number; movement_number: string }>> {
    return typedExecute<{ id: number; movement_number: string }>(sql`
      UPDATE pos_movements
         SET status = 'qc_review', updated_at = NOW()
       WHERE status = 'karantin'
         AND created_at < NOW() - INTERVAL '48 hours'
      RETURNING id, movement_number
    `);
  }

  async listQuarantine(): Promise<unknown[]> {
    return typedExecute<unknown>(sql`
      SELECT
        pm.id, pm.movement_number AS "movementNumber",
        pm.movement_type AS "movementType", pm.status,
        pm.created_at    AS "createdAt",
        EXTRACT(EPOCH FROM (NOW() - pm.created_at)) / 3600 AS "hoursInQuarantine",
        pip.supplier_name AS "supplierName",
        pip.contract_number AS "contractNumber",
        pip.quantity::numeric AS quantity,
        pip.qc_result AS "qcResult"
      FROM pos_movements pm
      LEFT JOIN pos_inventory_passport pip ON pip.movement_id = pm.id
      WHERE pm.status IN ('karantin', 'qc_review')
        AND pm.deleted_at IS NULL
      ORDER BY pm.created_at ASC
    `);
  }
}
