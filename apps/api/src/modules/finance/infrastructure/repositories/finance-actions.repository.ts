/**
 * @module finance-actions.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Finance)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql, eq, isNotNull, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { payroll_period_record } from '@shared/db/schema-business-c-2';
import { payroll_advances } from '@shared/db/schema-business-b-1';
import { hrEmployees } from '@shared/db/schema-misc-app-a';
import { customer_payments } from '@shared/db/schema-compat-5';
// OWNER QARORI 2026-07-02 (Moliya-GL-Kassa): finance_invoices = kanonik invoice-manba.
// vendor_invoices / sales_invoices NOT NULL cheklovlari AR/AP insertni buzardi; oldin
// `invoices` (fi_invoices view) ishlatilardi — endi finance_invoices (integer id, permissive
// nullable schema, invoice_type='purchase'/'sales').
import type { IFinanceActionsRepo } from '../../domain/repositories/i-finance-actions.repo';

type Row = Record<string, unknown>;

@Injectable()
export class FinanceActionsRepository implements IFinanceActionsRepo {
  async getSalaryBenchmark(): Promise<Result<Row>> {
    try {
      const rows = await db.select({
        market_min:    sql<number>`MIN(${payroll_period_record.base_salary}::numeric)`,
        market_median: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${payroll_period_record.base_salary}::numeric)`,
        market_max:    sql<number>`MAX(${payroll_period_record.base_salary}::numeric)`,
        market_avg:    sql<number>`AVG(${payroll_period_record.base_salary}::numeric)`,
        sample_size:   sql<number>`COUNT(*)`,
      }).from(payroll_period_record).where(isNotNull(payroll_period_record.base_salary));
      return Ok((rows[0] ?? {}) as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async approvePayment(id: number, approvedBy: number | string): Promise<Result<Row>> {
    try {
      const now = _time.now();
      await db.update(customer_payments)
        .set({
          status: 'approved',
          approved_by: String(approvedBy),
          approved_at: now,
          applied_at: now,
        })
        .where(eq(customer_payments.id, id));
      return Ok({ id, status: 'approved', approved_by: approvedBy, approved_at: now.toISOString() } as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  /**
   * Verify a payment — UPDATE finance_payments.status = 'verified'.
   * finance_payments has no Drizzle schema; raw SQL used (RULE4_EXCEPTION).
   */
  async verifyPayment(id: number, verifiedBy: number): Promise<Result<Row>> {
    try {
      const r = await db.execute(sql`
        UPDATE finance_payments
        SET    status = 'verified'
        WHERE  id = ${id}
        RETURNING *
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      if (!rows[0]) return Err(`Payment ${id} topilmadi yoki allaqachon verified`);
      return Ok({ ...rows[0], verified_by: verifiedBy } as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  async listAdvances(lim: number, off: number, page: number): Promise<Result<{ items: Row[]; total: number; page: number; limit: number }>> {
    try {
      const [items, countRows] = await Promise.all([
        db.select({
          id:            payroll_advances.id,
          employee_id:   payroll_advances.employee_id,
          amount:        payroll_advances.amount,
          request_date:  payroll_advances.request_date,
          status:        payroll_advances.status,
          document_id:   payroll_advances.document_id,
          approved_at:   payroll_advances.approved_at,
          created_at:    payroll_advances.created_at,
          employee_name: sql<string>`TRIM(COALESCE(${hrEmployees.first_name}, '') || ' ' || COALESCE(${hrEmployees.last_name}, ''))`,
        }).from(payroll_advances)
          .leftJoin(hrEmployees, eq(hrEmployees.id, payroll_advances.employee_id))
          .orderBy(desc(payroll_advances.created_at))
          .limit(lim).offset(off),
        db.select({ total: sql<number>`COUNT(*)::int` }).from(payroll_advances),
      ]);
      const total = Number(countRows[0]?.total ?? 0);
      return Ok({ items: items as Row[], total, page, limit: lim });
    } catch (e) {
      return Err(String(e));
    }
  }

  async getPendingAdvances(): Promise<Result<Row[]>> {
    try {
      const rows = await db.select({
        id:            payroll_advances.id,
        employee_id:   payroll_advances.employee_id,
        amount:        payroll_advances.amount,
        request_date:  payroll_advances.request_date,
        status:        payroll_advances.status,
        document_id:   payroll_advances.document_id,
        approved_at:   payroll_advances.approved_at,
        created_at:    payroll_advances.created_at,
        employee_name: sql<string>`TRIM(COALESCE(${hrEmployees.first_name}, '') || ' ' || COALESCE(${hrEmployees.last_name}, ''))`,
      }).from(payroll_advances)
        .leftJoin(hrEmployees, eq(hrEmployees.id, payroll_advances.employee_id))
        .where(eq(payroll_advances.status, 'pending'))
        .orderBy(desc(payroll_advances.created_at))
        .limit(100);
      return Ok(rows as Row[]);
    } catch (e) {
      return Err(String(e));
    }
  }

  /**
   * Create AP (Accounts Payable) entry — inserts into `finance_invoices` (kanonik, OWNER
   * QARORI 2026-07-02). invoice_type='purchase'; vendor_id/notes/due_date optional.
   */
  async createApEntry(data: Record<string, unknown>): Promise<Result<Row>> {
    try {
      // C4 continued (CRITICAL-CORRECTNESS-AUDIT-2026-07-06, finding 1.3): was `AP-${Date.now()}` —
      // same collision risk as drizzle-finance-invoice.repo.ts's saveInvoice(), same target table
      // (finance_invoices), now closed with the same fix — server-side nextval(invoice_number_seq),
      // atomic and collision-proof. The AP/AR prefix distinguishes these from the generic INV- series.
      const totalAmount   = data['amount'] ? String(data['amount']) : '0';
      const supplierName  = data['vendorName'] ? String(data['vendorName']) : 'Vendor';
      const dueDateRaw    = data['dueDate'] ? String(data['dueDate']) : null;
      const dueDate       = dueDateRaw
        ? sql`${dueDateRaw}::date`
        : sql`(NOW() + INTERVAL '30 days')::date`;
      const createdBy = data['createdBy'] != null ? Number(data['createdBy']) : null;
      const r = await db.execute(sql`
        INSERT INTO finance_invoices
          (invoice_number, invoice_type, vendor_id, total_amount, paid_amount,
           payment_status, due_date, supplier_name, notes, created_at, updated_at, created_by)
        VALUES
          ('AP-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('invoice_number_seq')::text, 6, '0'),
           'purchase', ${data['vendorId'] ? Number(data['vendorId']) : null},
           ${totalAmount}::numeric, 0, 'unpaid', ${dueDate}, ${supplierName},
           ${data['notes'] ? String(data['notes']) : null}, NOW(), NOW(), ${createdBy})
        RETURNING id, invoice_number, payment_status AS status, total_amount, invoice_type AS type, created_at
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      return Ok({ ...rows[0], ...data } as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  /**
   * Create AR (Accounts Receivable) entry — inserts into `finance_invoices` (kanonik, OWNER
   * QARORI 2026-07-02). invoice_type='sales'; customer_name/notes/due_date optional.
   */
  async createArEntry(data: Record<string, unknown>): Promise<Result<Row>> {
    try {
      // C4 continued — see createApEntry() above for the full rationale.
      const totalAmount   = data['amount'] ? String(data['amount']) : '0';
      const customerName  = data['customerName'] ? String(data['customerName']) : 'Mijoz';
      const dueDateRaw    = data['dueDate'] ? String(data['dueDate']) : null;
      const dueDate       = dueDateRaw
        ? sql`${dueDateRaw}::date`
        : sql`(NOW() + INTERVAL '30 days')::date`;
      const createdBy = data['createdBy'] != null ? Number(data['createdBy']) : null;
      const r = await db.execute(sql`
        INSERT INTO finance_invoices
          (invoice_number, invoice_type, total_amount, paid_amount, payment_status,
           due_date, customer_name, notes, created_at, updated_at, created_by)
        VALUES
          ('AR-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('invoice_number_seq')::text, 6, '0'),
           'sales', ${totalAmount}::numeric, 0, 'unpaid', ${dueDate},
           ${customerName}, ${data['notes'] ? String(data['notes']) : null}, NOW(), NOW(), ${createdBy})
        RETURNING id, invoice_number, payment_status AS status, total_amount, invoice_type AS type, created_at
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      return Ok({ ...rows[0], ...data } as Row);
    } catch (e) {
      return Err(String(e));
    }
  }
}
