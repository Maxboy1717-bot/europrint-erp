/**
 * @module i-finance.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/types/result.type';

export type FinanceRow = Record<string, unknown>;

// ---- DTOs returned to domain services (P0-1 / P0-2) ----

export interface CfoConfigRow {
  id: number;
  configKey: string;
  configValue: string;
  description: string | null;
  updatedAt: Date;
}

export interface BreakEvenInputs {
  /** Cost structure row for (product, period); null when no record exists. */
  costStructure: {
    fixedCostUzs: number;
    variableCostUzs: number;
    sellingPriceUzs: number;
  } | null;
  /** Sum of completed production-order planned quantities for the period. */
  actualQty: number;
}

export interface CashflowWeekRaw {
  arCol: number;
  soInflow: number;
  apOut: number;
  payrollOut: number;
}

export interface FinancialRatiosGl {
  revenue: number;
  cogs: number;
  opex: number;
  interestExp: number;
  totalAssets: number;
  totalEquity: number;
  totalDebt: number;
  currentAssets: number;
  currentLiabilities: number;
  inventory: number;
  cash: number;
  retainedEarnings: number;
}

export interface FinancialRatiosSnapshotInput {
  period: string;
  currentRatio: number;
  quickRatio: number;
  grossMarginPct: number;
  netMarginPct: number;
  roa: number;
  roe: number;
  debtToEquity: number;
  altmanZ: number;
  altmanZone: string;
  revenue: number;
  netIncome: number;
}

export interface StandardCostRecord {
  productName: string;
  productId: number | null;
  period: string;
  stdMaterialUzs: number;
  stdLaborUzs: number;
  stdOverheadUzs: number;
  stdTotalUzs: number;
  createdAt: Date | null;
}

export interface StandardCostCalcInputs {
  productId: number | null;
  bomItemsJson: string;
  routingStepsJson: string;
}

export interface StandardCostUpsertInput {
  productName: string;
  productId: number | null;
  period: string;
  stdMaterialUzs: number;
  stdLaborUzs: number;
  stdOverheadUzs: number;
}

export interface PriceTierRow {
  id: string;
  productName: string;
  productId: number | null;
  tierName: string;
  minQty: number;
  maxQty: number | null;
  priceUzs: number;
  validFrom: string;
  validTo: string | null;
}

export interface PriceTierUpsertInput {
  productName: string;
  tierName: string;
  minQty: number;
  maxQty: number | null;
  priceUzs: number;
  validFrom: string;
  validTo: string | null;
}

export interface VarianceOrderInputs {
  order: {
    id: number;
    orderNumber: string;
    productName: string;
    productId: number | null;
    plannedQty: number;
    actualCostTotal: number;
    bomId: number | null;
    routingId: number | null;
  } | null;
  bomItemsJson: string;
  routingStepsJson: string;
  actualHours: number;
  stdCost: {
    stdMaterialUzs: number;
    stdLaborUzs: number;
    stdOverheadUzs: number;
    stdTotal: number;
  } | null;
  actualMaterial: {
    actualMaterialQty: number;
    actualUnitPrice: number;
  };
}

export interface VarianceReportInput {
  orderId: number;
  mpv: number;
  mqv: number;
  lrv: number;
  lev: number;
  ov: number;
  totalVariance: number;
}

export interface IFinanceRepo {
  // Invoices
  findInvoiceById(id: string): Promise<Result<FinanceRow | null>>;
  findInvoices(filters: { status?: string; customerId?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>>;
  findInvoiceBySalesOrderId(salesOrderId: string): Promise<Result<FinanceRow | null>>;
  saveInvoice(invoice: FinanceRow): Promise<Result<FinanceRow>>;
  updateInvoice(id: string, data: FinanceRow): Promise<Result<FinanceRow>>;
  updateInvoicePaidAmount(invoiceId: number, paidAmount: number, paymentStatus: string): Promise<Result<void>>;

  // Payments
  findPayments(filters: { invoiceId?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>>;
  savePayment(payment: FinanceRow): Promise<Result<FinanceRow>>;

  // GL
  saveGlEntry(entry: FinanceRow): Promise<Result<FinanceRow>>;
  findGlEntries(filters: { account?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>>;

  // Business queries
  getArAging(): Promise<Result<FinanceRow[]>>;
  getCashFlow(from: Date, to: Date): Promise<Result<{ inflows: number; outflows: number; netFlow: number; from: Date; to: Date }>>;
  getAdvanceSummary(): Promise<Result<FinanceRow[]>>;

  // Budgets
  findBudgetById(id: string): Promise<Result<FinanceRow>>;
  findBudgets(filters: {
    fiscalYear?: number;
    status?: string;
    department?: string;
    page?: number;
    limit?: number;
  }): Promise<Result<{ items: FinanceRow[]; total: number }>>;
  saveBudget(budget: FinanceRow, lines: FinanceRow[]): Promise<Result<FinanceRow>>;
  updateBudgetStatus(id: string, status: string): Promise<Result<FinanceRow>>;
  updateActuals(budgetId: string): Promise<Result<FinanceRow>>;
  getBudgetStats(fiscalYear: number): Promise<
    Result<{
      totalBudgets: number;
      approved: number;
      draft: number;
      totalPlanned: number;
      totalActual: number;
      overallVariancePercent: number;
    }>
  >;

  // ---- P0-6 (handler migration) — needed by record-payment / check-advance handlers ----
  getSettingValue(settingKey: string): Promise<number>;
  findEmployeeBalance(employeeId: number): Promise<{ baseSalary: number } | null>;
  recordAdvance(advance: {
    employeeId: number;
    amount: number;
    status: string;
    approvedBy: number;
    remarks?: string;
    approvedAt: Date;
  }): Promise<void>;
  recordPayment(payment: {
    paymentId: number;
    invoiceId: number;
    amount: number;
    status: string;
    recordedBy: number;
    recordedAt: Date;
  }): Promise<void>;

  // ---- P0-1 CFO Config ----
  findCfoConfig(key: string): Promise<Result<CfoConfigRow | null>>;
  findCfoConfigMap(keys: string[]): Promise<Result<Map<string, string>>>;
  findAllCfoConfig(): Promise<Result<CfoConfigRow[]>>;
  upsertCfoConfig(input: { key: string; value: number }): Promise<Result<CfoConfigRow>>;

  // ---- P0-2 Domain service data accessors ----
  fetchBreakEvenInputs(productName: string, period: string): Promise<BreakEvenInputs>;
  upsertCostStructure(input: {
    productName: string;
    period: string;
    fixedCostUzs: number;
    variableCostUzs: number;
    sellingPriceUzs: number;
  }): Promise<void>;

  fetchCashflowWeek(weekStartIso: string, weekEndIso: string, eclRates: {
    e030: number; e3160: number; e6190: number; e91p: number;
  }): Promise<CashflowWeekRaw>;

  fetchFinancialRatiosGl(period: string): Promise<FinancialRatiosGl | null>;
  saveFinancialRatiosSnapshot(snapshot: FinancialRatiosSnapshotInput): Promise<void>;
  flagAltmanDistress(period: string, zScore: number): Promise<void>;

  findStandardCostByName(productName: string, period: string): Promise<StandardCostRecord | null>;
  findStandardCostById(productId: number, period: string): Promise<StandardCostRecord | null>;
  listStandardCosts(productName: string, limit: number): Promise<StandardCostRecord[]>;
  fetchStandardCostCalcInputs(productName: string): Promise<StandardCostCalcInputs>;
  upsertStandardCost(input: StandardCostUpsertInput): Promise<void>;
  findLatestStandardCost(productId: number | null, productName: string): Promise<{
    stdMaterialUzs: number; stdLaborUzs: number; stdOverheadUzs: number; stdTotal: number;
  } | null>;

  findPriceTierForQty(productName: string, qty: number, effectiveDateIso: string): Promise<PriceTierRow | null>;
  listPriceTiers(productName: string): Promise<PriceTierRow[]>;
  upsertPriceTier(input: PriceTierUpsertInput): Promise<PriceTierRow | null>;

  fetchVarianceOrderInputs(orderId: number): Promise<VarianceOrderInputs>;
  saveVarianceReport(input: VarianceReportInput): Promise<void>;
  createKaizenAuditTask(title: string, description: string): Promise<void>;
}
export const FINANCE_REPO = Symbol('FINANCE_REPO');
