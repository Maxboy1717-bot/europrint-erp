/**
 * @module pos-inventory-count-query.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import type { SQL, SQLWrapper } from 'drizzle-orm';

import { Injectable, Logger } from '@nestjs/common';
import { posInventoryCounts, posInventoryCountLines, db, and, eq, sql, desc } from '@workspace/db';
import type { CountFilterDto } from '../../dto/inventory-count.dto';

type Row = Record<string, unknown>;
export interface CountPagedResult { items: Row[]; total: number; page: number; limit: number; totalPages: number }
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await db.execute(q)).rows as Row[]);

@Injectable()
export class PosInventoryCountQueryRepository {
  private readonly logger = new Logger(PosInventoryCountQueryRepository.name);

  async snapshotStock(countId: number, warehouseId: string, categoryFilter?: string): Promise<Result<void>>  {
  try {  
      const stocks = categoryFilter
        ? await exec(sql`SELECT cs.material_id AS material_card_id, cs.quantity_on_hand, mc.xom_ashyo FROM current_stock cs JOIN material_cards mc ON mc.id = cs.material_id WHERE cs.warehouse_id = ${warehouseId} AND mc.material_type = ${categoryFilter}`)
        : await exec(sql`SELECT cs.material_id AS material_card_id, cs.quantity_on_hand, mc.xom_ashyo FROM current_stock cs JOIN material_cards mc ON mc.id = cs.material_id WHERE cs.warehouse_id = ${warehouseId}`);
      if ((stocks.ok ? stocks.data : []).length === 0) { this.logger.warn(`Omborda material topilmadi: ${warehouseId}`); return Ok(); }
      const lines = (stocks.ok ? stocks.data : []).map((row: Row) => ({ countId, materialCardId: Number(row['material_card_id'] ?? 0), systemQty: Number(row['quantity_on_hand'] ?? 0), actualQty: null as null }));
      await db.insert(posInventoryCountLines).values(lines as typeof posInventoryCountLines.$inferInsert[]);
      this.logger.debug(`Snapshot olindi: ${lines.length} material, ombor=${warehouseId}`);  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findLine(lineId: number): Promise<Result<Row | null>> {
  try {  
      const [line] = await db.select().from(posInventoryCountLines).where(eq(posInventoryCountLines.id, lineId));
      return Ok(line ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async checkBarcode(materialCardId: number, scannedBarcode: string): Promise<Result<boolean>>  {
  try {  
      const r = await exec(sql`SELECT id FROM material_cards WHERE id = ${materialCardId} AND (barcode = ${scannedBarcode} OR id IN (SELECT material_card_id FROM inventory_barcode_assignments WHERE barcode = ${scannedBarcode})) LIMIT 1`);
      return Ok((r.ok ? r.data : []).length > 0);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async updateCountLine(lineId: number, updates: Partial<typeof posInventoryCountLines.$inferInsert>): Promise<Result<void>>  {
  try {  
      await db.update(posInventoryCountLines).set(updates).where(eq(posInventoryCountLines.id, lineId));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findCount(countId: number): Promise<Result<Row | null>> {
  try {  
      const [invCount] = await db.select().from(posInventoryCounts).where(eq(posInventoryCounts.id, countId));
      return Ok(invCount ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getVarianceLines(countId: number): Promise<Result<Row[]>>  {
  try {  
      return exec(sql`SELECT cicl.*, mc.xom_ashyo AS material_name, mc.unit_of_measure, COALESCE(cicl.actual_qty::numeric - cicl.system_qty::numeric, 0) AS variance_calc, COALESCE((cicl.actual_qty::numeric - cicl.system_qty::numeric) * COALESCE((SELECT unit_price::numeric FROM pos_movement_lines pml JOIN pos_movements pm ON pm.id = pml.movement_id WHERE pml.material_id = cicl.material_id ORDER BY pm.created_at DESC LIMIT 1), 0), 0) AS variance_value FROM pos_inventory_count_lines cicl JOIN material_cards mc ON mc.id = cicl.material_id WHERE cicl.count_id = ${countId} ORDER BY ABS(cicl.actual_qty::numeric - cicl.system_qty::numeric) DESC NULLS LAST`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async findAll(filter: CountFilterDto): Promise<Result<CountPagedResult>> {
  try {  
      const page = filter.page ?? 1; const limit = filter.limit ?? 20; const offset = (page - 1) * limit;
      const conditions = [];
      if (filter.status)      conditions.push(sql`${posInventoryCounts.status} = ${filter.status}`);
      if (filter.warehouseId) conditions.push(eq(posInventoryCounts.warehouseId, filter.warehouseId));
      if (filter.dateFrom)    conditions.push(sql`count_date >= ${new Date(filter.dateFrom)}`);
      if (filter.dateTo)      conditions.push(sql`count_date <= ${new Date(filter.dateTo)}`);
      const where = conditions.length ? and(...conditions) : undefined;
      const [items, [{ total }]] = await Promise.all([
        db.select().from(posInventoryCounts).where(where).orderBy(desc(posInventoryCounts.createdAt)).limit(limit).offset(offset),
        db.select({ total: sql<number>`count(*)` }).from(posInventoryCounts).where(where),
      ]);
      return Ok({ items, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });  } catch (_e) {
    return Err(String(_e));
  }

  }
}
