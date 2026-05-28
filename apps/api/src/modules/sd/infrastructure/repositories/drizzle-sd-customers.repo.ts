/**
 * @module drizzle-sd-customers.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries.
 *   Customer 360 builder/helpers and contact/NPS/docs/competitor sub-ops live
 *   in ./drizzle-sd-customers/ to satisfy Rule 16 (file size).
 */

import { Injectable } from '@nestjs/common';
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
             COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS "totalRevenue"
      FROM sd_customers c LEFT JOIN sales_orders o ON o.customer_id = c.id
      WHERE c.status != 'deleted'
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
      creditLimit: Number(r.credit_limit ?? 0),
      actualAddress: r.actual_address ?? null,
      segment: this.mapSegment(String(r.status ?? '')),
    }));
  }

  async getById(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT c.*, c.actual_address,
             COUNT(DISTINCT o.id)::int AS "totalOrders",
             COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS "totalRevenue"
      FROM sd_customers c
      LEFT JOIN sales_orders o ON o.customer_id = c.id
      WHERE c.id = ${cid} AND c.status != 'deleted'
      GROUP BY c.id
    `);
    return (rows.rows as Row[]).map(r => ({
      ...r,
      totalOrders: Number(r.totalOrders ?? 0),
      totalRevenue: Number(r.totalRevenue ?? 0),
      creditLimit: Number(r.credit_limit ?? 0),
      actualAddress: r.actual_address ?? null,
      segment: this.mapSegment(String(r.status ?? '')),
    }));
  }

  async get360View(cid: number): Promise<Record<string, unknown>> {
    const safe = async (q: ReturnType<typeof runQuery<Row>>) =>
      q.then(r => r.rows as Row[]).catch(() => [] as Row[]);

    const [customerRows, ordersRows, contactsRows, documentsRows, interactionsRows, competitorsRows, paymentsRows, npsRows] = await Promise.all([
      safe(runQuery<Row>(sql`SELECT * FROM sd_customers WHERE id = ${cid} AND deleted_at IS NULL`)),
      safe(runQuery<Row>(sql`
        SELECT id, order_number, status, total_amount, currency, created_at, delivery_date,
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
      safe(runQuery<Row>(sql`SELECT * FROM sd_payments WHERE customer_id = ${cid} ORDER BY payment_date DESC LIMIT 50`)),
      safe(runQuery<Row>(sql`
        SELECT id, score, comment, created_at,
               CASE WHEN score >= 9 THEN 'promoter' WHEN score >= 7 THEN 'passive' ELSE 'detractor' END AS category
        FROM nps_responses WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 20
      `)),
    ]);

    return buildCustomer360View({
      customerRows, ordersRows, contactsRows, documentsRows,
      interactionsRows, competitorsRows, paymentsRows, npsRows,
    });
  }

  async update(cid: number, body: Row): Promise<Row[]> {
    const { name, title, stir, inn, phone, email, address, status, notes } = body;
    const finalName = name ?? title ?? null;
    const finalStir = stir ?? inn ?? null;
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
          updated_at = NOW()
      WHERE id = ${cid} RETURNING *
    `);
    return rows.rows as Row[];
  }

  async create(body: Row): Promise<Row> {
    const { name, title, stir, inn, phone, email, address, notes } = body;
    const finalName = name ?? title ?? 'Nomsiz';
    const finalStir = stir ?? inn ?? null;
    const seg = String(body.segment ?? 'new');
    const dbStatus = seg === 'vip' ? 'vip' : seg === 'regular' ? 'active' : seg === 'potential' ? 'at_risk' : 'new';
    const actualAddress = body.actualAddress ?? body.actual_address ?? address ?? null;
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customers (name, stir, inn, phone, email, address, actual_address, notes, status, created_at, updated_at)
      VALUES (${finalName}, ${finalStir}, ${finalStir}, ${phone ?? null}, ${email ?? null},
              ${actualAddress}, ${actualAddress},
              ${notes ?? null}, ${dbStatus}, NOW(), NOW())
      RETURNING *
    `);
    const row = (rows.rows[0] ?? {}) as Row;
    return { ...row, segment: this.mapSegment(String(row.status ?? '')), creditLimit: Number(row.credit_limit ?? 0), actualAddress: row.actual_address ?? null };
  }

  async softDelete(cid: number): Promise<void> { await execSdCustomerSoftDelete(cid); }

  async getRecentOrders(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT id, order_number, status, total_amount, created_at, delivery_date
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
