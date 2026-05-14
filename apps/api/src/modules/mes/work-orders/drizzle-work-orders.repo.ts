/**
 * @module drizzle-work-orders.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { productionOrders, productionSessions, machineCrews } from '@europrint/schemas';
import { eq, isNull, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IWorkOrdersRepository, WorkOrderRow } from './i-work-orders.repo';

@Injectable()
export class DrizzleWorkOrdersRepository implements IWorkOrdersRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: WorkOrderRow[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(productionOrders).where(isNull(productionOrders.deletedAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(productionOrders).where(isNull(productionOrders.deletedAt)).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) {
      const msg = e instanceof Error ? (e as Error).message : 'Ish buyurtmalari topilmadi';
      return Err(msg);
    }
  }

  async findById(id: number): Promise<Result<WorkOrderRow | null>> {
    try {
      const rows = await db.select().from(productionOrders).where(eq(productionOrders.id, id));
      return Ok(rows[0] ?? null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? (e as Error).message : `Ish buyurtmasi #${id} topilmadi`;
      return Err(msg);
    }
  }

  async findSessionsByOrderId(orderId: number): Promise<Result<WorkOrderRow[]>> {
    try {
      const rows = await db.select().from(productionSessions).where(eq(productionSessions.productionOrderId, String(orderId)));
      return Ok(rows);
    } catch (e: unknown) {
      const msg = e instanceof Error ? (e as Error).message : 'Sessiyalar topilmadi';
      return Err(msg);
    }
  }

  async findCrewsByOrderId(orderId: number): Promise<Result<WorkOrderRow[]>> {
    try {
      const rows = await db.select().from(machineCrews).where(eq(machineCrews.productionOrderId, orderId));
      return Ok(rows);
    } catch (e: unknown) {
      const msg = e instanceof Error ? (e as Error).message : 'Jamoalar topilmadi';
      return Err(msg);
    }
  }

  async create(dto: Record<string, unknown>): Promise<Result<WorkOrderRow>> {
    try {
      const result = await db.insert(productionOrders).values({ ...dto, status: 'created' } as typeof productionOrders.$inferInsert).returning();
      const rows = Array.isArray(result) ? result : [];
      return Ok(rows[0]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? (e as Error).message : 'Yaratishda xatolik';
      return Err(msg);
    }
  }

  async updateStatus(id: number, status: string): Promise<Result<WorkOrderRow>> {
    try {
      const result = await db.update(productionOrders).set({ status }).where(eq(productionOrders.id, id)).returning();
      const rows = Array.isArray(result) ? result : [];
      return Ok(rows[0]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? (e as Error).message : 'Holatni yangilashda xatolik';
      return Err(msg);
    }
  }
}
