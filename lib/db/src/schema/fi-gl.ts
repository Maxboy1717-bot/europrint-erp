/**
 * @module fi-gl
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


// ========== 2. OMBOR VA MOLIYA MODULI (WAREHOUSE & FINANCE) ==========

// Accounts (buxgalteriya hisobvaraqlari)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  accountCode: varchar("account_code", { length: 20 }).notNull().unique(),
  accountName: text("account_name").notNull(),
  accountNameRu: text("account_name_ru"),
  accountType: varchar("account_type", { length: 20 }).notNull(), // asset, liability, equity, revenue, expense
  parentAccountId: varchar("parent_account_id").references((): AnyPgColumn => accounts.id, { onDelete: 'set null' }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("accounts_type_chk", sql`${t.accountType} IN ('asset','liability','equity','revenue','expense')`),
]);


export const insertAccountSchema = createInsertSchema(accounts, {
  accountCode: z.string().min(1, "Hisob kodi talab qilinadi"),
  accountName: z.string().min(2, "Hisob nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  accountType: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
}).omit({ id: true, createdAt: true } as never);


export type Account = typeof accounts.$inferSelect;

export type InsertAccount = z.infer<typeof insertAccountSchema>;


// Entries (provodkalar)
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  entryNumber: varchar("entry_number", { length: 50 }).notNull().unique(),
  entryDate: varchar("entry_date", { length: 10 }).notNull(), // YYYY-MM-DD
  documentType: varchar("document_type", { length: 50 }).notNull(), // purchase, sale, production, payment, other
  documentId: varchar("document_id"), // Bog'liq hujjat ID
  debitAccountId: varchar("debit_account_id").references(() => accounts.id, { onDelete: "set null" }),
  creditAccountId: varchar("credit_account_id").references(() => accounts.id, { onDelete: "set null" }),
  amount: numericMoney("amount").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // ADD-ONLY (live DB drift columns)
  debitAccount: text("debit_account"),
  creditAccount: text("credit_account"),
  referenceId: varchar("reference_id"),
  referenceType: varchar("reference_type", { length: 30 }),
  postedBy: integer("posted_by"),
  postedAt: timestamp("posted_at"),
  currency: varchar("currency", { length: 10 }).notNull().default('UZS'),
}, (t) => [
  check("entries_amount_chk", sql`${t.amount} > 0`),
]);


export const insertEntrySchema = createInsertSchema(entries, {
  entryNumber: z.string().min(1, "Provodka raqami talab qilinadi"),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type Entry = typeof entries.$inferSelect;

export type InsertEntry = z.infer<typeof insertEntrySchema>;


// Cost Centers (xarajat markazlari)
export const costCenters = pgTable("cost_centers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: 'set null' }),
  managerId: integer("manager_id").references(() => users.id, { onDelete: 'set null' }),
  parentId: varchar("parent_id").references((): AnyPgColumn => costCenters.id, { onDelete: 'set null' }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


export const insertCostCenterSchema = createInsertSchema(costCenters, {
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type CostCenter = typeof costCenters.$inferSelect;

export type InsertCostCenter = z.infer<typeof insertCostCenterSchema>;


// Profit Centers (foyda markazlari)
export const profitCenters = pgTable("profit_centers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  description: text("description"),
  managerId: integer("manager_id").references(() => users.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertProfitCenterSchema = createInsertSchema(profitCenters, {
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type ProfitCenter = typeof profitCenters.$inferSelect;

export type InsertProfitCenter = z.infer<typeof insertProfitCenterSchema>;


// GL Documents (Bosh daftar hujjatlari)
export const glDocuments = pgTable("gl_documents", {
  id: serial("id").primaryKey(),
  documentNumber: varchar("document_number", { length: 50 }).notNull().unique(),
  documentDate: varchar("document_date", { length: 10 }).notNull(), // YYYY-MM-DD
  postingDate: varchar("posting_date", { length: 10 }).notNull(), // YYYY-MM-DD
  documentType: varchar("document_type", { length: 20 }).notNull(), // invoice, payment, transfer, adjustment
  referenceType: varchar("reference_type", { length: 30 }), // sales_order, purchase_order, production_order, manual
  referenceId: varchar("reference_id"),
  description: text("description"),
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  totalDebit: numericMoney("total_debit").notNull().default(0),
  totalCredit: numericMoney("total_credit").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, posted, reversed
  postedBy: varchar("posted_by").references(() => users.id, { onDelete: "set null" }),
  postedAt: timestamp("posted_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // ADD-ONLY (live DB drift columns — converged from stub/DB manifest)
  costCenterId: varchar("cost_center_id"),
  profitCenterId: varchar("profit_center_id"),
  updatedAt: timestamp("updated_at"),
  docNumber: text("doc_number"),
  docType: varchar("doc_type", { length: 20 }),
  reference: varchar("reference", { length: 100 }),
  totalAmount: numericMoney("total_amount"),
  amount: numericMoney("amount"),
  metadata: jsonb("metadata"),
  createdBy: integer("created_by"),
}, (t) => [
  index("idx_gl_documents_status").on(t.status),
  index("idx_gl_documents_document_type").on(t.documentType),
  index("idx_gl_documents_document_date").on(t.documentDate),
  index("idx_gl_documents_reference_id").on(t.referenceId),
  index("idx_gl_documents_created_at").on(t.createdAt),
  check("gl_documents_status_chk", sql`${t.status} IN ('draft','posted','reversed')`),
  check("gl_documents_doc_type_chk", sql`${t.documentType} IN ('invoice','payment','transfer','adjustment','sales_invoice','purchase_invoice')`),
]);


export const insertGlDocumentSchema = createInsertSchema(glDocuments, {
  documentNumber: z.string().min(1, "Hujjat raqami talab qilinadi"),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  postingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  documentType: z.enum(["invoice", "payment", "transfer", "adjustment", "sales_invoice", "purchase_invoice"]),
  referenceType: z.enum(["sales_order", "purchase_order", "production_order", "sales_invoice", "purchase_invoice", "manual"]).optional(),
  status: z.enum(["draft", "posted", "reversed"]),
}).omit({ id: true, createdAt: true } as never);


export type GlDocument = typeof glDocuments.$inferSelect;

export type InsertGlDocument = z.infer<typeof insertGlDocumentSchema>;


// GL Lines (Bosh daftar qatorlari)
export const glLines = pgTable("gl_lines", {
  id: serial("id").primaryKey(),
  glDocumentId: varchar("gl_document_id").notNull().references(() => glDocuments.id, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(),
  accountId: varchar("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  costCenterId: varchar("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
  profitCenterId: varchar("profit_center_id").references(() => profitCenters.id, { onDelete: "set null" }),
  debitAmount: numericMoney("debit_amount").notNull().default(0),
  creditAmount: numericMoney("credit_amount").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertGlLineSchema = createInsertSchema(glLines, {
  lineNumber: z.number().int().positive("Qator raqami musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type GlLine = typeof glLines.$inferSelect;

export type InsertGlLine = z.infer<typeof insertGlLineSchema>;


// Accounting Periods (hisobot davrlari)
export const accountingPeriods = pgTable("accounting_periods", {
  id: serial("id").primaryKey(),
  periodCode: varchar("period_code", { length: 7 }).notNull().unique(), // YYYY-MM format
  fiscalYear: integer("fiscal_year").notNull(),
  month: integer("month").notNull(), // 1-12
  startDate: varchar("start_date", { length: 10 }).notNull(), // YYYY-MM-DD
  endDate: varchar("end_date", { length: 10 }).notNull(), // YYYY-MM-DD
  status: varchar("status", { length: 20 }).notNull().default("open"), // open, closed, soft_closed
  closedBy: varchar("closed_by").references(() => users.id, { onDelete: "set null" }),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // ADD-ONLY (live DB drift columns)
  year: integer("year"),
  isClosed: boolean("is_closed"),
  name: text("name"),
}, (t) => [
  check("accounting_periods_status_chk", sql`${t.status} IN ('open','closed','soft_closed')`),
  check("accounting_periods_month_chk", sql`${t.month} >= 1 AND ${t.month} <= 12`),
]);


export const insertAccountingPeriodSchema = createInsertSchema(accountingPeriods, {
  periodCode: z.string().regex(/^\d{4}-\d{2}$/, "Davr kodi YYYY-MM formatida bo'lishi kerak"),
  fiscalYear: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["open", "closed", "soft_closed"]),
}).omit({ id: true, createdAt: true } as never);


export type AccountingPeriod = typeof accountingPeriods.$inferSelect;

export type InsertAccountingPeriod = z.infer<typeof insertAccountingPeriodSchema>;


// Payroll Periods (ish haqi davrlari)
export const payrollPeriods = pgTable("payroll_periods", {
  id: serial("id").primaryKey(),
  // Multi-tenancy (Phase 2 / Task 2.1). See lib/db/src/schema/employees.ts.
  tenantId: integer("tenant_id").notNull().default(1),
  periodName: text("period_name"),
  startDate: varchar("start_date", { length: 10 }),
  endDate: varchar("end_date", { length: 10 }),
  periodStartDate: varchar("period_start_date", { length: 10 }),
  periodEndDate: varchar("period_end_date", { length: 10 }),
  calculationDate: varchar("calculation_date", { length: 10 }),
  approvalDate: varchar("approval_date", { length: 10 }),
  paymentDate: varchar("payment_date", { length: 10 }),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  totalAmount: numericMoney("total_amount"),
  totalPayrollAmount: numericMoney("total_payroll_amount"),
  employeeCount: integer("employee_count"),
  createdBy: integer("created_by"),
  approvedBy: integer("approved_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  // ADD-ONLY (live DB drift column)
  updatedAt: timestamp("updated_at"),
}, (t) => [
  check("payroll_periods_status_chk", sql`${t.status} IN ('open','processing','closed')`),
]);


export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods, {
  periodName: z.string().min(3, "Davr nomi kamida 3 ta belgidan iborat bo'lishi kerak"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  status: z.enum(["open", "processing", "closed"]),
}).omit({ id: true, createdAt: true, closedAt: true } as never);


export type PayrollPeriod = typeof payrollPeriods.$inferSelect;

export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;


// Payroll Rows (ish haqi qatorlari - faqat ishlab chiqarish)
export const payrollRows = pgTable("payroll_rows", {
  id: serial("id").primaryKey(),
  periodId: varchar("period_id").references(() => payrollPeriods.id, { onDelete: "set null" }),
  employeeId: varchar("employee_id").references(() => users.id, { onDelete: "set null" }),
  workDays: integer("work_days").notNull().default(0),
  productionQuantity: integer("production_quantity").notNull().default(0), // Ishlab chiqargan mahsulot miqdori
  ratePerUnit: numericMoney("rate_per_unit"), // Bir birlik uchun to'lov
  baseSalary: numericMoney("base_salary").notNull().default(0),
  bonuses: numericMoney("bonuses").notNull().default(0),
  deductions: numericMoney("deductions").notNull().default(0),
  totalSalary: numericMoney("total_salary").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // ADD-ONLY (live DB drift columns)
  bonus: numericMoney("bonus"),
  netPay: numericMoney("net_pay"),
  status: varchar("status", { length: 20 }),
});


export const insertPayrollRowSchema = createInsertSchema(payrollRows, {
  workDays: z.number().int().nonnegative("Ish kunlari 0 yoki katta bo'lishi kerak"),
  productionQuantity: z.number().int().nonnegative("Ishlab chiqarish miqdori 0 yoki katta bo'lishi kerak"),
  baseSalary: z.number().nonnegative("Asosiy maosh 0 yoki katta bo'lishi kerak"),
  bonuses: z.number().nonnegative("Bonuslar 0 yoki katta bo'lishi kerak"),
  deductions: z.number().nonnegative("Ushlab qolishlar 0 yoki katta bo'lishi kerak"),
  totalSalary: z.number().nonnegative("Umumiy maosh 0 yoki katta bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type PayrollRow = typeof payrollRows.$inferSelect;

// =====================================================================
// CFO CONFIG — Moliyaviy konfiguratsiya jadvali (TZ 01 / Task #482)
// =====================================================================
export const cfoConfig = pgTable("cfo_config", {
  id:          serial("id").primaryKey(),
  configKey:   varchar("config_key", { length: 100 }).notNull().unique(),
  configValue: numeric("config_value", { precision: 20, scale: 6 }).notNull(),
  description: text("description"),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
});

export type CfoConfig = typeof cfoConfig.$inferSelect;
