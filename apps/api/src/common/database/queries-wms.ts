/**
 * @module queries-wms
 * @description Source module. See exports for details.
 */

import { db, runQuery } from '@shared/db';
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
  // #03 HOP-4: QC-passed finished goods land in the CANONICAL warehouse_stock (was non-canonical `stocks`,
  // conflict #8 — invisible to every downstream WMS/POS reader). Idempotent upsert on (warehouse_id, material_id);
  // the unique index warehouse_stock_wh_mat_uniq backs the ON CONFLICT. Same proven pattern as pos-wms-sync.helpers.
  await runQuery(sql`
    INSERT INTO warehouse_stock
      (warehouse_id, material_id, quantity, reserved_quantity, available_quantity, last_updated_at, created_at, last_movement_at)
    VALUES
      (${warehouseId}, ${materialId}, ${amount}, 0, ${amount}, NOW(), NOW(), NOW())
    ON CONFLICT (warehouse_id, material_id)
    DO UPDATE SET
      quantity           = warehouse_stock.quantity + ${amount},
      available_quantity = warehouse_stock.available_quantity + ${amount},
      last_movement_at   = NOW(),
      last_updated_at    = NOW()
  `);
}

/**
 * #08 chiqim (goods-issue): guarded atomic decrement of the CANONICAL warehouse_stock (same table
 * receiveFg fills). The `>= amount` guard makes the single UPDATE both the stock check and the write,
 * so it can't go negative. Returns the row id, or 0 if material missing / insufficient available.
 * FEFO/batch-lot issue (the `stocks` table) is a separate deep-vision layer, not used here.
 */
export async function execIssueFromWarehouseStock(warehouseId: number, materialId: number, amount: number): Promise<number> {
  const r = await runQuery(sql`
    UPDATE warehouse_stock
    SET quantity = quantity - ${amount},
        available_quantity = available_quantity - ${amount},
        last_movement_at = NOW(), last_updated_at = NOW()
    WHERE warehouse_id = ${warehouseId} AND material_id = ${materialId}
      AND available_quantity >= ${amount}
    RETURNING id`);
  return Number((r.rows[0] as { id?: unknown } | undefined)?.id ?? 0);
}

export async function queryAllStockByWarehouse(warehouseId: number): Promise<StockRow[]> {
  const rows = await db.select().from(stocks).where(eq(stocks.warehouse_id, warehouseId));
  return rows as StockRow[];
}
