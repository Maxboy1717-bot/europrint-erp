/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   schema-resilient fallback chains (try `payment_date` column → on error retry
 *   with `created_at`; try `account_type/account_code` → fall back to `source_type`),
 *   and multi-table compatibility selects (fi_invoices, gl_journal_entries,
 *   payroll, payroll_advances) whose Drizzle schemas are not unified.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */

/**
 * @module drizzle-finance.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery, cfoConfigTable, settings } from '@shared/db';
import { asc, eq, inArray, sql } from 'drizzle-orm';
import { Result } from '@common/types/result.type';
import {
  IFinanceRepo, FinanceRow,
  CfoConfigRow, BreakEvenInputs, CashflowWeekRaw,
  FinancialRatiosGl, FinancialRatiosSnapshotInput,
  StandardCostRecord, StandardCostCalcInputs, StandardCostUpsertInput,
  PriceTierRow, PriceTierUpsertInput,
  VarianceOrderInputs, VarianceReportInput,
} from '../../domain/repositories/i-finance.repo';
import { FinanceInvoiceRepo } from './drizzle-finance-invoice.repo';
import { FinanceReportRepo } from './drizzle-finance-report.repo';
import { FinanceBudgetRepo } from './drizzle-finance-budget.repo';

type RawRow = Record<string, unknown>;
const toNum = (v: unknown, fallback = 0): number => {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

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

  // ============================================================
  // P0-1 CFO Config
  // ============================================================

  async findCfoConfig(key: string): Promise<Result<CfoConfigRow | null>> {
    try {
      const rows = await db.select({
        id: cfoConfigTable.id,
        config_key: cfoConfigTable.configKey,
        config_value: cfoConfigTable.configValue,
        description: cfoConfigTable.description,
        updated_at: cfoConfigTable.updatedAt,
      }).from(cfoConfigTable).where(eq(cfoConfigTable.configKey, key)).limit(1);
      const row = rows[0];
      if (!row) return { ok: true, data: null };
      return {
        ok: true,
        data: {
          id:          Number(row.id ?? 0),
          configKey:   String(row.config_key ?? ''),
          configValue: String(row.config_value ?? '0'),
          description: row.description ? String(row.description) : null,
          updatedAt:   row.updated_at ? new Date(String(row.updated_at)) : new Date(),
        },
      };
    } catch (error: unknown) {
      this.logger.error(`findCfoConfig("${key}") xato: ${(error as Error).message}`);
      return { ok: false, error: { code: 'DB_ERROR', message: (error as Error).message } };
    }
  }

  async findCfoConfigMap(keys: string[]): Promise<Result<Map<string, string>>> {
    try {
      if (!Array.isArray(keys) || keys.length === 0) {
        return { ok: true, data: new Map<string, string>() };
      }
      const rows = await db.select({
        config_key: cfoConfigTable.configKey,
        config_value: cfoConfigTable.configValue,
      }).from(cfoConfigTable).where(inArray(cfoConfigTable.configKey, keys));
      const map = new Map<string, string>();
      for (const row of rows) {
        map.set(String(row.config_key ?? ''), String(row.config_value ?? '0'));
      }
      return { ok: true, data: map };
    } catch (error: unknown) {
      this.logger.error(`findCfoConfigMap xato: ${(error as Error).message}`);
      return { ok: false, error: { code: 'DB_ERROR', message: (error as Error).message } };
    }
  }

  async findAllCfoConfig(): Promise<Result<CfoConfigRow[]>> {
    try {
      const rows = await db.select({
        id: cfoConfigTable.id,
        config_key: cfoConfigTable.configKey,
        config_value: cfoConfigTable.configValue,
        description: cfoConfigTable.description,
        updated_at: cfoConfigTable.updatedAt,
      }).from(cfoConfigTable).orderBy(asc(cfoConfigTable.configKey));
      const data: CfoConfigRow[] = rows.map(row => ({
        id:          Number(row.id ?? 0),
        configKey:   String(row.config_key ?? ''),
        configValue: String(row.config_value ?? '0'),
        description: row.description ? String(row.description) : null,
        updatedAt:   row.updated_at ? new Date(String(row.updated_at)) : new Date(),
      }));
      return { ok: true, data };
    } catch (error: unknown) {
      this.logger.error(`findAllCfoConfig xato: ${(error as Error).message}`);
      return { ok: false, error: { code: 'DB_ERROR', message: (error as Error).message } };
    }
  }

  async upsertCfoConfig(input: { key: string; value: number }): Promise<Result<CfoConfigRow>> {
    try {
      const rows = await db.insert(cfoConfigTable)
        .values({ configKey: input.key, configValue: String(input.value), updatedAt: new Date() })
        .onConflictDoUpdate({
          target: cfoConfigTable.configKey,
          set: { configValue: String(input.value), updatedAt: new Date() },
        })
        .returning({
          id: cfoConfigTable.id,
          config_key: cfoConfigTable.configKey,
          config_value: cfoConfigTable.configValue,
          description: cfoConfigTable.description,
          updated_at: cfoConfigTable.updatedAt,
        });
      const row = rows[0];
      if (!row) return { ok: false, error: { code: 'DB_ERROR', message: `CFO config key topilmadi: ${input.key}` } };
      return {
        ok: true,
        data: {
          id:          Number(row.id ?? 0),
          configKey:   String(row.config_key ?? ''),
          configValue: String(row.config_value ?? '0'),
          description: row.description ? String(row.description) : null,
          updatedAt:   row.updated_at ? new Date(String(row.updated_at)) : new Date(),
        },
      };
    } catch (error: unknown) {
      this.logger.error(`upsertCfoConfig("${input.key}") xato: ${(error as Error).message}`);
      return { ok: false, error: { code: 'DB_ERROR', message: (error as Error).message } };
    }
  }

  // ============================================================
  // P0-2 Break-even
  // ============================================================

  async fetchBreakEvenInputs(productName: string, period: string): Promise<BreakEvenInputs> {
    const [structRes, salesRes] = await Promise.all([
      runQuery<RawRow>(sql`
        SELECT fixed_cost_uzs, variable_cost_uzs, selling_price_uzs
        FROM cost_structure
        WHERE product_name = ${productName} AND period = ${period}
        LIMIT 1
      `).catch(() => ({ rows: [] as RawRow[] })),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(po.planned_quantity), 0)::numeric AS actual_qty
        FROM production_orders po
        JOIN products p ON p.id = po.product_id
        WHERE p.name = ${productName}
          AND po.status::text = 'completed'
          AND TO_CHAR(po.created_at, 'YYYY-MM') = ${period}
      `).catch(() => ({ rows: [] as RawRow[] })),
    ]);

    const structRow = structRes.rows[0];
    const costStructure = structRow
      ? {
          fixedCostUzs:    toNum(structRow['fixed_cost_uzs'], 0),
          variableCostUzs: toNum(structRow['variable_cost_uzs'], 0),
          sellingPriceUzs: toNum(structRow['selling_price_uzs'], 0),
        }
      : null;

    const actualQty = toNum(salesRes.rows[0]?.['actual_qty'], 0);
    return { costStructure, actualQty };
  }

  async upsertCostStructure(input: {
    productName: string;
    period: string;
    fixedCostUzs: number;
    variableCostUzs: number;
    sellingPriceUzs: number;
  }): Promise<void> {
    await runQuery(sql`
      INSERT INTO cost_structure (product_name, period, fixed_cost_uzs, variable_cost_uzs, selling_price_uzs)
      VALUES (${input.productName}, ${input.period}, ${input.fixedCostUzs}, ${input.variableCostUzs}, ${input.sellingPriceUzs})
      ON CONFLICT (product_name, period) DO UPDATE
        SET fixed_cost_uzs    = EXCLUDED.fixed_cost_uzs,
            variable_cost_uzs = EXCLUDED.variable_cost_uzs,
            selling_price_uzs = EXCLUDED.selling_price_uzs,
            updated_at        = now()
    `);
  }

  // ============================================================
  // P0-2 Cashflow Forecast
  // ============================================================

  async fetchCashflowWeek(
    weekStartIso: string, weekEndIso: string,
    eclRates: { e030: number; e3160: number; e6190: number; e91p: number },
  ): Promise<CashflowWeekRaw> {
    const { e030, e3160, e6190, e91p } = eclRates;
    const [arRes, soRes, apRes, payRes] = await Promise.all([
      runQuery<RawRow>(sql`
        SELECT
          COALESCE(SUM(
            CASE WHEN age_days BETWEEN 0  AND 30  THEN balance * ${1 - e030}
                 WHEN age_days BETWEEN 31 AND 60  THEN balance * ${1 - e3160}
                 WHEN age_days BETWEEN 61 AND 90  THEN balance * ${1 - e6190}
                 WHEN age_days > 90               THEN balance * ${1 - e91p}
                 ELSE 0 END
          ), 0) AS ar_col
        FROM (
          SELECT total_amount AS balance,
                 (${weekStartIso}::date - DATE(created_at)) AS age_days
          FROM fi_invoices
          WHERE status NOT IN ('paid', 'cancelled')
            AND (invoice_type IS NULL OR invoice_type != 'payable')
            AND DATE(due_date) BETWEEN ${weekStartIso}::date AND ${weekEndIso}::date
        ) sub
      `).catch(() => ({ rows: [] as RawRow[] })),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(total_amount), 0) AS so_total
        FROM sales_orders
        WHERE status IN ('confirmed', 'in_production')
          AND delivery_date BETWEEN ${weekStartIso} AND ${weekEndIso}
      `).catch(() => ({ rows: [] as RawRow[] })),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(total_amount), 0) AS ap_out
        FROM fi_invoices
        WHERE invoice_type = 'payable'
          AND status NOT IN ('paid', 'cancelled')
          AND DATE(due_date) BETWEEN ${weekStartIso}::date AND ${weekEndIso}::date
      `).catch(() => ({ rows: [] as RawRow[] })),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(net_pay), 0) AS payroll_out
        FROM payroll_entries
        WHERE DATE(created_at) BETWEEN ${weekStartIso}::date AND ${weekEndIso}::date
      `).catch(() => ({ rows: [] as RawRow[] })),
    ]);

    return {
      arCol:      toNum(arRes.rows[0]?.['ar_col'], 0),
      soInflow:   toNum(soRes.rows[0]?.['so_total'], 0),
      apOut:      toNum(apRes.rows[0]?.['ap_out'], 0),
      payrollOut: toNum(payRes.rows[0]?.['payroll_out'], 0),
    };
  }

  // ============================================================
  // P0-2 Financial Ratios
  // ============================================================

  async fetchFinancialRatiosGl(period: string): Promise<FinancialRatiosGl | null> {
    const r = await runQuery<RawRow>(sql`
      SELECT
        COALESCE(SUM(CASE WHEN a.account_type = 'REVENUE'  THEN jl.credit - jl.debit ELSE 0 END), 0) AS revenue,
        COALESCE(SUM(CASE WHEN a.account_type = 'COGS'     THEN jl.debit - jl.credit ELSE 0 END), 0) AS cogs,
        COALESCE(SUM(CASE WHEN a.account_type = 'OPEX'     THEN jl.debit - jl.credit ELSE 0 END), 0) AS opex,
        COALESCE(SUM(CASE WHEN a.account_type = 'INTEREST' THEN jl.debit - jl.credit ELSE 0 END), 0) AS interest_exp,
        COALESCE(SUM(CASE WHEN a.account_type = 'ASSET'    THEN jl.debit - jl.credit ELSE 0 END), 0) AS total_assets,
        COALESCE(SUM(CASE WHEN a.account_type = 'EQUITY'   THEN jl.credit - jl.debit ELSE 0 END), 0) AS total_equity,
        COALESCE(SUM(CASE WHEN a.account_type = 'DEBT'     THEN jl.credit - jl.debit ELSE 0 END), 0) AS total_debt,
        COALESCE(SUM(CASE WHEN a.code LIKE '2%'            THEN jl.debit - jl.credit ELSE 0 END), 0) AS current_assets,
        COALESCE(SUM(CASE WHEN a.code LIKE '3%'            THEN jl.credit - jl.debit ELSE 0 END), 0) AS current_liabilities,
        COALESCE(SUM(CASE WHEN a.code LIKE '14%'           THEN jl.debit - jl.credit ELSE 0 END), 0) AS inventory,
        COALESCE(SUM(CASE WHEN a.code LIKE '11%'           THEN jl.debit - jl.credit ELSE 0 END), 0) AS cash,
        COALESCE(SUM(CASE WHEN a.account_type = 'RETAINED' THEN jl.credit - jl.debit ELSE 0 END), 0) AS retained_earnings
      FROM gl_journal_lines jl
      JOIN gl_accounts a ON a.id = jl.account_id
      JOIN gl_journal_entries e ON e.id = jl.entry_id
      WHERE TO_CHAR(e.entry_date, 'YYYY-MM') = ${period}
    `);
    const g = r.rows[0];
    if (!g) return null;
    return {
      revenue:            toNum(g['revenue'], 0),
      cogs:               toNum(g['cogs'], 0),
      opex:               toNum(g['opex'], 0),
      interestExp:        toNum(g['interest_exp'], 0),
      totalAssets:        toNum(g['total_assets'], 0),
      totalEquity:        toNum(g['total_equity'], 0),
      totalDebt:          toNum(g['total_debt'], 0),
      currentAssets:      toNum(g['current_assets'], 0),
      currentLiabilities: toNum(g['current_liabilities'], 0),
      inventory:          toNum(g['inventory'], 0),
      cash:               toNum(g['cash'], 0),
      retainedEarnings:   toNum(g['retained_earnings'], 0),
    };
  }

  async saveFinancialRatiosSnapshot(s: FinancialRatiosSnapshotInput): Promise<void> {
    try {
      await runQuery(sql`
        INSERT INTO financial_ratios_snapshot
          (period, current_ratio, quick_ratio, gross_margin_pct, net_margin_pct,
           roa, roe, debt_to_equity, altman_z, altman_zone, revenue, net_income)
        VALUES
          (${s.period}, ${s.currentRatio}, ${s.quickRatio},
           ${s.grossMarginPct}, ${s.netMarginPct},
           ${s.roa}, ${s.roe}, ${s.debtToEquity},
           ${s.altmanZ}, ${s.altmanZone}, ${s.revenue}, ${s.netIncome})
        ON CONFLICT (period) DO UPDATE
          SET current_ratio    = EXCLUDED.current_ratio,
              quick_ratio      = EXCLUDED.quick_ratio,
              gross_margin_pct = EXCLUDED.gross_margin_pct,
              net_margin_pct   = EXCLUDED.net_margin_pct,
              roa = EXCLUDED.roa, roe = EXCLUDED.roe,
              debt_to_equity   = EXCLUDED.debt_to_equity,
              altman_z         = EXCLUDED.altman_z,
              altman_zone      = EXCLUDED.altman_zone,
              revenue          = EXCLUDED.revenue,
              net_income       = EXCLUDED.net_income,
              updated_at       = now()
      `);
    } catch (err) {
      this.logger.warn(`FinancialRatiosSnapshot saqlashda xato: ${String(err)}`);
    }
  }

  async flagAltmanDistress(period: string, zScore: number): Promise<void> {
    const title = `Altman Z-Score Distress Signali: ${period}`;
    const desc  = `Moliyaviy xavf: ${period} davr uchun Altman Z-Score ${zScore.toFixed(4)} — Distress zonasi (<1.81). CFO zudlik bilan choralar ko'rishi kerak.`;
    await runQuery(sql`
      INSERT INTO kaizen_suggestions (title, description, status, created_at)
      VALUES (${title}, ${desc}, ${'open'}, now())
    `);
  }

  // ============================================================
  // P0-2 Standard Cost
  // ============================================================

  private toStdCostRecord(row: RawRow): StandardCostRecord {
    const mat   = toNum(row['std_material_uzs'], 0);
    const lab   = toNum(row['std_labor_uzs'], 0);
    const ovh   = toNum(row['std_overhead_uzs'], 0);
    const total = toNum(row['std_total_uzs'], mat + lab + ovh);
    return {
      productName:    String(row['product_name'] ?? ''),
      productId:      row['product_id'] != null ? Number(row['product_id']) : null,
      period:         String(row['period'] ?? ''),
      stdMaterialUzs: mat,
      stdLaborUzs:    lab,
      stdOverheadUzs: ovh,
      stdTotalUzs:    total,
      createdAt:      row['created_at'] ? new Date(String(row['created_at'])) : null,
    };
  }

  async findStandardCostByName(productName: string, period: string): Promise<StandardCostRecord | null> {
    const r = await runQuery<RawRow>(sql`
      SELECT sc.product_name, sc.product_id, sc.period,
             sc.std_material_uzs, sc.std_labor_uzs, sc.std_overhead_uzs,
             sc.std_material_uzs + sc.std_labor_uzs + sc.std_overhead_uzs AS std_total_uzs,
             sc.created_at
      FROM standard_cost sc
      LEFT JOIN products p ON p.id = sc.product_id
      WHERE (sc.product_name = ${productName} OR p.name = ${productName})
        AND sc.period = ${period}
      ORDER BY sc.period DESC LIMIT 1
    `);
    return r.rows[0] ? this.toStdCostRecord(r.rows[0]) : null;
  }

  async findStandardCostById(productId: number, period: string): Promise<StandardCostRecord | null> {
    const r = await runQuery<RawRow>(sql`
      SELECT sc.product_name, sc.product_id, sc.period,
             sc.std_material_uzs, sc.std_labor_uzs, sc.std_overhead_uzs,
             sc.std_material_uzs + sc.std_labor_uzs + sc.std_overhead_uzs AS std_total_uzs,
             sc.created_at
      FROM standard_cost sc
      WHERE sc.product_id = ${productId}
        AND sc.period = ${period}
      ORDER BY sc.period DESC LIMIT 1
    `);
    return r.rows[0] ? this.toStdCostRecord(r.rows[0]) : null;
  }

  async listStandardCosts(productName: string, limit: number): Promise<StandardCostRecord[]> {
    const r = await runQuery<RawRow>(sql`
      SELECT sc.product_name, sc.product_id, sc.period,
             sc.std_material_uzs, sc.std_labor_uzs, sc.std_overhead_uzs,
             sc.std_material_uzs + sc.std_labor_uzs + sc.std_overhead_uzs AS std_total_uzs,
             sc.created_at
      FROM standard_cost sc
      LEFT JOIN products p ON p.id = sc.product_id
      WHERE sc.product_name = ${productName} OR p.name = ${productName}
      ORDER BY sc.period DESC LIMIT ${limit}
    `);
    return r.rows.map(row => this.toStdCostRecord(row));
  }

  async fetchStandardCostCalcInputs(productName: string): Promise<StandardCostCalcInputs> {
    const prodRes = await runQuery<RawRow>(sql`
      SELECT id FROM products WHERE name = ${productName} AND is_active = true LIMIT 1
    `);
    const productId = prodRes.rows[0] ? Number(prodRes.rows[0]['id']) : null;

    const [bomRes, routingRes] = await Promise.all([
      runQuery<RawRow>(sql`
        SELECT items FROM boms
        WHERE product_name = ${productName} AND is_active = true
        ORDER BY created_at DESC LIMIT 1
      `).catch(() => ({ rows: [] as RawRow[] })),
      productId !== null
        ? runQuery<RawRow>(sql`
            SELECT r.steps
            FROM routings r
            JOIN production_orders po ON po.routing_id = r.id
            WHERE po.product_id = ${productId}
            ORDER BY po.created_at DESC LIMIT 1
          `).catch(() => ({ rows: [] as RawRow[] }))
        : Promise.resolve({ rows: [] as RawRow[] }),
    ]);

    return {
      productId,
      bomItemsJson:     String(bomRes.rows[0]?.['items']  ?? '[]'),
      routingStepsJson: String(routingRes.rows[0]?.['steps'] ?? '[]'),
    };
  }

  async upsertStandardCost(input: StandardCostUpsertInput): Promise<void> {
    if (input.productId !== null) {
      await runQuery(sql`
        INSERT INTO standard_cost (product_name, product_id, period, std_material_uzs, std_labor_uzs, std_overhead_uzs)
        VALUES (${input.productName}, ${input.productId}, ${input.period},
                ${input.stdMaterialUzs}, ${input.stdLaborUzs}, ${input.stdOverheadUzs})
        ON CONFLICT (product_name, period) DO UPDATE
          SET product_id       = EXCLUDED.product_id,
              std_material_uzs = EXCLUDED.std_material_uzs,
              std_labor_uzs    = EXCLUDED.std_labor_uzs,
              std_overhead_uzs = EXCLUDED.std_overhead_uzs,
              updated_at       = now()
      `);
    } else {
      await runQuery(sql`
        INSERT INTO standard_cost (product_name, period, std_material_uzs, std_labor_uzs, std_overhead_uzs)
        VALUES (${input.productName}, ${input.period},
                ${input.stdMaterialUzs}, ${input.stdLaborUzs}, ${input.stdOverheadUzs})
        ON CONFLICT (product_name, period) DO UPDATE
          SET std_material_uzs = EXCLUDED.std_material_uzs,
              std_labor_uzs    = EXCLUDED.std_labor_uzs,
              std_overhead_uzs = EXCLUDED.std_overhead_uzs,
              updated_at       = now()
      `);
    }
  }

  async findLatestStandardCost(
    productId: number | null,
    productName: string,
  ): Promise<{ stdMaterialUzs: number; stdLaborUzs: number; stdOverheadUzs: number; stdTotal: number } | null> {
    const r = productId !== null
      ? await runQuery<RawRow>(sql`
          SELECT std_material_uzs, std_labor_uzs, std_overhead_uzs,
                 std_material_uzs + std_labor_uzs + std_overhead_uzs AS std_total
          FROM standard_cost
          WHERE product_id = ${productId}
          ORDER BY period DESC LIMIT 1
        `)
      : await runQuery<RawRow>(sql`
          SELECT std_material_uzs, std_labor_uzs, std_overhead_uzs,
                 std_material_uzs + std_labor_uzs + std_overhead_uzs AS std_total
          FROM standard_cost
          WHERE product_name = ${productName}
          ORDER BY period DESC LIMIT 1
        `);
    const row = r.rows[0];
    if (!row) return null;
    return {
      stdMaterialUzs: toNum(row['std_material_uzs'], 0),
      stdLaborUzs:    toNum(row['std_labor_uzs'], 0),
      stdOverheadUzs: toNum(row['std_overhead_uzs'], 0),
      stdTotal:       toNum(row['std_total'], 0),
    };
  }

  // ============================================================
  // P0-2 Tiered Pricing
  // ============================================================

  private toPriceTier(row: RawRow): PriceTierRow {
    return {
      id:          String(row['id'] ?? ''),
      productName: String(row['product_name'] ?? ''),
      productId:   row['product_id'] != null ? Number(row['product_id']) : null,
      tierName:    String(row['tier_name'] ?? ''),
      minQty:      toNum(row['min_qty'], 0),
      maxQty:      row['max_qty'] != null ? toNum(row['max_qty'], 0) : null,
      priceUzs:    toNum(row['price_uzs'], 0),
      validFrom:   String(row['valid_from'] ?? ''),
      validTo:     row['valid_to'] ? String(row['valid_to']) : null,
    };
  }

  async findPriceTierForQty(
    productName: string, qty: number, effectiveDateIso: string,
  ): Promise<PriceTierRow | null> {
    const r = await runQuery<RawRow>(sql`
      SELECT pt.id::text AS id, pt.product_name, pt.product_id,
             pt.tier_name, pt.min_qty, pt.max_qty, pt.price_uzs,
             pt.valid_from, pt.valid_to
      FROM price_tier pt
      LEFT JOIN products p ON p.id = pt.product_id
      WHERE (pt.product_name = ${productName} OR p.name = ${productName})
        AND pt.min_qty <= ${qty}
        AND (pt.max_qty IS NULL OR pt.max_qty >= ${qty})
        AND pt.valid_from <= ${effectiveDateIso}::date
        AND (pt.valid_to IS NULL OR pt.valid_to >= ${effectiveDateIso}::date)
      ORDER BY pt.min_qty DESC
      LIMIT 1
    `);
    return r.rows[0] ? this.toPriceTier(r.rows[0]) : null;
  }

  async listPriceTiers(productName: string): Promise<PriceTierRow[]> {
    const r = await runQuery<RawRow>(sql`
      SELECT pt.id::text AS id, pt.product_name, pt.product_id,
             pt.tier_name, pt.min_qty, pt.max_qty,
             pt.price_uzs, pt.valid_from::text AS valid_from, pt.valid_to::text AS valid_to
      FROM price_tier pt
      LEFT JOIN products p ON p.id = pt.product_id
      WHERE pt.product_name = ${productName} OR p.name = ${productName}
      ORDER BY pt.min_qty ASC
    `);
    return r.rows.map(row => this.toPriceTier(row));
  }

  async upsertPriceTier(input: PriceTierUpsertInput): Promise<PriceTierRow | null> {
    const prodRes = await runQuery<RawRow>(sql`
      SELECT id FROM products WHERE name = ${input.productName} AND is_active = true LIMIT 1
    `);
    const productId = prodRes.rows[0] ? Number(prodRes.rows[0]['id']) : null;

    const r = productId !== null
      ? await runQuery<RawRow>(sql`
          INSERT INTO price_tier (product_name, product_id, tier_name, min_qty, max_qty, price_uzs, valid_from, valid_to)
          VALUES (${input.productName}, ${productId}, ${input.tierName}, ${input.minQty}, ${input.maxQty},
                  ${input.priceUzs}, ${input.validFrom}::date, ${input.validTo}::date)
          RETURNING id::text AS id, product_name, product_id, tier_name, min_qty, max_qty,
                    price_uzs, valid_from::text AS valid_from, valid_to::text AS valid_to
        `)
      : await runQuery<RawRow>(sql`
          INSERT INTO price_tier (product_name, tier_name, min_qty, max_qty, price_uzs, valid_from, valid_to)
          VALUES (${input.productName}, ${input.tierName}, ${input.minQty}, ${input.maxQty},
                  ${input.priceUzs}, ${input.validFrom}::date, ${input.validTo}::date)
          RETURNING id::text AS id, product_name, product_id, tier_name, min_qty, max_qty,
                    price_uzs, valid_from::text AS valid_from, valid_to::text AS valid_to
        `);
    return r.rows[0] ? this.toPriceTier(r.rows[0]) : null;
  }

  // ============================================================
  // P0-2 Variance Analysis
  // ============================================================

  async fetchVarianceOrderInputs(orderId: number): Promise<VarianceOrderInputs> {
    const orderRes = await runQuery<RawRow>(sql`
      SELECT po.id                    AS id,
             po.order_number,
             p.name                  AS product_name,
             po.product_id,
             po.planned_quantity     AS planned_qty,
             po.actual_cost::numeric AS actual_cost_total,
             po.bom_id               AS bom_id,
             po.routing_id           AS routing_id
      FROM production_orders po
      LEFT JOIN products p ON p.id = po.product_id
      WHERE po.id = ${orderId}
      LIMIT 1
    `);
    const orderRow = orderRes.rows[0];
    if (!orderRow) {
      return {
        order: null,
        bomItemsJson: '[]', routingStepsJson: '[]',
        actualHours: 0, stdCost: null,
        actualMaterial: { actualMaterialQty: 0, actualUnitPrice: 0 },
      };
    }

    const order = {
      id:              Number(orderRow['id'] ?? 0),
      orderNumber:     String(orderRow['order_number'] ?? ''),
      productName:     String(orderRow['product_name'] ?? ''),
      productId:       orderRow['product_id']  ? Number(orderRow['product_id'])  : null,
      plannedQty:      toNum(orderRow['planned_qty'], 1),
      actualCostTotal: toNum(orderRow['actual_cost_total'], 0),
      bomId:           orderRow['bom_id']     ? Number(orderRow['bom_id'])     : null,
      routingId:       orderRow['routing_id'] ? Number(orderRow['routing_id']) : null,
    };

    const [bomRes, routingRes, mesRes, stdRes, movRes] = await Promise.all([
      order.bomId !== null
        ? runQuery<RawRow>(sql`SELECT items FROM boms WHERE id = ${order.bomId} LIMIT 1`)
            .catch(() => ({ rows: [] as RawRow[] }))
        : Promise.resolve({ rows: [] as RawRow[] }),
      order.routingId !== null
        ? runQuery<RawRow>(sql`SELECT steps FROM routings WHERE id = ${order.routingId} LIMIT 1`)
            .catch(() => ({ rows: [] as RawRow[] }))
        : Promise.resolve({ rows: [] as RawRow[] }),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600.0), 0) AS ah
        FROM mes_sessions ms
        WHERE ms.production_order_id::text = ${String(orderId)}
          AND ms.status::text = 'completed'
      `).catch(() => ({ rows: [] as RawRow[] })),
      order.productId !== null
        ? runQuery<RawRow>(sql`
            SELECT std_material_uzs, std_labor_uzs, std_overhead_uzs,
                   std_material_uzs + std_labor_uzs + std_overhead_uzs AS std_total
            FROM standard_cost
            WHERE product_id = ${order.productId}
            ORDER BY period DESC LIMIT 1
          `).catch(() => ({ rows: [] as RawRow[] }))
        : runQuery<RawRow>(sql`
            SELECT std_material_uzs, std_labor_uzs, std_overhead_uzs,
                   std_material_uzs + std_labor_uzs + std_overhead_uzs AS std_total
            FROM standard_cost
            WHERE product_name = ${order.productName}
            ORDER BY period DESC LIMIT 1
          `).catch(() => ({ rows: [] as RawRow[] })),
      runQuery<RawRow>(sql`
        SELECT COALESCE(SUM(ABS(sm.quantity)), 0) AS actual_material_qty,
               COALESCE(AVG(si.cost_price::numeric), 0) AS actual_unit_price
        FROM stock_movements sm
        JOIN stock_items si ON si.id = sm.stock_item_id
        WHERE sm.reference_id::text = ${String(orderId)}
          AND sm.movement_type::text IN ('OUT', 'CONSUMPTION')
      `).catch(() => ({ rows: [] as RawRow[] })),
    ]);

    const stdRow = stdRes.rows[0];
    const stdCost = stdRow
      ? {
          stdMaterialUzs: toNum(stdRow['std_material_uzs'], 0),
          stdLaborUzs:    toNum(stdRow['std_labor_uzs'], 0),
          stdOverheadUzs: toNum(stdRow['std_overhead_uzs'], 0),
          stdTotal:       toNum(stdRow['std_total'], 0),
        }
      : null;

    return {
      order,
      bomItemsJson:     String(bomRes.rows[0]?.['items']  ?? '[]'),
      routingStepsJson: String(routingRes.rows[0]?.['steps'] ?? '[]'),
      actualHours:      toNum(mesRes.rows[0]?.['ah'], 0),
      stdCost,
      actualMaterial: {
        actualMaterialQty: toNum(movRes.rows[0]?.['actual_material_qty'], 0),
        actualUnitPrice:   toNum(movRes.rows[0]?.['actual_unit_price'], 0),
      },
    };
  }

  async saveVarianceReport(v: VarianceReportInput): Promise<void> {
    try {
      await runQuery(sql`
        INSERT INTO variance_report (order_id, mpv, mqv, lrv, lev, ov, total_variance)
        VALUES (${v.orderId}, ${v.mpv}, ${v.mqv}, ${v.lrv}, ${v.lev}, ${v.ov}, ${v.totalVariance})
        ON CONFLICT (order_id) DO UPDATE
          SET mpv = EXCLUDED.mpv, mqv = EXCLUDED.mqv, lrv = EXCLUDED.lrv,
              lev = EXCLUDED.lev, ov = EXCLUDED.ov, total_variance = EXCLUDED.total_variance,
              calculated_at = now()
      `);
    } catch (err) {
      this.logger.warn(`VarianceReport saqlashda xato (skipped): ${String(err)}`);
    }
  }

  async createKaizenAuditTask(title: string, description: string): Promise<void> {
    await runQuery(sql`
      INSERT INTO kaizen_suggestions (title, description, status, created_at)
      VALUES (${title}, ${description}, ${'open'}, now())
    `);
  }
}
