/**
 * @module queries-sd
 * @description Source module. See exports for details.
 */

import { db } from '@shared/db';
import {
  sd_customer_contacts, sd_customer_documents,
  sd_customer_competitors, sd_sales_orders,
  ai_report_subscriptions, ai_report_categories,
} from '@shared/db';
import { eq, and, sql } from 'drizzle-orm';
import { DEFAULT_ADVANCE_PERCENT } from '@common/constants/business.constants';

type Row = Record<string, unknown>;

/**
 * VISION-3340 #63: sd_customers.deleted_at/deleted_by exist live (A89 boot migration —
 * see apps/api/src/shared/db/invariants/migrations-drift.ts:3908-3909) but are NOT mapped
 * on the Drizzle `sdCustomers` pgTable (lib/db/src/schema/sd-europrint-schema.ts), so the
 * Drizzle query-builder's `.set()` cannot target them type-safely. Raw SQL is used here
 * (same pattern as execSdLeadDelete below) so both audit columns are populated in the
 * SAME UPDATE as the status flip, instead of leaving them NULL forever.
 */
export async function execSdCustomerSoftDelete(cid: number, deletedBy?: number): Promise<void> {
  await db.execute(sql`
    UPDATE sd_customers
       SET status = 'deleted', updated_at = NOW(), deleted_at = NOW(), deleted_by = ${deletedBy ?? null}
     WHERE id = ${cid}
  `);
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
  /**
   * 2.6 golden-thread: the originating CRM lead (crm_leads.id), when the order was
   * created via a Deal that itself originated from a Lead (Lead→Deal→Won→Order chain).
   * The `sd_sales_orders` view does not expose crm_lead_id, so — like created_by_user_id
   * above — it is written on the base `sales_orders` table in the post-insert UPDATE.
   */
  crmLeadId?: number | null,
  /** Bespoke-job print flags — previously hardcoded false, silently dropping the
   * command's real designFlag/sampleFlag on every insert (see create-order.handler.ts,
   * which still fires the DesignRequired event off the in-memory command value, so
   * the event itself was never affected — only the persisted sales_orders row was wrong,
   * breaking any later re-read of design_flag e.g. after a server restart). */
  designFlag?: boolean,
  sampleFlag?: boolean,
  currency?: string,
): Promise<number> {
  const conn = (tx as typeof db | undefined) ?? db;
  const rows = await conn.insert(sd_sales_orders).values({
    order_number: orderNumber,
    status,
    company_id: companyId as number,
    customer_id: customerId ?? null,
    total_amount: String(totalAmount),
    currency: currency ?? 'UZS',
    advance_required: DEFAULT_ADVANCE_PERCENT,
    advance_paid: '0',
    advance_status: 'pending',
    design_flag: designFlag ?? false,
    sample_flag: sampleFlag ?? false,
    // ⚠️ Pre-existing schema drift: live sales_orders.created_by is UUID but app user ids are integer.
    // The integer creator now lands in sales_orders.created_by_user_id (T8-01 column, FK→users) via the
    // post-insert UPDATE below — the `sd_sales_orders` view does not expose that column, so it cannot be
    // set on this Drizzle INSERT. `created_by` (uuid) stays NULL (matches the seed rows).
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
    // T12-01 (writer-wire): the integer creator (user.id from the controller's
    // @CurrentUser, threaded through CreateOrderCommand.createdBy) is written to
    // sales_orders.created_by_user_id (T8-01 column, FK→users ON DELETE SET NULL).
    // The `sd_sales_orders` view does not expose this column, so it is set here on
    // the base table in the same `conn` (atomic with the INSERT / outbox tx).
    // Only a real positive integer is written; COALESCE never clobbers an existing
    // value, so an idempotent re-run is safe. No fabrication — NULL when no creator.
    const creatorId = Number(createdBy);
    const createdByUserId = Number.isInteger(creatorId) && creatorId > 0 ? creatorId : null;
    // 2.6: only a real positive integer is written; COALESCE never clobbers an
    // existing value. No fabrication — NULL when the order has no lead origin.
    const leadIdNum = Number(crmLeadId);
    const crmLeadIdVal = Number.isInteger(leadIdNum) && leadIdNum > 0 ? leadIdNum : null;
    await conn.execute(sql`
      UPDATE sales_orders
         SET document_number    = COALESCE(document_number, ${orderNumber}),
             overall_status     = COALESCE(overall_status, 'IN_PROCESS'),
             created_by_user_id = COALESCE(created_by_user_id, ${createdByUserId}),
             crm_lead_id        = COALESCE(crm_lead_id, ${crmLeadIdVal})
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
  /**
   * Technolog 3-checkpoint flags (Algoritm 11.2 §9) — golden-thread SD→PP gate.
   * ApproveTechCheckpointHandler flips these on the in-memory SalesOrder
   * aggregate via approveTechCheckpoint(), but DrizzleSalesOrderRepository.update()
   * previously called this function with only status/advanceStatus, so the 3
   * flags were silently dropped: every re-read (findById) lost the prior
   * approval(s) and isThreeCheckpointPassed() could never go true across
   * separate API calls. Optional so the single caller (repo.update()) can keep
   * a 1:1 mapping to the aggregate; undefined leaves the column untouched.
   */
  techBomApproved?: boolean,
  techRoutingApproved?: boolean,
  techCardApproved?: boolean,
): Promise<void> {
  const conn = (tx as typeof db | undefined) ?? db;
  await conn.update(sd_sales_orders)
    .set({ status, advance_status: advanceStatus, updated_at: sql`NOW()` })
    .where(eq(sd_sales_orders.id, id as number));

  // The sd_sales_orders Drizzle stub (schema-ext-a-1.ts) does not map
  // tech_bom_approved/tech_routing_approved/tech_card_approved, so they cannot be
  // targeted through the typed .set() above. Written directly on the base
  // sales_orders table instead (same `conn`, so still atomic with the status
  // UPDATE and any sibling outbox write when `tx` is passed) — same established
  // pattern as markPendingMaterial() / execSdSalesOrderInsert's post-insert UPDATE.
  // COALESCE(param, column) so a caller that only knows a subset of the 3 flags
  // never clobbers the other two back to their old value.
  if (techBomApproved !== undefined || techRoutingApproved !== undefined || techCardApproved !== undefined) {
    await conn.execute(sql`
      UPDATE sales_orders
         SET tech_bom_approved     = COALESCE(${techBomApproved ?? null}, tech_bom_approved),
             tech_routing_approved = COALESCE(${techRoutingApproved ?? null}, tech_routing_approved),
             tech_card_approved    = COALESCE(${techCardApproved ?? null}, tech_card_approved),
             updated_at            = NOW()
       WHERE id = ${id as number}
    `);
  }
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
