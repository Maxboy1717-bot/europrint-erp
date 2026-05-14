/**
 * @module drizzle-wms-inventory.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { warehouseStock, warehouses } from '@europrint/schemas';
import { eq, isNull, count } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IWmsInventoryRepository } from './i-wms-inventory.repo';

import { MAX_EXPORT_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;
@Injectable()
export class DrizzleWmsInventoryRepository implements IWmsInventoryRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(warehouseStock).limit(1).offset(0),
        db.select().from(warehouseStock).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Inventar topilmadi'); }
  }

  async findWarehouseById(warehouseId: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(warehouses).where(eq(warehouses.id, warehouseId)).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Ombor #${warehouseId} topilmadi`); }
  }

  async findStockByWarehouse(warehouseId: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(warehouseStock).where(eq(warehouseStock.warehouseId, warehouseId)).limit(MAX_EXPORT_LIMIT).offset(0);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Stok topilmadi'); }
  }

  async findStockById(id: number): Promise<Result<any | null>> {
    try {
      const rows = await db.select().from(warehouseStock).where(eq(warehouseStock.id, id)).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Stok #${id} topilmadi`); }
  }
}
