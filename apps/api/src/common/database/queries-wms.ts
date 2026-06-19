/**
 * @module queries-wms
 * @description Source module. See exports for details.
 */

import { db, runQuery } from '@shared/db';
import { stocks } from '@shared/db';
import { eq, and, asc, sql } from 'drizzle-orm';
import { BATCH_ISSUABLE_QUALITY_STATUSES } from '../../modules/wms/domain/constants/wms-batch-issue.constants';

type StockRow = Record<string, unknown>;

export interface BatchLotRow {
  id: number;
  remaining_quantity: string | number | null;
  expiry_date: string | Date | null;
  received_date: string | Date | null;
}

/** Minimal executor surface (db or a Drizzle tx) for raw-SQL helpers below. */
type ExecuteLike = { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> };
const execRows = async (
  q: ReturnType<typeof sql>,
  exec?: ExecuteLike,
): Promise<Record<string, unknown>[]> => {
  if (exec) {
    const r = await exec.execute(q);
    return (Array.isArray(r) ? r : (r.rows ?? [])) as Record<string, unknown>[];
  }
  const r = await runQuery(q);
  return r.rows as Record<string, unknown>[];
};

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
 * Accepts an optional tx executor so the batch-issue path can keep batch_lots +
 * warehouse_stock decrements in ONE transaction.
 */
export async function execIssueFromWarehouseStock(
  warehouseId: number,
  materialId: number,
  amount: number,
  exec?: ExecuteLike,
): Promise<number> {
  const rows = await execRows(
    sql`
      UPDATE warehouse_stock
      SET quantity = quantity - ${amount},
          available_quantity = available_quantity - ${amount},
          last_movement_at = NOW(), last_updated_at = NOW()
      WHERE warehouse_id = ${warehouseId} AND material_id = ${materialId}
        AND available_quantity >= ${amount}
      RETURNING id`,
    exec,
  );
  const first = (Array.isArray(rows) ? rows[0] : undefined) as { id?: unknown } | undefined;
  return Number(first?.id ?? 0);
}

export async function queryAllStockByWarehouse(warehouseId: number): Promise<StockRow[]> {
  const rows = await db.select().from(stocks).where(eq(stocks.warehouse_id, warehouseId));
  return rows as StockRow[];
}

/**
 * #08 PHASE 4/7 — issuable batch_lots for a material/warehouse (canonical table).
 * Returns active rows in the QC-allowed quality_status set with positive qoldiq.
 * Expired rows ARE included so the selection service can BLOCK (EP-WMS-079).
 * Ordered FEFO-first (expiry ASC NULLS LAST, received ASC); the service may
 * re-order for FIFO, but a stable DB order keeps results deterministic.
 */
export async function queryIssuableBatchLots(
  materialId: number,
  warehouseId: number,
  exec?: ExecuteLike,
): Promise<BatchLotRow[]> {
  const allowed = [...BATCH_ISSUABLE_QUALITY_STATUSES];
  const rows = await execRows(
    sql`
      SELECT id,
             remaining_quantity,
             expiry_date,
             COALESCE(received_date, created_at) AS received_date
      FROM batch_lots
      WHERE material_id = ${materialId}
        AND warehouse_id = ${warehouseId}
        AND is_active = true
        AND remaining_quantity > 0
        AND quality_status = ANY(${allowed})
      ORDER BY expiry_date ASC NULLS LAST, COALESCE(received_date, created_at) ASC
    `,
    exec,
  );
  return rows as unknown as BatchLotRow[];
}

/**
 * True when ANY active batch_lots row exists for the material/warehouse
 * (any quality_status, any qoldiq). Drives the no-batch aggregate fallback.
 */
export async function queryHasAnyBatchLots(
  materialId: number,
  warehouseId: number,
  exec?: ExecuteLike,
): Promise<boolean> {
  const rows = await execRows(
    sql`
      SELECT 1
      FROM batch_lots
      WHERE material_id = ${materialId}
        AND warehouse_id = ${warehouseId}
        AND is_active = true
      LIMIT 1
    `,
    exec,
  );
  return (Array.isArray(rows) ? rows : []).length > 0;
}

/**
 * Guarded decrement of one batch_lots row by `qty`. The `remaining_quantity >= qty`
 * guard makes the UPDATE atomic (check + write), so it can't go negative.
 * Returns the row id, or 0 when missing / insufficient.
 */
export async function execDecrementBatchLot(
  lotId: number,
  qty: number,
  exec?: ExecuteLike,
): Promise<number> {
  const rows = await execRows(
    sql`
      UPDATE batch_lots
      SET remaining_quantity = remaining_quantity - ${qty}
      WHERE id = ${lotId}
        AND remaining_quantity >= ${qty}
      RETURNING id
    `,
    exec,
  );
  const first = (Array.isArray(rows) ? rows[0] : undefined) as { id?: unknown } | undefined;
  return Number(first?.id ?? 0);
}
