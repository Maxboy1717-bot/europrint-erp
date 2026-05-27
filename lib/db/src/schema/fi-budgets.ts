/**
 * @module fi-budgets
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, type AnyPgColumn, uuid, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Position, approvalRequests, departments, users } from "./core-schema";
import { crmCompanies, crmContacts } from "./crm-schema";
import { Attendance } from "./hr-schema";
import { materialCards, purchaseInvoices, purchaseOrders, vendors } from "./mm-schema";
import { Order, orders, productMasters, productionOrders } from "./pp-schema";
import { salesInvoices, salesOrders } from "./sd-schema";
import { warehouses } from "./wms-schema";
import { accounts, costCenters, glDocuments, payrollPeriods, profitCenters, glLines, accountingPeriods, payrollRows, insertPayrollRowSchema } from "./fi-gl";
import { budgets } from "./fi-ap-core";

export const insertBudgetSchema = createInsertSchema(budgets, {
  budgetName: z.string().min(3, "Byudjet nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  fiscalYear: z.number().int().min(2000).max(2100),
  periodType: z.enum(["annual", "quarterly", "monthly"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["draft", "approved", "active", "closed"]),
  totalAmount: z.number().nonnegative("Umumiy summa 0 yoki katta bo'lishi kerak"),
}).omit({ id: true, createdAt: true, approvedAt: true } as never);


export type Budget = typeof budgets.$inferSelect;

export type InsertBudget = z.infer<typeof insertBudgetSchema>;


// Budget Lines (Byudjet qatorlari)
export const budgetLines = pgTable("budget_lines", {
  id: serial("id").primaryKey(),
  budgetId: varchar("budget_id").notNull().references(() => budgets.id, { onDelete: "cascade" }),
  accountId: varchar("account_id").references(() => accounts.id, { onDelete: "set null" }),
  costCenterId: varchar("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
  plannedAmount: numericMoney("planned_amount").notNull().default(0),
  actualAmount: numericMoney("actual_amount").notNull().default(0),
  varianceAmount: numericMoney("variance_amount"), // actual - planned
  variancePercent: numericMoney("variance_percent"), // ((actual - planned) / planned) * 100
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_budget_lines_budget_id").on(t.budgetId),
  index("idx_budget_lines_account_id").on(t.accountId),
  index("idx_budget_lines_cost_center_id").on(t.costCenterId),
]);


export const insertBudgetLineSchema = createInsertSchema(budgetLines, {
  plannedAmount: z.number().nonnegative("Rejalashtirilgan summa 0 yoki katta bo'lishi kerak"),
  actualAmount: z.number().nonnegative("Haqiqiy summa 0 yoki katta bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type BudgetLine = typeof budgetLines.$inferSelect;

export type InsertBudgetLine = z.infer<typeof insertBudgetLineSchema>;


// Order Costings (Buyurtma tannarxi)
export const orderCostings = pgTable("order_costings", {
  id: serial("id").primaryKey(),
  orderId: text("order_id"),
  orderType: text("order_type"),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id, { onDelete: "set null" }),
  productionOrderId: varchar("production_order_id").references(() => productionOrders.id, { onDelete: "set null" }),
  materialCost: numericMoney("material_cost").notNull().default(0),
  laborCost: numericMoney("labor_cost").notNull().default(0),
  overheadCost: numericMoney("overhead_cost").notNull().default(0),
  energyCost: numericMoney("energy_cost").notNull().default(0),
  wasteCost: numericMoney("waste_cost").notNull().default(0),
  totalCost: numericMoney("total_cost").notNull().default(0),
  sellingPrice: numericMoney("selling_price").notNull().default(0),
  grossProfit: numericMoney("gross_profit"),
  profitMargin: numericMoney("profit_margin"),
  marginPercent: numericMoney("margin_percent"),
  currency: text("currency").default("UZS"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  calculatedBy: varchar("calculated_by").references(() => users.id, { onDelete: "set null" }),
  calculatedAt: timestamp("calculated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_order_costings_sales_order_id").on(t.salesOrderId),
  index("idx_order_costings_production_order_id").on(t.productionOrderId),
  index("idx_order_costings_status").on(t.status),
  check("order_costings_status_chk", sql`${t.status} IN ('draft','calculated','approved')`),
]);


export const insertOrderCostingSchema = createInsertSchema(orderCostings, {
  materialCost: z.number().nonnegative("Material xarajati 0 yoki katta bo'lishi kerak"),
  laborCost: z.number().nonnegative("Mehnat xarajati 0 yoki katta bo'lishi kerak"),
  overheadCost: z.number().nonnegative("Ustama xarajat 0 yoki katta bo'lishi kerak"),
  energyCost: z.number().nonnegative("Energiya xarajati 0 yoki katta bo'lishi kerak"),
  wasteCost: z.number().nonnegative("Isrof xarajati 0 yoki katta bo'lishi kerak"),
  totalCost: z.number().nonnegative("Umumiy xarajat 0 yoki katta bo'lishi kerak"),
  sellingPrice: z.number().nonnegative("Sotish narxi 0 yoki katta bo'lishi kerak"),
  status: z.enum(["draft", "calculated", "approved"]),
}).omit({ id: true, createdAt: true, calculatedAt: true } as never);


export type OrderCosting = typeof orderCostings.$inferSelect;

export type InsertOrderCosting = z.infer<typeof insertOrderCostingSchema>;


// Order Costing Lines (Buyurtma tannarx tafsilotlari)
export const orderCostingLines = pgTable("order_costing_lines", {
  id: serial("id").primaryKey(),
  orderCostingId: varchar("order_costing_id").notNull().references(() => orderCostings.id, { onDelete: "cascade" }),
  costType: varchar("cost_type", { length: 20 }).notNull(), // material, labor, overhead, energy, waste
  itemName: text("item_name").notNull(),
  quantity: numericMoney("quantity").notNull().default(0),
  unitPrice: numericMoney("unit_price").notNull().default(0),
  totalAmount: numericMoney("total_amount").notNull().default(0), // quantity * unitPrice
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // ADD-ONLY (live DB drift columns)
  type: text("type"),
  description: text("description"),
  amount: numericMoney("amount"),
}, (t) => [
  index("idx_order_costing_lines_order_costing_id").on(t.orderCostingId),
  index("idx_order_costing_lines_cost_type").on(t.costType),
  check("order_costing_lines_cost_type_chk", sql`${t.costType} IN ('material','labor','overhead','energy','waste')`),
]);


export const insertOrderCostingLineSchema = createInsertSchema(orderCostingLines, {
  costType: z.enum(["material", "labor", "overhead", "energy", "waste"]),
  itemName: z.string().min(1, "Element nomi talab qilinadi"),
  quantity: z.number().nonnegative("Miqdor 0 yoki katta bo'lishi kerak"),
  unitPrice: z.number().nonnegative("Birlik narxi 0 yoki katta bo'lishi kerak"),
  totalAmount: z.number().nonnegative("Umumiy summa 0 yoki katta bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type OrderCostingLine = typeof orderCostingLines.$inferSelect;

export type InsertOrderCostingLine = z.infer<typeof insertOrderCostingLineSchema>;


// AR Aging Buckets (Debitor qarzdorlik yosh kategoriyalari)
export const arAgingBuckets = pgTable("ar_aging_buckets", {
  id: serial("id").primaryKey(),
  customerId: varchar("customer_id"), // Reference to crmCompanies or crmContacts
  customerType: varchar("customer_type", { length: 20 }), // company, contact
  current: numericMoney("current").notNull().default(0), // 0-30 days
  days31to60: numericMoney("days_31_to_60").notNull().default(0),
  days61to90: numericMoney("days_61_to_90").notNull().default(0),
  days91to120: numericMoney("days_91_to_120").notNull().default(0),
  over120: numericMoney("over_120").notNull().default(0),
  totalOutstanding: numericMoney("total_outstanding").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
}, (t) => [
  index("idx_ar_aging_buckets_customer_id").on(t.customerId),
  index("idx_ar_aging_buckets_customer_type").on(t.customerType),
  check("ar_aging_customer_type_chk", sql`${t.customerType} IS NULL OR ${t.customerType} IN ('company','contact')`),
]);


export const insertArAgingBucketSchema = createInsertSchema(arAgingBuckets, {
  customerType: z.enum(["company", "contact"]).optional(),
  current: z.number().nonnegative(),
  days31to60: z.number().nonnegative(),
  days61to90: z.number().nonnegative(),
  days91to120: z.number().nonnegative(),
  over120: z.number().nonnegative(),
  totalOutstanding: z.number().nonnegative(),
}).omit({ id: true, lastUpdated: true } as never);


export type ArAgingBucket = typeof arAgingBuckets.$inferSelect;

export type InsertArAgingBucket = z.infer<typeof insertArAgingBucketSchema>;


// AP Aging Buckets (Kreditor qarzdorlik yosh kategoriyalari)
export const apAgingBuckets = pgTable("ap_aging_buckets", {
  id: serial("id").primaryKey(),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  current: numericMoney("current").notNull().default(0), // 0-30 days
  days31to60: numericMoney("days_31_to_60").notNull().default(0),
  days61to90: numericMoney("days_61_to_90").notNull().default(0),
  days91to120: numericMoney("days_91_to_120").notNull().default(0),
  over120: numericMoney("over_120").notNull().default(0),
  totalOutstanding: numericMoney("total_outstanding").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
}, (t) => [
  index("idx_ap_aging_buckets_vendor_id").on(t.vendorId),
]);


export const insertApAgingBucketSchema = createInsertSchema(apAgingBuckets, {
  current: z.number().nonnegative(),
  days31to60: z.number().nonnegative(),
  days61to90: z.number().nonnegative(),
  days91to120: z.number().nonnegative(),
  over120: z.number().nonnegative(),
  totalOutstanding: z.number().nonnegative(),
}).omit({ id: true, lastUpdated: true } as never);


export type ApAgingBucket = typeof apAgingBuckets.$inferSelect;

export type InsertApAgingBucket = z.infer<typeof insertApAgingBucketSchema>;


// Financial KPIs (Moliyaviy ko'rsatkichlar)
export const financialKPIs = pgTable("financial_kpis", {
  id: serial("id").primaryKey(),
  kpiDate: varchar("kpi_date", { length: 10 }).notNull(), // YYYY-MM-DD
  kpiPeriod: varchar("kpi_period", { length: 20 }).notNull().default("monthly"), // daily, weekly, monthly
  // Liquidity Ratios
  currentRatio: numericMoney("current_ratio"), // Current Assets / Current Liabilities
  quickRatio: numericMoney("quick_ratio"), // (Current Assets - Inventory) / Current Liabilities
  // Leverage Ratios
  debtToEquity: numericMoney("debt_to_equity"), // Total Debt / Total Equity
  // Profitability Ratios
  grossProfitMargin: numericMoney("gross_profit_margin"), // (Revenue - COGS) / Revenue * 100
  netProfitMargin: numericMoney("net_profit_margin"), // Net Income / Revenue * 100
  returnOnAssets: numericMoney("return_on_assets"), // Net Income / Total Assets * 100
  returnOnEquity: numericMoney("return_on_equity"), // Net Income / Shareholders' Equity * 100
  // Activity Ratios
  inventoryTurnover: numericMoney("inventory_turnover"), // COGS / Average Inventory
  receivablesTurnover: numericMoney("receivables_turnover"), // Net Credit Sales / Average Accounts Receivable
  payablesTurnover: numericMoney("payables_turnover"), // COGS / Average Accounts Payable
  // Cash Conversion
  cashConversionCycle: numericMoney("cash_conversion_cycle"), // DIO + DSO - DPO
  workingCapital: numericMoney("working_capital"), // Current Assets - Current Liabilities
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_financial_kpis_kpi_date").on(t.kpiDate),
  index("idx_financial_kpis_kpi_period").on(t.kpiPeriod),
  check("financial_kpis_period_chk", sql`${t.kpiPeriod} IN ('daily','weekly','monthly')`),
]);


export const insertFinancialKPISchema = createInsertSchema(financialKPIs, {
  kpiDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  kpiPeriod: z.enum(["daily", "weekly", "monthly"]),
}).omit({ id: true, createdAt: true } as never);


export type FinancialKPI = typeof financialKPIs.$inferSelect;
