/**
 * @module queries-wms
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import { stocks } from '@shared/db';
import { eq, and, asc, sql } from 'drizzle-orm';

type StockRow = Record<string, unknown>;

export async function execSaveStock(warehouseId: number, materialId: number, quantity: number, reservedQty: number, expiryDate: unknown, batchNumber: unknown, receivedAt: unknown): Promise<void> {
  await db.insert(stocks).values({
    warehouse_id: warehouseId,
    material_id: materialId,
    quantity: String(quantity),
    reserved_quantity: String(reservedQty),
    expiry_date: (expiryDate as string | null) ?? null,
    batch_number: (batchNumber as string | null) ?? null,
    received_at: (receivedAt as Date | null) ?? null,
  }).onConflictDoNothing();
}

export async function queryStock(id: number): Promise<StockRow | null> {
  const rows = await db.select().from(stocks).where(eq(stocks.id, id)).limit(1);
  return (rows[0] ?? null) as StockRow | null;
}

export async function queryStockByMaterialAndWarehouse(materialId: number, warehouseId: number): Promise<StockRow[]> {
  const rows = await db.select().from(stocks).where(and(eq(stocks.material_id, materialId), eq(stocks.warehouse_id, warehouseId)));
  return rows as StockRow[];
}

export async function queryFefoStock(materialId: number, warehouseId: number): Promise<StockRow[]> {
  const rows = await db.select().from(stocks)
    .where(and(eq(stocks.material_id, materialId), eq(stocks.warehouse_id, warehouseId)))
    .orderBy(sql`${stocks.expiry_date} ASC NULLS LAST`, asc(stocks.received_at));
  return rows as StockRow[];
}

export async function execUpdateStockReserved(id: unknown, newReserved: number): Promise<void> {
  await db.update(stocks).set({ reserved_quantity: String(newReserved) }).where(eq(stocks.id, id as number));
}

export async function execUpdateStockIssued(id: unknown, newQty: number, newReserved: number): Promise<void> {
  await db.update(stocks).set({ quantity: String(newQty), reserved_quantity: String(newReserved) }).where(eq(stocks.id, id as number));
}

export async function execReceiveFg(warehouseId: number, materialId: number, amount: number): Promise<void> {
  await db.insert(stocks).values({
    warehouse_id: warehouseId,
    material_id: materialId,
    quantity: String(amount),
    reserved_quantity: '0',
    batch_number: `FG-${Date.now()}`,
    received_at: new Date(),
  });
}

export async function queryAllStockByWarehouse(warehouseId: number): Promise<StockRow[]> {
  const rows = await db.select().from(stocks).where(eq(stocks.warehouse_id, warehouseId));
  return rows as StockRow[];
}
