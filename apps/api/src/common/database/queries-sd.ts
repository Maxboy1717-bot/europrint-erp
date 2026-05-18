/**
 * @module queries-sd
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import {
  sd_customers, sd_customer_contacts, sd_customer_documents,
  sd_customer_competitors, sdLeads, sd_sales_orders,
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
    .where(and(eq(sd_customer_contacts.id, kid), eq(sd_customer_contacts.customer_id, cid)));
}

export async function execSdDocumentDelete(did: number, cid: number): Promise<void> {
  await db.delete(sd_customer_documents)
    .where(and(eq(sd_customer_documents.id, did), eq(sd_customer_documents.customer_id, cid)));
}

export async function execSdCompetitorDelete(competitorId: number, customerId: number): Promise<void> {
  await db.delete(sd_customer_competitors)
    .where(and(eq(sd_customer_competitors.id, competitorId), eq(sd_customer_competitors.customer_id, customerId)));
}

export async function execSdLeadDelete(lid: number): Promise<void> {
  await db.delete(sdLeads).where(eq(sdLeads.id, lid));
}

export async function execSdLeadConvert(lid: number): Promise<void> {
  await db.update(sdLeads)
    .set({ status: 'converted', updated_at: sql`NOW()` })
    .where(eq(sdLeads.id, lid));
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
): Promise<void> {
  const conn = (tx as typeof db | undefined) ?? db;
  await conn.insert(sd_sales_orders).values({
    order_number: orderNumber,
    status,
    company_id: companyId as number,
    total_amount: String(totalAmount),
    advance_required: 70,
    advance_paid: '0',
    advance_status: 'pending',
    design_flag: false,
    sample_flag: false,
    created_by: (createdBy ?? 0) as number,
  }).onConflictDoNothing();
}

export async function execSdSalesOrderUpdate(status: string, advanceStatus: string, id: unknown): Promise<void> {
  await db.update(sd_sales_orders)
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
