/**
 * @module barcode-warehouse.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 * Read-only query methods live in BarcodeWarehouseQueriesService and are exposed via inheritance.
 */

import { Injectable } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall } from '@common/result';
import { getConfigNumber } from '@common/config/business-config.helper';
import { BarcodeWarehouseQueriesService } from './barcode-warehouse-queries.service';

// C8.7 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): receive()/productionReceive() generated
// movement_number via second-resolution TO_CHAR(NOW(),'YYYYMMDD-HH24MISS') — two concurrent
// requests landing in the same second produced the identical string. pos_movements.movement_number
// already has a live UNIQUE constraint (pos_movements_movement_number_key, verified live), so the
// pre-fix symptom was a crash on collision (23505 propagating as an opaque error), not a silent
// duplicate. Fix mirrors C8.1/C8.2's approach: movement_number is generated in JS with a random
// suffix (prefix-YYYYMMDD-HHMMSS-RND6) and the INSERT retries with a freshly generated number on a
// 23505, bounded at 5 attempts. Any other failure kind is rethrown immediately, no retry.
const MAX_MOVEMENT_NUMBER_RETRIES = 5;
const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class BarcodeWarehouseCompatService extends BarcodeWarehouseQueriesService {
  // Note: `logger` is inherited from BarcodeWarehouseQueriesService (protected readonly) — do NOT
  // redeclare it here. A `private readonly logger` in this subclass previously caused
  // TS2415 (incompatible override of the base class's `protected` member).

  /** C8.7: prefix-YYYYMMDD-HHMMSS-RND6 — a fresh call yields a different string. */
  private generateMovementNumber(prefix: string): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const rnd = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${datePart}-${timePart}-${rnd}`;
  }

  /**
   * C8.7: runs `insertFn` (an INSERT ... RETURNING keyed by the given movement_number) with a
   * bounded retry on a Postgres 23505 unique-violation (pos_movements_movement_number_key) — each
   * retry generates a fresh movement_number so a genuine collision resolves instead of crashing.
   * Any other failure kind is rethrown immediately (the outer safeCall() converts it to a Result).
   */
  private async insertMovementWithRetry<T>(
    prefix: string,
    insertFn: (movementNumber: string) => Promise<T>,
  ): Promise<T> {
    let movementNumber = this.generateMovementNumber(prefix);
    for (let attempt = 1; attempt <= MAX_MOVEMENT_NUMBER_RETRIES; attempt++) {
      try {
        return await insertFn(movementNumber);
      } catch (e) {
        const pgCode = (e as { code?: string } | null)?.code;
        if (pgCode !== POSTGRES_UNIQUE_VIOLATION || attempt === MAX_MOVEMENT_NUMBER_RETRIES) throw e;
        this.logger.warn(`[BarcodeWarehouse] Harakat raqami to'qnashuvi (${movementNumber}), qayta urinish ${attempt}/${MAX_MOVEMENT_NUMBER_RETRIES}`);
        movementNumber = this.generateMovementNumber(prefix);
      }
    }
    throw new Error("Harakat raqami ajratib bo'lmadi");
  }

  async qcDecision(id: string, passed: boolean) {
    return safeCall(async () => {
      const newStatus = passed ? 'APPROVED' : 'REJECTED';
      await rawSql(sql`
        UPDATE pos_movements SET status = ${newStatus}, updated_at = NOW() WHERE id = ${id}
      `);
      return { status: newStatus, message: passed ? 'QC tasdiqlandi' : 'QC rad etildi' };
    });
  }

  async submitCycleCount(body: Record<string, unknown>) {
    const counted  = Number(body['countedQuantity'] ?? 0);
    const system   = Number(body['systemQuantity'] ?? 0);
    const variance = system > 0 ? Math.abs(counted - system) / system * 100 : 0;
    // M4 (2026-07-05): thresholds now read settings.'cycle_count_auto_adjust_pct'/
    // 'cycle_count_supervisor_pct' first, falling back to 2%/5% when unset.
    const autoAdjustPct = await getConfigNumber('cycle_count_auto_adjust_pct', 2);
    const supervisorPct = await getConfigNumber('cycle_count_supervisor_pct', 5);
    let adjustmentAction: string;
    if (variance <= autoAdjustPct)      adjustmentAction = 'AUTO_ADJUST';
    else if (variance <= supervisorPct) adjustmentAction = 'SUPERVISOR_APPROVAL';
    else                                adjustmentAction = 'RECOUNT';
    return {
      adjustmentAction,
      variance: +variance.toFixed(2),
      message:
        adjustmentAction === 'AUTO_ADJUST'
          ? 'Farq 2% dan kam. Tizim avtomatik tuzatdi.'
          : adjustmentAction === 'RECOUNT'
          ? 'Farq 5% dan katta. Qayta sanash kerak!'
          : "Farq 2-5%. Supervisor tasdig'i kutilmoqda.",
    };
  }

  async receive(body: Record<string, unknown>) {
    return safeCall(async () => {
      const movementTypeCode = String(body['movementType'] ?? 'RECEIPT');
      const lotNumber = String(body['lotNumber'] ?? '');
      // C8.7 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): movement_number now generated in JS
      // (random suffix) with a bounded retry-on-23505 — see insertMovementWithRetry() above.
      const result = await this.insertMovementWithRetry('RCV', (movementNumber) => rawSql(sql`
        INSERT INTO pos_movements (movement_number, movement_type_id, status, lot_number, created_at, updated_at)
        SELECT ${movementNumber}, id, 'pending', ${lotNumber}, NOW(), NOW()
        FROM pos_movement_types WHERE code = ${movementTypeCode} LIMIT 1
        RETURNING id, movement_number, status
      `));
      return dbRows(result)[0] ?? { success: true };
    });
  }

  async productionReceive(body: Record<string, unknown>) {
    return safeCall(async () => {
      const lotNumber = String(body['lotNumber'] ?? '');
      const notes = String(body['notes'] ?? '');
      // C8.7 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): movement_number now generated in JS
      // (random suffix) with a bounded retry-on-23505 — see insertMovementWithRetry() above.
      const result = await this.insertMovementWithRetry('PROD-RCV', (movementNumber) => rawSql(sql`
        INSERT INTO pos_movements (movement_number, movement_type_id, status, lot_number, notes, created_at, updated_at)
        SELECT ${movementNumber}, id, 'pending', ${lotNumber}, ${notes}, NOW(), NOW()
        FROM pos_movement_types WHERE code = 'PRODUCTION_RECEIPT' LIMIT 1
        RETURNING id, movement_number, status
      `));
      return dbRows(result)[0] ?? { success: true };
    });
  }

  async productionComplete(body: Record<string, unknown>) {
    return safeCall(async () => {
      const movementId = String(body['movementId'] ?? '');
      if (movementId) {
        await rawSql(sql`
          UPDATE pos_movements SET status = 'completed', updated_at = NOW()
          WHERE id = ${movementId}
        `);
      }
      return { success: true, message: "Ishlab chiqarish zavershena", movementId };
    });
  }

  async pickTask(taskId: string, body: Record<string, unknown>) {
    return safeCall(async () => {
      void body;
      await rawSql(sql`
        UPDATE pos_movements SET status = 'in_progress', updated_at = NOW()
        WHERE id = ${taskId}
      `);
      return { success: true, taskId, status: 'in_progress' };
    });
  }

  async resolveOperatorBalance(id: string, body: Record<string, unknown>) {
    return safeCall(async () => {
      const resolution = String(body['resolution'] ?? 'RESOLVED');
      await rawSql(sql`
        UPDATE employee_liability_cases SET status = ${resolution}, updated_at = NOW()
        WHERE id = ${parseInt(id, 10)}
      `);
      return { success: true, id, status: resolution };
    });
  }

  async deleteBarcode(id: string) {
    return safeCall(async () => {
      await rawSql(sql`
        UPDATE pos_movements SET status = 'cancelled', updated_at = NOW() WHERE id = ${id}
      `);
      return { success: true, id };
    });
  }

  async updateBarcode(id: string, body: Record<string, unknown>) {
    return safeCall(async () => {
      const status = body['status'] ? String(body['status']) : null;
      const notes = body['notes'] ? String(body['notes']) : null;
      const warehouseId = body['warehouse_id'] ? Number(body['warehouse_id']) : null;
      await rawSql(sql`
        UPDATE pos_movements
        SET
          status        = COALESCE(${status},      status),
          notes         = COALESCE(${notes},       notes),
          warehouse_id  = COALESCE(${warehouseId}, warehouse_id),
          updated_at    = NOW()
        WHERE id = ${id}
      `);
      const res = await rawSql(sql`SELECT * FROM pos_movements WHERE id = ${id}`);
      return dbRows(res)[0] ?? { id };
    });
  }

  async scanBarcodeById(id: string) {
    return safeCall(async () => {
      const res = await rawSql(sql`
        SELECT pm.*, NULL AS material_name, NULL AS unit_of_measure, w.name AS warehouse_name
        FROM pos_movements pm
        LEFT JOIN wms_warehouses w ON w.id = pm.warehouse_id
        WHERE pm.id::text = ${id}
        LIMIT 1
      `);
      const found = dbRows(res);
      return found[0] ?? { found: false, id };
    });
  }

  async notifySecurityExit(id: string, notes: string | null) {
    return safeCall(async () => {
      await rawSql(sql`
        UPDATE wms_exit_logs SET security_notified = true, security_notes = ${notes}, updated_at = NOW()
        WHERE id = ${parseInt(id, 10)}
      `);
      return { success: true, id, security_notified: true };
    });
  }

  async issueGoods(body: Record<string, unknown>, userId: string | null) {
    return safeCall(async () => {
      const res = await rawSql(sql`
        INSERT INTO wms_transactions (warehouse_id, material_id, type, quantity, unit_cost, created_by, notes)
        VALUES (${body.warehouseId ?? body.warehouse_id ?? null},
                ${body.materialId ?? body.material_id ?? null},
                'issue', ${body.quantity ?? 0}, ${body.unitCost ?? body.unit_cost ?? 0},
                ${userId ? parseInt(userId, 10) : null}, ${body.notes ?? null})
        RETURNING *
      `);
      return dbRows(res)[0] ?? { success: true };
    });
  }
}
