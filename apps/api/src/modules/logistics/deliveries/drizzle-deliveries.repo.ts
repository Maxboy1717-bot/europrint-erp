import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { mmDeliveries } from '@europrint/schemas';
import { eq, isNull, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IDeliveriesRepository } from './i-deliveries.repo';

@Injectable()
export class DrizzleDeliveriesRepository implements IDeliveriesRepository {
  async findAll(): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(mmDeliveries).where(isNull(mmDeliveries.updatedAt)).orderBy(desc(mmDeliveries.createdAt));
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Yetkazishlar topilmadi');
    }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(mmDeliveries).where(eq(mmDeliveries.id, id));
      return Ok((rows)[0] || null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Yetkazish #${id} topilmadi`);
    }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(mmDeliveries).values({ ...dto, status: 'planned' } as typeof mmDeliveries.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Yaratishda xatolik');
    }
  }

  async updateStatus(id: number, status: string, arrivedAt?: Date): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(mmDeliveries).set({
        status,
        ...(arrivedAt ? { actualArrival: arrivedAt } : {}),
      } as Partial<typeof mmDeliveries.$inferInsert>).where(eq(mmDeliveries.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Holat yangilashda xatolik');
    }
  }
}
