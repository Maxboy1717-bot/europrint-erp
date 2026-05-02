
import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';
import { posInventoryCounts, db, sql, eq, and, inArray } from '@workspace/db';
import { execPosInventoryCountMarkGlPosted } from '@common/database/queries-remaining';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await db.execute(q)).rows as Row[];
};

interface VarianceLine {
  id: number; material_card_id: number; variance: number;
  actual_qty: number; [key: string]: unknown;
}

@Injectable()
export class PosInventoryCountRepository {
  async findActiveCountForWarehouse(warehouseId: string) : Promise<Result<Record<string, unknown> | null>>{
    return safeCall(async () => {
      const [activeCount] = await db
        .select()
        .from(posInventoryCounts)
        .where(and(eq(posInventoryCounts.warehouseId, warehouseId), inArray(posInventoryCounts.status, ['DRAFT', 'IN_PROGRESS'])));
      return activeCount ?? null;
      }, 'DB_ERROR');
  }

  async countAll(): Promise<Result<number>> {
    return safeCall(async () => {
      const [{ cnt }] = await db.select({ cnt: sql<number>`count(*)` }).from(posInventoryCounts);
      return Number(cnt ?? 0);
      }, 'DB_ERROR');
  }

  async createCount(data: typeof posInventoryCounts.$inferInsert) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [inventoryCount] = await db.insert(posInventoryCounts).values(data).returning();
      return inventoryCount;
      }, 'DB_ERROR');
  }

  async startCount(id: number): Promise<void> {
    await db.update(posInventoryCounts).set({ status: 'IN_PROGRESS' }).where(eq(posInventoryCounts.id, id));
  }

  async findById(id: number) : Promise<Result<Record<string, unknown> | null>>{
    return safeCall(async () => {
      const [invCount] = await db.select().from(posInventoryCounts).where(eq(posInventoryCounts.id, id));
      return invCount ?? null;
      }, 'DB_ERROR');
  }

  async finalizeCount(id: number, data: Partial<typeof posInventoryCounts.$inferInsert>) : Promise<Result<Record<string, unknown>>>{
    return safeCall(async () => {
      const [updated] = await db.update(posInventoryCounts).set(data).where(eq(posInventoryCounts.id, id)).returning();
      return updated;
      }, 'DB_ERROR');
  }

  async getWarehouseById(warehouseId: string): Promise<Result<{ id: number } | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT id FROM warehouses WHERE id = ${warehouseId} LIMIT 1`);
      return (r[0] as { id: number }) ?? null;
      }, 'DB_ERROR');
  }

  async getNullLinesCount(countId: number): Promise<Result<number>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT COUNT(*) AS null_count FROM pos_inventory_count_lines WHERE count_id = ${countId} AND actual_qty IS NULL`);
      return Number(r[0]?.null_count ?? 0);
      }, 'DB_ERROR');
  }

  async getVarianceLines(countId: number): Promise<Result<VarianceLine[]>> {
    return safeCall(async () => {
      return castTo<VarianceLine[]>(exec(sql`SELECT * FROM pos_inventory_count_lines WHERE count_id = ${countId} AND variance != 0 AND actual_qty IS NOT NULL`));
      }, 'DB_ERROR');
  }

  async getMovementTypeByCode(code: string): Promise<Result<{ id: number } | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT id FROM pos_movement_types WHERE code = ${code} LIMIT 1`);
      return (r[0] as { id: number }) ?? null;
      }, 'DB_ERROR');
  }

  async markLineGlPosted(lineId: number): Promise<void> {
    await execPosInventoryCountMarkGlPosted(lineId);
  }
}
