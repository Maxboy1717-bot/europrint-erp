/**
 * @module queries-sd
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import {
  sd_customers, sd_customer_contacts, sd_customer_documents,
  sd_customer_competitors, sd_sales_orders,
  ai_report_subscriptions, ai_report_categories,
} from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';

type Row = Record<string, unknown>;

export async function execSdCustomerSoftDelete(cid: number): Promise<void> {
  await db.update(sd_customers)
    .set({ status: 'deleted', updated_at: sql`NOW()` })
    .where(eq(sd_customers.id, cid));
}

export async function execSdContactDelete(kid: number, cid: number): Promise<void> {
  await db.delete(sd_customer_contacts)
    .where(and(eq(sd_customer_contacts.id, kid), eq(sd_customer_contacts.customerId, cid)));
}

export async function execSdDocumentDelete(did: number, cid: number): Promise<void> {
  await db.delete(sd_customer_documents)
    .where(and(eq(sd_customer_documents.id, did), eq(sd_customer_documents.customerId, cid)));
}

export async function execSdCompetitorDelete(competitorId: number, customerId: number): Promise<void> {
  await db.delete(sd_customer_competitors)
    .where(and(eq(sd_customer_competitors.id, competitorId), eq(sd_customer_competitors.customerId, customerId)));
}

export async function execSdLeadDelete(lid: number): Promise<void> {
  // STEP 1b: soft-delete on canonical crm_leads (was a hard delete on the sd_leads view;
  // crm_leads has 5 real rows and readers filter `deleted_at IS NULL`, so soft is correct).
  await db.execute(sql`UPDATE crm_leads SET deleted_at = NOW() WHERE id = ${lid}`);
}

export async function execSdLeadConvert(lid: number): Promise<void> {
  await db.execute(sql`UPDATE crm_leads SET status = 'converted', updated_at = NOW() WHERE id = ${lid}`);
}

export async function execSdSalesOrderInsert(
  orderNumber: string, status: string, companyId: unknown,
  totalAmount: unknown, createdBy: unknown,
  /**
   * Optional Drizzle transaction executor. When provided, the insert runs on
   * the transaction so it shares atomicity with sibling writes (PA0-6 outbox).
   * Typed as `unknown` to keep this shared helper agnostic of Drizzle internals;
   * the runtime type is the same `tx` returned by `db.transaction(async tx => ...)`.
   */
  tx?: unknown,
  /** #03 golden-thread HOP-0: the customer link — previously dropped, leaving every API order customer_id=NULL. */
  customerId?: number | null,
): Promise<number> {
  const conn = (tx as typeof db | undefined) ?? db;
  const rows = await conn.insert(sd_sales_orders).values({
    order_number: orderNumber,
    status,
    company_id: companyId as number,
    customer_id: customerId ?? null,
    total_amount: String(totalAmount),
    advance_required: 70,
    advance_paid: '0',
    advance_status: 'pending',
    design_flag: false,
    sample_flag: false,
    // ⚠️ Pre-existing schema drift: live sales_orders.created_by is UUID but app user ids are integer
    // (no integer creator column exists). Sending the integer user.id threw "uuid vs integer" — which is
    // WHY no order ever flowed the API path (all 12 live orders are seed, created_by NULL). Insert NULL to
    // unblock the golden thread (matches seed); integer-creator tracking = a later schema-drift cleanup.
    created_by: null,
  }).onConflictDoNothing().returning({ id: sd_sales_orders.id });
  // Normal path: the INSERT returns the new serial id. On conflict (duplicate
  // order_number) returning is empty — fall back to looking up the existing row
  // so the caller still gets the real id (idempotent create) instead of 0.
  const newId = rows[0]?.id != null
    ? Number(rows[0].id)
    : await (async () => {
        const existing = await conn
          .select({ id: sd_sales_orders.id })
          .from(sd_sales_orders)
          .where(eq(sd_sales_orders.order_number, orderNumber))
          .limit(1);
        return existing[0]?.id != null ? Number(existing[0].id) : 0;
      })();

  // T7-01 (Golden): backfill the SAP-style document_number + overall_status on
  // the freshly-created row. The `sd_sales_orders` Drizzle stub does not map
  // these two columns, but they exist on the underlying `sales_orders` base
  // table (the auto-updatable view forwards the write), and create handlers were
  // never setting them → every API order landed with document_number/overall_status NULL.
  //   • document_number = the generated SO-YYYY-NNNNNN (already UNIQUE via the
  //     order_number constraint — 1:1 with order_number), satisfying the
  //     "SO-YYYY-NNNNNN unique" contract without a second sequence.
  //   • overall_status = 'IN_PROCESS' — the schema default + golden-thread entry state.
  // Runs on `conn` so it is atomic with the order INSERT (and, when a tx is passed,
  // with the sibling outbox write). Only fills NULLs so a re-run / idempotent
  // create never clobbers an existing value.
  if (newId > 0) {
    await conn.execute(sql`
      UPDATE sales_orders
         SET document_number = COALESCE(document_number, ${orderNumber}),
             overall_status  = COALESCE(overall_status, 'IN_PROCESS')
       WHERE id = ${newId}
    `);
  }
  return newId;
}

export async function execSdSalesOrderUpdate(
  status: string,
  advanceStatus: string,
  id: unknown,
  /**
   * Optional Drizzle transaction executor. When provided the status UPDATE runs
   * on the transaction so it shares atomicity with the sibling outbox insert —
   * the golden-thread `OrderStatusChanged` event is persisted in the SAME tx as
   * the status write (PA0-6 pattern, mirrors execSdSalesOrderInsert). Typed as
   * `unknown` to keep this shared helper agnostic of Drizzle internals.
   */
  tx?: unknown,
): Promise<void> {
  const conn = (tx as typeof db | undefined) ?? db;
  await conn.update(sd_sales_orders)
    .set({ status, advance_status: advanceStatus, updated_at: sql`NOW()` })
    .where(eq(sd_sales_orders.id, id as number));
}

export async function execSdSalesOrderDelete(id: number): Promise<void> {
  await db.delete(sd_sales_orders).where(eq(sd_sales_orders.id, id));
}

export async function querySdReportsAiCategories(): Promise<Row[]> {
  const rows = await db.select().from(ai_report_subscriptions).limit(0);
  return rows as Row[];
}

export async function execAiReportSubscriptionDelete(id: number, userId: number): Promise<void> {
  await db.delete(ai_report_subscriptions)
    .where(and(eq(ai_report_subscriptions.id, id), eq(ai_report_subscriptions.user_id, userId)));
}

export async function execAiReportCategoriesSeed(): Promise<void> {
  await db.insert(ai_report_categories).values([
    { name: 'Moliya',             slug: 'finance',    description: 'Финансы' },
    { name: 'HR',                 slug: 'hr',         description: 'Кадры' },
    { name: 'Ishlab chiqarish',   slug: 'production', description: 'Производство' },
    { name: 'Savdo',              slug: 'sales',      description: 'Продажи' },
    { name: 'Logistika',          slug: 'logistics',  description: 'Логистика' },
  ]).onConflictDoNothing();
}
