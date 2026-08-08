/**
 * @module wms-crud.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (WMS)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { sql, eq, isNull, and } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';
import { wms_stock } from '@shared/db/schema-compat-5';
import type { IWmsCrudRepo } from '../../domain/repositories/i-wms-crud.repo';

type Row = Record<string, unknown>;

@Injectable()
export class WmsCrudRepository implements IWmsCrudRepo {
  private async exec(q: Parameters<typeof runQuery>[0]): Promise<Result<Row[]>> {
    try {
      const res = await runQuery<Row>(q);
      if (!Array.isArray(res.rows)) return Err('DB_TYPE_ERROR');
      return Ok(res.rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  async softDeleteTransaction(id: number, userId: number | null): Promise<Result<Row>> {
    const r = await this.exec(
      sql`UPDATE wms_transactions SET deleted_at = NOW(), deleted_by = ${userId} WHERE id = ${id} AND deleted_at IS NULL RETURNING *`,
    );
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async patchTransaction(id: number, body: Row): Promise<Result<Row>> {
    const { quantity, unit_cost, notes } = body;
    const r = await this.exec(
      sql`UPDATE wms_transactions SET quantity = COALESCE(${quantity ?? null}, quantity), unit_cost = COALESCE(${unit_cost ?? null}, unit_cost), notes = COALESCE(${notes ?? null}, notes), updated_at = NOW() WHERE id = ${id} AND deleted_at IS NULL RETURNING *`,
    );
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async softDeleteGoodsIssue(id: number, userId: number | null): Promise<Result<Row>> {
    const r = await this.exec(
      sql`UPDATE wms_goods_issues SET deleted_at = NOW(), deleted_by = ${userId} WHERE id = ${id} AND deleted_at IS NULL RETURNING *`,
    );
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async patchGoodsIssue(id: number, body: Row): Promise<Result<Row>> {
    const { quantity, notes } = body;
    const r = await this.exec(
      sql`UPDATE wms_goods_issues SET quantity = COALESCE(${quantity ?? null}, quantity), notes = COALESCE(${notes ?? null}, notes), updated_at = NOW() WHERE id = ${id} AND deleted_at IS NULL RETURNING *`,
    );
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async softDeleteInventory(id: number, userId: number | null): Promise<Result<Row>> {
    const r = await this.exec(
      sql`UPDATE wms_inventory SET deleted_at = NOW(), deleted_by = ${userId} WHERE id = ${id} AND deleted_at IS NULL RETURNING *`,
    );
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async patchInventory(id: number, body: Row): Promise<Result<Row>> {
    const { qty_on_hand, notes } = body;
    const r = await this.exec(
      sql`UPDATE wms_inventory SET qty_on_hand = COALESCE(${qty_on_hand ?? null}, qty_on_hand), notes = COALESCE(${notes ?? null}, notes), updated_at = NOW() WHERE id = ${id} AND deleted_at IS NULL RETURNING *`,
    );
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async softDeleteRentalRecord(id: number, userId: number | null): Promise<Result<Row>> {
    const r = await this.exec(
      sql`UPDATE warehouse_rental_records SET deleted_at = NOW(), deleted_by = ${userId} WHERE id = ${id} AND deleted_at IS NULL RETURNING *`,
    );
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async patchRentalRecord(id: number, body: Row): Promise<Result<Row>> {
    const { area_m2, daily_rate_per_m2, notes, status } = body;
    const r = await this.exec(
      sql`UPDATE warehouse_rental_records SET area_m2 = COALESCE(${area_m2 ?? null}, area_m2), daily_rate_per_m2 = COALESCE(${daily_rate_per_m2 ?? null}, daily_rate_per_m2), notes = COALESCE(${notes ?? null}, notes), status = COALESCE(${status ?? null}, status), updated_at = NOW() WHERE id = ${id} AND deleted_at IS NULL RETURNING *`,
    );
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async softDeleteStock(id: number, userId: number | null): Promise<Result<Row>> {
    try {
      const rows = await db
        .update(wms_stock)
        .set({ deleted_at: _time.now(), deleted_by: userId })
        .where(and(eq(wms_stock.id, id), isNull(wms_stock.deleted_at)))
        .returning();
      if (rows.length === 0) return Err('NOT_FOUND');
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async patchStock(id: number, body: Row): Promise<Result<Row>> {
    const { qty, batch_no, notes } = body;
    try {
      const rows = await db
        .update(wms_stock)
        .set({
          ...(qty !== null && qty !== undefined ? { qty: String(qty) } : {}),
          ...(batch_no !== null && batch_no !== undefined ? { batch_no: String(batch_no) } : {}),
          ...(notes !== null && notes !== undefined ? { notes: String(notes) } : {}),
          updated_at: _time.now(),
        })
        .where(and(eq(wms_stock.id, id), isNull(wms_stock.deleted_at)))
        .returning();
      if (rows.length === 0) return Err('NOT_FOUND');
      return Ok(rows[0] as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async softDeleteInventoryCount(id: number, userId: number | null): Promise<Result<Row>> {
    const r = await this.exec(
      sql`UPDATE wms_inventory_counts SET deleted_at = NOW(), deleted_by = ${userId} WHERE id = ${id} AND deleted_at IS NULL RETURNING *`,
    );
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async softDeleteWarehouse(id: string | number, userId: number | null): Promise<Result<Row>> {
    const r = await this.exec(
      sql`UPDATE warehouses SET deleted_at = NOW(), deleted_by = ${userId} WHERE id = ${String(id)} AND deleted_at IS NULL RETURNING *`,
    );
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async listGoodsIssues(limit: number, offset: number): Promise<Result<Row[]>> {
    return this.exec(sql`
      SELECT gi.*, mc.xom_ashyo AS material_name, mc.unit_of_measure,
             w.name AS warehouse_name
      FROM wms_goods_issues gi
      LEFT JOIN material_cards mc ON gi.material_id = mc.id
      LEFT JOIN warehouses w ON gi.warehouse_id = w.id
      WHERE gi.deleted_at IS NULL
      ORDER BY gi.issued_at DESC, gi.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
  }

  async getGoodsIssueById(id: number): Promise<Result<Row>> {
    const r = await this.exec(sql`
      SELECT gi.*, mc.xom_ashyo AS material_name, mc.unit_of_measure,
             w.name AS warehouse_name
      FROM wms_goods_issues gi
      LEFT JOIN material_cards mc ON gi.material_id = mc.id
      LEFT JOIN warehouses w ON gi.warehouse_id = w.id
      WHERE gi.id = ${id} AND gi.deleted_at IS NULL
    `);
    if (!r.ok) return Err(r.error);
    if (!Array.isArray(r.data) || r.data.length === 0) return Err('NOT_FOUND');
    return Ok(r.data[0]);
  }

  async getStockById(id: number): Promise<Result<Row | null>> {
    const r = await this.exec(sql`
      SELECT ws.*, mc.xom_ashyo AS material_name, mc.unit_of_measure, w.name AS warehouse_name
      FROM warehouse_stock ws
      LEFT JOIN material_cards mc ON ws.material_id = mc.id
      LEFT JOIN warehouses w ON ws.warehouse_id = w.id
      WHERE ws.id = ${id}
    `);
    if (!r.ok) return Err(r.error);
    return Ok(Array.isArray(r.data) && r.data.length > 0 ? r.data[0] : null);
  }
}
