import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { orderCostings, orderCostingLines } from '@europrint/schemas';
import { eq, count, desc, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IOrderCostingRepository } from './i-order-costing.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleOrderCostingRepository implements IOrderCostingRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(orderCostings).orderBy(desc(orderCostings.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(orderCostings),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || 'Xarajat hisobi topilmadi'); }
  }

  async findById(id: number): Promise<Result<object | null>> {
    try {
      const [row] = await db.select().from(orderCostings).where(eq(orderCostings.id, id)).limit(1);
      if (!row) return Ok(null);
      const lines = await db.select().from(orderCostingLines).where(eq(orderCostingLines.orderCostingId, id));
      return Ok({ ...row, lines });
    } catch (e: unknown) { return Err((e as Error).message || `Xarajat hisobi #${id} topilmadi`); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(orderCostings).values(dto as typeof orderCostings.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }

  async findTopProfitable(limit: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select()
        .from(orderCostings)
        .where(sql`${orderCostings.marginPercent} IS NOT NULL`)
        .orderBy(desc(orderCostings.marginPercent))
        .limit(limit);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error).message || 'Top foydali buyurtmalar topilmadi'); }
  }

  async findTopLoss(limit: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select()
        .from(orderCostings)
        .where(sql`${orderCostings.marginPercent} IS NOT NULL`)
        .orderBy(orderCostings.marginPercent)
        .limit(limit);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error).message || 'Top zarar buyurtmalar topilmadi'); }
  }

  async calculate(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const [row] = await db.select().from(orderCostings).where(eq(orderCostings.id, id)).limit(1);
      if (!row) return Err(`Buyurtma #${id} topilmadi`);
      const totalCost = Number(row.materialCost || 0) + Number(row.laborCost || 0) + Number(row.overheadCost || 0);
      const sellingPrice = Number(row.sellingPrice || 0);
      const grossProfit = sellingPrice - totalCost;
      const marginPercent = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
      const result = await db.update(orderCostings).set({
        totalCost: String(totalCost),
        marginPercent: String(marginPercent),
      }).where(eq(orderCostings.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Hisoblashda xatolik'); }
  }
}
