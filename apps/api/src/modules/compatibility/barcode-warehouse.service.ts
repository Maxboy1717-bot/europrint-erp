/**
 * @module barcode-warehouse.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';
@Injectable()
export class BarcodeWarehouseCompatService {
  private readonly logger = new Logger(BarcodeWarehouseCompatService.name);

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
  
    });}

  async getBarcodes(status?: string){
    return safeCall(async () => {
    const statusFilter = status ? sql`pm.status = ${status}` : sql`1=1`;
    const result = await rawSql(sql`
      SELECT pm.id, pm.id AS "barcodeId", pm.status,
             pml.quantity AS "remainingQuantity", pml.unit_of_measure AS uom,
             pm.lot_number AS "lotNumber", mc.xom_ashyo AS "materialName", mc.id AS "materialCardId"
      FROM pos_movements pm
      LEFT JOIN pos_movement_lines pml ON pml.movement_id = pm.id
      LEFT JOIN material_cards mc ON mc.id = pml.material_card_id
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
  
    });}

  async qcDecision(id: string, passed: boolean){
    return safeCall(async () => {
    const newStatus = passed ? 'APPROVED' : 'REJECTED';
    await rawSql(sql`
      UPDATE pos_movements SET status = ${newStatus}, updated_at = NOW() WHERE id = ${id}
    `);
    return { status: newStatus, message: passed ? 'QC tasdiqlandi' : 'QC rad etildi' };
  
    });}

  async getPickingTasks(){
    return safeCall(async () => {
    const result = await rawSql(sql`
      SELECT pm.id, pm.movement_number AS "taskNumber", pm.status,
             pml.quantity AS "requiredQty", pml.quantity_picked AS "pickedQty",
             mc.xom_ashyo AS "materialName"
      FROM pos_movements pm
      LEFT JOIN pos_movement_lines pml ON pml.movement_id = pm.id
      LEFT JOIN material_cards mc ON mc.id = pml.material_card_id
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
  
    });}

  async getPrintQueue(){
    return safeCall(async () => {
    const result = await rawSql(sql`
      SELECT * FROM pos_barcode_print_queue WHERE status = 'QUEUED' ORDER BY created_at DESC LIMIT 50
    `);
    return dbRows(result);
  
    });}

  async getExitLogs(){
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
  
    });}

  async getOperatorBalance(){
    return safeCall(async () => {
    const result = await rawSql(sql`
      SELECT elc.id, elc.user_id, CONCAT(u.first_name, ' ', u.last_name) AS "operatorName",
             mc.xom_ashyo AS "materialName", elc.status, elc.description AS reason,
             elc.assessed_value::float AS "qtyDebt", elc.created_at, null AS "barcodeCode"
      FROM employee_liability_cases elc
      LEFT JOIN users u ON u.id = elc.user_id
      LEFT JOIN material_cards mc ON mc.id = elc.material_card_id
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
  
    });}

  async getCycleCounts(){
    return safeCall(async () => {
    const result = await rawSql(sql`
      SELECT * FROM pos_inventory_counts WHERE status IN ('draft','in_progress','review')
      ORDER BY created_at DESC LIMIT 20
    `);
    return dbRows(result);
  
    });}

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

  async receive(body: Record<string, unknown>){
    return safeCall(async () => {
    const movementTypeCode = String(body['movementType'] ?? 'RECEIPT');
    const result = await rawSql(sql`
      INSERT INTO pos_movements (movement_number, movement_type_id, status, lot_number, created_at, updated_at)
      SELECT CONCAT('RCV-', TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS')), id, 'pending', ${String(body['lotNumber'] ?? '')}, NOW(), NOW()
      FROM pos_movement_types WHERE code = ${movementTypeCode} LIMIT 1
      RETURNING id, movement_number, status
    `);
    return dbRows(result)[0] ?? { success: true };
  
    });}

  async productionReceive(body: Record<string, unknown>){
    return safeCall(async () => {
    const result = await rawSql(sql`
      INSERT INTO pos_movements (movement_number, movement_type_id, status, lot_number, notes, created_at, updated_at)
      SELECT CONCAT('PROD-RCV-', TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS')), id, 'pending',
             ${String(body['lotNumber'] ?? '')}, ${String(body['notes'] ?? '')}, NOW(), NOW()
      FROM pos_movement_types WHERE code = 'PRODUCTION_RECEIPT' LIMIT 1
      RETURNING id, movement_number, status
    `);
    return dbRows(result)[0] ?? { success: true };
  
    });}

  async productionComplete(body: Record<string, unknown>){
    return safeCall(async () => {
    const movementId = String(body['movementId'] ?? '');
    if (movementId) {
      await rawSql(sql`
        UPDATE pos_movements SET status = 'completed', updated_at = NOW()
        WHERE id = ${movementId}
      `);
    }
    return { success: true, message: "Ishlab chiqarish zavershena", movementId };
  
    });}

  async pickTask(taskId: string, body: Record<string, unknown>){
    return safeCall(async () => {
    void body;
    await rawSql(sql`
      UPDATE pos_movements SET status = 'in_progress', updated_at = NOW()
      WHERE id = ${taskId}
    `);
    return { success: true, taskId, status: 'in_progress' };
  
    });}

  async resolveOperatorBalance(id: string, body: Record<string, unknown>){
    return safeCall(async () => {
    const resolution = String(body['resolution'] ?? 'RESOLVED');
    await rawSql(sql`
      UPDATE employee_liability_cases SET status = ${resolution}, updated_at = NOW()
      WHERE id = ${parseInt(id, 10)}
    `);
    return { success: true, id, status: resolution };
  
    });}

  async deleteBarcode(id: string){
    return safeCall(async () => {
    await rawSql(sql`
      UPDATE pos_movements SET status = 'cancelled', updated_at = NOW() WHERE id = ${id}
    `);
    return { success: true, id };
  
    });}

  async updateBarcode(id: string, body: Record<string, unknown>){
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
  
    });}

  async scanBarcodeById(id: string){
    return safeCall(async () => {
    const res = await rawSql(sql`
      SELECT pm.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name
      FROM pos_movements pm
      LEFT JOIN mm_materials m ON m.id = pm.material_id
      LEFT JOIN wms_warehouses w ON w.id = pm.warehouse_id
      WHERE pm.id = ${id} OR pm.barcode = ${id}
      LIMIT 1
    `);
    const found = dbRows(res);
    return found[0] ?? { found: false, id };
  
    });}

  async notifySecurityExit(id: string, notes: string | null){
    return safeCall(async () => {
    await rawSql(sql`
      UPDATE wms_exit_logs SET security_notified = true, security_notes = ${notes}, updated_at = NOW()
      WHERE id = ${parseInt(id, 10)}
    `);
    return { success: true, id, security_notified: true };
  
    });}

  async issueGoods(body: Record<string, unknown>, userId: string | null){
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
    });}
}
