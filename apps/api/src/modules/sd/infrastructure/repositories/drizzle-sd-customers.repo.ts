/**
 * @module drizzle-sd-customers.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries.
 *   Customer 360 builder/helpers and contact/NPS/docs/competitor sub-ops live
 *   in ./drizzle-sd-customers/ to satisfy Rule 16 (file size).
 */

import { Injectable, ConflictException } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { execSdCustomerSoftDelete } from '@common/database/queries-sd';
import { mapSegment } from './drizzle-sd-customers/customer-360.helpers';
import { buildCustomer360View } from './drizzle-sd-customers/customer-360.builder';
import * as subOps from './drizzle-sd-customers/contacts-nps.repo';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleSdCustomersRepository {
  private mapSegment(status: string | null | undefined): string { return mapSegment(status); }

  async list(pat: string | null, status: string | undefined, lim: number, off: number): Promise<Row[]> {
    const dbStatus = status === 'regular' ? 'active' : status === 'vip' ? 'vip' : status === 'potential' ? 'at_risk' : status === 'new' ? 'new' : status;
    const rows = await runQuery<Row>(sql`
      SELECT c.id, c.name, c.stir, c.status, c.actual_address, c.notes,
             c.credit_limit, c.payment_terms_days, c.industry, c.website,
             COUNT(DISTINCT o.id)::int AS "totalOrders",
             COALESCE(SUM(o.total_value), 0)::numeric(15,2) AS "totalRevenue",
             -- Audit 2026-08-06 (SD/CRM): the customer card asks for open debt and lifetime
             -- value; the query only ever returned totalRevenue, so both rendered empty.
             -- Correlated subqueries (not another JOIN) so the invoice rows cannot multiply
             -- the sales_orders aggregate above. Same predicates the canonical AR-aging
             -- handler uses, so the two screens cannot disagree.
             COALESCE((
               SELECT SUM(fi.total_amount - COALESCE(fi.paid_amount, 0))
               FROM finance_invoices fi
               WHERE fi.customer_id = c.id
                 AND fi.payment_status NOT IN ('paid', 'cancelled', 'void')
                 AND COALESCE(fi.invoice_type, 'sales') = 'sales'
                 AND fi.total_amount > COALESCE(fi.paid_amount, 0)
             ), 0)::numeric(15,2) AS "openDebt",
             COALESCE((
               SELECT SUM(COALESCE(fi.paid_amount, 0))
               FROM finance_invoices fi
               WHERE fi.customer_id = c.id
                 AND COALESCE(fi.invoice_type, 'sales') = 'sales'
                 AND fi.payment_status <> 'cancelled'
             ), 0)::numeric(15,2) AS "lifetimeValue"
      FROM sd_customers c LEFT JOIN sales_orders o ON o.customer_id = c.id
      WHERE c.status != 'deleted' AND c.deleted_at IS NULL
        AND (${pat}::text IS NULL OR c.name ILIKE ${pat} OR c.stir ILIKE ${pat})
        AND (${dbStatus ?? null}::text IS NULL OR c.status = ${dbStatus ?? null})
      GROUP BY c.id, c.name, c.stir, c.status, c.actual_address, c.notes,
               c.credit_limit, c.payment_terms_days, c.industry, c.website
      ORDER BY c.name LIMIT ${lim} OFFSET ${off}
    `);
    return (rows.rows as Row[]).map(r => ({
      ...r,
      totalOrders: Number(r.totalOrders ?? 0),
      totalRevenue: Number(r.totalRevenue ?? 0),
      openDebt: Number(r.openDebt ?? 0),
      lifetimeValue: Number(r.lifetimeValue ?? 0),
      creditLimit: Number(r.credit_limit ?? 0),
      actualAddress: r.actual_address ?? null,
      segment: this.mapSegment(String(r.status ?? '')),
    }));
  }

  async getById(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT c.*, c.actual_address,
             COUNT(DISTINCT o.id)::int AS "totalOrders",
             COALESCE(SUM(o.total_value), 0)::numeric(15,2) AS "totalRevenue",
             -- Same open-debt / lifetime-value pair as list(); see the comment there.
             COALESCE((
               SELECT SUM(fi.total_amount - COALESCE(fi.paid_amount, 0))
               FROM finance_invoices fi
               WHERE fi.customer_id = c.id
                 AND fi.payment_status NOT IN ('paid', 'cancelled', 'void')
                 AND COALESCE(fi.invoice_type, 'sales') = 'sales'
                 AND fi.total_amount > COALESCE(fi.paid_amount, 0)
             ), 0)::numeric(15,2) AS "openDebt",
             COALESCE((
               SELECT SUM(COALESCE(fi.paid_amount, 0))
               FROM finance_invoices fi
               WHERE fi.customer_id = c.id
                 AND COALESCE(fi.invoice_type, 'sales') = 'sales'
                 AND fi.payment_status <> 'cancelled'
             ), 0)::numeric(15,2) AS "lifetimeValue"
      FROM sd_customers c
      LEFT JOIN sales_orders o ON o.customer_id = c.id
      WHERE c.id = ${cid} AND c.status != 'deleted' AND c.deleted_at IS NULL
      GROUP BY c.id
    `);
    return (rows.rows as Row[]).map(r => ({
      ...r,
      totalOrders: Number(r.totalOrders ?? 0),
      totalRevenue: Number(r.totalRevenue ?? 0),
      openDebt: Number(r.openDebt ?? 0),
      lifetimeValue: Number(r.lifetimeValue ?? 0),
      creditLimit: Number(r.credit_limit ?? 0),
      actualAddress: r.actual_address ?? null,
      segment: this.mapSegment(String(r.status ?? '')),
    }));
  }

  /**
   * EP-SD-060/061/062 credit-limit check: a customer's credit_limit vs current outstanding (pending
   * payments) + the requested order amount. Returns withinLimit + a flag (AI flags → human decides, E1 —
   * never auto-blocks). credit_limit=0 means "no limit set" → always within.
   */
  async getCreditStatus(cid: number, amount: number): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      SELECT c.id, COALESCE(c.credit_limit, 0)::numeric AS credit_limit,
             COALESCE((SELECT SUM(p.amount) FROM sd_payments p
                       WHERE p.customer_id = c.id AND p.status = 'pending'), 0)::numeric AS outstanding
      FROM sd_customers c WHERE c.id = ${cid} AND c.status != 'deleted' AND c.deleted_at IS NULL
    `);
    const row = rows.rows[0] as Row | undefined;
    if (!row) return { found: false };
    const creditLimit = Number(row.credit_limit ?? 0);
    const outstanding = Number(row.outstanding ?? 0);
    const available = creditLimit - outstanding;
    const exceeds = creditLimit > 0 && outstanding + amount > creditLimit;
    return {
      found: true, customer_id: cid, credit_limit: creditLimit, outstanding, available,
      requested_amount: amount, within_limit: !exceeds,
      flag: exceeds ? `Kredit-limit oshib ketadi: mavjud ${available}, so'ralgan ${amount} — direktor tasdig'i kerak (EP-SD-061)` : null,
    };
  }

  async get360View(cid: number): Promise<Record<string, unknown>> {
    const safe = async (q: ReturnType<typeof runQuery<Row>>) =>
      q.then(r => r.rows as Row[]).catch(() => [] as Row[]);

    const [customerRows, ordersRows, contactsRows, documentsRows, interactionsRows, competitorsRows, paymentsRows, npsRows, productsRows] = await Promise.all([
      safe(runQuery<Row>(sql`SELECT * FROM sd_customers WHERE id = ${cid}`)),
      safe(runQuery<Row>(sql`
        SELECT id, document_number AS order_number, overall_status AS status,
               total_value AS total_amount, currency, created_at, delivery_date,
               EXTRACT(YEAR FROM created_at)::int AS order_year,
               EXTRACT(MONTH FROM created_at)::int AS order_month
        FROM sales_orders WHERE customer_id = ${cid} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 100
      `)),
      safe(runQuery<Row>(sql`
        SELECT id, customer_id, full_name, position, phone, email, telegram,
               is_primary, department, influence_level, is_decision_maker,
               linkedin_url, role_note, created_at
        FROM sd_customer_contacts WHERE customer_id = ${cid}
        ORDER BY is_decision_maker DESC, influence_level DESC, is_primary DESC, full_name
      `)),
      safe(runQuery<Row>(sql`SELECT * FROM sd_customer_documents WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 30`)),
      safe(runQuery<Row>(sql`
        SELECT i.id, i.type, i.notes, i.direction, i.subject, i.outcome,
               i.next_action, i.next_action_date, i.interaction_date, i.created_at,
               i.satisfaction_rating, i.sentiment_score,
               COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name
        FROM sd_customer_interactions i
        LEFT JOIN employees e ON e.id::text = i.employee_id::text
        WHERE i.customer_id = ${cid} ORDER BY i.created_at DESC LIMIT 50
      `)),
      safe(runQuery<Row>(sql`SELECT * FROM sd_customer_competitors WHERE customer_id = ${cid} ORDER BY competitor_name`)),
      // Bug fix 2026-07-13 (found while verifying a user-reported 500): sd_payments has no
      // payment_date column (live: id/invoice_id/amount/currency/payment_method/
      // reference_number/paid_at/recorded_by/notes/created_at/order_id/customer_id/type/
      // status/due_date/paid_date/overdue_days/created_by/updated_at — confirmed via psql
      // \d). The query didn't crash the request (wrapped in safe() -> []) but silently
      // returned zero payment history for every customer, always (Q-40 "ishlaydi lekin
      // noto'g'ri"). paid_date is the correct column for "when was this paid" ordering;
      // NULLS LAST keeps not-yet-paid rows visible instead of hiding them at a random position.
      safe(runQuery<Row>(sql`SELECT * FROM sd_payments WHERE customer_id = ${cid} ORDER BY paid_date DESC NULLS LAST LIMIT 50`)),
      safe(runQuery<Row>(sql`
        SELECT id, score, comment, created_at,
               CASE WHEN score >= 9 THEN 'promoter' WHEN score >= 7 THEN 'passive' ELSE 'detractor' END AS category
        FROM nps_responses WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 20
      `)),
      // SB0611/EP-SD (decisions/06-sd.md:470) "mijoz kartasida mahsulotlar arxivi jadvali
      // (sana/tiraj/narx/dizayn link)" — per-product order history for this customer.
      safe(runQuery<Row>(sql`
        SELECT soi.id, soi.sales_order_id, so.document_number AS order_number,
               soi.description AS product_name, soi.material_number,
               soi.order_quantity, soi.unit, soi.net_price, soi.total_price,
               so.created_at AS order_date, so.delivery_date, so.overall_status AS order_status
        FROM sales_order_items soi
        JOIN sales_orders so ON so.id = soi.sales_order_id
        WHERE so.customer_id = ${cid} AND so.deleted_at IS NULL
        ORDER BY so.created_at DESC LIMIT 200
      `)),
    ]);

    return buildCustomer360View({
      customerRows, ordersRows, contactsRows, documentsRows,
      interactionsRows, competitorsRows, paymentsRows, npsRows, productsRows,
    });
  }

  /**
   * Owner decision 2026-07-13: ownership lookup for the update() authorization gate
   * (SdCustomersService.update() / sd-customer-scope.ts). Deliberately unfiltered by
   * status/deleted_at — mirrors update()'s own WHERE id = cid below, so the ownership
   * check always sees exactly the row the UPDATE would touch.
   */
  async getOwnerId(cid: number): Promise<Row | undefined> {
    const rows = await runQuery<Row>(sql`
      SELECT id, manager_id FROM sd_customers WHERE id = ${cid}
    `);
    return rows.rows[0] as Row | undefined;
  }

  async update(cid: number, body: Row, updatedBy?: number): Promise<Row[]> {
    const { name, title, stir, inn, phone, email, address, status, notes } = body;
    const finalName = name ?? title ?? null;
    const finalStir = stir ?? inn ?? null;
    // CRM-13 #120: default_payment_type — validated upstream by SdUpdateCustomerSchema
    // (sd.dto.ts) against the existing SD payment-method vocabulary (cash/card/bank_transfer/online).
    const defaultPaymentType = body.default_payment_type ?? body.defaultPaymentType ?? null;
    // CRM-13 #133 — agreed packaging method; accept either camelCase or snake_case body key.
    const packagingMethod = (body.packagingMethod ?? body.packaging_method ?? null) as string | null;
    const rows = await runQuery<Row>(sql`
      UPDATE sd_customers
      SET name = COALESCE(${finalName}, name),
          stir = COALESCE(${finalStir}, stir),
          inn = COALESCE(${finalStir}, inn),
          phone = COALESCE(${phone ?? null}, phone),
          email = COALESCE(${email ?? null}, email),
          address = COALESCE(${address ?? null}, address),
          status = COALESCE(${status ?? null}, status),
          notes = COALESCE(${notes ?? null}, notes),
          default_payment_type = COALESCE(${defaultPaymentType}, default_payment_type),
          packaging_method = COALESCE(${packagingMethod}, packaging_method),
          updated_by = COALESCE(${updatedBy ?? null}, updated_by),
          updated_at = NOW()
      WHERE id = ${cid} RETURNING *
    `);
    return rows.rows as Row[];
  }

  /**
   * B11 duplicate-prevention: reject create when an existing, non-deleted
   * customer already matches on the same natural business key (tax id / STIR,
   * or phone — the only near-unique identifying fields this table has; there
   * is no DB-level unique constraint on either, see EXTENDED-GOVERNANCE-CHECK
   * 2026-07-04 B11). Name is intentionally NOT matched — legitimate distinct
   * companies/customers can share a common name.
   */
  private async findDuplicate(finalStir: unknown, phone: unknown): Promise<Row | undefined> {
    const stirVal = finalStir ? String(finalStir) : null;
    const phoneVal = phone ? String(phone) : null;
    if (!stirVal && !phoneVal) return undefined;
    const rows = await runQuery<Row>(sql`
      SELECT id, name, stir, phone FROM sd_customers
      WHERE deleted_at IS NULL AND status != 'deleted'
        AND ((${stirVal}::text IS NOT NULL AND stir = ${stirVal})
          OR (${phoneVal}::text IS NOT NULL AND phone = ${phoneVal}))
      LIMIT 1
    `);
    return rows.rows[0] as Row | undefined;
  }

  async create(body: Row, createdBy?: number): Promise<Row> {
    const { name, title, stir, inn, phone, email, address, notes } = body;
    const finalName = name ?? title ?? 'Nomsiz';
    const finalStir = stir ?? inn ?? null;
    const seg = String(body.segment ?? 'new');
    const dbStatus = seg === 'vip' ? 'vip' : seg === 'regular' ? 'active' : seg === 'potential' ? 'at_risk' : 'new';
    const actualAddress = body.actualAddress ?? body.actual_address ?? address ?? null;
    // CRM-13 #120: default_payment_type — validated upstream by CreateCustomerSchema
    // (this controller) against the existing SD payment-method vocabulary.
    const defaultPaymentType = body.default_payment_type ?? body.defaultPaymentType ?? null;
    // CRM-13 #133 — agreed packaging method; accept either camelCase or snake_case body key.
    const packagingMethod = (body.packagingMethod ?? body.packaging_method ?? null) as string | null;

    const dup = await this.findDuplicate(finalStir, phone);
    if (dup) {
      throw new ConflictException(
        `Bu mijoz allaqachon mavjud (STIR yoki telefon mos keldi): "${dup.name}" (id=${dup.id})`,
      );
    }

    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customers (name, stir, inn, phone, email, address, actual_address, notes, status, default_payment_type, packaging_method, created_by, created_at, updated_at)
      VALUES (${finalName}, ${finalStir}, ${finalStir}, ${phone ?? null}, ${email ?? null},
              ${actualAddress}, ${actualAddress},
              ${notes ?? null}, ${dbStatus}, ${defaultPaymentType}, ${packagingMethod}, ${createdBy ?? null}, NOW(), NOW())
      RETURNING *
    `);
    const row = (rows.rows[0] ?? {}) as Row;
    return { ...row, segment: this.mapSegment(String(row.status ?? '')), creditLimit: Number(row.credit_limit ?? 0), actualAddress: row.actual_address ?? null };
  }

  async softDelete(cid: number, deletedBy?: number): Promise<void> { await execSdCustomerSoftDelete(cid, deletedBy); }

  async getRecentOrders(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT id, document_number AS order_number, overall_status AS status,
             total_value AS total_amount, created_at, delivery_date
      FROM sales_orders WHERE customer_id = ${cid} AND deleted_at IS NULL
      ORDER BY created_at DESC LIMIT 10
    `);
    return rows.rows as Row[];
  }

  // ─── Delegated sub-operations (see ./drizzle-sd-customers/contacts-nps.repo) ───
  getContacts          = subOps.getContacts;
  addContact           = subOps.addContact;
  updateContact        = subOps.updateContact;
  deleteContact        = subOps.deleteContact;
  getNps               = subOps.getNps;
  addNps               = subOps.addNps;
  getInteractions      = subOps.getInteractions;
  addInteraction       = subOps.addInteraction;
  getDocuments         = subOps.getDocuments;
  addDocument          = subOps.addDocument;
  deleteDocument       = subOps.deleteDocument;
  getCompetitors       = subOps.getCompetitors;
  addCompetitor        = subOps.addCompetitor;
  deleteCompetitor     = subOps.deleteCompetitor;
  getComplaints        = subOps.getComplaints;
  createComplaint      = subOps.createComplaint;
  resolveComplaint     = subOps.resolveComplaint;
  updateInternalNotes  = subOps.updateInternalNotes;
  exportCsv            = subOps.exportCsv;
}
