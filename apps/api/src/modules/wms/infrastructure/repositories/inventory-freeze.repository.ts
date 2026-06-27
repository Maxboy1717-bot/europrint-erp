/**
 * @module inventory-freeze.repository
 * @description W3-COUNT muzlatish-zona + og'ish-sabab data-access (Drizzle raw SQL,
 *   Result<T>). Jadvallar: inventory_freeze_zones, count_deviation_reasons
 *   (migration: docs/migration/w3-count-inventarizatsiya-kuchaytirish.sql).
 * @layer Infrastructure (WMS)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import type { IInventoryFreezeRepo, FreezeZoneInput } from '../../domain/repositories/i-inventory-freeze.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> =>
  safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class InventoryFreezeRepository implements IInventoryFreezeRepo {
  async findActiveFreeze(warehouseId: number, materialId: number): Promise<Result<Row | null>> {
    // Butun-zona muzlatish (material_id IS NULL) HAR materialni qamrab oladi;
    // material-aniq muzlatish faqat shu material_id ga mos kelganda.
    const r = await exec(sql`
      SELECT id, warehouse_id, material_id, count_id, status, reason, frozen_by, frozen_at
      FROM inventory_freeze_zones
      WHERE status = 'active'
        AND warehouse_id = ${warehouseId}
        AND (material_id IS NULL OR material_id = ${materialId})
      ORDER BY frozen_at DESC
      LIMIT 1
    `);
    if (!r.ok) return Err(r.error);
    return Ok(r.data[0] ?? null);
  }

  async createFreeze(input: FreezeZoneInput): Promise<Result<Row>> {
    const r = await exec(sql`
      INSERT INTO inventory_freeze_zones
        (warehouse_id, material_id, count_id, status, reason, frozen_by)
      VALUES (
        ${input.warehouseId},
        ${input.materialId},
        ${input.countId},
        'active',
        ${input.reason},
        ${input.frozenBy}
      )
      RETURNING *
    `);
    if (!r.ok) return Err(r.error);
    return Ok(r.data[0] ?? null);
  }

  async releaseFreeze(id: number, releasedBy: number | null): Promise<Result<Row | null>> {
    // Faqat aktiv muzlatishni bo'shatish (idempotent — qayta bo'shatish 0 satr qaytaradi).
    const r = await exec(sql`
      UPDATE inventory_freeze_zones
      SET status = 'released', released_by = ${releasedBy}, released_at = NOW()
      WHERE id = ${id} AND status = 'active'
      RETURNING *
    `);
    if (!r.ok) return Err(r.error);
    return Ok(r.data[0] ?? null);
  }

  async listFreezes(status?: string, warehouseId?: number): Promise<Result<Row[]>> {
    const base = sql`
      SELECT f.*, w.name AS warehouse_name, m.name AS material_name
      FROM inventory_freeze_zones f
      LEFT JOIN wms_warehouses w ON w.id = f.warehouse_id
      LEFT JOIN mm_materials m ON m.id = f.material_id
    `;
    if (status && warehouseId) {
      return exec(sql`${base} WHERE f.status = ${status} AND f.warehouse_id = ${warehouseId} ORDER BY f.frozen_at DESC`);
    }
    if (status) {
      return exec(sql`${base} WHERE f.status = ${status} ORDER BY f.frozen_at DESC`);
    }
    if (warehouseId) {
      return exec(sql`${base} WHERE f.warehouse_id = ${warehouseId} ORDER BY f.frozen_at DESC`);
    }
    return exec(sql`${base} ORDER BY f.frozen_at DESC`);
  }

  async listDeviationReasons(): Promise<Result<Row[]>> {
    return exec(sql`
      SELECT id, code, name, name_ru, description, sort_order
      FROM count_deviation_reasons
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, code ASC
    `);
  }

  async deviationReasonExists(code: string): Promise<Result<boolean>> {
    const r = await exec(sql`
      SELECT 1 AS x FROM count_deviation_reasons
      WHERE code = ${code} AND is_active = TRUE LIMIT 1
    `);
    if (!r.ok) return Err(r.error);
    return Ok(r.data.length > 0);
  }
}
