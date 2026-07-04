/**
 * @module queries-pp
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import { boms_int, routings_int, production_orders_int, routing_operations_int } from '@shared/db';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { nextDocNumber } from './doc-sequences.helper';

type DbRow = Record<string, unknown>;

export async function execSavePo(
  soId: number | null, status: string, bomId: number | null,
  routingId: number | null, plannedStart: unknown, plannedEnd: unknown,
  productId: number | null = null,
  createdBy: string | null = null,
  // SB0233 (06-PP audit): optional org-karta (org_departments.id). NULL = hali
  // tayinlanmagan (egasi-DATA — avtomatik karta-tayinlash qoidasi hozircha yo'q).
  orgDepartmentId: number | null = null,
): Promise<number> {
  type PoInsert = typeof production_orders_int.$inferInsert;
  // FIX: product_id is NOT NULL (FK products) and sales_order_id used to be dropped — both supplied
  // now so the production order actually inserts and stays linked to its sales order (SD->PP thread).
  const rows = await db.insert(production_orders_int).values({
    status,
    bomId: bomId,
    routingId: routingId,
    salesOrderId: soId,
    productId: productId,
    plannedStartDate: plannedStart != null ? String(plannedStart) : undefined,
    plannedEndDate: plannedEnd != null ? String(plannedEnd) : undefined,
    orderNumber: await nextDocNumber('PO'),
    plannedQuantity: 1,
    createdBy: createdBy != null ? Number(createdBy) : undefined,
    orgDepartmentId: orgDepartmentId ?? undefined,
  } as PoInsert).returning({ id: production_orders_int.id });
  return rows[0]?.id ?? 0;
}

/** Update an existing production order's status (used by release/transition — savePo no longer re-inserts). */
export async function execUpdatePoStatus(id: number, status: string): Promise<number> {
  const rows = await db.update(production_orders_int)
    .set({ status })
    .where(eq(production_orders_int.id, id))
    .returning({ id: production_orders_int.id });
  return rows[0]?.id ?? 0;
}

export async function queryPo(id: number): Promise<DbRow | null> {
  const rows = await db.select().from(production_orders_int).where(eq(production_orders_int.id, id)).limit(1);
  return (rows[0] ?? null) as DbRow | null;
}

export async function queryPoByStatus(status: string): Promise<DbRow[]> {
  const rows = await db.select().from(production_orders_int).where(eq(production_orders_int.status, status));
  return rows as DbRow[];
}

export async function execSaveBom(productName: string, version: string, createdBy: string | null = null): Promise<number> {
  const rows = await db.insert(boms_int).values({
    product_name: productName,
    version,
    is_active: true,
    created_by: createdBy,
    items: [],
  }).onConflictDoNothing().returning({ id: boms_int.id });
  return rows[0]?.id ?? 0;
}

export async function queryBom(id: number): Promise<DbRow | null> {
  const rows = await db.select().from(boms_int).where(eq(boms_int.id, id)).limit(1);
  return (rows[0] ?? null) as DbRow | null;
}

export async function queryBomByProduct(productId: number): Promise<DbRow | null> {
  const rows = await db.select().from(boms_int)
    .where(eq(boms_int.product_name, String(productId)))
    .orderBy(sql`${boms_int.version} DESC`)
    .limit(1);
  return (rows[0] ?? null) as DbRow | null;
}

export async function execSaveRouting(productId: number, name: string, version: number, createdBy: string | null = null): Promise<number> {
  type RoutingInsert = typeof routings_int.$inferInsert;
  const rows = await db.insert(routings_int).values({
    routingNumber: name,
    productId: productId,
    version,
    createdBy: createdBy != null ? Number(createdBy) : undefined,
  } as RoutingInsert).onConflictDoNothing().returning({ id: routings_int.id });
  void productId; void version;
  return rows[0]?.id ?? 0;
}

export async function queryRouting(id: number): Promise<DbRow | null> {
  const rows = await db.select().from(routings_int).where(eq(routings_int.id, id)).limit(1);
  return (rows[0] ?? null) as DbRow | null;
}

export async function queryRoutingByProduct(productId: number): Promise<DbRow | null> {
  const rows = await db.select().from(routings_int)
    .where(eq(routings_int.routingNumber, String(productId)))
    .orderBy(sql`${routings_int.createdAt} DESC`)
    .limit(1);
  return (rows[0] ?? null) as DbRow | null;
}

/**
 * Golden-thread SD→PP: how many production orders already reference this sales order.
 * Used by the sales-order-ready listener for idempotency (skip if a plan exists).
 * `sales_order_id` is a live column (varchar FK → sales_orders serial PK); Postgres
 * coerces the numeric id, matching the existing execSavePo / execUnlockPlanning pattern.
 */
export async function countPoBySalesOrder(salesOrderId: number): Promise<number> {
  const rows = await db
    .select({ id: production_orders_int.id })
    .from(production_orders_int)
    .where(eq(production_orders_int.salesOrderId, String(salesOrderId)));
  return Array.isArray(rows) ? rows.length : 0;
}

/**
 * Golden-thread SD→PP: read the finished-good lines of a confirmed sales order so the
 * listener can open a production order per line. `product_id` is the finished good
 * (sales_order_items.product_id → products.id; matches production_orders.product_id
 * NOT NULL FK). Only lines with a resolved product_id can become a production order.
 */
export async function querySalesOrderItemsForPlanning(
  salesOrderId: number,
): Promise<Array<{ productId: number; quantity: number; unit: string | null }>> {
  const rows = await db.execute<DbRow>(sql`
    SELECT product_id AS "productId",
           order_quantity AS "quantity",
           unit AS "unit"
    FROM sales_order_items
    WHERE sales_order_id = ${salesOrderId}
      AND product_id IS NOT NULL
    ORDER BY id ASC
  `);
  const list = Array.isArray((rows as { rows?: DbRow[] }).rows)
    ? (rows as { rows: DbRow[] }).rows
    : (Array.isArray(rows) ? (rows as DbRow[]) : []);
  return list.map((r) => ({
    productId: Number(r['productId']),
    quantity: Number(r['quantity'] ?? 1) || 1,
    unit: r['unit'] != null ? String(r['unit']) : null,
  }));
}

/**
 * Golden-thread SD→PP: open ONE production order for a confirmed sales-order line.
 * Reuses the production_orders table (no duplication). bom_id/routing_id stay NULL —
 * the technologist resolves them later; product_id (NOT NULL FK) + sales_order_id link
 * the plan back to the order. Status 'created' = freshly planned (MPS line).
 */
export async function execCreatePlanLine(
  salesOrderId: number,
  productId: number,
  plannedQuantity: number,
  unit: string | null,
  createdBy: number | null = null,
): Promise<number> {
  type PoInsert = typeof production_orders_int.$inferInsert;
  const rows = await db
    .insert(production_orders_int)
    .values({
      status: 'created',
      salesOrderId: String(salesOrderId),
      productId,
      plannedQuantity: plannedQuantity > 0 ? plannedQuantity : 1,
      orderNumber: await nextDocNumber('PO'),
      unit: unit ?? undefined,
      createdBy: createdBy ?? undefined,
    } as PoInsert)
    .returning({ id: production_orders_int.id });
  return rows[0]?.id ?? 0;
}

export async function execUnlockPlanning(orderId: number): Promise<void> {
  // #03 HOP-1 fix: the caller (advance-approved.listener) passes the SALES order id, and the SD fan-out
  // creates production_orders keyed by sales_order_id — so transition planning by sales_order_id, NOT id
  // (the old `WHERE id = orderId` matched the sales id against the PO PK → UPDATEd 0 rows = dead Trigger-7).
  // Only move not-yet-finished POs into planning. Raw parametrized SQL (sales_order_id is a live column).
  await db.execute(sql`
    UPDATE production_orders SET status = 'pending', updated_at = NOW()
    WHERE sales_order_id = ${orderId} AND status NOT IN ('completed', 'cancelled')
  `);
}

export async function queryProductionPlan(startDate: Date, endDate: Date): Promise<DbRow[]> {
  const rows = await db.select().from(production_orders_int)
    .where(and(gte(production_orders_int.plannedStartDate, String(startDate)), lte(production_orders_int.plannedStartDate, String(endDate))));
  return rows as DbRow[];
}

export async function queryMachineLoad(workCenterId: number): Promise<DbRow[]> {
  const rows = await db.select().from(routing_operations_int)
    .where(eq(routing_operations_int.workCenterId, workCenterId));
  return rows as DbRow[];
}
