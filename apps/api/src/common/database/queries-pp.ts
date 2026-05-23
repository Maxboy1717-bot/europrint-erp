/**
 * @module queries-pp
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import { boms_int, routings_int, production_orders_int, routing_operations_int } from '@shared/db';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

type DbRow = Record<string, unknown>;

export async function execSavePo(
  soId: number | null, status: string, bomId: number | null,
  routingId: number | null, plannedStart: unknown, plannedEnd: unknown,
  createdBy: string | null = null,
): Promise<number> {
  type PoInsert = typeof production_orders_int.$inferInsert;
  const rows = await db.insert(production_orders_int).values({
    status,
    bomId: bomId,
    routingId: routingId,
    plannedStartDate: plannedStart != null ? String(plannedStart) : undefined,
    plannedEndDate: plannedEnd != null ? String(plannedEnd) : undefined,
    orderNumber: `PO-${Date.now()}`,
    plannedQuantity: 1,
    createdBy: createdBy != null ? Number(createdBy) : undefined,
  } as PoInsert).returning({ id: production_orders_int.id });
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

export async function execUnlockPlanning(orderId: number): Promise<void> {
  await db.update(production_orders_int)
    .set({ status: 'pending' })
    .where(eq(production_orders_int.id, orderId));
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
