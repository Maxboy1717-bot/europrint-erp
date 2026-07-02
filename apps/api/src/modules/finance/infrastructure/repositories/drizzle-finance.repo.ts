/**
 * @module drizzle-finance.repo
 * @description Umbrella facade implementing {@link IFinanceRepo}. After Rule 13/16 split,
 *              every concern is delegated to a focused sub-repo:
 *                • Ops/payroll/cash         → {@link FinanceOpsRepo}
 *                • Invoices/Payments/GL     → {@link FinanceInvoiceRepo}
 *                • Reports (AR aging, etc.) → {@link FinanceReportRepo}
 *                • Budgets                  → {@link DrizzleFinanceBudgetsRepository}
 *                • CFO Config (P0-1)        → {@link FinanceCfoRepo}
 *                • Planning (P0-2)          → {@link FinancePlanningRepo}
 *                • Costing/Pricing (P0-2)   → {@link FinanceCostingRepo}
 *                • Variance analysis (P0-2) → {@link FinanceVarianceRepo}
 *
 *              The facade preserves the public IFinanceRepo contract so consumers
 *              (handlers, listeners, modules) keep working unchanged. See
 *              ARCHITECTURE_RULES.md Rule 16.
 */

import { Injectable } from '@nestjs/common';
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
import { DrizzleFinanceBudgetsRepository } from '../../budgets/drizzle-finance-budgets.repo';
import { FinanceOpsRepo } from './drizzle-finance-ops.repo';
import { FinanceCfoRepo } from './drizzle-finance-cfo.repo';
import { FinancePlanningRepo } from './drizzle-finance-planning.repo';
import { FinanceCostingRepo } from './drizzle-finance-costing.repo';
import { FinanceVarianceRepo } from './drizzle-finance-variance.repo';

@Injectable()
export class FinanceRepository implements IFinanceRepo {
  constructor(
    private readonly invoiceRepo:  FinanceInvoiceRepo,
    private readonly reportRepo:   FinanceReportRepo,
    private readonly budgetRepo:   DrizzleFinanceBudgetsRepository,
    private readonly opsRepo:      FinanceOpsRepo,
    private readonly cfoRepo:      FinanceCfoRepo,
    private readonly planningRepo: FinancePlanningRepo,
    private readonly costingRepo:  FinanceCostingRepo,
    private readonly varianceRepo: FinanceVarianceRepo,
  ) {}

  // ── Ops/payroll/cash (handler support) ──────────────────────────────────────
  getSettingValue(settingKey: string): Promise<number> { return this.opsRepo.getSettingValue(settingKey); }
  findEmployeeBalance(employeeId: number): Promise<{ baseSalary: number } | null> { return this.opsRepo.findEmployeeBalance(employeeId); }
  recordAdvance(advance: Parameters<FinanceOpsRepo['recordAdvance']>[0]): Promise<void> { return this.opsRepo.recordAdvance(advance); }
  recordPayment(payment: Parameters<FinanceOpsRepo['recordPayment']>[0]): Promise<void> { return this.opsRepo.recordPayment(payment); }
  getWarehouseRentalRate(warehouseId: number): Promise<number> { return this.opsRepo.getWarehouseRentalRate(warehouseId); }
  recordWarehouseRental(rental: Parameters<FinanceOpsRepo['recordWarehouseRental']>[0]): Promise<number> { return this.opsRepo.recordWarehouseRental(rental); }
  getAllUnpaidInvoices(): Promise<{ id: number; totalAmount: number; paidAmount: number; dueDate: Date }[]> { return this.opsRepo.getAllUnpaidInvoices(); }
  getCashBalance(asOfDate: Date): Promise<number> { return this.opsRepo.getCashBalance(asOfDate); }
  getSalesReceipts(startDate: Date, endDate: Date): Promise<number> { return this.opsRepo.getSalesReceipts(startDate, endDate); }
  getOtherReceipts(startDate: Date, endDate: Date): Promise<number> { return this.opsRepo.getOtherReceipts(startDate, endDate); }
  getExpenses(startDate: Date, endDate: Date): Promise<number> { return this.opsRepo.getExpenses(startDate, endDate); }
  getPayrollDisbursements(startDate: Date, endDate: Date): Promise<number> { return this.opsRepo.getPayrollDisbursements(startDate, endDate); }
  getOtherDisbursements(startDate: Date, endDate: Date): Promise<number> { return this.opsRepo.getOtherDisbursements(startDate, endDate); }

  // ── Invoices / Payments / GL ────────────────────────────────────────────────
  async findInvoiceById(id: string): Promise<Result<FinanceRow | null>> { return this.invoiceRepo.findInvoiceById(id); }
  async findInvoices(f: Parameters<FinanceInvoiceRepo['findInvoices']>[0]): Promise<Result<{ items: FinanceRow[]; total: number }>> { return this.invoiceRepo.findInvoices(f); }
  async findInvoiceBySalesOrderId(sid: string): Promise<Result<FinanceRow | null>> { return this.invoiceRepo.findInvoiceBySalesOrderId(sid); }
  async saveInvoice(inv: FinanceRow): Promise<Result<FinanceRow>> { return this.invoiceRepo.saveInvoice(inv); }
  async updateInvoice(id: string, data: FinanceRow): Promise<Result<FinanceRow>> { return this.invoiceRepo.updateInvoice(id, data); }
  async updateInvoicePaidAmount(invoiceId: number, paidAmount: number, paymentStatus: string): Promise<Result<void>> { return this.invoiceRepo.updateInvoicePaidAmount(invoiceId, paidAmount, paymentStatus); }
  async findPayments(f: Parameters<FinanceInvoiceRepo['findPayments']>[0]): Promise<Result<{ items: FinanceRow[]; total: number }>> { return this.invoiceRepo.findPayments(f); }
  async savePayment(p: FinanceRow): Promise<Result<FinanceRow>> { return this.invoiceRepo.savePayment(p); }
  async saveGlEntry(entry: FinanceRow): Promise<Result<FinanceRow>> { return this.invoiceRepo.saveGlEntry(entry); }
  async findGlEntries(f: Parameters<FinanceInvoiceRepo['findGlEntries']>[0]): Promise<Result<{ items: FinanceRow[]; total: number }>> { return this.invoiceRepo.findGlEntries(f); }

  // ── Reports ─────────────────────────────────────────────────────────────────
  async getArAging(): Promise<Result<FinanceRow[]>> { return this.reportRepo.getArAging(); }
  async getCashFlow(from: Date, to: Date): Promise<Result<{ inflows: number; outflows: number; netFlow: number; from: Date; to: Date }>> { return this.reportRepo.getCashFlow(from, to); }
  async getAdvanceSummary(): Promise<Result<FinanceRow[]>> { return this.reportRepo.getAdvanceSummary(); }

  // ── Budgets ─────────────────────────────────────────────────────────────────
  async findBudgetById(id: string): Promise<Result<FinanceRow>> { return this.budgetRepo.findBudgetById(id); }
  async findBudgets(f: Parameters<DrizzleFinanceBudgetsRepository['findBudgets']>[0]): Promise<Result<{ items: FinanceRow[]; total: number }>> { return this.budgetRepo.findBudgets(f); }
  async saveBudget(budget: FinanceRow, lines: FinanceRow[]): Promise<Result<FinanceRow>> { return this.budgetRepo.saveBudget(budget, lines); }
  async updateBudgetStatus(id: string, status: string): Promise<Result<FinanceRow>> { return this.budgetRepo.updateBudgetStatus(id, status); }
  async updateActuals(budgetId: string): Promise<Result<FinanceRow>> { return this.budgetRepo.updateActuals(budgetId); }
  async getBudgetStats(fiscalYear: number): Promise<Result<{ totalBudgets: number; approved: number; draft: number; totalPlanned: number; totalActual: number; overallVariancePercent: number }>> { return this.budgetRepo.getBudgetStats(fiscalYear); }

  // ── CFO Config (P0-1) ───────────────────────────────────────────────────────
  findCfoConfig(key: string): Promise<Result<CfoConfigRow | null>> { return this.cfoRepo.findCfoConfig(key); }
  findCfoConfigMap(keys: string[]): Promise<Result<Map<string, string>>> { return this.cfoRepo.findCfoConfigMap(keys); }
  findAllCfoConfig(): Promise<Result<CfoConfigRow[]>> { return this.cfoRepo.findAllCfoConfig(); }
  upsertCfoConfig(input: { key: string; value: number }): Promise<Result<CfoConfigRow>> { return this.cfoRepo.upsertCfoConfig(input); }

  // ── Planning (P0-2: Break-even, Cashflow, Ratios) ───────────────────────────
  fetchBreakEvenInputs(productName: string, period: string): Promise<BreakEvenInputs> { return this.planningRepo.fetchBreakEvenInputs(productName, period); }
  upsertCostStructure(input: Parameters<FinancePlanningRepo['upsertCostStructure']>[0]): Promise<void> { return this.planningRepo.upsertCostStructure(input); }
  fetchCashflowWeek(weekStartIso: string, weekEndIso: string, eclRates: { e030: number; e3160: number; e6190: number; e91p: number }): Promise<CashflowWeekRaw> { return this.planningRepo.fetchCashflowWeek(weekStartIso, weekEndIso, eclRates); }
  fetchFinancialRatiosGl(period: string): Promise<FinancialRatiosGl | null> { return this.planningRepo.fetchFinancialRatiosGl(period); }
  saveFinancialRatiosSnapshot(snapshot: FinancialRatiosSnapshotInput): Promise<void> { return this.planningRepo.saveFinancialRatiosSnapshot(snapshot); }
  flagAltmanDistress(period: string, zScore: number): Promise<void> { return this.planningRepo.flagAltmanDistress(period, zScore); }

  // ── Costing / Pricing / Variance (P0-2) ─────────────────────────────────────
  findStandardCostByName(productName: string, period: string): Promise<StandardCostRecord | null> { return this.costingRepo.findStandardCostByName(productName, period); }
  findStandardCostById(productId: number, period: string): Promise<StandardCostRecord | null> { return this.costingRepo.findStandardCostById(productId, period); }
  listStandardCosts(productName: string, limit: number): Promise<StandardCostRecord[]> { return this.costingRepo.listStandardCosts(productName, limit); }
  fetchStandardCostCalcInputs(productName: string): Promise<StandardCostCalcInputs> { return this.costingRepo.fetchStandardCostCalcInputs(productName); }
  upsertStandardCost(input: StandardCostUpsertInput): Promise<void> { return this.costingRepo.upsertStandardCost(input); }
  findLatestStandardCost(productId: number | null, productName: string): Promise<{ stdMaterialUzs: number; stdLaborUzs: number; stdOverheadUzs: number; stdTotal: number } | null> { return this.costingRepo.findLatestStandardCost(productId, productName); }
  findPriceTierForQty(productName: string, qty: number, effectiveDateIso: string): Promise<PriceTierRow | null> { return this.costingRepo.findPriceTierForQty(productName, qty, effectiveDateIso); }
  listPriceTiers(productName: string): Promise<PriceTierRow[]> { return this.costingRepo.listPriceTiers(productName); }
  upsertPriceTier(input: PriceTierUpsertInput): Promise<PriceTierRow | null> { return this.costingRepo.upsertPriceTier(input); }
  fetchVarianceOrderInputs(orderId: number): Promise<VarianceOrderInputs> { return this.varianceRepo.fetchVarianceOrderInputs(orderId); }
  saveVarianceReport(input: VarianceReportInput): Promise<void> { return this.varianceRepo.saveVarianceReport(input); }
  createKaizenAuditTask(title: string, description: string): Promise<void> { return this.varianceRepo.createKaizenAuditTask(title, description); }
}
