import { db } from '@shared/db';
import { boms_int, routings_int, production_orders_int, routing_operations_int } from '@shared/db';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

type DbRow = Record<string, unknown>;

export async function execSavePo(
  soId: number | null, status: string, bomId: number | null,
  routingId: number | null, plannedStart: unknown, plannedEnd: unknown,
  createdBy: string | null = null,
): Promise<void> {
  await db.insert(production_orders_int).values({
    sales_order_id: soId,
    status,
    bom_id: bomId,
    routing_id: routingId,
    scheduled_start: plannedStart as Date | null,
    scheduled_end: plannedEnd as Date | null,
    order_number: `PO-${Date.now()}`,
    product_name: 'Production Order',
    quantity: 1,
    unit: 'pcs',
    created_by: createdBy,
  }).onConflictDoNothing();
}

export async function queryPo(id: number): Promise<DbRow | null> {
  const rows = await db.select().from(production_orders_int).where(eq(production_orders_int.id, id)).limit(1);
  return (rows[0] ?? null) as DbRow | null;
}

export async function queryPoByStatus(status: string): Promise<DbRow[]> {
  const rows = await db.select().from(production_orders_int).where(eq(production_orders_int.status, status));
  return rows as DbRow[];
}

export async function execSaveBom(productName: string, version: string, createdBy: string | null = null): Promise<void> {
  await db.insert(boms_int).values({
    product_name: productName,
    version,
    is_active: true,
    created_by: createdBy,
    items: [],
  }).onConflictDoNothing();
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

export async function execSaveRouting(productId: number, createdBy: string | null = null): Promise<void> {
  await db.insert(routings_int).values({
    name: String(productId),
    is_active: true,
    created_by: createdBy,
    steps: [],
    work_centers: [],
  }).onConflictDoNothing();
}

export async function queryRouting(id: number): Promise<DbRow | null> {
  const rows = await db.select().from(routings_int).where(eq(routings_int.id, id)).limit(1);
  return (rows[0] ?? null) as DbRow | null;
}

export async function queryRoutingByProduct(productId: number): Promise<DbRow | null> {
  const rows = await db.select().from(routings_int)
    .where(eq(routings_int.name, String(productId)))
    .orderBy(sql`${routings_int.created_at} DESC`)
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
    .where(and(gte(production_orders_int.scheduled_start, startDate), lte(production_orders_int.scheduled_start, endDate)));
  return rows as DbRow[];
}

export async function queryMachineLoad(workCenterId: number): Promise<DbRow[]> {
  const rows = await db.select().from(routing_operations_int)
    .where(eq(routing_operations_int.work_center_id, workCenterId));
  return rows as DbRow[];
}
