/**
 * @module fi-financial-reports
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { pgTable, text, varchar, integer, date, timestamp, jsonb, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================================
// FI-FINANCIAL-REPORTS — Daily snapshot tables for reporting
// Text primary keys use deterministic IDs (e.g. 'kassa-2026-05-08')
// so cron snapshots are idempotent via onConflictDoNothing().
// ============================================================

// 1. Kassa (Cash Flow) daily snapshots
export const kassaTransactions = pgTable("rpt_kassa_transactions", {
  id: text("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  totalInflow: numericMoney("total_inflow").notNull().default(0),
  totalOutflow: numericMoney("total_outflow").notNull().default(0),
  netCashFlow: numericMoney("net_cash_flow").notNull().default(0),
  openingBalance: numericMoney("opening_balance").notNull().default(0),
  closingBalance: numericMoney("closing_balance").notNull().default(0),
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_rpt_kassa_report_date").on(t.reportDate),
  check("chk_rpt_kassa_inflow_nn", sql`${t.totalInflow} >= 0`),
  check("chk_rpt_kassa_outflow_nn", sql`${t.totalOutflow} >= 0`),
]);

// 2. Ombor qoldiq (Warehouse balance) daily snapshots
export const omborQoldiq = pgTable("rpt_ombor_qoldiq", {
  id: text("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  warehouseId: integer("warehouse_id"),
  warehouseName: text("warehouse_name"),
  totalItems: integer("total_items").notNull().default(0),
  totalQuantity: numericMoney("total_quantity").notNull().default(0),
  totalValue: numericMoney("total_value").notNull().default(0),
  averageValue30d: numericMoney("average_value_30d").notNull().default(0),
  overstockFlag: text("overstock_flag").default("normal"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_rpt_ombor_report_date").on(t.reportDate),
  index("idx_rpt_ombor_warehouse_id").on(t.warehouseId),
  check("chk_rpt_ombor_overstock_flag", sql`${t.overstockFlag} IN ('normal','warning','critical')`),
]);

// 3. Debitorlar (Accounts receivable) aging snapshots
export const debitorlar = pgTable("rpt_debitorlar", {
  id: text("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  customerId: integer("customer_id"),
  customerName: text("customer_name"),
  totalReceivable: numericMoney("total_receivable").notNull().default(0),
  current: numericMoney("current").notNull().default(0),   // 0-30 days
  overdue30: numericMoney("overdue_30").notNull().default(0),  // 31-60 days
  overdue60: numericMoney("overdue_60").notNull().default(0),  // 61-90 days
  overdue90plus: numericMoney("overdue_90_plus").notNull().default(0), // >90 days
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_rpt_debitorlar_report_date").on(t.reportDate),
  index("idx_rpt_debitorlar_customer_id").on(t.customerId),
  check("chk_rpt_debitorlar_receivable_nn", sql`${t.totalReceivable} >= 0`),
]);

// 4. Kreditorlar (Accounts payable) aging snapshots
export const kreditorlar = pgTable("rpt_kreditorlar", {
  id: text("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  vendorId: integer("vendor_id"),
  vendorName: text("vendor_name"),
  totalPayable: numericMoney("total_payable").notNull().default(0),
  current: numericMoney("current").notNull().default(0),
  overdue30: numericMoney("overdue_30").notNull().default(0),
  overdue60: numericMoney("overdue_60").notNull().default(0),
  overdue90plus: numericMoney("overdue_90_plus").notNull().default(0),
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_rpt_kreditorlar_report_date").on(t.reportDate),
  index("idx_rpt_kreditorlar_vendor_id").on(t.vendorId),
  check("chk_rpt_kreditorlar_payable_nn", sql`${t.totalPayable} >= 0`),
]);

// 5. Balans (Balance sheet) daily snapshots
export const balans = pgTable("rpt_balans", {
  id: text("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  totalAssets: numericMoney("total_assets").notNull().default(0),
  currentAssets: numericMoney("current_assets").notNull().default(0),
  nonCurrentAssets: numericMoney("non_current_assets").notNull().default(0),
  totalLiabilities: numericMoney("total_liabilities").notNull().default(0),
  currentLiabilities: numericMoney("current_liabilities").notNull().default(0),
  nonCurrentLiabilities: numericMoney("non_current_liabilities").notNull().default(0),
  equity: numericMoney("equity").notNull().default(0),
  retainedEarnings: numericMoney("retained_earnings").notNull().default(0),
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_rpt_balans_report_date").on(t.reportDate),
]);

// 6. Ishlab chiqarish (Production) daily snapshots
export const ishlabChiqarish = pgTable("rpt_ishlab_chiqarish", {
  id: text("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  plannedQuantity: numericMoney("planned_quantity").notNull().default(0),
  actualQuantity: numericMoney("actual_quantity").notNull().default(0),
  goodQuantity: numericMoney("good_quantity").notNull().default(0),
  scrapQuantity: numericMoney("scrap_quantity").notNull().default(0),
  efficiencyPct: numericMoney("efficiency_pct").notNull().default(0),
  scrapRatePct: numericMoney("scrap_rate_pct").notNull().default(0),
  downtimeMinutes: integer("downtime_minutes").notNull().default(0),
  workCenterId: integer("work_center_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_rpt_ishlab_report_date").on(t.reportDate),
  check("chk_rpt_ishlab_efficiency_range", sql`${t.efficiencyPct} >= 0 AND ${t.efficiencyPct} <= 100`),
  check("chk_rpt_ishlab_scrap_range", sql`${t.scrapRatePct} >= 0 AND ${t.scrapRatePct} <= 100`),
  check("chk_rpt_ishlab_downtime_nn", sql`${t.downtimeMinutes} >= 0`),
]);
