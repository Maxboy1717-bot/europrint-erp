/**
 * @module sd-payments.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (SD)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { ISdPaymentsRepo } from '../../domain/repositories/i-sd-payments.repo';
type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class SdPaymentsRepository implements ISdPaymentsRepo {
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
      // EP-SD-013/112: debitor aging buckets (0-30 / 31-60 / 61-90 / 90+ days overdue), computed from
      // pending payments' due_date age (varchar date → ::date). FE renders these columns.
      // Column aliases match SDDebitors.tsx Debitor interface exactly.
      // NOTE: sd_customers and sd_payments have no deleted_at columns — soft-delete not used here.
      // SB0596 — "collection responsibility": surface who owns collecting this debt
      // (sd_customers.manager_id -> employees, same join pattern as sd-dashboard.repository.ts).
      const r = await exec(sql`
        SELECT
          c.id          AS "customerId",
          c.name        AS "customerName",
          c.segment,
          c.manager_id  AS "managerId",
          TRIM(COALESCE(m.first_name,'') || ' ' || COALESCE(m.last_name,'')) AS "managerName",
          COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0)::numeric(15,2) AS total,
          COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END)::int AS pending_payments,
          MIN(CASE WHEN p.status = 'pending' THEN p.due_date END) AS earliest_due,
          COALESCE(SUM(CASE WHEN p.status='pending' AND (now()::date - p.due_date::date) BETWEEN 0 AND 30  THEN p.amount ELSE 0 END),0)::numeric(15,2) AS "0-30",
          COALESCE(SUM(CASE WHEN p.status='pending' AND (now()::date - p.due_date::date) BETWEEN 31 AND 60 THEN p.amount ELSE 0 END),0)::numeric(15,2) AS "31-60",
          COALESCE(SUM(CASE WHEN p.status='pending' AND (now()::date - p.due_date::date) BETWEEN 61 AND 90 THEN p.amount ELSE 0 END),0)::numeric(15,2) AS "61-90",
          COALESCE(SUM(CASE WHEN p.status='pending' AND (now()::date - p.due_date::date) > 90              THEN p.amount ELSE 0 END),0)::numeric(15,2) AS "90+"
        FROM sd_customers c
        LEFT JOIN sd_payments p ON p.customer_id = c.id
        LEFT JOIN employees m ON m.id = c.manager_id
        GROUP BY c.id, c.name, c.segment, c.manager_id, m.first_name, m.last_name
        HAVING COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) > 0
        ORDER BY total DESC LIMIT ${lim} OFFSET ${off}`);
      return r.ok ? r : Err(String(r.error));
  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getOverdue(lim: number, off: number): Promise<Result<Row[]>>  {
  try {
      const r = await exec(sql`SELECT p.*, c.name AS customer_name, (CURRENT_DATE - p.due_date::date)::int AS days_overdue FROM sd_payments p LEFT JOIN sd_customers c ON c.id = p.customer_id WHERE p.status = 'pending' AND p.due_date::date < CURRENT_DATE ORDER BY p.due_date ASC LIMIT ${lim} OFFSET ${off}`);
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

      // C1.2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): PARTIAL mitigation, not a full fix — a
      // true concurrent double-submit (same millisecond) still races past this SELECT exactly
      // like it races past the overpay-guard SELECT below; only the accidental-double-click
      // class (human click latency, typically well under the debounce window) is caught here.
      // A full fix needs a client-generated idempotency key persisted across retries (frontend
      // work, out of scope for this backend-only stopgap) — see MASTER-STATUS-BOARD-2026-07-06.md.
      //
      // An explicit idempotency_key in the body bypasses this debounce entirely (the caller is
      // asserting "this is intentionally a new/different payment"); it is NOT itself deduped by
      // a unique index (unlike finance_invoices.invoice_number's C4 fix) — resubmitting the same
      // key twice within the window still inserts twice. Persistent key-based dedup would need
      // its own schema migration (idempotency_key column + partial UNIQUE index, same shape as
      // pos_movements) and is a distinct, larger follow-up, not silently folded into this stopgap.
      const idempotencyKey = body['idempotency_key'] != null ? String(body['idempotency_key']).trim()
        : body['idempotencyKey'] != null ? String(body['idempotencyKey']).trim() : null;
      const paymentMethod = String(body['payment_method'] ?? body['method'] ?? 'bank_transfer');
      const DEBOUNCE_WINDOW_SECONDS = 7; // accidental-double-click window, not a concurrency lock

      if (!idempotencyKey) {
        const customerId = body['customer_id'] != null ? Number(body['customer_id']) : null;
        // Key on order_id when present (strongest natural key — ties the payment to one
        // invoice/order); fall back to customer_id for cash/unlinked sales (order_id null).
        // If BOTH are null there is no natural key to dedupe on — skip the check rather than
        // block a legitimate anonymous/walk-in payment.
        if (orderId != null) {
          const dupR = await exec(sql`
            SELECT 1 FROM payments
            WHERE order_id = ${orderId} AND amount = ${amount} AND payment_method = ${paymentMethod}
              AND created_at > NOW() - make_interval(secs => ${DEBOUNCE_WINDOW_SECONDS})
            LIMIT 1
          `);
          if (dupR.ok && dupR.data.length > 0) {
            return Err(
              `Bu to'lov so'nggi ${DEBOUNCE_WINDOW_SECONDS} soniya ichida allaqachon yuborilgan ` +
              `(buyurtma #${orderId}, summa ${amount}). Takroriy yuborishni oldini olish uchun kuting.`
            );
          }
        } else if (customerId != null) {
          const dupR = await exec(sql`
            SELECT 1 FROM payments
            WHERE order_id IS NULL AND customer_id = ${customerId} AND amount = ${amount} AND payment_method = ${paymentMethod}
              AND created_at > NOW() - make_interval(secs => ${DEBOUNCE_WINDOW_SECONDS})
            LIMIT 1
          `);
          if (dupR.ok && dupR.data.length > 0) {
            return Err(
              `Bu to'lov so'nggi ${DEBOUNCE_WINDOW_SECONDS} soniya ichida allaqachon yuborilgan ` +
              `(mijoz #${customerId}, summa ${amount}). Takroriy yuborishni oldini olish uchun kuting.`
            );
          }
        }
      }

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

      const r = await exec(sql`INSERT INTO sd_payments (customer_id, order_id, amount, type, status, due_date, payment_method, notes, created_by) VALUES (${body['customer_id'] ?? null}, ${orderId}, ${amount}, ${body['type'] ?? 'payment'}, ${body['status'] ?? 'pending'}, ${body['due_date'] ?? _time.now().toISOString()}, ${paymentMethod}, ${body['notes'] ?? null}, ${body['created_by'] ?? null}) RETURNING *`);
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
