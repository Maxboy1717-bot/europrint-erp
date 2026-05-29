/**
 * @module barcode-warehouse-queries.service
 * @description Read-side queries for the barcode-warehouse compat surface.
 */

import { Injectable, Logger } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class BarcodeWarehouseQueriesService {
  protected readonly logger = new Logger(BarcodeWarehouseQueriesService.name);

  async getDashboard(): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await rawSql(sql`
        SELECT
          (SELECT COUNT(*) FROM pos_movements WHERE status = 'pending')       AS pending_approvals,
          (SELECT COUNT(*) FROM pos_movements WHERE status = 'qc_pending')    AS qc_pending,
          (SELECT COUNT(*) FROM pos_movement_lines)                            AS total_lines,
          (SELECT COALESCE(SUM(quantity_on_hand),0) FROM current_stock)       AS total_stock_qty
      `);
      const row = dbRows(result)[0] ?? {};
      return {
        pendingApprovals: Number(row['pending_approvals'] ?? 0),
        qcPending:        Number(row['qc_pending'] ?? 0),
        totalLines:       Number(row['total_lines'] ?? 0),
        totalStockQty:    Number(row['total_stock_qty'] ?? 0),
      };
    });
  }

  async getBarcodes(status?: string) {
    return safeCall(async () => {
      const statusFilter = status ? sql`pm.status = ${status}` : sql`1=1`;
      const result = await rawSql(sql`
        SELECT pm.id, pm.id AS "barcodeId", pm.status,
               pml.quantity AS "remainingQuantity", pml.unit_of_measure AS uom,
               pm.lot_number AS "lotNumber", mc.xom_ashyo AS "materialName", mc.id AS "materialCardId"
        FROM pos_movements pm
        LEFT JOIN pos_movement_lines pml ON pml.movement_id = pm.id
        LEFT JOIN material_cards mc ON mc.id = pml.material_id
        WHERE ${statusFilter}
        ORDER BY pm.created_at DESC LIMIT 100
      `);
      return dbRows(result).map((row) => ({
        barcode: {
          id:                row['id'],
          barcodeId:         row['barcodeId'] ?? row['id'],
          status:            row['status'],
          remainingQuantity: Number(row['remainingQuantity'] ?? 0),
          uom:               row['uom'] ?? 'dona',
          lotNumber:         row['lotNumber'],
        },
        materialName:   row['materialName'],
        materialCardId: row['materialCardId'],
      }));
    });
  }

  async getPickingTasks() {
    return safeCall(async () => {
      const result = await rawSql(sql`
        SELECT pm.id, pm.movement_number AS "taskNumber", pm.status,
               pml.quantity AS "requiredQty", pml.quantity_picked AS "pickedQty",
               mc.xom_ashyo AS "materialName"
        FROM pos_movements pm
        LEFT JOIN pos_movement_lines pml ON pml.movement_id = pm.id
        LEFT JOIN material_cards mc ON mc.id = pml.material_id
        JOIN pos_movement_types pmt ON pmt.id = pm.movement_type_id
        WHERE pmt.code = 'INTERNAL_ISSUE' AND pm.status IN ('pending', 'in_progress')
        ORDER BY pm.created_at DESC LIMIT 50
      `);
      return dbRows(result).map((row) => ({
        task: {
          id:          row['id'],
          taskNumber:  row['taskNumber'],
          status:      row['status'],
          requiredQty: Number(row['requiredQty'] ?? 0),
          pickedQty:   Number(row['pickedQty'] ?? 0),
        },
        materialName: row['materialName'],
      }));
    });
  }

  async getPrintQueue() {
    return safeCall(async () => {
      const result = await rawSql(sql`
        SELECT * FROM pos_barcode_print_queue WHERE status = 'QUEUED' ORDER BY created_at DESC LIMIT 50
      `);
      return dbRows(result);
    });
  }

  async getExitLogs() {
    return safeCall(async () => {
      const result = await rawSql(sql`
        SELECT elc.id, CONCAT(u.first_name, ' ', u.last_name) AS "personName",
               elc.status AS "alertLevel", true AS "exitAllowed",
               elc.created_at AS "exitTime", false AS "securityNotified"
        FROM employee_liability_cases elc
        LEFT JOIN users u ON u.id = elc.user_id
        ORDER BY elc.created_at DESC LIMIT 50
      `);
      return dbRows(result);
    });
  }

  async getOperatorBalance() {
    return safeCall(async () => {
      const result = await rawSql(sql`
        SELECT elc.id, elc.user_id, CONCAT(u.first_name, ' ', u.last_name) AS "operatorName",
               mc.xom_ashyo AS "materialName", elc.status, elc.description AS reason,
               elc.assessed_value::float AS "qtyDebt", elc.created_at, null AS "barcodeCode"
        FROM employee_liability_cases elc
        LEFT JOIN users u ON u.id = elc.user_id
        LEFT JOIN material_cards mc ON mc.id = elc.material_id
        WHERE elc.status IN ('OPEN', 'UNDER_REVIEW')
        ORDER BY elc.created_at DESC LIMIT 50
      `);
      return dbRows(result).map((row) => ({
        operatorName: row['operatorName'],
        barcodeCode:  row['barcodeCode'],
        materialName: row['materialName'],
        balance: {
          id:      row['id'],
          status:  row['status'] === 'OPEN' ? 'PENDING' : row['status'],
          qtyDebt: Number(row['qtyDebt'] ?? 0),
          reason:  row['reason'] ?? 'SHORTAGE',
          currency:'UZS',
        },
      }));
    });
  }

  async getCycleCounts() {
    return safeCall(async () => {
      const result = await rawSql(sql`
        SELECT * FROM pos_inventory_counts WHERE status IN ('draft','in_progress','review')
        ORDER BY created_at DESC LIMIT 20
      `);
      return dbRows(result);
    });
  }
}
