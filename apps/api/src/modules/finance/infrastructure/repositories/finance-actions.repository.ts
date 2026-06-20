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
import { salary_history } from '@shared/db/schema-business-c-2';
import { payroll_advances } from '@shared/db/schema-business-b-1';
import { hrEmployees } from '@shared/db/schema-misc-app-a';
import { customer_payments } from '@shared/db/schema-compat-5';
// vendor_invoices / sales_invoices have NOT NULL constraints that crash AR/AP inserts;
// canonical target is `invoices` table (via fi_invoices view) — raw SQL used (RULE4_EXCEPTION).
import type { IFinanceActionsRepo } from '../../domain/repositories/i-finance-actions.repo';

type Row = Record<string, unknown>;

@Injectable()
export class FinanceActionsRepository implements IFinanceActionsRepo {
  async getSalaryBenchmark(): Promise<Result<Row>> {
    try {
      const rows = await db.select({
        market_min:    sql<number>`MIN(${salary_history.base_salary}::numeric)`,
        market_median: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${salary_history.base_salary}::numeric)`,
        market_max:    sql<number>`MAX(${salary_history.base_salary}::numeric)`,
        market_avg:    sql<number>`AVG(${salary_history.base_salary}::numeric)`,
        sample_size:   sql<number>`COUNT(*)`,
      }).from(salary_history).where(isNotNull(salary_history.base_salary));
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
   * Create AP (Accounts Payable) entry — inserts into `invoices` table (fi_invoices view).
   * vendor_invoices has NOT NULL constraints (invoice_number, vendor_id, invoice_date,
   * total_amount, currency, status, match_status, created_by) that cause 23502 crash.
   * `invoices` is the canonical table behind fi_invoices (all nullable except id/invoice_number/
   * customer_name/subtotal/tax_amount/total_amount/created_by — all provided here).
   * NOTE: Drizzle fi_invoices schema has serial id vs live uuid — raw SQL used (RULE4_EXCEPTION).
   */
  async createApEntry(data: Record<string, unknown>): Promise<Result<Row>> {
    try {
      const invoiceNumber = `AP-${Date.now()}`;
      const totalAmount   = data['amount'] ? String(data['amount']) : '0';
      const customerName  = data['vendorName'] ? String(data['vendorName']) : 'Vendor';
      const dueDateRaw    = data['dueDate'] ? String(data['dueDate']) : null;
      const dueDate       = dueDateRaw
        ? sql`${dueDateRaw}::timestamp`
        : sql`NOW() + INTERVAL '30 days'`;
      const r = await db.execute(sql`
        INSERT INTO invoices
          (id, invoice_number, customer_name, items, subtotal, tax_amount, total_amount,
           status, created_by, type, due_date, vendor_id, notes)
        VALUES
          (gen_random_uuid(), ${invoiceNumber}, ${customerName}, '[]', 0, 0, ${totalAmount}::numeric,
           'draft', '00000000-0000-0000-0000-000000000001'::uuid, 'payable',
           ${dueDate}, ${data['vendorId'] ? Number(data['vendorId']) : null},
           ${data['notes'] ? String(data['notes']) : null})
        RETURNING id, invoice_number, status, total_amount, type, created_at
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      return Ok({ ...rows[0], ...data } as Row);
    } catch (e) {
      return Err(String(e));
    }
  }

  /**
   * Create AR (Accounts Receivable) entry — inserts into `invoices` table (fi_invoices view).
   * sales_invoices has NOT NULL constraints (invoice_number, invoice_date, net_value,
   * paid_amount, payment_status, created_at, updated_at, tenant_id) that cause 23502 crash.
   * `invoices` is the canonical table behind fi_invoices — type='receivable'.
   * NOTE: Drizzle fi_invoices schema has serial id vs live uuid — raw SQL used (RULE4_EXCEPTION).
   */
  async createArEntry(data: Record<string, unknown>): Promise<Result<Row>> {
    try {
      const invoiceNumber = `AR-${Date.now()}`;
      const totalAmount   = data['amount'] ? String(data['amount']) : '0';
      const customerName  = data['customerName'] ? String(data['customerName']) : 'Mijoz';
      const dueDateRaw    = data['dueDate'] ? String(data['dueDate']) : null;
      const dueDate       = dueDateRaw
        ? sql`${dueDateRaw}::timestamp`
        : sql`NOW() + INTERVAL '30 days'`;
      const r = await db.execute(sql`
        INSERT INTO invoices
          (id, invoice_number, customer_name, items, subtotal, tax_amount, total_amount,
           status, created_by, type, due_date, notes)
        VALUES
          (gen_random_uuid(), ${invoiceNumber}, ${customerName}, '[]', 0, 0, ${totalAmount}::numeric,
           'draft', '00000000-0000-0000-0000-000000000001'::uuid, 'receivable',
           ${dueDate}, ${data['notes'] ? String(data['notes']) : null})
        RETURNING id, invoice_number, status, total_amount, type, created_at
      `);
      const rows = ((r as { rows?: Row[] }).rows) ?? [];
      return Ok({ ...rows[0], ...data } as Row);
    } catch (e) {
      return Err(String(e));
    }
  }
}
