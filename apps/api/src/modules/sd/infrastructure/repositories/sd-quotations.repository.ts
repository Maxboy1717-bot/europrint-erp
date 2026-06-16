/**
 * @module sd-quotations.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (SD)
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeCall, Ok, Err, Result } from '@common/result';
import { ISdQuotationsRepo } from '../../domain/repositories/i-sd-quotations.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);
const execOne = async (q: SQL | SQLWrapper): Promise<Result<Row | null>> => {
  const rows = await exec(q);
  if (!rows.ok) return rows as Result<Row | null>;
  return Ok(rows.data[0] ?? null);
};

@Injectable()
export class SdQuotationsRepository implements ISdQuotationsRepo {
  async listQuotations(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>> {
    return customerId && status
      ? exec(sql`SELECT q.*, c.name AS customer_name FROM sd_quotations q LEFT JOIN sd_customers c ON c.id = q.customer_id WHERE q.customer_id = ${customerId} AND q.status = ${status} ORDER BY q.created_at DESC LIMIT ${lim} OFFSET ${off}`)
      : customerId
      ? exec(sql`SELECT q.*, c.name AS customer_name FROM sd_quotations q LEFT JOIN sd_customers c ON c.id = q.customer_id WHERE q.customer_id = ${customerId} ORDER BY q.created_at DESC LIMIT ${lim} OFFSET ${off}`)
      : status
      ? exec(sql`SELECT q.*, c.name AS customer_name FROM sd_quotations q LEFT JOIN sd_customers c ON c.id = q.customer_id WHERE q.status = ${status} ORDER BY q.created_at DESC LIMIT ${lim} OFFSET ${off}`)
      : exec(sql`SELECT q.*, c.name AS customer_name FROM sd_quotations q LEFT JOIN sd_customers c ON c.id = q.customer_id ORDER BY q.created_at DESC LIMIT ${lim} OFFSET ${off}`);
  }

  async createQuotation(body: Row): Promise<Result<Row | null>> {
    // #04 SD fix: live sd_quotations has NO title/items columns (the old INSERT crashed with DB_ERROR).
    // Write the real header columns; accept camelCase from FE; line items go to sd_quotation_items (was
    // orphaned). Generates a quotation_number. Real persist, no fake.
    const customerId = body.customer_id ?? body.customerId ?? null;
    const total = Number(body.total_amount ?? body.total_value ?? body.totalAmount ?? 0);
    const validUntil = body.valid_until ?? body.validUntil ?? null;
    const qNum = (body.quotation_number as string) ?? `KP-${Math.floor(Date.now() / 1000)}`;
    const r = await exec(sql`
      INSERT INTO sd_quotations
        (quotation_number, customer_id, customer_name, quotation_date, total_value, total_amount, net_value,
         currency, valid_until, status, notes, payment_terms, markup_percent, created_at, updated_at)
      VALUES
        (${qNum}, ${customerId}, ${body.customer_name ?? null}, to_char(NOW(),'YYYY-MM-DD'), ${total}, ${total}, ${total},
         ${body.currency ?? 'UZS'}, COALESCE(${validUntil}, to_char(NOW() + INTERVAL '14 days', 'YYYY-MM-DD')), ${body.status ?? 'draft'}, ${body.notes ?? null},
         ${body.payment_terms ?? body.paymentTerms ?? null}, ${body.markup_percent ?? body.markupPercent ?? null}, NOW(), NOW())
      RETURNING *`);
    if (!r.ok) return r as Result<Row | null>;
    const quote = r.data[0] ?? null;
    const items = Array.isArray(body.items) ? (body.items as Row[]) : [];
    if (quote && items.length > 0) {
      const qId = Number((quote as Row).id);
      for (const it of items) {
        await exec(sql`
          INSERT INTO sd_quotation_items (quotation_id, product_type, quantity, unit_price)
          VALUES (${qId}, ${it.product_type ?? it.productType ?? null},
                  ${Number(it.quantity ?? it.qty ?? 1)}, ${Number(it.unit_price ?? it.unitPrice ?? 0)})`);
      }
    }
    return Ok(quote);
  }

  async listContracts(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>> {
    try {
      return customerId && status
        ? exec(sql`SELECT ct.*, c.name AS customer_name FROM sd_contracts ct LEFT JOIN sales_orders o ON o.id = ct.order_id LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE o.customer_id = ${customerId} AND ct.status = ${status} ORDER BY ct.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : customerId
        ? exec(sql`SELECT ct.*, c.name AS customer_name FROM sd_contracts ct LEFT JOIN sales_orders o ON o.id = ct.order_id LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE o.customer_id = ${customerId} ORDER BY ct.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : status
        ? exec(sql`SELECT ct.*, c.name AS customer_name FROM sd_contracts ct LEFT JOIN sales_orders o ON o.id = ct.order_id LEFT JOIN sd_customers c ON c.id = o.customer_id WHERE ct.status = ${status} ORDER BY ct.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : exec(sql`SELECT ct.*, c.name AS customer_name FROM sd_contracts ct LEFT JOIN sales_orders o ON o.id = ct.order_id LEFT JOIN sd_customers c ON c.id = o.customer_id ORDER BY ct.created_at DESC LIMIT ${lim} OFFSET ${off}`);
    } catch {
      return Ok([]);
    }
  }

  async createContract(body: Row): Promise<Result<Row | null>> {
    const contractNumber = body.contract_number ?? `CNT-${Date.now()}`;
    const orderId = body.order_id != null ? parseInt(String(body.order_id), 10) : null;
    const customerId = body.customer_id != null ? parseInt(String(body.customer_id), 10) : null;
    // Use only columns that exist in the live sd_contracts table (build phase — no migrations yet)
    // valid_until maps from end_date if provided
    const validUntil = body.end_date != null ? String(body.end_date) : null;
    const r = await exec(sql`
      INSERT INTO sd_contracts
        (order_id, contract_number, template_type, status, customer_id, valid_until, notes)
      VALUES
        (${orderId}, ${contractNumber}, ${body.template_type ?? 'standard'}, ${body.status ?? 'draft'},
         ${customerId}, ${validUntil}, ${body.notes ?? null})
      RETURNING *
    `);
    if (!r.ok) return r as Result<Row | null>;
    return Ok(r.data[0] ?? null);
  }

  async listPriceFormulas(lim: number, off: number): Promise<Result<Row[]>> {
    return exec(sql`SELECT * FROM sd_price_formulas ORDER BY id LIMIT ${lim} OFFSET ${off}`);
  }

  async getKpiTeam(): Promise<Result<Row[]>> {
    try {
      return exec(sql`SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) AS full_name, e.position_id AS position, COUNT(DISTINCT o.id)::int AS orders_count, COALESCE(SUM(o.total_amount), 0)::numeric(15,2) AS total_revenue, COUNT(DISTINCT l.id)::int AS leads_count FROM employees e LEFT JOIN sales_orders o ON o.customer_id IN (SELECT l2.customer_id FROM crm_leads l2 WHERE l2.manager_id = e.id) LEFT JOIN crm_leads l ON l.manager_id = e.id GROUP BY e.id, e.first_name, e.last_name, e.position_id ORDER BY total_revenue DESC LIMIT 20`);
    } catch {
      return Ok([]);
    }
  }

  async getKpiTargets(managerId: number | null): Promise<Result<Row[]>> {
    try {
      return Ok([]);
    } catch {
      return Ok([]);
    }
  }

  async getFunnelReport(): Promise<Result<Row>> {
    const rows = await exec(sql`SELECT COUNT(DISTINCT l.id)::int AS total_leads, COUNT(DISTINCT CASE WHEN l.status_description ILIKE '%active%' OR l.status_description ILIKE '%new%' THEN l.id END)::int AS active_leads, COUNT(DISTINCT d.id)::int AS total_deals, COUNT(DISTINCT CASE WHEN d.stage_semantic_id = 'won' THEN d.id END)::int AS won_deals, COALESCE(SUM(CASE WHEN d.stage_semantic_id = 'won' THEN d.opportunity END), 0)::numeric(15,2) AS won_revenue FROM crm_leads l LEFT JOIN crm_deals d ON d.lead_id::text = l.id::text`);
    if (!rows.ok) return rows as Result<Row>;
    return Ok((rows.data[0] ?? {}) as Row);
  }

  async getQuotationById(id: string): Promise<Result<Row | null>> {
    const r = await exec(sql`
      SELECT q.*, c.name AS customer_name, c.id AS customer_record_id
      FROM sd_quotations q
      LEFT JOIN sd_customers c ON c.id = q.customer_id
      WHERE q.id = ${id} AND q.deleted_at IS NULL LIMIT 1
    `);
    if (!r.ok) return r as Result<Row | null>;
    return Ok(r.data[0] ?? null);
  }

  async convertQuotationToOrder(id: string): Promise<Result<{ error: string } | { order: Row }>> {
    return safeCall(async () => {
      const quotationResult = await this.getQuotationById(id);
      if (!quotationResult.ok) return Promise.reject(quotationResult.error);
      const quotation = quotationResult.data;
      if (!quotation) return { error: `Quotation ${id} not found` };
      if (quotation['status'] === 'converted') {
        let existingOrder: Row | null = null;
        if (quotation['order_id']) {
          const orderResult = await execOne(sql`SELECT id, order_number FROM sales_orders WHERE id = ${quotation['order_id']} LIMIT 1`);
          if (!orderResult.ok) return Promise.reject(orderResult.error);
          existingOrder = orderResult.data;
        }
        return { order: existingOrder ?? { id: quotation['order_id'], order_number: `QO-${id}` } };
      }
      const orderNumber = `QO-${id}-${Date.now().toString(36).toUpperCase()}`;
      const totalAmount = String(quotation['total_amount'] ?? '0');
      const companyId = Number(quotation['customer_id'] ?? quotation['company_id'] ?? 0);
      if (isNaN(companyId) || companyId === 0) {
        throw new BadRequestException('Invalid or missing customer_id on quotation');
      }
      const advancePercent = Number(quotation['advance_percent'] ?? 30);
      // Atomic: order INSERT + quotation status UPDATE must succeed together.
      // Without tx: if UPDATE fails after INSERT, you get an orphaned order with the quotation
      // still marked "not converted", leading to a duplicate-conversion attempt on retry.
      const insertedOrder = await db.transaction(async (tx) => {
        const orderRes = await tx.execute(sql`
          INSERT INTO sales_orders
            (order_number, status, company_id, total_amount, advance_required, advance_paid, advance_status, design_flag, sample_flag, created_by)
          VALUES
            (${orderNumber}, 'pending', ${companyId}, ${totalAmount}, ${advancePercent ?? 30}, '0', 'pending', false, false, 0)
          RETURNING id, order_number, status, total_amount, created_at
        `);
        const order = (orderRes.rows?.[0] ?? null) as Row | null;
        if (!order) return null;
        await tx.execute(sql`
          UPDATE sd_quotations
          SET status = 'converted', order_id = ${order['id']}, updated_at = NOW()
          WHERE id = ${id}
        `);
        return order;
      });
      if (!insertedOrder) return { error: 'Failed to create sales order — DB insert returned no row' };
      return { order: insertedOrder };
      }, 'DB_ERROR');
  }
}
