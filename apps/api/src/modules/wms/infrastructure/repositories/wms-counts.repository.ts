/**
 * @module wms-counts.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (WMS)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeInt } from '../../../hr/common/db-rows';
import type { IWmsCountsRepo, CountLineInput } from '../../domain/repositories/i-wms-counts.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class WmsCountsRepository implements IWmsCountsRepo {
  async listInventoryCounts(warehouseId?: string, status?: string, lim = 20): Promise<Result<Row[]>>  {
  try {
      const wid = warehouseId ? safeInt(warehouseId, 0) : null;
      return wid && status
        ? exec(sql`SELECT ic.*, w.name AS warehouse_name, e.full_name AS counted_by_name FROM wms_inventory_counts ic LEFT JOIN wms_warehouses w ON w.id = ic.warehouse_id LEFT JOIN employees e ON e.id = ic.counted_by WHERE ic.warehouse_id = ${wid} AND ic.status = ${status} ORDER BY ic.created_at DESC LIMIT ${lim}`)
        : wid
        ? exec(sql`SELECT ic.*, w.name AS warehouse_name, e.full_name AS counted_by_name FROM wms_inventory_counts ic LEFT JOIN wms_warehouses w ON w.id = ic.warehouse_id LEFT JOIN employees e ON e.id = ic.counted_by WHERE ic.warehouse_id = ${wid} ORDER BY ic.created_at DESC LIMIT ${lim}`)
        : status
        ? exec(sql`SELECT ic.*, w.name AS warehouse_name, e.full_name AS counted_by_name FROM wms_inventory_counts ic LEFT JOIN wms_warehouses w ON w.id = ic.warehouse_id LEFT JOIN employees e ON e.id = ic.counted_by WHERE ic.status = ${status} ORDER BY ic.created_at DESC LIMIT ${lim}`)
        : exec(sql`SELECT ic.*, w.name AS warehouse_name, e.full_name AS counted_by_name FROM wms_inventory_counts ic LEFT JOIN wms_warehouses w ON w.id = ic.warehouse_id LEFT JOIN employees e ON e.id = ic.counted_by ORDER BY ic.created_at DESC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createInventoryCount(warehouseId: number, countedBy: number | null, notes: string | null): Promise<Result<Row>>  {
  try {
      const r = await exec(sql`INSERT INTO wms_inventory_counts (warehouse_id, counted_by, notes, status, count_date) VALUES (${warehouseId}, ${countedBy ?? null}, ${notes ?? null}, 'in_progress', NOW()) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listInternalRequests(status?: string, lim = 50): Promise<Result<Row[]>>  {
  try {
      return status
        ? exec(sql`SELECT ir.*, e.full_name AS requested_by_name FROM wms_internal_requests ir LEFT JOIN employees e ON e.id = ir.requested_by WHERE ir.status = ${status} ORDER BY ir.created_at DESC LIMIT ${lim}`)
        : exec(sql`SELECT ir.*, e.full_name AS requested_by_name FROM wms_internal_requests ir LEFT JOIN employees e ON e.id = ir.requested_by ORDER BY ir.created_at DESC LIMIT ${lim}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async createInternalRequest(requestedBy: number | null, fromWarehouseId: number | null, toWarehouseId: number | null, materialId: number, quantity: number, notes: string | null): Promise<Result<Row>>  {
  try {
      const warehouseId = toWarehouseId ?? fromWarehouseId ?? null;
      const requestNo = `IR-${Date.now()}`;
      const r = await exec(sql`
        INSERT INTO internal_requests
          (request_no, requested_by, warehouse_id, material_id,
           material_name, quantity, unit, urgency, notes, status)
        VALUES (
          ${requestNo},
          ${requestedBy},
          ${warehouseId},
          ${materialId},
          COALESCE((SELECT name FROM mm_materials WHERE id = ${materialId}), 'Material ' || ${materialId}::text),
          ${quantity},
          'dona',
          'normal',
          ${notes ?? null},
          'pending'
        )
        RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateInternalRequest(id: number, status: string | null, notes: string | null): Promise<Result<Row[]>>  {
  try {
      return exec(sql`UPDATE wms_internal_requests SET status = COALESCE(${status ?? null}, status), notes = COALESCE(${notes ?? null}, notes), updated_at = NOW() WHERE id = ${id} RETURNING *`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async listBatches(materialId?: string, warehouseId?: string, expiring?: string): Promise<Result<Row[]>>  {
  try {
      const mid = materialId ? safeInt(materialId, 0) : null;
      const wid = warehouseId ? safeInt(warehouseId, 0) : null;
      return mid && wid && expiring
        ? exec(sql`SELECT b.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name FROM wms_stock_batches b LEFT JOIN mm_materials m ON m.id = b.material_id LEFT JOIN wms_warehouses w ON w.id = b.warehouse_id WHERE b.quantity_on_hand > 0 AND b.material_id = ${mid} AND b.warehouse_id = ${wid} AND b.expiry_date <= NOW() + INTERVAL '30 days' ORDER BY b.expiry_date ASC NULLS LAST, b.received_at ASC`)
        : mid && wid
        ? exec(sql`SELECT b.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name FROM wms_stock_batches b LEFT JOIN mm_materials m ON m.id = b.material_id LEFT JOIN wms_warehouses w ON w.id = b.warehouse_id WHERE b.quantity_on_hand > 0 AND b.material_id = ${mid} AND b.warehouse_id = ${wid} ORDER BY b.expiry_date ASC NULLS LAST, b.received_at ASC`)
        : mid
        ? exec(sql`SELECT b.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name FROM wms_stock_batches b LEFT JOIN mm_materials m ON m.id = b.material_id LEFT JOIN wms_warehouses w ON w.id = b.warehouse_id WHERE b.quantity_on_hand > 0 AND b.material_id = ${mid} ORDER BY b.expiry_date ASC NULLS LAST, b.received_at ASC`)
        : exec(sql`SELECT b.*, m.name AS material_name, m.unit_of_measure, w.name AS warehouse_name FROM wms_stock_batches b LEFT JOIN mm_materials m ON m.id = b.material_id LEFT JOIN wms_warehouses w ON w.id = b.warehouse_id WHERE b.quantity_on_hand > 0 ORDER BY b.expiry_date ASC NULLS LAST, b.received_at ASC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getProductionSupply(sessionId?: string): Promise<Result<Row[]>>  {
  try {
      const sid = sessionId ? safeInt(sessionId, 0) : null;
      return sid
        ? exec(sql`SELECT ps.*, m.name AS material_name, m.unit_of_measure FROM wms_production_supply ps LEFT JOIN mm_materials m ON m.id = ps.material_id WHERE ps.session_id = ${sid} ORDER BY ps.created_at DESC`)
        : exec(sql`SELECT ps.*, m.name AS material_name, m.unit_of_measure FROM wms_production_supply ps LEFT JOIN mm_materials m ON m.id = ps.material_id ORDER BY ps.created_at DESC`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async recordCountLine(input: CountLineInput): Promise<Result<Row>> {
    // book_quantity = tizim miqdori (snapshot); counted_quantity = sanoqchi kiritgani.
    // variance = counted - book. deviation_reason_code = majburiy kod (system≠counted bo'lsa).
    const variance = input.countedQty - input.systemQty;
    const variancePercent = input.systemQty !== 0 ? (variance / input.systemQty) * 100 : null;
    // item_type / unit_cost / book_value — jadval NOT NULL (default yo'q). Bu count-line
    // oqimida material birlik-narxi manbasi yo'q → 0 (neytral; Q-40 fabrikatsiya emas,
    // baholash count tasdiqlash bosqichida alohida hisoblanadi).
    const r = await exec(sql`
      INSERT INTO inventory_count_lines
        (count_id, material_id, item_type, book_quantity, counted_quantity, system_quantity,
         variance, variance_percent, unit_cost, book_value,
         deviation_reason_code, reason, counted_by, counted_at)
      VALUES (
        ${input.countId},
        ${input.materialId},
        'material',
        ${input.systemQty},
        ${input.countedQty},
        ${input.systemQty},
        ${variance},
        ${variancePercent},
        0,
        0,
        ${input.deviationReasonCode},
        ${input.notes},
        ${input.countedBy},
        NOW()
      )
      RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  // Batch 5 Item 10 — variance lines needing human confirmation (variance != 0). missing_reason
  // flags a variance with no deviation_reason_code — it must be filled before the count can close.
  async getCountVariances(countId: number): Promise<Result<Row[]>> {
    return exec(sql`
      SELECT l.id, l.material_id, l.item_name, l.sku,
             l.book_quantity, l.counted_quantity, l.variance, l.variance_percent,
             l.deviation_reason_code, l.reason,
             (l.deviation_reason_code IS NULL OR l.deviation_reason_code = '') AS missing_reason
      FROM inventory_count_lines l
      WHERE l.count_id = ${countId} AND COALESCE(l.variance, 0) <> 0
      ORDER BY ABS(COALESCE(l.variance, 0)) DESC, l.id`);
  }

  // Batch 5 Item 10 — human-confirm close. No percentage auto-approval anywhere: this is the only
  // path that sets status='approved', it always stamps a real approved_by, and it refuses to close
  // while any variance line lacks a deviation reason.
  async approveCount(countId: number, approvedBy: number): Promise<Result<Row>> {
    const cur = await exec(sql`SELECT id, status FROM inventory_counts WHERE id = ${countId} LIMIT 1`);
    if (!cur.ok) return Err(cur.error);
    const row = cur.data[0];
    if (!row) return Err({ code: 'NOT_FOUND', message: 'Inventarizatsiya topilmadi' });
    if (String(row.status) === 'approved') return Err({ code: 'CONFLICT', message: 'Allaqachon tasdiqlangan' });

    const missing = await exec(sql`
      SELECT COUNT(*)::int AS n FROM inventory_count_lines
      WHERE count_id = ${countId} AND COALESCE(variance, 0) <> 0
        AND (deviation_reason_code IS NULL OR deviation_reason_code = '')`);
    if (!missing.ok) return Err(missing.error);
    const missingCount = Number((missing.data[0]?.n as number) ?? 0);
    if (missingCount > 0) {
      return Err({ code: 'BUSINESS_RULE_VIOLATION', message: `Tasdiqdan oldin ${missingCount} ta tafovutga sabab-kodi kerak` });
    }

    const upd = await exec(sql`
      UPDATE inventory_counts
      SET status = 'approved', approved_by = ${approvedBy}, approved_at = NOW(), updated_at = NOW()
      WHERE id = ${countId} AND status <> 'approved'
      RETURNING id, status, approved_by, approved_at`);
    if (!upd.ok) return Err(upd.error);
    const updated = upd.data[0];
    if (!updated) return Err({ code: 'CONFLICT', message: 'Tasdiqlanmadi (holat o\'zgargan)' });
    return Ok(updated);
  }
}
