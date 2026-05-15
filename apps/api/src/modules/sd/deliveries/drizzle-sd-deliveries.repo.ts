/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   findItemsByDeliveryId queries delivery_items which has no Drizzle schema
 *   binding (legacy table), and the where-clause ${deliveries.id} = ${String(id)}
 *   coercion uses raw sql template because the id column is varchar in the
 *   shared schema while the API accepts numeric ids.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module drizzle-sd-deliveries.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { deliveries } from '@shared/db';
import { eq, count, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ISdDeliveriesRepository } from './i-sd-deliveries.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleSdDeliveriesRepository implements ISdDeliveriesRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(deliveries).limit(limit).offset(offset),
        db.select({ count: count() }).from(deliveries).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yetkazishlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(deliveries).where(sql`${deliveries.id} = ${String(id)}`).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Yetkazish #${id} topilmadi`); }
  }

  async findItemsByDeliveryId(deliveryId: number): Promise<Result<object[]>> {
    try {
      const result = await db.execute(sql`
        SELECT di.*
        FROM delivery_items di
        WHERE di.delivery_id = ${deliveryId}
        ORDER BY di.id ASC
      `);
      return Ok((result.rows ?? []) as object[]);
    } catch (e: unknown) { return Err((e as Error)?.message || `Yetkazish #${deliveryId} bandlari topilmadi`); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(deliveries).values({ ...dto, status: 'pending' } as typeof deliveries.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(deliveries)
        .set({ status: status as typeof deliveries.$inferInsert['status'] })
        .where(sql`${deliveries.id} = ${String(id)}`)
        .returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Holat yangilashda xatolik'); }
  }
}
