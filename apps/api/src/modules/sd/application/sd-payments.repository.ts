/**
 * @module sd-payments.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class SdPaymentsRepository {
  async list(customerId: number | null, status: string | null, lim: number, off: number): Promise<Result<Row[]>>  {
  try {
      const r = customerId && status
        ? await exec(sql`SELECT p.*, c.name AS customer_name, o.document_number AS order_number FROM sd_payments p LEFT JOIN sd_customers c ON c.id = p.customer_id LEFT JOIN sales_orders o ON o.id = p.order_id WHERE p.customer_id = ${customerId} AND p.status = ${status} ORDER BY p.paid_date DESC NULLS LAST, p.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : customerId
        ? await exec(sql`SELECT p.*, c.name AS customer_name, o.document_number AS order_number FROM sd_payments p LEFT JOIN sd_customers c ON c.id = p.customer_id LEFT JOIN sales_orders o ON o.id = p.order_id WHERE p.customer_id = ${customerId} ORDER BY p.paid_date DESC NULLS LAST, p.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : status
        ? await exec(sql`SELECT p.*, c.name AS customer_name, o.document_number AS order_number FROM sd_payments p LEFT JOIN sd_customers c ON c.id = p.customer_id LEFT JOIN sales_orders o ON o.id = p.order_id WHERE p.status = ${status} ORDER BY p.paid_date DESC NULLS LAST, p.created_at DESC LIMIT ${lim} OFFSET ${off}`)
        : await exec(sql`SELECT p.*, c.name AS customer_name, o.document_number AS order_number FROM sd_payments p LEFT JOIN sd_customers c ON c.id = p.customer_id LEFT JOIN sales_orders o ON o.id = p.order_id ORDER BY p.paid_date DESC NULLS LAST, p.created_at DESC LIMIT ${lim} OFFSET ${off}`);
      return r.ok ? r : Ok([]);
  } catch (_e) {
    return Ok([]);
  }

  }

  async getDebitors(lim: number, off: number): Promise<Result<Row[]>>  {
  try {
      const r = await exec(sql`SELECT c.id, c.name, COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0)::numeric(15,2) AS debt_amount, COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END)::int AS pending_payments, MIN(CASE WHEN p.status = 'pending' THEN p.due_date END) AS earliest_due FROM sd_customers c LEFT JOIN sd_payments p ON p.customer_id = c.id AND p.deleted_at IS NULL WHERE c.deleted_at IS NULL GROUP BY c.id, c.name HAVING COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) > 0 ORDER BY debt_amount DESC LIMIT ${lim} OFFSET ${off}`);
      return r.ok ? r : Err(String(r.error));
  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getOverdue(lim: number, off: number): Promise<Result<Row[]>>  {
  try {
      const r = await exec(sql`SELECT p.*, c.name AS customer_name, EXTRACT(DAY FROM (NOW() - p.due_date))::int AS days_overdue FROM sd_payments p LEFT JOIN sd_customers c ON c.id = p.customer_id AND c.deleted_at IS NULL WHERE p.status = 'pending' AND p.due_date < NOW() AND p.deleted_at IS NULL ORDER BY p.due_date ASC LIMIT ${lim} OFFSET ${off}`);
      return r.ok ? r : Err(String(r.error));
  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(body: Row): Promise<Result<Row | null>>  {
  try {
      const amount   = Number(body['amount'] ?? 0);
      const orderId  = body['order_id'] != null ? Number(body['order_id']) : null;

      // To'lov summasi > 0 bo'lishi shart
      if (amount <= 0) return Err('To\'lov summasi musbat son bo\'lishi kerak');

      // Agar buyurtma ID berilgan bo'lsa — faktura summasidan oshib ketmasligi tekshiriladi
      if (orderId) {
        const invoiceRows = await exec(sql`
          SELECT COALESCE(SUM(total_amount::numeric), 0)      AS invoice_total,
                 COALESCE(SUM(paid_amount::numeric), 0)       AS already_paid
          FROM   invoices
          WHERE  sales_order_id = ${orderId}
            AND  status NOT IN ('cancelled', 'voided')
        `);
        if (invoiceRows.ok && invoiceRows.data.length > 0) {
          const invoiceTotal  = Number((invoiceRows.data[0] as Row)['invoice_total'] ?? 0);
          const alreadyPaid   = Number((invoiceRows.data[0] as Row)['already_paid'] ?? 0);
          const remaining     = invoiceTotal - alreadyPaid;
          if (invoiceTotal > 0 && amount > remaining) {
            return Err(
              `To'lov summasi (${amount}) qolgan qarz (${remaining.toFixed(2)}) dan oshib ketdi. ` +
              `Faktura jami: ${invoiceTotal}, allaqachon to'langan: ${alreadyPaid}.`
            );
          }
        }
      }

      const r = await exec(sql`INSERT INTO sd_payments (customer_id, order_id, amount, type, status, due_date, payment_method, notes, created_by) VALUES (${body['customer_id'] ?? null}, ${orderId}, ${amount}, ${body['type'] ?? 'payment'}, ${body['status'] ?? 'pending'}, ${body['due_date'] ?? _time.now().toISOString()}, ${body['payment_method'] ?? body['method'] ?? 'bank_transfer'}, ${body['notes'] ?? null}, ${body['created_by'] ?? null}) RETURNING *`);
      return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getActiveRentals(lim: number, off: number): Promise<Result<Row[]>>  {
  try {
      const r = await exec(sql`SELECT r.*, c.name AS customer_name FROM sd_rentals r LEFT JOIN sd_customers c ON c.id = r.customer_id WHERE r.status = 'active' ORDER BY r.start_date DESC LIMIT ${lim} OFFSET ${off}`);
      return r.ok ? r : Ok([]);
  } catch (_e) {
    return Ok([]);
  }

  }
}
