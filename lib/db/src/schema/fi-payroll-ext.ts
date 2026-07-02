/**
 * @module fi-payroll-ext
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, type AnyPgColumn, uuid, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Position, approvalRequests, departments, users } from "./core-schema";
// ORFAN CLEANUP (2026-07-02): unused import of crmCompanies/crmContacts from
// "./crm-schema" removed — those pgTable declarations were deleted (dead
// lib/db duplicates, Q-29 verified: never used in this file).
import { Attendance } from "./hr-schema";
import { materialCards, vendors } from "./mm-schema";
import { Order, orders, productMasters, productionOrders } from "./pp-schema";
import { salesInvoices, salesOrders } from "./sd-schema";
import { warehouses } from "./wms-schema";
import { accounts, glDocuments, glLines, accountingPeriods, payrollPeriods } from "./fi-gl";
import { customerPayments, invoicePayments } from "./fi-ap-ar";
import { cashRegisters, insertAiFinanceInsightSchema, aiFinanceInsights } from "./fi-banking";

export type InsertAiFinanceInsight = z.infer<typeof insertAiFinanceInsightSchema>;


// ============================================
// AI PAYROLL CALCULATION (AI OYLIK HISOBLASH)
// ============================================

// Payroll Work Evidence (Ish dalillari - AI tomonidan yig'ilgan)
export const payrollWorkEvidence = pgTable("payroll_work_evidence", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  periodMonth: varchar("period_month", { length: 7 }).notNull(), // YYYY-MM

  // Attendance data (Davomat ma'lumotlari)
  attendanceWorkDays: integer("attendance_work_days").default(0), // Davomat bo'yicha ish kunlari
  attendanceWorkHours: numericMoney("attendance_work_hours").default(0), // Davomat soatlari
  attendanceSource: varchar("attendance_source", { length: 30 }).default("camera"), // camera, manual, time_clock
  attendanceConfidence: numericMoney("attendance_confidence").default(0), // 0-100%

  // Production data (Ishlab chiqarish ma'lumotlari)
  productionUnits: numericMoney("production_units").default(0), // Ishlab chiqarilgan dona
  productionSource: varchar("production_source", { length: 30 }).default("iot"), // iot, manual, erp
  productionConfidence: numericMoney("production_confidence").default(0), // 0-100%

  // Time tracking data (Vaqt kuzatuvi)
  trackedHours: numericMoney("tracked_hours").default(0), // Kanban time tracking
  taskCompletionCount: integer("task_completion_count").default(0), // Bajarilgan vazifalar
  timeTrackingSource: varchar("time_tracking_source", { length: 30 }).default("kanban"), // kanban, manual
  timeTrackingConfidence: numericMoney("time_tracking_confidence").default(0), // 0-100%

  // Overtime data (Qo'shimcha ish vaqti)
  overtimeHours: numericMoney("overtime_hours").default(0),
  weekendHours: numericMoney("weekend_hours").default(0),
  holidayHours: numericMoney("holiday_hours").default(0),

  // Aggregated scores (Umumiy ballar)
  overallConfidence: numericMoney("overall_confidence").default(0), // 0-100%
  dataQualityScore: varchar("data_quality_score", { length: 10 }).default("medium"), // low, medium, high

  // Anomalies detected (Aniqlangan anomaliyalar)
  anomaliesDetected: boolean("anomalies_detected").default(false),
  anomalyDetails: jsonb("anomaly_details"), // { type, description, severity }[]

  // Manual overrides (Qo'lda o'zgartirishlar)
  manualOverride: boolean("manual_override").default(false),
  overrideBy: varchar("override_by").references(() => users.id, { onDelete: "set null" }),
  overrideReason: text("override_reason"),
  overrideAt: timestamp("override_at"),

  // Meta
  aggregatedAt: timestamp("aggregated_at").notNull().defaultNow(),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_payroll_work_evidence_employee_id").on(t.employeeId),
  index("idx_payroll_work_evidence_period_month").on(t.periodMonth),
  check("payroll_work_evidence_quality_chk", sql`${t.dataQualityScore} IS NULL OR ${t.dataQualityScore} IN ('low','medium','high')`),
  check("payroll_work_evidence_confidence_chk", sql`${t.overallConfidence} IS NULL OR (${t.overallConfidence} >= 0 AND ${t.overallConfidence} <= 100)`),
]);


export const insertPayrollWorkEvidenceSchema = createInsertSchema(payrollWorkEvidence, {
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/, "Davr YYYY-MM formatida bo'lishi kerak"),
  attendanceSource: z.enum(["camera", "manual", "time_clock"]).default("camera"),
  productionSource: z.enum(["iot", "manual", "erp"]).default("iot"),
  timeTrackingSource: z.enum(["kanban", "manual"]).default("kanban"),
  dataQualityScore: z.enum(["low", "medium", "high"]).default("medium"),
}).omit({ id: true, createdAt: true, aggregatedAt: true } as never);


export type PayrollWorkEvidence = typeof payrollWorkEvidence.$inferSelect;

export type InsertPayrollWorkEvidence = z.infer<typeof insertPayrollWorkEvidenceSchema>;


// AI Payroll Recommendations (AI oylik tavsiялари)
export const payrollAiRecommendations = pgTable("payroll_ai_recommendations", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  periodMonth: varchar("period_month", { length: 7 }).notNull(), // YYYY-MM
  evidenceId: varchar("evidence_id").references(() => payrollWorkEvidence.id, { onDelete: "set null" }),
  
  // Recommendation type
  recommendationType: varchar("recommendation_type", { length: 30 }).notNull(), // bonus, penalty, adjustment, warning, optimization
  priority: varchar("priority", { length: 10 }).default("medium"), // low, medium, high, critical
  
  // Content
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description").notNull(),
  descriptionRu: text("description_ru"),
  
  // Impact
  suggestedAmount: numericMoney("suggested_amount"), // Taklif qilingan summa
  impactPercentage: numericMoney("impact_percentage"), // Ta'sir foizi
  
  // Analysis details
  analysisDetails: jsonb("analysis_details"), // { comparison, trends, factors }
  confidence: numericMoney("confidence").default(0), // 0-100%
  
  // Status
  status: varchar("status", { length: 20 }).default("pending"), // pending, accepted, rejected, applied
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  reviewNote: text("review_note"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_payroll_ai_recommendations_employee_id").on(t.employeeId),
  index("idx_payroll_ai_recommendations_period_month").on(t.periodMonth),
  index("idx_payroll_ai_recommendations_status").on(t.status),
  check("payroll_ai_rec_type_chk", sql`${t.recommendationType} IN ('bonus','penalty','adjustment','warning','optimization')`),
  check("payroll_ai_rec_priority_chk", sql`${t.priority} IS NULL OR ${t.priority} IN ('low','medium','high','critical')`),
  check("payroll_ai_rec_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('pending','accepted','rejected','applied')`),
]);


export const insertPayrollAiRecommendationSchema = createInsertSchema(payrollAiRecommendations, {
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/, "Davr YYYY-MM formatida bo'lishi kerak"),
  recommendationType: z.enum(["bonus", "penalty", "adjustment", "warning", "optimization"]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  description: z.string().min(10, "Tavsif kamida 10 ta belgidan iborat bo'lishi kerak"),
  status: z.enum(["pending", "accepted", "rejected", "applied"]).default("pending"),
}).omit({ id: true, createdAt: true } as never);


export type PayrollAiRecommendation = typeof payrollAiRecommendations.$inferSelect;

export type InsertPayrollAiRecommendation = z.infer<typeof insertPayrollAiRecommendationSchema>;


// 7. STOCK BALANCE SNAPSHOT - Ombor qoldig'i real-time (balans-snapshot, LEDGER EMAS).
//    SQL nomi 'stock_ledger' → 'stock_balance_snapshot' (schema-convergence 2026-06-19):
//    POS pos-schema-extensions.ts dagi append-only `stock_ledger` bilan SQL-nom to'qnashuvi
//    bor edi (drizzle-kit push'ni bloklardi). Bu eksport hech qayerda import qilinmagan;
//    balanslar kanonik `warehouse_stock`. Eksport nomi (stockLedger) saqlandi.
export const stockLedger = pgTable("stock_balance_snapshot", {
  id: serial("id").primaryKey(),
  productMasterId: varchar("product_master_id").references(() => productMasters.id, { onDelete: "set null" }),
  materialCardId: varchar("material_id").references(() => materialCards.id, { onDelete: "set null" }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  batchNumber: varchar("batch_number", { length: 50 }),
  onHandQuantity: numericMoney("on_hand_quantity").notNull().default(0),
  reservedQuantity: numericMoney("reserved_quantity").notNull().default(0),
  availableQuantity: numericMoney("available_quantity").notNull().default(0), // onHand - reserved
  inTransitQuantity: numericMoney("in_transit_quantity").notNull().default(0),
  orderedQuantity: numericMoney("ordered_quantity").notNull().default(0), // incoming orders
  unitCost: numericMoney("unit_cost"),
  totalValue: numericMoney("total_value"),
  lastReceivedAt: timestamp("last_received_at"),
  lastIssuedAt: timestamp("last_issued_at"),
  lastCountedAt: timestamp("last_counted_at"),
  expiryDate: varchar("expiry_date", { length: 10 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_stock_balance_snapshot_product").on(t.productMasterId),
  index("idx_stock_balance_snapshot_warehouse").on(t.warehouseId),
]);


export type StockLedger = typeof stockLedger.$inferSelect;


// Budget Control - Byudjet nazorati
export const budgetControls = pgTable("budget_controls", {
  id: serial("id").primaryKey(),
  budgetCode: varchar("budget_code", { length: 50 }).notNull().unique(),
  budgetName: text("budget_name").notNull(),
  budgetNameRu: text("budget_name_ru"),
  budgetType: varchar("budget_type", { length: 30 }).notNull(), // department, project, cost_center, internal_order
  referenceId: varchar("reference_id"), // departmentId, projectId, etc
  fiscalYear: varchar("fiscal_year", { length: 4 }).notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull(), // annual, quarterly, monthly
  periodCode: varchar("period_code", { length: 10 }), // Q1, 2026-01, etc
  budgetAmount: numericMoney("budget_amount").notNull(),
  committedAmount: numericMoney("committed_amount").notNull().default(0), // Approved but not spent
  actualAmount: numericMoney("actual_amount").notNull().default(0),
  availableAmount: numericMoney("available_amount").notNull(), // budget - committed - actual
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  warningPercent: numericMoney("warning_percent").default(80), // Alert when 80% used
  blockPercent: numericMoney("block_percent").default(100), // Block when 100% used
  allowOverspend: boolean("allow_overspend").notNull().default(false),
  overspendLimit: numericMoney("overspend_limit"),
  approverRoleForOverspend: varchar("approver_role_for_overspend", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, frozen, closed
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  index("idx_budget_controls_budget_type").on(t.budgetType),
  index("idx_budget_controls_fiscal_year").on(t.fiscalYear),
  index("idx_budget_controls_status").on(t.status),
]);


export type BudgetControl = typeof budgetControls.$inferSelect;


export const insertStockLedgerSchema = createInsertSchema(stockLedger).omit({ id: true, updatedAt: true } as never);

export type InsertStockLedger = z.infer<typeof insertStockLedgerSchema>;


export const insertBudgetControlSchema = createInsertSchema(budgetControls).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type InsertBudgetControl = z.infer<typeof insertBudgetControlSchema>;


// ========== POS SYSTEM ==========
// NOTE: retail `posTransactions` pgTable (pos_transactions) o'chirildi 2026-07-02 —
// retail-do'kon kontsepti retiring qilindi (naqd-nazorat = fi-cashier-hub.ts),
// 0 runtime o'quvchi isbotlangan. DB jadvali DROP qilinmadi (egasi-bosqich).
export const posProducts = pgTable("pos_products", {
  id: serial("id").primaryKey(),
  barcode: varchar("barcode", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  category: varchar("category", { length: 50 }),
  unitPrice: numericMoney("unit_price").notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("dona"),
  stockQuantity: numericMoney("stock_quantity").default(0),
  minStock: numericMoney("min_stock").default(0),
  isActive: boolean("is_active").notNull().default(true),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_pos_products_category").on(t.category),
  index("idx_pos_products_is_active").on(t.isActive),
]);


export const insertPosProductSchema = createInsertSchema(posProducts).omit({ id: true, createdAt: true } as never);


export type PosProduct = typeof posProducts.$inferSelect;

export type InsertPosProduct = z.infer<typeof insertPosProductSchema>;


export const cfoBotSettings = pgTable("cfo_bot_settings", {
  id: serial("id").primaryKey(),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }).notNull().unique(),
  ownerName: varchar("owner_name", { length: 200 }),
  language: varchar("language", { length: 10 }).default("uz"),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Tashkent"),
  morningReportEnabled: boolean("morning_report_enabled").default(true),
  morningReportTime: varchar("morning_report_time", { length: 10 }).default("08:00"),
  weeklyReportEnabled: boolean("weekly_report_enabled").default(true),
  weeklyReportDay: integer("weekly_report_day").default(1),
  alertsEnabled: boolean("alerts_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_cfo_bot_settings_language").on(t.language),
]);


export const cfoBotConversations = pgTable("cfo_bot_conversations", {
  id: serial("id").primaryKey(),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 30 }).default("text"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_cfo_bot_conversations_telegram_chat_id").on(t.telegramChatId),
  index("idx_cfo_bot_conversations_role").on(t.role),
]);

