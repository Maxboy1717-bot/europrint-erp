import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { warehouses, warehouseZones } from '@europrint/schemas';
import { eq, count } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IWmsWarehousesRepository } from './i-wms-warehouses.repo';

import { MAX_EXPORT_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
@Injectable()
export class DrizzleWmsWarehousesRepository implements IWmsWarehousesRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(warehouses).limit(limit).offset(offset),
        db.select({ count: count() }).from(warehouses).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Omborlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(warehouses).where(eq(warehouses.id, id)).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Ombor #${id} topilmadi`); }
  }

  async findZonesByWarehouseId(warehouseId: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(warehouseZones).where(eq(warehouseZones.warehouseId, warehouseId)).limit(MAX_EXPORT_LIMIT).offset(0);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Zonalar topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const row: Omit<typeof warehouses.$inferInsert, 'id'> = {
        name: (dto.name as string | undefined) ?? '',
        code: dto.code as string | undefined,
        location: dto.location as string | undefined,
        type: (dto.type as string | undefined) ?? 'main',
        isActive: (dto.isActive as boolean | undefined) ?? true,
      };
      const result = await db.insert(warehouses).values(row as typeof warehouses.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(warehouses).set(dto as Partial<typeof warehouses.$inferInsert>).where(eq(warehouses.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async deactivate(id: number): Promise<Result<void>> {
    try {
      await db.update(warehouses).set({ isActive: false }).where(eq(warehouses.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
