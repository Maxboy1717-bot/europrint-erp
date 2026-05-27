/**
 * @module fi-kassa
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
import { accounts, glDocuments, payrollPeriods, glLines, accountingPeriods, costCenters, profitCenters } from "./fi-gl";
import { customerPayments, invoicePayments, financialKPIs, insertFinancialKPISchema } from "./fi-ap-ar";

export type InsertFinancialKPI = z.infer<typeof insertFinancialKPISchema>;


// ============================================
// KASSA (CASH REGISTER) MODULE
// ============================================

// Cash Registers (Kassalar)
export const cashRegisters = pgTable("cash_registers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  location: text("location"), // Joylashuv
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  custodianId: integer("custodian_id").references(() => users.id, { onDelete: "set null" }), // Kassir
  openingBalance: numericMoney("opening_balance").notNull().default(0),
  currentBalance: numericMoney("current_balance").notNull().default(0),
  dailyLimit: numericMoney("daily_limit"), // Kunlik limit
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_cash_registers_custodian_id").on(t.custodianId),
  index("idx_cash_registers_currency").on(t.currency),
]);


export const insertCashRegisterSchema = createInsertSchema(cashRegisters, {
  name: z.string().min(2, "Kassa nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  currency: z.string().default("UZS"),
}).omit({ id: true, createdAt: true } as never);


export type CashRegister = typeof cashRegisters.$inferSelect;

export type InsertCashRegister = z.infer<typeof insertCashRegisterSchema>;


// Cash Sessions (Kassa smenalari)
export const cashSessions = pgTable("cash_sessions", {
  id: serial("id").primaryKey(),
  registerId: integer("register_id").notNull().references(() => cashRegisters.id, { onDelete: "restrict" }),
  sessionNumber: varchar("session_number", { length: 50 }).notNull().unique(),
  openedBy: integer("opened_by").notNull().references(() => users.id, { onDelete: "set null" }),
  closedBy: integer("closed_by").references(() => users.id, { onDelete: "set null" }),
  openingBalance: numericMoney("opening_balance").notNull(),
  closingBalance: numericMoney("closing_balance"),
  expectedBalance: numericMoney("expected_balance"), // Kutilgan balans
  variance: numericMoney("variance"), // Farq (actual - expected)
  totalInflow: numericMoney("total_inflow").notNull().default(0),
  totalOutflow: numericMoney("total_outflow").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("open"), // open, closed, reconciled
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
  notes: text("notes"),
}, (t) => [
  check("cash_sessions_status_chk", sql`${t.status} IN ('open','closed','reconciled')`),
  index("idx_cash_sessions_register_id").on(t.registerId),
  index("idx_cash_sessions_status").on(t.status),
  index("idx_cash_sessions_opened_at").on(t.openedAt),
]);


export const insertCashSessionSchema = createInsertSchema(cashSessions, {
  openingBalance: z.number().nonnegative("Boshlang'ich balans 0 dan kam bo'lmasligi kerak"),
  status: z.enum(["open", "closed", "reconciled"]).default("open"),
}).omit({ id: true, openedAt: true } as never);


export type CashSession = typeof cashSessions.$inferSelect;

export type InsertCashSession = z.infer<typeof insertCashSessionSchema>;


// Cash Transactions (Kassa tranzaksiyalari)
export const cashTransactions = pgTable("cash_transactions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => cashSessions.id, { onDelete: "set null" }),
  registerId: integer("register_id").notNull().references(() => cashRegisters.id, { onDelete: "restrict" }),
  transactionNumber: varchar("transaction_number", { length: 50 }).notNull().unique(),
  transactionDate: varchar("transaction_date", { length: 10 }).notNull(), // YYYY-MM-DD
  transactionTime: varchar("transaction_time", { length: 8 }), // HH:MM:SS
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // inflow | outflow
  categoryId: varchar("category_id"), // References financeCategories.id
  counterparty: text("counterparty"), // Kim bilan
  counterpartyType: varchar("counterparty_type", { length: 20 }), // customer | vendor | employee | other
  paymentMethod: varchar("payment_method", { length: 20 }).notNull().default("cash"), // cash | card | bank_transfer
  referenceType: varchar("reference_type", { length: 30 }), // sales_invoice, purchase_invoice, expense, manual
  referenceId: varchar("reference_id"),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  description: text("description"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("cash_txn_type_chk", sql`${t.transactionType} IN ('inflow','outflow')`),
  check("cash_txn_counterparty_chk", sql`${t.counterpartyType} IS NULL OR ${t.counterpartyType} IN ('customer','vendor','employee','other')`),
  check("cash_txn_payment_chk", sql`${t.paymentMethod} IN ('cash','card','bank_transfer')`),
  index("idx_cash_transactions_session_id").on(t.sessionId),
  index("idx_cash_transactions_register_id").on(t.registerId),
  index("idx_cash_transactions_transaction_type").on(t.transactionType),
  index("idx_cash_transactions_reference_type").on(t.referenceType),
  index("idx_cash_transactions_created_at").on(t.createdAt),
]);


export const insertCashTransactionSchema = createInsertSchema(cashTransactions, {
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  transactionType: z.enum(["inflow", "outflow"]),
  paymentMethod: z.enum(["cash", "card", "bank_transfer"]).default("cash"),
  amount: z.number().positive("Summa 0 dan katta bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type CashTransaction = typeof cashTransactions.$inferSelect;

export type InsertCashTransaction = z.infer<typeof insertCashTransactionSchema>;


// ============================================
// KIRIM/CHIQIM (INCOME/EXPENSE) MODULE
// ============================================

// Finance Categories (Moliya kategoriyalari)
export const financeCategories = pgTable("finance_categories", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  categoryType: varchar("category_type", { length: 20 }).notNull(), // income | expense
  parentId: varchar("parent_id").references((): AnyPgColumn => financeCategories.id, { onDelete: "set null" }),
  accountId: varchar("account_id").references(() => accounts.id, { onDelete: "set null" }), // GL hisob bog'lanishi
  isSystem: boolean("is_system").notNull().default(false), // Tizim tomonidan yaratilgan
  isActive: boolean("is_active").notNull().default(true),
  color: varchar("color", { length: 7 }), // Rang kodi (#RRGGBB)
  icon: varchar("icon", { length: 50 }), // Lucide icon nomi
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // ADD-ONLY (live DB drift column)
  type: text("type"),
}, (t) => [
  check("finance_cat_type_chk", sql`${t.categoryType} IN ('income','expense')`),
  index("idx_finance_categories_category_type").on(t.categoryType),
  index("idx_finance_categories_is_active").on(t.isActive),
]);


export const insertFinanceCategorySchema = createInsertSchema(financeCategories, {
  code: z.string().min(2, "Kategoriya kodi kamida 2 ta belgidan iborat bo'lishi kerak"),
  name: z.string().min(2, "Kategoriya nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  categoryType: z.enum(["income", "expense"]),
}).omit({ id: true, createdAt: true } as never);


export type FinanceCategory = typeof financeCategories.$inferSelect;

export type InsertFinanceCategory = z.infer<typeof insertFinanceCategorySchema>;


// Income/Expense Transactions (Kirim/Chiqim operatsiyalari)
export const incomeExpenseTransactions = pgTable("income_expense_transactions", {
  id: serial("id").primaryKey(),
  transactionNumber: varchar("transaction_number", { length: 50 }).notNull().unique(),
  transactionDate: varchar("transaction_date", { length: 10 }).notNull(), // YYYY-MM-DD
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // income | expense
  categoryId: varchar("category_id"), // References financeCategories.id
  accountId: varchar("account_id").references(() => accounts.id, { onDelete: "set null" }), // GL hisob
  counterpartyType: varchar("counterparty_type", { length: 20 }), // customer, vendor, employee, other
  counterpartyId: varchar("counterparty_id"), // Related entity ID
  counterpartyName: text("counterparty_name"),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  exchangeRate: numericMoney("exchange_rate").default(1),
  description: text("description"),
  referenceType: varchar("reference_type", { length: 30 }), // invoice, order, manual
  referenceId: varchar("reference_id"),
  glDocumentId: varchar("gl_document_id").references(() => glDocuments.id, { onDelete: "set null" }), // Auto-generated GL entry
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | posted | cancelled
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  postedAt: timestamp("posted_at"),
}, (t) => [
  check("ie_txn_type_chk", sql`${t.transactionType} IN ('income','expense')`),
  check("ie_txn_status_chk", sql`${t.status} IN ('draft','posted','cancelled')`),
  index("idx_income_expense_transactions_transaction_type").on(t.transactionType),
  index("idx_income_expense_transactions_status").on(t.status),
  index("idx_income_expense_transactions_created_at").on(t.createdAt),
  index("idx_income_expense_transactions_reference_type").on(t.referenceType),
]);


export const insertIncomeExpenseTransactionSchema = createInsertSchema(incomeExpenseTransactions, {
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  transactionType: z.enum(["income", "expense"]),
  amount: z.number().positive("Summa 0 dan katta bo'lishi kerak"),
  status: z.enum(["draft", "posted", "cancelled"]).default("draft"),
}).omit({ id: true, createdAt: true } as never);


export type IncomeExpenseTransaction = typeof incomeExpenseTransactions.$inferSelect;

export type InsertIncomeExpenseTransaction = z.infer<typeof insertIncomeExpenseTransactionSchema>;


// ============================================
// PAYROLL AUTOMATION (OYLIK AVTOMATLASHTIRISH)
// ============================================

// Payroll Contracts (Oylik shartnomalari)