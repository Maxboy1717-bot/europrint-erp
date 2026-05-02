import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, type AnyPgColumn, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Position, approvalRequests, departments, users } from "./core-schema";
import { crmCompanies, crmContacts } from "./crm-schema";
import { Attendance } from "./hr-schema";
import { materialCards, purchaseInvoices, purchaseOrders, vendors } from "./mm-schema";
import { Order, orders, productMasters, productionOrders } from "./pp-schema";
import { salesInvoices, salesOrders } from "./sd-schema";
import { warehouses } from "./wms-schema";
import { accounts, glDocuments, payrollPeriods, glLines, accountingPeriods, costCenters, profitCenters } from "./fi-gl";
import { customerPayments, invoicePayments, financialKPIs, insertFinancialKPISchema } from "./fi-ap-ar";

export const payrollContracts = pgTable("payroll_contracts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  contractNumber: varchar("contract_number", { length: 50 }).notNull().unique(),
  payType: varchar("pay_type", { length: 20 }).notNull(), // fixed, hourly, piecework
  baseSalary: numericMoney("base_salary"), // For fixed salary
  hourlyRate: numericMoney("hourly_rate"), // For hourly
  pieceworkRate: numericMoney("piecework_rate"), // For piecework (per unit)
  pieceworkUnit: varchar("piecework_unit", { length: 20 }), // dona, kg, metr, etc.
  minWageGuarantee: boolean("min_wage_guarantee").notNull().default(true), // Minimal maosh kafolati
  workSchedule: varchar("work_schedule", { length: 20 }).default("full_time"), // full_time, part_time, shift
  monthlyHours: integer("monthly_hours").default(176), // Oylik ish soatlari
  effectiveFrom: varchar("effective_from", { length: 10 }).notNull(), // YYYY-MM-DD
  effectiveTo: varchar("effective_to", { length: 10 }), // YYYY-MM-DD
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, suspended, terminated
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  index("idx_payroll_contracts_employee_id").on(t.employeeId),
  index("idx_payroll_contracts_status").on(t.status),
  index("idx_payroll_contracts_pay_type").on(t.payType),
]);


export const insertPayrollContractSchema = createInsertSchema(payrollContracts, {
  contractNumber: z.string().min(3, "Shartnoma raqami kamida 3 ta belgidan iborat bo'lishi kerak"),
  payType: z.enum(["fixed", "hourly", "piecework"]),
  workSchedule: z.enum(["full_time", "part_time", "shift"]).default("full_time"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["active", "suspended", "terminated"]).default("active"),
}).omit({ id: true, createdAt: true } as never);


export type PayrollContract = typeof payrollContracts.$inferSelect;

export type InsertPayrollContract = z.infer<typeof insertPayrollContractSchema>;


// Payroll Tax Rules (Soliq qoidalari)
export const payrollTaxRules = pgTable("payroll_tax_rules", {
  id: serial("id").primaryKey(),
  taxCode: varchar("tax_code", { length: 20 }).notNull().unique(),
  taxName: text("tax_name").notNull(),
  taxNameRu: text("tax_name_ru"),
  taxType: varchar("tax_type", { length: 20 }).notNull(), // income_tax, social_tax, pension
  rate: numericMoney("rate").notNull(), // Foiz (masalan: 12 = 12%)
  employeeShare: numericMoney("employee_share").notNull().default(0), // Xodim ulushi
  employerShare: numericMoney("employer_share").notNull().default(0), // Ish beruvchi ulushi
  minThreshold: numericMoney("min_threshold"), // Minimal chegara
  maxThreshold: numericMoney("max_threshold"), // Maksimal chegara
  effectiveFrom: varchar("effective_from", { length: 10 }).notNull(), // YYYY-MM-DD
  effectiveTo: varchar("effective_to", { length: 10 }), // YYYY-MM-DD
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_payroll_tax_rules_tax_type").on(t.taxType),
  index("idx_payroll_tax_rules_is_active").on(t.isActive),
]);


export const insertPayrollTaxRuleSchema = createInsertSchema(payrollTaxRules, {
  taxCode: z.string().min(2, "Soliq kodi kamida 2 ta belgidan iborat bo'lishi kerak"),
  taxName: z.string().min(3, "Soliq nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  taxType: z.enum(["income_tax", "social_tax", "pension"]),
  rate: z.number().min(0).max(100, "Stavka 0 dan 100 gacha bo'lishi kerak"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type PayrollTaxRule = typeof payrollTaxRules.$inferSelect;

export type InsertPayrollTaxRule = z.infer<typeof insertPayrollTaxRuleSchema>;


// Enhanced Payroll Calculations (Kengaytirilgan oylik hisob-kitob)
export const payrollCalculations = pgTable("payroll_calculations", {
  id: serial("id").primaryKey(),
  periodId: varchar("period_id").references(() => payrollPeriods.id),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  contractId: varchar("contract_id").references(() => payrollContracts.id),
  payType: varchar("pay_type", { length: 20 }).notNull(), // fixed, hourly, piecework

  // Time/Production data
  workDays: integer("work_days").default(0),
  workHours: numericMoney("work_hours").default(0),
  overtimeHours: numericMoney("overtime_hours").default(0),
  productionUnits: numericMoney("production_units").default(0),

  // Earnings breakdown
  basePay: numericMoney("base_pay").notNull().default(0),
  hourlyPay: numericMoney("hourly_pay").default(0),
  pieceworkPay: numericMoney("piecework_pay").default(0),
  overtimePay: numericMoney("overtime_pay").default(0),
  bonuses: numericMoney("bonuses").default(0),
  allowances: numericMoney("allowances").default(0), // Qo'shimcha to'lovlar
  grossPay: numericMoney("gross_pay").notNull(), // Yalpi maosh

  // Tax deductions (auto-calculated)
  taxInps: numericMoney("tax_inps").notNull().default(0), // INPS 12%
  taxJshd: numericMoney("tax_jshd").notNull().default(0), // JSHD 12%
  totalTaxes: numericMoney("total_taxes").notNull().default(0),

  // Other deductions
  otherDeductions: numericMoney("other_deductions").default(0),
  advances: numericMoney("advances").default(0), // Avans
  loans: numericMoney("loans").default(0), // Qarz to'lovlari
  totalDeductions: numericMoney("total_deductions").notNull().default(0),

  // Final amounts
  netPay: numericMoney("net_pay").notNull(), // Sof maosh
  minWageTopUp: numericMoney("min_wage_top_up").default(0), // Minimal maosh qo'shimchasi

  // Status
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, calculated, approved, paid
  calculatedAt: timestamp("calculated_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_payroll_calculations_employee_id").on(t.employeeId),
  index("idx_payroll_calculations_period_id").on(t.periodId),
  index("idx_payroll_calculations_status").on(t.status),
  index("idx_payroll_calculations_created_at").on(t.createdAt),
]);


export const insertPayrollCalculationSchema = createInsertSchema(payrollCalculations, {
  payType: z.enum(["fixed", "hourly", "piecework"]),
  grossPay: z.number().nonnegative("Yalpi maosh 0 dan kam bo'lmasligi kerak"),
  netPay: z.number().nonnegative("Sof maosh 0 dan kam bo'lmasligi kerak"),
  status: z.enum(["draft", "calculated", "approved", "paid"]).default("draft"),
}).omit({ id: true, createdAt: true } as never);


export type PayrollCalculation = typeof payrollCalculations.$inferSelect;

export type InsertPayrollCalculation = z.infer<typeof insertPayrollCalculationSchema>;


// ============================================
// DAILY FINANCIAL KPIs
// ============================================

// Daily Financial Metrics (Kunlik moliyaviy ko'rsatkichlar)
export const dailyFinancialMetrics = pgTable("daily_financial_metrics", {
  id: serial("id").primaryKey(),
  metricDate: varchar("metric_date", { length: 10 }).notNull().unique(), // YYYY-MM-DD

  // Cash Position
  cashBalance: numericMoney("cash_balance").default(0), // Naqd pul qoldig'i
  bankBalance: numericMoney("bank_balance").default(0), // Bank balansi
  totalLiquidity: numericMoney("total_liquidity").default(0), // Umumiy likvidlik

  // Daily Transactions
  dailyIncome: numericMoney("daily_income").default(0), // Kunlik daromad
  dailyExpense: numericMoney("daily_expense").default(0), // Kunlik xarajat
  dailyNetCash: numericMoney("daily_net_cash").default(0), // Kunlik sof pul oqimi

  // Receivables & Payables
  totalReceivables: numericMoney("total_receivables").default(0), // Debitorlar
  totalPayables: numericMoney("total_payables").default(0), // Kreditorlar
  overdueReceivables: numericMoney("overdue_receivables").default(0), // Muddati o'tgan debitor
  overduePayables: numericMoney("overdue_payables").default(0), // Muddati o'tgan kreditor

  // Inventory
  inventoryValue: numericMoney("inventory_value").default(0), // Inventar qiymati
  rawMaterialValue: numericMoney("raw_material_value").default(0), // Xom ashyo qiymati
  finishedGoodsValue: numericMoney("finished_goods_value").default(0), // Tayyor mahsulot

  // Orders & Sales
  newOrdersCount: integer("new_orders_count").default(0), // Yangi buyurtmalar
  newOrdersValue: numericMoney("new_orders_value").default(0),
  invoicedValue: numericMoney("invoiced_value").default(0), // Faktura qilingan
  collectedValue: numericMoney("collected_value").default(0), // Yig'ilgan

  // Production
  productionValue: numericMoney("production_value").default(0), // Ishlab chiqarish qiymati
  productionCost: numericMoney("production_cost").default(0), // Ishlab chiqarish xarajati

  // Profitability
  dailyGrossProfit: numericMoney("daily_gross_profit").default(0),
  dailyGrossMargin: numericMoney("daily_gross_margin").default(0), // %

  // Trends (vs previous day)
  cashTrend: numericMoney("cash_trend").default(0), // % change
  incomeTrend: numericMoney("income_trend").default(0),
  ordersTrend: numericMoney("orders_trend").default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  index("idx_daily_financial_metrics_metric_date").on(t.metricDate),
]);


export const insertDailyFinancialMetricSchema = createInsertSchema(dailyFinancialMetrics, {
  metricDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type DailyFinancialMetric = typeof dailyFinancialMetrics.$inferSelect;

export type InsertDailyFinancialMetric = z.infer<typeof insertDailyFinancialMetricSchema>;


// AI Finance Insights (AI moliya tahliллари)
export const aiFinanceInsights = pgTable("ai_finance_insights", {
  id: serial("id").primaryKey(),
  insightType: varchar("insight_type", { length: 30 }).notNull(), // forecast, anomaly, recommendation, alert
  segment: varchar("segment", { length: 30 }).notNull(), // cash, receivables, payables, inventory, payroll, budget
  insightDate: varchar("insight_date", { length: 10 }).notNull(), // YYYY-MM-DD
  confidence: numericMoney("confidence"), // 0-100
  priority: varchar("priority", { length: 10 }).default("medium"), // low, medium, high, critical
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description").notNull(),
  descriptionRu: text("description_ru"),
  impact: text("impact"), // Ta'sir
  impactRu: text("impact_ru"),
  recommendation: text("recommendation"), // Tavsiya
  recommendationRu: text("recommendation_ru"),
  payload: jsonb("payload"), // Qo'shimcha ma'lumotlar
  actionRequired: boolean("action_required").notNull().default(false),
  actionTaken: boolean("action_taken").notNull().default(false),
  actionTakenBy: varchar("action_taken_by").references(() => users.id),
  actionTakenAt: timestamp("action_taken_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_ai_finance_insights_insight_type").on(t.insightType),
  index("idx_ai_finance_insights_segment").on(t.segment),
  index("idx_ai_finance_insights_priority").on(t.priority),
  index("idx_ai_finance_insights_created_at").on(t.createdAt),
]);


export const insertAiFinanceInsightSchema = createInsertSchema(aiFinanceInsights, {
  insightType: z.enum(["forecast", "anomaly", "recommendation", "alert"]),
  segment: z.enum(["cash", "receivables", "payables", "inventory", "payroll", "budget"]),
  insightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  confidence: z.number().min(0).max(100).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  description: z.string().min(10, "Tavsif kamida 10 ta belgidan iborat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type AiFinanceInsight = typeof aiFinanceInsights.$inferSelect;
