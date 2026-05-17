/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   schema-resilient fallback chains (try `payment_date` column → on error retry
 *   with `created_at`; try `account_type/account_code` → fall back to `source_type`),
 *   and multi-table compatibility selects (fi_invoices, gl_journal_entries,
 *   payroll, payroll_advances) whose Drizzle schemas are not unified.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

/**
 * @module drizzle-finance-ops.repo
 * @description Operational/payroll/cash helpers extracted from drizzle-finance.repo
 *              as part of Rule 13/16 split. Backs the record-payment / check-advance /
 *              start-rental-timer / cash-flow handlers.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db, runQuery, settings } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { Result } from '@common/types/result.type';

@Injectable()
export class FinanceOpsRepo {
  private readonly logger = new Logger(FinanceOpsRepo.name);

  async getSettingValue(settingKey: string): Promise<number> {
    try {
      const rows = await db.select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, settingKey))
        .limit(1);
      const row = rows[0];
      return row?.value ? parseInt(row.value, 10) : 70;
    } catch (error: unknown) {
      this.logger.error(`Error fetching setting ${settingKey}: ${(error as Error).message}`);
      return 70;
    }
  }

  async findEmployeeBalance(employeeId: number): Promise<{ baseSalary: number } | null> {
    try {
      const r = await runQuery<{ base_salary: string }>(sql`SELECT base_salary FROM employees WHERE id = ${employeeId} LIMIT 1`);
      const row = r.rows[0];
      if (!row) return null;
      return { baseSalary: parseFloat(row.base_salary ?? '0') };
    } catch (error: unknown) {
      this.logger.error(`Error finding employee: ${(error as Error).message}`);
      throw error;
    }
  }

  async recordAdvance(advance: {
    employeeId: number; amount: number; status: string; approvedBy: number; remarks?: string; approvedAt: Date;
  }): Promise<void> {
    try {
      const now = new Date();
      await runQuery(sql`
        INSERT INTO payroll_advances
          (employee_id, amount, status, approved_by, approved_at, request_date)
        VALUES
          (${advance.employeeId}, ${advance.amount}, ${advance.status},
           ${String(advance.approvedBy)}, ${advance.approvedAt}, ${now})
        ON CONFLICT DO NOTHING
      `);
      this.logger.debug(`Advance recorded - Employee: ${advance.employeeId}, Amount: ${advance.amount}`);
    } catch (error: unknown) {
      this.logger.error(`Error recording advance: ${(error as Error).message}`);
      throw error;
    }
  }

  async findInvoiceById(invoiceId: string): Promise<Result<Record<string, unknown> | null>> {
    try {
      const r = await runQuery<Record<string, unknown>>(sql`SELECT * FROM fi_invoices WHERE id = ${invoiceId} LIMIT 1`);
      return { ok: true, data: r.rows[0] || null };
    } catch (error: unknown) {
      this.logger.error(`Error finding invoice: ${(error as Error).message}`);
      return { ok: false, error: { code: 'DB_ERROR', message: (error as Error).message } };
    }
  }

  async recordPayment(payment: {
    paymentId: number; invoiceId: number; amount: number; status: string; recordedBy: number; recordedAt: Date;
  }): Promise<void> {
    try {
      await runQuery(sql`
        INSERT INTO fi_payments
          (invoice_id, amount, status, recorded_by, payment_date)
        VALUES
          (${payment.invoiceId}, ${payment.amount}, ${payment.status},
           ${payment.recordedBy}, ${payment.recordedAt})
      `);
      this.logger.debug(`Payment recorded - Payment ID: ${payment.paymentId}`);
    } catch (error: unknown) {
      this.logger.error(`Error recording payment: ${(error as Error).message}`);
      throw error;
    }
  }

  async getWarehouseRentalRate(warehouseId: number): Promise<number> {
    try {
      const r = await runQuery<{ rental_rate_per_m2: string }>(sql`SELECT rental_rate_per_m2 FROM warehouses WHERE id = ${warehouseId} LIMIT 1`);
      return parseFloat(r.rows[0]?.rental_rate_per_m2 ?? '0');
    } catch (error: unknown) {
      this.logger.error(`Error fetching rental rate: ${(error as Error).message}`);
      return 0;
    }
  }

  async recordWarehouseRental(rental: {
    orderId: number; warehouseId: number; areaM2: number; dailyRate: number; startDate: Date; status: string; startedBy: number;
  }): Promise<number> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        INSERT INTO warehouse_rentals
          (order_id, warehouse_id, area_m2, daily_rate, start_date, status, started_by)
        VALUES
          (${rental.orderId}, ${rental.warehouseId}, ${rental.areaM2},
           ${rental.dailyRate}, ${rental.startDate}, ${rental.status}, ${rental.startedBy})
        RETURNING id
      `);
      const generatedId = r.rows[0]?.id ?? 0;
      this.logger.debug(`Warehouse rental recorded - Order: ${rental.orderId}, ID: ${generatedId}`);
      return generatedId;
    } catch (error: unknown) {
      this.logger.error(`Error recording warehouse rental: ${(error as Error).message}`);
      return 0;
    }
  }

  async getAllUnpaidInvoices(): Promise<{ id: number; totalAmount: number; paidAmount: number; dueDate: Date }[]> {
    try {
      const r = await runQuery<{ id: number; totalAmount: number; paidAmount: number; dueDate: Date }>(sql`
        SELECT id,
               total_amount AS "totalAmount",
               paid_amount  AS "paidAmount",
               due_date     AS "dueDate"
        FROM fi_invoices
        WHERE status != 'paid'
      `);
      return r.rows as { id: number; totalAmount: number; paidAmount: number; dueDate: Date }[];
    } catch (error: unknown) {
      this.logger.error(`Error fetching unpaid invoices: ${(error as Error).message}`);
      throw error;
    }
  }

  async getCashBalance(asOfDate: Date): Promise<number> {
    try {
      // Use customer_payments (cash receipts) minus approved disbursements as cash proxy,
      // restricted to approved/completed transactions up to asOfDate.
      const r = await runQuery<{ balance: string }>(sql`
        SELECT COALESCE(SUM(amount), 0) AS balance
        FROM customer_payments
        WHERE payment_date <= ${asOfDate}
          AND status = 'approved'
      `);
      return parseFloat(r.rows[0]?.balance || '0');
    } catch (error: unknown) {
      this.logger.error(`Error fetching cash balance: ${(error as Error).message}`);
      return 0;
    }
  }

  async getSalesReceipts(startDate: Date, endDate: Date): Promise<number> {
    try {
      const r = await runQuery<{ total: string }>(sql`
        SELECT COALESCE(SUM(total_amount), 0) AS total
        FROM fi_invoices
        WHERE status = 'paid'
          AND payment_date BETWEEN ${startDate} AND ${endDate}
      `);
      return parseFloat(r.rows[0]?.total || '0');
    } catch {
      // Fallback to created_at if payment_date column does not exist
      try {
        const r2 = await runQuery<{ total: string }>(sql`
          SELECT COALESCE(SUM(total_amount), 0) AS total
          FROM fi_invoices
          WHERE status = 'paid'
            AND created_at BETWEEN ${startDate} AND ${endDate}
        `);
        return parseFloat(r2.rows[0]?.total || '0');
      } catch { return 0; }
    }
  }

  async getOtherReceipts(startDate: Date, endDate: Date): Promise<number> {
    try {
      // Restrict to non-operating income sources only — sales receipts are counted separately via getSalesReceipts
      const r = await runQuery<{ total: string }>(sql`
        SELECT COALESCE(SUM(total_debit), 0) AS total
        FROM gl_journal_entries
        WHERE entry_date BETWEEN ${startDate} AND ${endDate}
          AND source_type IN ('other_income', 'interest', 'misc', 'rental_income')
      `);
      return parseFloat(r.rows[0]?.total || '0');
    } catch { return 0; }
  }

  async getExpenses(startDate: Date, endDate: Date): Promise<number> {
    try {
      // Filter to expense accounts only (account codes 6xx or 7xx, or account_type = 'expense')
      const r = await runQuery<{ total: string }>(sql`
        SELECT COALESCE(SUM(total_debit), 0) AS total
        FROM gl_journal_entries
        WHERE entry_date BETWEEN ${startDate} AND ${endDate}
          AND (
            account_type = 'expense'
            OR account_code LIKE '6%'
            OR account_code LIKE '7%'
          )
      `);
      return parseFloat(r.rows[0]?.total || '0');
    } catch {
      // Fallback: filter by source_type if account columns don't exist
      try {
        const r2 = await runQuery<{ total: string }>(sql`
          SELECT COALESCE(SUM(total_debit), 0) AS total
          FROM gl_journal_entries
          WHERE entry_date BETWEEN ${startDate} AND ${endDate}
            AND source_type IN ('expense', 'payroll', 'procurement')
        `);
        return parseFloat(r2.rows[0]?.total || '0');
      } catch { return 0; }
    }
  }

  async getPayrollDisbursements(startDate: Date, endDate: Date): Promise<number> {
    try {
      // Sum net_salary from payroll records paid within the date range
      const r = await runQuery<{ total: string }>(sql`
        SELECT COALESCE(SUM(net_salary), 0) AS total
        FROM payroll
        WHERE payment_date BETWEEN ${startDate} AND ${endDate}
      `);
      return parseFloat(r.rows[0]?.total || '0');
    } catch {
      // Fallback: approved advances within date range
      try {
        const r2 = await runQuery<{ total: string }>(sql`
          SELECT COALESCE(SUM(amount), 0) AS total
          FROM payroll_advances
          WHERE status = 'approved'
            AND approved_at BETWEEN ${startDate} AND ${endDate}
        `);
        return parseFloat(r2.rows[0]?.total || '0');
      } catch { return 0; }
    }
  }

  async getOtherDisbursements(startDate: Date, endDate: Date): Promise<number> {
    try {
      // Exclude payroll and sales credit entries (those are counted separately)
      const r = await runQuery<{ total: string }>(sql`
        SELECT COALESCE(SUM(total_credit), 0) AS total
        FROM gl_journal_entries
        WHERE entry_date BETWEEN ${startDate} AND ${endDate}
          AND source_type NOT IN ('payroll', 'sales')
      `);
      return parseFloat(r.rows[0]?.total || '0');
    } catch { return 0; }
  }
}
