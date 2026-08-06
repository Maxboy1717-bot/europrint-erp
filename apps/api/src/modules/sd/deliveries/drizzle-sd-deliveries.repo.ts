/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   findItemsByDeliveryId queries delivery_items which has no Drizzle schema
 *   binding (legacy table). The ${deliveries.id} = ${String(id)} where-clauses are
 *   plain raw-sql style but deliveries.id is a real integer (serial) column —
 *   Postgres infers the parameter type from the `=` context, so the string
 *   coercion is harmless, just not required.
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
      // SD-CRM audit §5.2(b)/§5.4 item 7 bonus: dto arrives camelCase (SdCreateDeliverySchema:
      // salesOrderId/customerId/plannedGoodsMovementDate/driverName/vehicleNumber/createdBy) plus
      // the controller-appended deliveryNumber. None of those keys match the deliveries table's
      // snake_case columns, so the old `{ ...dto, status: 'pending' }` spread silently inserted
      // an almost-empty row (delivery_number NOT NULL would have failed once the id-type crash
      // below was fixed). Map explicitly instead of relying on key-name coincidence.
      const values: typeof deliveries.$inferInsert = {
        delivery_number: String(dto.deliveryNumber ?? ''),
        sales_order_id: dto.salesOrderId != null ? Number(dto.salesOrderId) : null,
        customer_id: dto.customerId != null ? Number(dto.customerId) : null,
        planned_goods_movement_date: dto.plannedGoodsMovementDate != null ? String(dto.plannedGoodsMovementDate) : null,
        driver_name: dto.driverName != null ? String(dto.driverName) : null,
        vehicle_number: dto.vehicleNumber != null ? String(dto.vehicleNumber) : null,
        created_by: dto.createdBy != null ? Number(dto.createdBy) : null,
        status: 'pending',
      };
      const result = await db.insert(deliveries).values(values).returning();
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

  async hasExpiredCertificate(salesOrderId: number): Promise<Result<boolean>> {
    try {
      const result = await db.execute(sql`
        SELECT 1 FROM certificates
        WHERE order_id = ${salesOrderId}
          AND expiry_date IS NOT NULL
          AND expiry_date::date < CURRENT_DATE
          AND status != 'revoked'
        LIMIT 1
      `);
      const rows = (result.rows ?? []) as unknown[];
      return Ok(rows.length > 0);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Sertifikat muddatini tekshirishda xatolik'); }
  }
}
