import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import {
  execSdCustomerSoftDelete, execSdContactDelete,
  execSdDocumentDelete, execSdCompetitorDelete,
} from '@common/database/queries-sd';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleSdCustomersRepository {
  async list(pat: string | null, status: string | undefined, lim: number, off: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT c.*, COUNT(DISTINCT o.id)::int AS order_count,
             COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS lifetime_value
      FROM sd_customers c LEFT JOIN sales_orders o ON o.customer_id = c.id
      WHERE (${pat}::text IS NULL OR c.name ILIKE ${pat} OR c.stir ILIKE ${pat})
        AND (${status ?? null}::text IS NULL OR c.status = ${status ?? null})
      GROUP BY c.id ORDER BY c.name LIMIT ${lim} OFFSET ${off}
    `);
    return rows.rows as Row[];
  }

  async getById(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM sd_customers WHERE id = ${cid}`);
    return rows.rows as Row[];
  }

  async get360View(cid: number): Promise<{ customer: unknown; recent_orders: unknown[]; contacts: unknown[]; documents: unknown[] }> {
    const [customerRows, ordersRows, contactsRows, documentsRows] = await Promise.all([
      runQuery<Row>(sql`SELECT * FROM sd_customers WHERE id = ${cid}`),
      runQuery<Row>(sql`SELECT id, order_number, status, total_amount, created_at FROM sales_orders WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 10`),
      runQuery<Row>(sql`SELECT * FROM sd_customer_contacts WHERE customer_id = ${cid}`),
      runQuery<Row>(sql`SELECT * FROM sd_customer_documents WHERE customer_id = ${cid} ORDER BY created_at DESC LIMIT 5`),
    ]);
    return {
      customer: customerRows.rows[0],
      recent_orders: ordersRows.rows as Row[],
      contacts: contactsRows.rows as Row[],
      documents: documentsRows.rows as Row[],
    };
  }

  async update(cid: number, body: Row): Promise<Row[]> {
    const { name, stir, legal_address, actual_address, segment, status, notes, is_blocked, block_reason, credit_limit } = body;
    const rows = await runQuery<Row>(sql`
      UPDATE sd_customers
      SET name = COALESCE(${name ?? null}, name),
          stir = COALESCE(${stir ?? null}, stir),
          legal_address = COALESCE(${legal_address ?? null}, legal_address),
          actual_address = COALESCE(${actual_address ?? null}, actual_address),
          segment = COALESCE(${segment ?? null}, segment),
          status = COALESCE(${status ?? null}, status),
          notes = COALESCE(${notes ?? null}, notes),
          is_blocked = COALESCE(${is_blocked ?? null}, is_blocked),
          block_reason = COALESCE(${block_reason ?? null}, block_reason),
          credit_limit = COALESCE(${credit_limit ?? null}, credit_limit),
          updated_at = NOW()
      WHERE id = ${cid} RETURNING *
    `);
    return rows.rows as Row[];
  }

  async softDelete(cid: number): Promise<void> {
    await execSdCustomerSoftDelete(cid);
  }

  async getContacts(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_contacts WHERE customer_id = ${cid} ORDER BY is_primary DESC, full_name`);
    return rows.rows as Row[];
  }

  async addContact(cid: number, full_name: unknown, phone: unknown, email: unknown, position: unknown, is_primary: unknown): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customer_contacts (customer_id, full_name, phone, email, position, is_primary)
      VALUES (${cid}, ${full_name}, ${phone ?? null}, ${email ?? null}, ${position ?? null}, ${is_primary ?? false})
      RETURNING *
    `);
    return rows.rows[0] as Row;
  }

  async updateContact(kid: number, cid: number, full_name: unknown, phone: unknown, email: unknown, position: unknown): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      UPDATE sd_customer_contacts
      SET full_name = COALESCE(${full_name ?? null}, full_name), phone = COALESCE(${phone ?? null}, phone),
          email = COALESCE(${email ?? null}, email), position = COALESCE(${position ?? null}, position), updated_at = NOW()
      WHERE id = ${kid} AND customer_id = ${cid} RETURNING *
    `);
    return rows.rows as Row[];
  }

  async deleteContact(kid: number, cid: number): Promise<void> {
    await execSdContactDelete(kid, cid);
  }

  async getInteractions(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT i.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS employee_name
      FROM sd_customer_interactions i LEFT JOIN employees e ON e.id::text = i.employee_id::text
      WHERE i.customer_id = ${cid} ORDER BY i.created_at DESC LIMIT 20
    `);
    return rows.rows as Row[];
  }

  async addInteraction(cid: number, type: unknown, notes: unknown, employee_id: unknown): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customer_interactions (customer_id, type, notes, employee_id)
      VALUES (${cid}, ${type}, ${notes ?? null}, ${employee_id ?? null}) RETURNING *
    `);
    return rows.rows[0] as Row;
  }

  async getDocuments(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_documents WHERE customer_id = ${cid} ORDER BY created_at DESC`);
    return rows.rows as Row[];
  }

  async addDocument(cid: number, type: unknown, name: unknown, url: unknown, notes: unknown): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      INSERT INTO sd_customer_documents (customer_id, type, name, url, notes)
      VALUES (${cid}, ${type}, ${name}, ${url ?? null}, ${notes ?? null}) RETURNING *
    `);
    return rows.rows[0] as Row;
  }

  async deleteDocument(cid: number, did: number): Promise<void> {
    await execSdDocumentDelete(did, cid);
  }

  async getCompetitors(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM sd_customer_competitors WHERE customer_id = ${cid} ORDER BY name`);
    return rows.rows as Row[];
  }

  async deleteCompetitor(customerId: number, competitorId: number): Promise<void> {
    await execSdCompetitorDelete(competitorId, customerId);
  }

  async getComplaints(cid: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT cp.*, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,'') AS resolved_by_name
      FROM sd_customer_complaints cp LEFT JOIN employees e ON e.id = cp.resolved_by
      WHERE cp.customer_id = ${cid} ORDER BY cp.created_at DESC
    `);
    return rows.rows as Row[];
  }

  async resolveComplaint(customerId: number, complaintId: number, resolution: string, resolvedBy: number | null): Promise<Row | null> {
    const rows = await runQuery<Row>(sql`
      UPDATE sd_customer_complaints SET status = 'resolved', resolution = ${resolution}, resolved_by = ${resolvedBy}, resolved_at = NOW()
      WHERE id = ${complaintId} AND customer_id = ${customerId} RETURNING *
    `);
    return (rows.rows[0] ?? null) as Row | null;
  }
}
