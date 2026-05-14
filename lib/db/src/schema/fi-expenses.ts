/**
 * @module fi-expenses
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
import { accounts, glDocuments, glLines, accountingPeriods, costCenters, profitCenters, payrollPeriods } from "./fi-gl";
import { customerPayments, invoicePayments } from "./fi-ap-ar";
import { cashRegisters, insertAiFinanceInsightSchema, aiFinanceInsights } from "./fi-banking";
import { cfoBotSettings, cfoBotConversations } from "./fi-payroll-ext";

export const cfoBotExpenses = pgTable("cfo_bot_expenses", {
  id: serial("id").primaryKey(),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("UZS"),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  vendor: varchar("vendor", { length: 200 }),
  receiptImageUrl: text("receipt_image_url"),
  sourceType: varchar("source_type", { length: 20 }).default("manual"),
  status: varchar("status", { length: 20 }).default("confirmed"),
  expenseDate: timestamp("expense_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_cfo_bot_expenses_telegram_chat_id").on(t.telegramChatId),
  index("idx_cfo_bot_expenses_category").on(t.category),
  index("idx_cfo_bot_expenses_status").on(t.status),
  index("idx_cfo_bot_expenses_created_at").on(t.createdAt),
  check("cfo_bot_expenses_source_type_chk", sql`${t.sourceType} IS NULL OR ${t.sourceType} IN ('manual','telegram','bot','import')`),
  check("cfo_bot_expenses_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('pending','confirmed','rejected')`),
]);

export const cfoBotDocuments = pgTable("cfo_bot_documents", {
  id: serial("id").primaryKey(),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }).notNull(),
  fileName: text("file_name").notNull(),
  fileType: varchar("file_type", { length: 50 }),
  summary: text("summary"),
  keyPoints: text("key_points"),
  originalSize: integer("original_size"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_cfo_bot_documents_telegram_chat_id").on(t.telegramChatId),
  index("idx_cfo_bot_documents_status").on(t.status),
  check("cfo_bot_documents_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('pending','processed','failed')`),
]);

export const cfoBotHealthLogs = pgTable("cfo_bot_health_logs", {
  id: serial("id").primaryKey(),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }).notNull(),
  logType: varchar("log_type", { length: 30 }).notNull(),
  logDate: timestamp("log_date").defaultNow(),
  description: text("description"),
  calories: integer("calories"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_cfo_bot_health_logs_telegram_chat_id").on(t.telegramChatId),
  index("idx_cfo_bot_health_logs_log_type").on(t.logType),
]);

export const cfoBotReminders = pgTable("cfo_bot_reminders", {
  id: serial("id").primaryKey(),
  telegramChatId: varchar("telegram_chat_id", { length: 100 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  remindAt: timestamp("remind_at").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: varchar("recurring_pattern", { length: 50 }),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("idx_cfo_bot_reminders_telegram_chat_id").on(t.telegramChatId),
  index("idx_cfo_bot_reminders_status").on(t.status),
  index("idx_cfo_bot_reminders_remind_at").on(t.remindAt),
  check("cfo_bot_reminders_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('active','completed','cancelled')`),
  check("cfo_bot_reminders_pattern_chk", sql`${t.recurringPattern} IS NULL OR ${t.recurringPattern} IN ('daily','weekly','monthly','yearly')`),
]);

export const insertCfoBotSettingsSchema = createInsertSchema(cfoBotSettings).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const insertCfoBotConversationSchema = createInsertSchema(cfoBotConversations).omit({ id: true, createdAt: true } as never);

export const insertCfoBotExpenseSchema = createInsertSchema(cfoBotExpenses).omit({ id: true, createdAt: true } as never);

export const insertCfoBotDocumentSchema = createInsertSchema(cfoBotDocuments).omit({ id: true, createdAt: true } as never);

export const insertCfoBotHealthLogSchema = createInsertSchema(cfoBotHealthLogs).omit({ id: true, createdAt: true } as never);

export const insertCfoBotReminderSchema = createInsertSchema(cfoBotReminders).omit({ id: true, createdAt: true } as never);

export type CfoBotSettings = typeof cfoBotSettings.$inferSelect;

export type CfoBotConversation = typeof cfoBotConversations.$inferSelect;

export type CfoBotExpense = typeof cfoBotExpenses.$inferSelect;

export type CfoBotDocument = typeof cfoBotDocuments.$inferSelect;

export type CfoBotHealthLog = typeof cfoBotHealthLogs.$inferSelect;

export type CfoBotReminder = typeof cfoBotReminders.$inferSelect;

// ============================================================================
// FAZA 1D: KASSA NAZORAT — EXPENSE & ADVANCE PAYMENT TIZIMI
// ============================================================================

export const expenseRequests = pgTable("expense_requests", {
  id: serial("id").primaryKey(),
  requestNumber: varchar("request_number", { length: 30 }).notNull(),
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  department: varchar("department", { length: 100 }),
  category: varchar("category", { length: 50 }).notNull(),
  purpose: text("purpose").notNull(),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 5 }).notNull().default("UZS"),
  budgetLineId: varchar("budget_line_id"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  approvalRequestId: varchar("approval_request_id").references(() => approvalRequests.id, { onDelete: "set null" }),
  cashRegisterId: varchar("cash_register_id").references(() => cashRegisters.id, { onDelete: "set null" }),
  disbursedAmount: numericMoney("disbursed_amount"),
  disbursedAt: timestamp("disbursed_at"),
  disbursedBy: varchar("disbursed_by").references(() => users.id, { onDelete: "set null" }),
  settlementStatus: varchar("settlement_status", { length: 20 }).default("not_settled"),
  settledAmount: numericMoney("settled_amount"),
  settledAt: timestamp("settled_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_expense_requests_requested_by").on(t.requestedBy),
  index("idx_expense_requests_status").on(t.status),
  index("idx_expense_requests_category").on(t.category),
  index("idx_expense_requests_created_at").on(t.createdAt),
  check("expense_requests_status_chk", sql`${t.status} IN ('draft','submitted','approved','disbursed','settled','rejected','cancelled')`),
  check("expense_requests_settlement_chk", sql`${t.settlementStatus} IS NULL OR ${t.settlementStatus} IN ('not_settled','partial','settled','overspent')`),
  check("expense_requests_category_chk", sql`${t.category} IN ('MATERIAL','MRO','TRAVEL','UTILITIES','OFFICE','TRANSPORT','FOOD','OTHER')`),
]);


export const insertExpenseRequestSchema = createInsertSchema(expenseRequests, {
  category: z.enum(["MATERIAL", "MRO", "TRAVEL", "UTILITIES", "OFFICE", "TRANSPORT", "FOOD", "OTHER"]),
  status: z.enum(["draft", "submitted", "approved", "disbursed", "settled", "rejected", "cancelled"]).default("draft"),
  settlementStatus: z.enum(["not_settled", "partial", "settled", "overspent"]).default("not_settled"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type ExpenseRequest = typeof expenseRequests.$inferSelect;

export type InsertExpenseRequest = z.infer<typeof insertExpenseRequestSchema>;


export const expenseReports = pgTable("expense_reports", {
  id: serial("id").primaryKey(),
  expenseRequestId: varchar("expense_request_id").references(() => expenseRequests.id, { onDelete: "cascade" }).notNull(),
  reportNumber: varchar("report_number", { length: 30 }).notNull(),
  totalSpent: numericMoney("total_spent").notNull(),
  totalReceipts: integer("total_receipts").notNull().default(0),
  remainingCash: numericMoney("remaining_cash").default(0),
  deficit: numericMoney("deficit").default(0),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  submittedBy: varchar("submitted_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  verifiedBy: varchar("verified_by").references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_expense_reports_expense_request_id").on(t.expenseRequestId),
  index("idx_expense_reports_status").on(t.status),
  index("idx_expense_reports_submitted_by").on(t.submittedBy),
  check("expense_reports_status_chk", sql`${t.status} IN ('draft','submitted','verified','approved','rejected')`),
  check("expense_reports_totals_chk", sql`${t.totalReceipts} >= 0`),
]);


export const insertExpenseReportSchema = createInsertSchema(expenseReports, {
  status: z.enum(["draft", "submitted", "verified", "approved", "rejected"]).default("draft"),
}).omit({ id: true, createdAt: true } as never);

export type ExpenseReport = typeof expenseReports.$inferSelect;

export type InsertExpenseReport = z.infer<typeof insertExpenseReportSchema>;


export const expenseAttachments = pgTable("expense_attachments", {
  id: serial("id").primaryKey(),
  expenseReportId: varchar("expense_report_id").references(() => expenseReports.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }),
  fileSize: integer("file_size"),
  description: varchar("description", { length: 500 }),
  amount: numericMoney("amount"),
  receiptDate: varchar("receipt_date", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_expense_attachments_expense_report_id").on(t.expenseReportId),
]);


export const insertExpenseAttachmentSchema = createInsertSchema(expenseAttachments).omit({ id: true, createdAt: true } as never);

export type ExpenseAttachment = typeof expenseAttachments.$inferSelect;

export type InsertExpenseAttachment = z.infer<typeof insertExpenseAttachmentSchema>;


export const advancePayments = pgTable("advance_payments", {
  id: serial("id").primaryKey(),
  requestNumber: varchar("request_number", { length: 30 }).notNull(),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  employeeId: varchar("employee_id").references(() => users.id, { onDelete: "set null" }),
  paymentType: varchar("payment_type", { length: 30 }).notNull(),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 5 }).notNull().default("UZS"),
  purpose: text("purpose").notNull(),
  purchaseOrderId: varchar("purchase_order_id").references(() => purchaseOrders.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("requested"),
  approvalRequestId: varchar("approval_request_id").references(() => approvalRequests.id, { onDelete: "set null" }),
  disbursedAt: timestamp("disbursed_at"),
  settledAmount: numericMoney("settled_amount").default(0),
  settlementStatus: varchar("settlement_status", { length: 20 }).default("unsettled"),
  glDocumentId: varchar("gl_document_id").references(() => glDocuments.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_advance_payments_vendor_id").on(t.vendorId),
  index("idx_advance_payments_employee_id").on(t.employeeId),
  index("idx_advance_payments_status").on(t.status),
  index("idx_advance_payments_created_at").on(t.createdAt),
  check("advance_payments_type_chk", sql`${t.paymentType} IN ('VENDOR_ADVANCE','EMPLOYEE_ADVANCE','TRAVEL_ADVANCE')`),
  check("advance_payments_status_chk", sql`${t.status} IN ('requested','approved','disbursed','partially_settled','settled','rejected')`),
  check("advance_payments_settlement_chk", sql`${t.settlementStatus} IS NULL OR ${t.settlementStatus} IN ('unsettled','partial','settled')`),
  check("advance_payments_amount_chk", sql`${t.amount} > 0`),
]);


export const insertAdvancePaymentSchema = createInsertSchema(advancePayments, {
  paymentType: z.enum(["VENDOR_ADVANCE", "EMPLOYEE_ADVANCE", "TRAVEL_ADVANCE"]),
  status: z.enum(["requested", "approved", "disbursed", "partially_settled", "settled", "rejected"]).default("requested"),
  settlementStatus: z.enum(["unsettled", "partial", "settled"]).default("unsettled"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type AdvancePayment = typeof advancePayments.$inferSelect;

export type InsertAdvancePayment = z.infer<typeof insertAdvancePaymentSchema>;


// ========== CRM & SALES: PAYMENT MATCHING ==========

export const invoicePaymentMatching = pgTable("invoice_payment_matching", {
  id: serial("id").primaryKey(),
  invoiceId: varchar("invoice_id").references(() => salesInvoices.id, { onDelete: "set null" }),
  paymentId: varchar("payment_id").references(() => customerPayments.id, { onDelete: "set null" }),
  matchedAmount: numericMoney("matched_amount").notNull(),
  matchedBy: varchar("matched_by").references(() => users.id, { onDelete: "set null" }),
  matchedAt: timestamp("matched_at").defaultNow(),
  isAutoMatched: boolean("is_auto_matched").default(false),
  notes: text("notes"),
}, (t) => [
  index("idx_invoice_payment_matching_invoice_id").on(t.invoiceId),
  index("idx_invoice_payment_matching_payment_id").on(t.paymentId),
]);


export const insertInvoicePaymentMatchingSchema = createInsertSchema(invoicePaymentMatching, {
  matchedAmount: z.number().positive("Summa musbat bo'lishi kerak"),
}).omit({ id: true, matchedAt: true } as never);

export type InvoicePaymentMatching = typeof invoicePaymentMatching.$inferSelect;


export const bankStatements = pgTable("bank_statements", {
  id: serial("id").primaryKey(),
  bankAccount: varchar("bank_account", { length: 50 }).notNull(),
  transactionDate: varchar("transaction_date", { length: 10 }).notNull(),
  valueDate: varchar("value_date", { length: 10 }),
  description: text("description"),
  reference: varchar("reference", { length: 100 }),
  debitAmount: numericMoney("debit_amount").default(0),
  creditAmount: numericMoney("credit_amount").default(0),
  balance: numericMoney("balance"),
  isMatched: boolean("is_matched").default(false),
  matchedInvoiceId: varchar("matched_invoice_id").references(() => salesInvoices.id, { onDelete: "set null" }),
  importedAt: timestamp("imported_at").defaultNow(),
  importedBy: varchar("imported_by").references(() => users.id, { onDelete: "set null" }),
}, (t) => [
  index("idx_bank_statements_bank_account").on(t.bankAccount),
  index("idx_bank_statements_transaction_date").on(t.transactionDate),
  index("idx_bank_statements_is_matched").on(t.isMatched),
]);


export const insertBankStatementSchema = createInsertSchema(bankStatements, {
  bankAccount: z.string().min(1, "Bank hisob raqami kerak"),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD formatida"),
}).omit({ id: true, importedAt: true } as never);

export type BankStatement = typeof bankStatements.$inferSelect;

