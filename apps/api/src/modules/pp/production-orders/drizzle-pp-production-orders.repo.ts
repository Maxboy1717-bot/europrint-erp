import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { productionOrders } from '@europrint/schemas';
import { eq, isNull, count } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IPpProductionOrdersRepository } from './i-pp-production-orders.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzlePpProductionOrdersRepository implements IPpProductionOrdersRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(productionOrders).where(isNull(productionOrders.deletedAt)).limit(1).offset(0),
        db.select().from(productionOrders).where(isNull(productionOrders.deletedAt)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Ishlab chiqarish buyurtmalari topilmadi'); }
  }

  async findById(id: number): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(productionOrders).where(eq(productionOrders.id, id)).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Buyurtma #${id} topilmadi`); }
  }

  async findByOrderNumber(orderNumber: string): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(productionOrders).where(eq(productionOrders.orderNumber, orderNumber)).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Buyurtma topilmadi'); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof productionOrders.$inferInsert, 'id'> = {
        orderNumber: dto.orderNumber as string | undefined,
        productId: dto.productId as string | undefined,
        quantity: (dto.quantity as string | undefined) ?? '1',
        unit: dto.unit as string | undefined,
        status: 'planned',
        plannedStart: dto.plannedStart as Date | undefined,
        plannedEnd: dto.plannedEnd as Date | undefined,
        createdBy: createdBy ? String(createdBy) : (dto.createdBy as string | undefined),
      };
      const result = await db.insert(productionOrders).values(row as typeof productionOrders.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const patch: Partial<typeof productionOrders.$inferInsert> = {
        ...(dto.orderNumber !== undefined ? { orderNumber: dto.orderNumber as string } : {}),
        ...(dto.productId !== undefined ? { productId: dto.productId as string } : {}),
        ...(dto.quantity !== undefined ? { quantity: dto.quantity as string } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit as string } : {}),
        ...(dto.status !== undefined ? { status: dto.status as string } : {}),
        ...(dto.plannedStart !== undefined ? { plannedStart: dto.plannedStart as Date } : {}),
        ...(dto.plannedEnd !== undefined ? { plannedEnd: dto.plannedEnd as Date } : {}),
        ...(dto.actualStart !== undefined ? { actualStart: dto.actualStart as Date } : {}),
        ...(dto.actualEnd !== undefined ? { actualEnd: dto.actualEnd as Date } : {}),
        updatedAt: _time.now(),
      };
      const result = await db.update(productionOrders).set(patch).where(eq(productionOrders.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(productionOrders).set({ status }).where(eq(productionOrders.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Holat yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(productionOrders).set({ deletedAt: _time.now() }).where(eq(productionOrders.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
