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
import { BarcodeWarehouseQueriesService } from './barcode-warehouse-queries.service';

@Injectable()
export class BarcodeWarehouseCompatService extends BarcodeWarehouseQueriesService {

  async qcDecision(id: string, passed: boolean) {
    return safeCall(async () => {
      const newStatus = passed ? 'APPROVED' : 'REJECTED';
      await rawSql(sql`
        UPDATE pos_movements SET status = ${newStatus}, updated_at = NOW() WHERE id = ${id}
      `);
      return { status: newStatus, message: passed ? 'QC tasdiqlandi' : 'QC rad etildi' };
    });
  }

  submitCycleCount(body: Record<string, unknown>) {
    const counted  = Number(body['countedQuantity'] ?? 0);
    const system   = Number(body['systemQuantity'] ?? 0);
    const variance = system > 0 ? Math.abs(counted - system) / system * 100 : 0;
    let adjustmentAction: string;
    if (variance <= 2)      adjustmentAction = 'AUTO_ADJUST';
    else if (variance <= 5) adjustmentAction = 'SUPERVISOR_APPROVAL';
    else                    adjustmentAction = 'RECOUNT';
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
      const result = await rawSql(sql`
        INSERT INTO pos_movements (movement_number, movement_type_id, status, lot_number, created_at, updated_at)
        SELECT CONCAT('RCV-', TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS')), id, 'pending', ${String(body['lotNumber'] ?? '')}, NOW(), NOW()
        FROM pos_movement_types WHERE code = ${movementTypeCode} LIMIT 1
        RETURNING id, movement_number, status
      `);
      return dbRows(result)[0] ?? { success: true };
    });
  }

  async productionReceive(body: Record<string, unknown>) {
    return safeCall(async () => {
      const result = await rawSql(sql`
        INSERT INTO pos_movements (movement_number, movement_type_id, status, lot_number, notes, created_at, updated_at)
        SELECT CONCAT('PROD-RCV-', TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS')), id, 'pending',
               ${String(body['lotNumber'] ?? '')}, ${String(body['notes'] ?? '')}, NOW(), NOW()
        FROM pos_movement_types WHERE code = 'PRODUCTION_RECEIPT' LIMIT 1
        RETURNING id, movement_number, status
      `);
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
