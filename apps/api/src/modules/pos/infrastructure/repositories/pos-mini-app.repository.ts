/**
 * @module pos-mini-app.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { sql, db } from '@workspace/db';
import type { SQL, SQLWrapper } from 'drizzle-orm';

import { Injectable } from '@nestjs/common';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  return (await db.execute(q)).rows as Row[];
};

@Injectable()
export class PosMiniAppRepository {
  async getUserDetails(userId: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT u.id, u.first_name, u.last_name, u.role, u.department AS department_code, e.department AS department_name FROM users u LEFT JOIN employees e ON e.id = u.employee_id WHERE u.id = ${userId} LIMIT 1`);
      return r[0] ?? null;
      }, 'DB_ERROR');
  }

  async searchMaterials(search: string, warehouseId?: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return warehouseId
        ? exec(sql`SELECT mc.id, mc.xom_ashyo AS name, mc.xom_ashyo_ru AS "nameRu", mc.barcode, mc.unit_of_measure AS unit, mc.is_consumable AS "isConsumable", mc.min_interval_days AS "minIntervalDays", mc.max_qty_per_issue AS "maxQtyPerIssue", COALESCE(cs.quantity_on_hand, 0) AS stock FROM material_cards mc LEFT JOIN current_stock cs ON cs.material_id = mc.id AND cs.warehouse_id = ${warehouseId} WHERE mc.is_active = TRUE AND (mc.xom_ashyo ILIKE ${search} OR mc.xom_ashyo_ru ILIKE ${search} OR mc.barcode ILIKE ${search}) ORDER BY mc.xom_ashyo LIMIT 20`)
        : exec(sql`SELECT mc.id, mc.xom_ashyo AS name, mc.xom_ashyo_ru AS "nameRu", mc.barcode, mc.unit_of_measure AS unit, mc.is_consumable AS "isConsumable", mc.min_interval_days AS "minIntervalDays", mc.max_qty_per_issue AS "maxQtyPerIssue", COALESCE(cs.quantity_on_hand, 0) AS stock FROM material_cards mc LEFT JOIN current_stock cs ON cs.material_id = mc.id WHERE mc.is_active = TRUE AND (mc.xom_ashyo ILIKE ${search} OR mc.xom_ashyo_ru ILIKE ${search} OR mc.barcode ILIKE ${search}) ORDER BY mc.xom_ashyo LIMIT 20`);
      }, 'DB_ERROR');
  }

  async getHistory(userId: number, lmt: number, ofs: number): Promise<Result<{ items: Row[]; total: number }>> {
    return safeCall(async () => {
      const [items, countRows] = await Promise.all([
        exec(sql`SELECT pmr.id, pmr.request_number AS "requestNumber", pmr.status, pmr.priority, pmr.notes, pmr.created_at AS "createdAt", pmr.approved_at AS "approvedAt", pmr.department_code AS "departmentCode", (SELECT json_agg(json_build_object('materialId', prl.material_id, 'name', mc.xom_ashyo, 'nameRu', mc.xom_ashyo_ru, 'requestedQty', prl.requested_qty, 'issuedQty', prl.issued_qty, 'unit', mc.unit_of_measure)) FROM pos_material_request_lines prl JOIN material_cards mc ON mc.id = prl.material_id WHERE prl.request_id = pmr.id) AS lines FROM pos_material_requests pmr WHERE pmr.requested_by = ${userId} ORDER BY pmr.created_at DESC LIMIT ${lmt} OFFSET ${ofs}`),
        exec(sql`SELECT COUNT(*) AS total FROM pos_material_requests WHERE requested_by = ${userId}`),
      ]);
      return { items, total: Number(countRows[0]?.total ?? 0) };
      }, 'DB_ERROR');
  }

  async getPendingApprovals(userId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return exec(sql`SELECT pmr.id, pmr.request_number AS "requestNumber", pmr.status, pmr.priority, pmr.notes, pmr.created_at AS "createdAt", pmr.department_code AS "departmentCode", u.first_name || ' ' || u.last_name AS "requestedByName", (SELECT json_agg(json_build_object('materialId', prl.material_id, 'name', mc.xom_ashyo, 'nameRu', mc.xom_ashyo_ru, 'requestedQty', prl.requested_qty, 'unit', mc.unit_of_measure)) FROM pos_material_request_lines prl JOIN material_cards mc ON mc.id = prl.material_id WHERE prl.request_id = pmr.id) AS lines FROM pos_material_requests pmr JOIN users u ON u.id = pmr.requested_by WHERE pmr.status = 'pending' AND pmr.department_code IN (SELECT department FROM users WHERE id = ${userId}) ORDER BY CASE pmr.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, pmr.created_at ASC LIMIT 30`);
      }, 'DB_ERROR');
  }

  async getWarehouses(userId: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return exec(sql`SELECT DISTINCT w.id, w.name, w.code, w.type FROM warehouses w LEFT JOIN warehouse_access_grants wag ON wag.warehouse_id = w.id AND wag.user_id = ${userId} AND wag.is_active = TRUE LEFT JOIN department_warehouse_map dwm ON dwm.warehouse_id = w.id LEFT JOIN users u ON u.department = dwm.department_code AND u.id = ${userId} WHERE w.is_active = TRUE AND (wag.user_id IS NOT NULL OR u.id IS NOT NULL OR EXISTS (SELECT 1 FROM users WHERE id = ${userId} AND role IN ('admin','warehouse_manager','pos_manager'))) ORDER BY w.name LIMIT 20`);
      }, 'DB_ERROR');
  }
}
