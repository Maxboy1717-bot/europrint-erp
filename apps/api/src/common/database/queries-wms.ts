/**
 * @module queries-wms
 * @description Source module. See exports for details.
 */

import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { BATCH_ISSUABLE_QUALITY_STATUSES } from '../../modules/wms/domain/constants/wms-batch-issue.constants';

type StockRow = Record<string, unknown>;

export interface BatchLotRow {
  id: number;
  remaining_quantity: string | number | null;
  expiry_date: string | Date | null;
  received_date: string | Date | null;
  /**
   * FAZA K (Kassa+Moliya FIFO tannarx) — per-batch acquisition cost (batch_lots.cost_per_unit).
   * NULL when the batch was created without a recorded cost (goods-issue then falls back to
   * material_cards.unit_price for that portion — never invents a FIFO value, Q-40).
   */
  cost_per_unit: string | number | null;
  /**
   * EP-MM #15 (Q515) — batch_lots.quality_status. Selection service chiqim
   * ustuvorligini "holat > FIFO sana" bo'yicha hisoblaydi (approved < pending).
   * Faqat issuable holatlar (approved/pending) query filtri orqali keladi.
   */
  quality_status: string | null;
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

/**
 * Reserve-path persist onto the CANONICAL warehouse_stock (was the dead `stocks` table —
 * 0 rows, so reservations vanished). `reservedQty` is the DELTA to reserve in this call
 * (the Stock aggregate starts reserved at 0 and `reserve()` only adds the new amount).
 * Mirrors execReceiveFg's incrementing upsert: bump reserved_quantity and shrink
 * available_quantity by the same delta, leaving on-hand `quantity` untouched. The unique
 * index warehouse_stock_wh_mat_uniq backs the ON CONFLICT. The `available_quantity >= delta`
 * guard makes it atomic (check + write) so a reservation can never push available negative.
 * expiry/batch/received args are accepted for signature compatibility but warehouse_stock
 * does not carry them, so they are ignored.
 */
export async function execSaveStock(warehouseId: number, materialId: number, _quantity: number, reservedQty: number, _expiryDate: unknown, _batchNumber: unknown, _receivedAt: unknown): Promise<void> {
  await runQuery(sql`
    UPDATE warehouse_stock
    SET reserved_quantity  = reserved_quantity + ${reservedQty},
        available_quantity = available_quantity - ${reservedQty},
        last_movement_at   = NOW(),
        last_updated_at    = NOW()
    WHERE warehouse_id = ${warehouseId} AND material_id = ${materialId}
      AND available_quantity >= ${reservedQty}
  `);
}

/**
 * All four SELECT helpers below read the CANONICAL warehouse_stock (was the dead `stocks`
 * table). warehouse_stock has no expiry_date / batch_number / received_at columns, so those
 * are aliased to NULL for the Stock-aggregate mapper. `quantity` is exposed as the live
 * AVAILABLE amount (available_quantity) so the reserve/issue callers see only un-reserved
 * stock; the raw on-hand and reserved are also returned for callers that need them.
 */
const WAREHOUSE_STOCK_SELECT = sql`
  id,
  warehouse_id,
  material_id,
  available_quantity AS quantity,
  reserved_quantity,
  quantity AS on_hand_quantity,
  NULL::date AS expiry_date,
  NULL::text AS batch_number,
  COALESCE(last_movement_at, created_at) AS received_at
`;

export async function queryStock(id: number): Promise<StockRow | null> {
  const rows = await runQuery(sql`SELECT ${WAREHOUSE_STOCK_SELECT} FROM warehouse_stock WHERE id = ${id} LIMIT 1`);
  return ((rows.rows as StockRow[])[0] ?? null) as StockRow | null;
}

export async function queryStockByMaterialAndWarehouse(materialId: number, warehouseId: number): Promise<StockRow[]> {
  const rows = await runQuery(sql`
    SELECT ${WAREHOUSE_STOCK_SELECT} FROM warehouse_stock
    WHERE material_id = ${materialId} AND warehouse_id = ${warehouseId}
  `);
  return rows.rows as StockRow[];
}

export async function queryFefoStock(materialId: number, warehouseId: number): Promise<StockRow[]> {
  const rows = await runQuery(sql`
    SELECT ${WAREHOUSE_STOCK_SELECT} FROM warehouse_stock
    WHERE material_id = ${materialId} AND warehouse_id = ${warehouseId}
    ORDER BY COALESCE(last_movement_at, created_at) ASC
  `);
  return rows.rows as StockRow[];
}

/**
 * READ-PARITY for GET /api/wms/stock/fefo/:materialId/:warehouseId.
 * The warehouse_stock-backed queryFefoStock above is an approximate FIFO (last_movement
 * proxy, no expiry) and stays the reserve/issue writer source (those callers UPDATE
 * warehouse_stock BY id, so they must keep reading warehouse_stock). The GET read instead
 * uses the CANONICAL batch/expiry source `batch_lots` for TRUE first-expiry FEFO — the same
 * table, filter and order as the goods-issue tx-branch (getFefoStock) and queryIssuableBatchLots,
 * so the read agrees with the issue selection. `remaining_quantity` is exposed as `quantity`
 * and `reserved_quantity` aliased to 0 (batch_lots tracks no reservation) to match the toStock
 * mapper shape. Order: expiry ASC NULLS LAST then COALESCE(received_date, created_at) ASC.
 */
export async function queryFefoBatchLots(materialId: number, warehouseId: number): Promise<StockRow[]> {
  const allowed = [...BATCH_ISSUABLE_QUALITY_STATUSES];
  const rows = await runQuery(sql`
    SELECT id,
           warehouse_id,
           material_id,
           remaining_quantity AS quantity,
           0::numeric AS reserved_quantity,
           remaining_quantity AS on_hand_quantity,
           expiry_date,
           batch_number,
           COALESCE(received_date, created_at) AS received_at
    FROM batch_lots
    WHERE material_id = ${materialId}
      AND warehouse_id = ${warehouseId}
      AND is_active = true
      AND remaining_quantity > 0
      AND quality_status IN (${sql.join(allowed.map((s) => sql`${s}`), sql`, `)})
    ORDER BY expiry_date ASC NULLS LAST, COALESCE(received_date, created_at) ASC
  `);
  return rows.rows as StockRow[];
}

/**
 * C1.4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): was `execUpdateStockReserved(id, newReserved)` —
 * the caller (reserveMaterial) computed `newReserved` in JS from a SELECT read moments earlier,
 * then this wrote it as an ABSOLUTE value with no guard. Two concurrent reservations against the
 * same row could both read the same stale `available_quantity`, both pass their own JS-side
 * check, and the second UPDATE would silently clobber the first's result — reserving more than
 * was ever actually available (oversell).
 *
 * Now takes a RELATIVE `delta` (amount to add to reserved_quantity) and guards the UPDATE itself
 * against the CURRENT row (`quantity - reserved_quantity >= delta`), mirroring the already-correct
 * `execIssueFromWarehouseStock` pattern below. Postgres row-level locking serializes concurrent
 * UPDATEs on the same row — the second one re-evaluates its guard against the first's committed
 * result, closing the race the old absolute-value write could not. Returns `true` iff the guard
 * passed and the row was updated; `false` means the caller's stale read overestimated availability
 * and this delta could not be applied (0 rows affected — no write happened, nothing to roll back).
 */
export async function execUpdateStockReserved(id: unknown, delta: number): Promise<boolean> {
  const rows = await execRows(sql`
    UPDATE warehouse_stock
    SET reserved_quantity  = reserved_quantity + ${delta},
        available_quantity = quantity - (reserved_quantity + ${delta}),
        last_movement_at   = NOW(),
        last_updated_at    = NOW()
    WHERE id = ${id as number}
      AND (quantity - reserved_quantity) >= ${delta}
    RETURNING id
  `);
  return rows.length > 0;
}

/**
 * C1.4: was `execUpdateStockIssued(id, newQty, newReserved)` — same absolute-value/no-guard
 * vulnerability as execUpdateStockReserved above, on the issue path. Now takes RELATIVE deltas
 * (`qtyDelta` = amount to subtract from on-hand quantity, `reservedDelta` = amount to subtract
 * from reserved_quantity — 0 for an ad-hoc issue that doesn't touch reservations, equal to
 * `qtyDelta` for a reserved-stock issue) and guards against the CURRENT row on all three
 * post-write invariants staying non-negative: `quantity - qtyDelta >= 0`,
 * `reserved_quantity - reservedDelta >= 0`, and — the one an earlier version of this fix MISSED,
 * caught by a live rollback-tx dry-run before this shipped — `available_quantity` (quantity minus
 * reserved) computed post-write must also stay >= 0: `(quantity - reserved_quantity) >=
 * (qtyDelta - reservedDelta)`. Without that third check, an ad-hoc issue (reservedDelta=0) could
 * pass `quantity >= qtyDelta` while eating into stock some OTHER caller already had reserved,
 * driving `available_quantity` negative — the exact class of bug this fix exists to close. For a
 * reserved-issue (reservedDelta=qtyDelta) the third check reduces to `available_quantity >= 0`,
 * which adds no new constraint — so this one formula is correct for both call shapes. Returns
 * `true` iff all three invariants held and the row was updated.
 */
export async function execUpdateStockIssued(id: unknown, qtyDelta: number, reservedDelta: number): Promise<boolean> {
  const rows = await execRows(sql`
    UPDATE warehouse_stock
    SET quantity           = quantity - ${qtyDelta},
        reserved_quantity  = reserved_quantity - ${reservedDelta},
        available_quantity = (quantity - ${qtyDelta}) - (reserved_quantity - ${reservedDelta}),
        last_movement_at   = NOW(),
        last_updated_at    = NOW()
    WHERE id = ${id as number}
      AND quantity >= ${qtyDelta}
      AND reserved_quantity >= ${reservedDelta}
      AND (quantity - reserved_quantity) >= (${qtyDelta} - ${reservedDelta})
    RETURNING id
  `);
  return rows.length > 0;
}

export async function execReceiveFg(
  warehouseId: number,
  productId: number,
  amount: number,
  exec?: ExecuteLike,
): Promise<void> {
  // Batch 3 Variant-2 split: finished-goods receipts land in warehouse_stock_fg (products.id-keyed),
  // NOT the raw warehouse_stock (material_cards.id-keyed). This helper is FG-EXCLUSIVE (sole caller =
  // DrizzleWmsRepository.receiveFg), so its id is always a products.id. Idempotent upsert on
  // (warehouse_id, product_id); the unique warehouse_stock_fg_wh_prod_uniq backs the ON CONFLICT.
  // A60: an optional `exec` (tx) lets the FG-receipt upsert run in the SAME transaction as the
  // wms_transactions IN-ledger row (execInsertWmsTransaction below), so stock + movement stay atomic.
  await execRows(
    sql`
    INSERT INTO warehouse_stock_fg
      (warehouse_id, product_id, quantity, reserved_quantity, available_quantity, last_updated_at, created_at, last_movement_at)
    VALUES
      (${warehouseId}, ${productId}, ${amount}, 0, ${amount}, NOW(), NOW(), NOW())
    ON CONFLICT (warehouse_id, product_id)
    DO UPDATE SET
      quantity           = warehouse_stock_fg.quantity + ${amount},
      available_quantity = warehouse_stock_fg.available_quantity + ${amount},
      last_movement_at   = NOW(),
      last_updated_at    = NOW()
  `,
    exec,
  );
}

/**
 * A60 — canonical WMS movement ledger row. Every stock change recorded here keeps the
 * `wms_transactions` ledger (read by the dashboard "today_movements" KPI, material
 * recent-transactions, and the extended transactions list) in sync with warehouse_stock.
 * `type` is the movement direction ('IN' for receipts, 'OUT' for issues); `reference_id`
 * links the movement back to its source (e.g. the sales order for a QC-passed FG receipt).
 * Accepts an optional `exec` (tx) so the ledger INSERT is atomic with the stock write.
 */
export async function execInsertWmsTransaction(
  input: {
    warehouseId: number;
    materialId: number;
    type: string;
    quantity: number;
    referenceId?: number | null;
    createdBy?: number | null;
    notes?: string | null;
    /**
     * T21-A2: per-unit cost recorded on the ledger row. For QC-passed FG receipts this is
     * the GRADE-ADJUSTED unit price (base × sort coefficient). NULL = unknown/unpriced.
     */
    unitCost?: number | null;
  },
  exec?: ExecuteLike,
): Promise<void> {
  await execRows(
    sql`
    INSERT INTO wms_transactions
      (warehouse_id, material_id, type, quantity, unit_cost, reference_id, created_by, notes, created_at)
    VALUES
      (${input.warehouseId}, ${input.materialId}, ${input.type}, ${input.quantity},
       ${input.unitCost ?? null}, ${input.referenceId ?? null}, ${input.createdBy ?? null}, ${input.notes ?? null}, NOW())
  `,
    exec,
  );
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
  const rows = await runQuery(sql`
    SELECT ${WAREHOUSE_STOCK_SELECT} FROM warehouse_stock WHERE warehouse_id = ${warehouseId}
  `);
  return rows.rows as StockRow[];
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
             cost_per_unit,
             quality_status,
             COALESCE(received_date, created_at) AS received_date
      FROM batch_lots
      WHERE material_id = ${materialId}
        AND warehouse_id = ${warehouseId}
        AND is_active = true
        AND remaining_quantity > 0
        AND quality_status IN (${sql.join(allowed.map((s) => sql`${s}`), sql`, `)})
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
