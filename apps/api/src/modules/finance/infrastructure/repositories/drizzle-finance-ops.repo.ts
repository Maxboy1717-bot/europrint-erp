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
import { Result, Ok, Err } from '@common/types/result.type';

/** Opaque Drizzle transaction handle — same convention as `DrizzleTxExecutor` in the SD module. */
type FinanceTx = unknown;

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

  /**
   * C1 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): accepts an optional Drizzle tx so the INSERT
   * participates in the same transaction as the invoice's atomic guarded UPDATE (see
   * `FinanceInvoiceRepo.applyInvoicePayment`) — either both commit or neither does. Also accepts
   * an optional idempotencyKey (unique-indexed, nullable) so a double-tap/retry of the same
   * logical payment cannot insert twice. Returns the real DB-generated id (previously void —
   * callers had no way to know the actual row id, only the client-supplied `paymentId`).
   */
  async recordPayment(payment: {
    paymentId: number; invoiceId: number; amount: number; status: string; recordedBy: number; recordedAt: Date;
    idempotencyKey?: string | null;
  }, tx?: FinanceTx): Promise<Result<{ id: number }>> {
    try {
      // Canonical table is finance_payments (fi_payments does not exist). It has no recorded_by
      // column, so the recorder is preserved in notes for the audit trail.
      const conn = (tx as typeof db | undefined) ?? db;
      const r = await conn.execute(sql`
        INSERT INTO finance_payments
          (invoice_id, amount, status, payment_date, notes, idempotency_key)
        VALUES
          (${payment.invoiceId}, ${payment.amount}, ${payment.status},
           ${payment.recordedAt}, ${`Recorded by user #${payment.recordedBy}`}, ${payment.idempotencyKey ?? null})
        RETURNING id
      `);
      const rows = ((r as unknown as { rows?: { id: number }[] }).rows) ?? [];
      const id = rows[0]?.id ?? payment.paymentId;
      this.logger.debug(`Payment recorded - Payment ID: ${id}`);
      return Ok({ id });
    } catch (error: unknown) {
      const msg = (error as Error).message;
      this.logger.error(`Error recording payment: ${msg}`);
      return Err(msg);
    }
  }

  /**
   * C1: idempotency lookup — a payment already inserted with this key is returned as-is so the
   * caller can short-circuit a duplicate submission instead of reprocessing it.
   */
  async findPaymentByIdempotencyKey(idempotencyKey: string): Promise<Result<{ id: number } | null>> {
    try {
      const r = await runQuery<{ id: number }>(sql`
        SELECT id FROM finance_payments WHERE idempotency_key = ${idempotencyKey} LIMIT 1
      `);
      return Ok(r.rows[0] ? { id: r.rows[0].id } : null);
    } catch (error: unknown) {
      const msg = (error as Error).message;
      this.logger.error(`Error finding payment by idempotency key: ${msg}`);
      return Err(msg);
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
      } catch (error: unknown) {
        this.logger.error(`getSalesReceipts failed (fi_invoices query): ${(error as Error).message}`);
        return 0;
      }
    }
  }

  async getOtherReceipts(startDate: Date, endDate: Date): Promise<number> {
    try {
      const r = await runQuery<{ total: string }>(sql`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM entries
        WHERE entry_date BETWEEN TO_CHAR(${startDate}::date, 'YYYY-MM-DD')
                              AND TO_CHAR(${endDate}::date, 'YYYY-MM-DD')
          AND document_type IN ('other_income', 'interest', 'misc', 'rental_income')
      `);
      return parseFloat(r.rows[0]?.total || '0');
    } catch (error: unknown) {
      this.logger.error(`getOtherReceipts failed (entries query): ${(error as Error).message}`);
      return 0;
    }
  }

  async getExpenses(startDate: Date, endDate: Date): Promise<number> {
    try {
      const r = await runQuery<{ total: string }>(sql`
        SELECT COALESCE(SUM(e.amount), 0) AS total
        FROM entries e
        LEFT JOIN accounts a ON a.id = e.debit_account_id
        WHERE e.entry_date BETWEEN TO_CHAR(${startDate}::date, 'YYYY-MM-DD')
                                AND TO_CHAR(${endDate}::date, 'YYYY-MM-DD')
          AND (
            a.account_type = 'expense'
            OR a.account_code LIKE '6%'
            OR a.account_code LIKE '7%'
          )
      `);
      return parseFloat(r.rows[0]?.total || '0');
    } catch {
      try {
        const r2 = await runQuery<{ total: string }>(sql`
          SELECT COALESCE(SUM(amount), 0) AS total
          FROM entries
          WHERE entry_date BETWEEN TO_CHAR(${startDate}::date, 'YYYY-MM-DD')
                                AND TO_CHAR(${endDate}::date, 'YYYY-MM-DD')
            AND document_type IN ('expense', 'payroll', 'procurement')
        `);
        return parseFloat(r2.rows[0]?.total || '0');
      } catch (error: unknown) {
        this.logger.error(`getExpenses failed (entries fallback query): ${(error as Error).message}`);
        return 0;
      }
    }
  }

  async getPayrollDisbursements(startDate: Date, endDate: Date): Promise<number> {
    try {
      const r = await runQuery<{ total: string }>(sql`
        SELECT COALESCE(SUM(net_salary), 0) AS total
        FROM payroll
        WHERE payment_date BETWEEN ${startDate} AND ${endDate}
      `);
      return parseFloat(r.rows[0]?.total || '0');
    } catch {
      try {
        const r2 = await runQuery<{ total: string }>(sql`
          SELECT COALESCE(SUM(amount), 0) AS total
          FROM payroll_advances
          WHERE status = 'approved'
            AND approved_at BETWEEN ${startDate} AND ${endDate}
        `);
        return parseFloat(r2.rows[0]?.total || '0');
      } catch (error: unknown) {
        this.logger.error(`getPayrollDisbursements failed (payroll_advances fallback): ${(error as Error).message}`);
        return 0;
      }
    }
  }

  async getOtherDisbursements(startDate: Date, endDate: Date): Promise<number> {
    try {
      const r = await runQuery<{ total: string }>(sql`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM entries
        WHERE entry_date BETWEEN TO_CHAR(${startDate}::date, 'YYYY-MM-DD')
                              AND TO_CHAR(${endDate}::date, 'YYYY-MM-DD')
          AND document_type NOT IN ('payroll', 'sale')
      `);
      return parseFloat(r.rows[0]?.total || '0');
    } catch (error: unknown) {
      this.logger.error(`getOtherDisbursements failed (entries query): ${(error as Error).message}`);
      return 0;
    }
  }
}
