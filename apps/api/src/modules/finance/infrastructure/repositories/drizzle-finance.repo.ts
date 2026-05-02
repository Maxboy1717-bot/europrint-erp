import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result } from '@common/types/result.type';
import { IFinanceRepo, FinanceRow } from '../../domain/repositories/i-finance.repo';
import { FinanceInvoiceRepo } from './drizzle-finance-invoice.repo';
import { FinanceReportRepo } from './drizzle-finance-report.repo';
import { FinanceBudgetRepo } from './drizzle-finance-budget.repo';

@Injectable()
export class FinanceRepository implements IFinanceRepo {
  private readonly logger = new Logger(FinanceRepository.name);

  constructor(
    private readonly invoiceRepo: FinanceInvoiceRepo,
    private readonly reportRepo: FinanceReportRepo,
    private readonly budgetRepo: FinanceBudgetRepo,
  ) {}

  async getSettingValue(settingKey: string): Promise<number> {
    try {
      const r = await runQuery<{ value: string }>(sql`SELECT value FROM settings WHERE key = ${settingKey} LIMIT 1`);
      return r.rows[0]?.value ? parseInt(r.rows[0].value, 10) : 70;
    } catch (error: unknown) {
      this.logger.error(`Error fetching setting ${settingKey}: ${(error as Error).message}`);
      return 70;
    }
  }

  async findEmployeeBalance(employeeId: number): Promise<{ baseSalary: number } | null> {
    try {
      const r = await runQuery<{ base_salary: string }>(sql`SELECT base_salary FROM employees WHERE id = ${employeeId} LIMIT 1`);
      if (!r.rows[0]) return null;
      return { baseSalary: parseFloat(r.rows[0].base_salary ?? '0') };
    } catch (error: unknown) {
      this.logger.error(`Error finding employee: ${(error as Error).message}`);
      throw error;
    }
  }

  async recordAdvance(advance: {
    employeeId: number; amount: number; status: string; approvedBy: number; remarks?: string; approvedAt: Date;
  }): Promise<void> {
    this.logger.debug(`Advance recorded - Employee: ${advance.employeeId}, Amount: ${advance.amount}`);
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
    this.logger.debug(`Payment recorded - Payment ID: ${payment.paymentId}`);
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
    this.logger.debug(`Warehouse rental recorded - Order: ${rental.orderId}`);
    return 0;
  }

  async getAllUnpaidInvoices(): Promise<{ id: number; totalAmount: number; paidAmount: number; dueDate: Date }[]> {
    try {
      const r = await runQuery<{ id: number; totalAmount: number; paidAmount: number; dueDate: Date }>(sql`SELECT * FROM fi_invoices WHERE status != 'paid'`);
      return r.rows as { id: number; totalAmount: number; paidAmount: number; dueDate: Date }[];
    } catch (error: unknown) {
      this.logger.error(`Error fetching unpaid invoices: ${(error as Error).message}`);
      throw error;
    }
  }

  async getCashBalance(asOfDate: Date): Promise<number> {
    try {
      const r = await runQuery<{ balance: string }>(sql`SELECT COALESCE(SUM(total_debit) - SUM(total_credit), 0) AS balance FROM gl_journal_entries WHERE entry_date <= ${asOfDate}`);
      return parseFloat(r.rows[0]?.balance || '0');
    } catch (error: unknown) {
      this.logger.error(`Error fetching cash balance: ${(error as Error).message}`);
      return 0;
    }
  }

  async getSalesReceipts(startDate: Date, endDate: Date): Promise<number> {
    try {
      const r = await runQuery<{ total: string }>(sql`SELECT COALESCE(SUM(total_amount), 0) AS total FROM fi_invoices WHERE status = 'paid' AND updated_at BETWEEN ${startDate} AND ${endDate}`);
      return parseFloat(r.rows[0]?.total || '0');
    } catch { return 0; }
  }

  async getOtherReceipts(startDate: Date, endDate: Date): Promise<number> {
    try {
      const r = await runQuery<{ total: string }>(sql`SELECT COALESCE(SUM(total_debit), 0) AS total FROM gl_journal_entries WHERE source_type != 'sales' AND entry_date BETWEEN ${startDate} AND ${endDate}`);
      return parseFloat(r.rows[0]?.total || '0');
    } catch { return 0; }
  }

  async getExpenses(startDate: Date, endDate: Date): Promise<number> {
    try {
      const r = await runQuery<{ total: string }>(sql`SELECT COALESCE(SUM(total_debit), 0) AS total FROM gl_journal_entries WHERE entry_date BETWEEN ${startDate} AND ${endDate}`);
      return parseFloat(r.rows[0]?.total || '0');
    } catch { return 0; }
  }

  async getPayrollDisbursements(_startDate: Date, _endDate: Date): Promise<number> { return 0; }

  async getOtherDisbursements(startDate: Date, endDate: Date): Promise<number> {
    try {
      const r = await runQuery<{ total: string }>(sql`SELECT COALESCE(SUM(total_credit), 0) AS total FROM gl_journal_entries WHERE entry_date BETWEEN ${startDate} AND ${endDate}`);
      return parseFloat(r.rows[0]?.total || '0');
    } catch { return 0; }
  }

  async findInvoiceByIdStr(id: string): Promise<Result<FinanceRow | null>> { return this.invoiceRepo.findInvoiceById(id); }
  async findInvoices(f: Parameters<FinanceInvoiceRepo['findInvoices']>[0]): Promise<Result<{ items: FinanceRow[]; total: number }>> { return this.invoiceRepo.findInvoices(f); }
  async findInvoiceBySalesOrderId(sid: string): Promise<Result<FinanceRow | null>> { return this.invoiceRepo.findInvoiceBySalesOrderId(sid); }
  async saveInvoice(inv: FinanceRow): Promise<Result<FinanceRow>> { return this.invoiceRepo.saveInvoice(inv); }
  async updateInvoice(id: string, data: FinanceRow): Promise<Result<FinanceRow>> { return this.invoiceRepo.updateInvoice(id, data); }
  async findPayments(f: Parameters<FinanceInvoiceRepo['findPayments']>[0]): Promise<Result<{ items: FinanceRow[]; total: number }>> { return this.invoiceRepo.findPayments(f); }
  async savePayment(p: FinanceRow): Promise<Result<FinanceRow>> { return this.invoiceRepo.savePayment(p); }
  async saveGlEntry(entry: FinanceRow): Promise<Result<FinanceRow>> { return this.invoiceRepo.saveGlEntry(entry); }
  async findGlEntries(f: Parameters<FinanceInvoiceRepo['findGlEntries']>[0]): Promise<Result<{ items: FinanceRow[]; total: number }>> { return this.invoiceRepo.findGlEntries(f); }

  async getArAging(): Promise<Result<FinanceRow[]>> { return this.reportRepo.getArAging(); }
  async getCashFlow(from: Date, to: Date): Promise<Result<{ inflows: number; outflows: number; netFlow: number; from: Date; to: Date }>> { return this.reportRepo.getCashFlow(from, to); }
  async getAdvanceSummary(): Promise<Result<FinanceRow[]>> { return this.reportRepo.getAdvanceSummary(); }

  async findBudgetById(id: string): Promise<Result<FinanceRow>> { return this.budgetRepo.findBudgetById(id); }
  async findBudgets(f: Parameters<FinanceBudgetRepo['findBudgets']>[0]): Promise<Result<{ items: FinanceRow[]; total: number }>> { return this.budgetRepo.findBudgets(f); }
  async saveBudget(budget: FinanceRow, lines: FinanceRow[]): Promise<Result<FinanceRow>> { return this.budgetRepo.saveBudget(budget, lines); }
  async updateBudgetStatus(id: string, status: string): Promise<Result<FinanceRow>> { return this.budgetRepo.updateBudgetStatus(id, status); }
  async updateActuals(budgetId: string): Promise<Result<FinanceRow>> { return this.budgetRepo.updateActuals(budgetId); }
  async getBudgetStats(fiscalYear: number): Promise<Result<{ totalBudgets: number; approved: number; draft: number; totalPlanned: number; totalActual: number; overallVariancePercent: number }>> { return this.budgetRepo.getBudgetStats(fiscalYear); }
}
