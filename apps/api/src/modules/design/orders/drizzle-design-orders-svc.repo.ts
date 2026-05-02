import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { designOrders } from '@europrint/schemas';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IDesignOrdersSvcRepository } from './i-design-orders-svc.repo';

@Injectable()
export class DrizzleDesignOrdersSvcRepository implements IDesignOrdersSvcRepository {
  async findAll(): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(designOrders).where(isNull(designOrders.deletedAt)).orderBy(desc(designOrders.createdAt));
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Dizayn buyurtmalari topilmadi');
    }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(designOrders).where(and(eq(designOrders.id, id), isNull(designOrders.deletedAt)));
      return Ok((rows)[0] || null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Dizayn buyurtmasi #${id} topilmadi`);
    }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(designOrders).values({ ...dto, status: 'new' } as typeof designOrders.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Yaratishda xatolik');
    }
  }

  async updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(designOrders).set({ status }).where(eq(designOrders.id, id)).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Holat yangilashda xatolik');
    }
  }
}
