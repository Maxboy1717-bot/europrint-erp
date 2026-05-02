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
import { accounts, costCenters, glDocuments, payrollPeriods, profitCenters, glLines, accountingPeriods, payrollRows, insertPayrollRowSchema } from "./fi-gl";

export type InsertPayrollRow = z.infer<typeof insertPayrollRowSchema>;


// ========== SAP ERP EXTENDED MODULES ==========

// ========== FI-AP: ACCOUNTS PAYABLE ==========

// Invoice Payments (Hisob-faktura to'lovlari)
export const invoicePayments = pgTable("invoice_payments", {
  id: serial("id").primaryKey(),
  paymentNumber: varchar("payment_number", { length: 50 }).notNull().unique(),
  paymentDate: varchar("payment_date", { length: 10 }).notNull(), // YYYY-MM-DD
  vendorId: varchar("vendor_id").references(() => vendors.id),
  purchaseInvoiceId: varchar("purchase_invoice_id").references(() => purchaseInvoices.id),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(), // bank_transfer, cash, check, letter_of_credit
  bankAccount: varchar("bank_account", { length: 50 }),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  exchangeRate: numericMoney("exchange_rate").default(1),
  reference: varchar("reference", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, cancelled, reversed
  clearedAt: timestamp("cleared_at"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_invoice_payments_vendor_id").on(t.vendorId),
  index("idx_invoice_payments_status").on(t.status),
  index("idx_invoice_payments_created_at").on(t.createdAt),
]);


export const insertInvoicePaymentSchema = createInsertSchema(invoicePayments, {
  paymentNumber: z.string().min(1, "To'lov raqami kerak"),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  paymentMethod: z.enum(["bank_transfer", "cash", "check", "letter_of_credit"]),
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
  status: z.enum(["pending", "completed", "cancelled", "reversed"]),
}).omit({ id: true, createdAt: true } as never);


export type InvoicePayment = typeof invoicePayments.$inferSelect;

export type InsertInvoicePayment = z.infer<typeof insertInvoicePaymentSchema>;


// ========== FI-AR: ACCOUNTS RECEIVABLE ==========

// Customer Payments (Mijoz to'lovlari)
export const customerPayments = pgTable("customer_payments", {
  id: serial("id").primaryKey(),
  paymentNumber: varchar("payment_number", { length: 50 }).notNull().unique(),
  paymentDate: varchar("payment_date", { length: 10 }).notNull(),
  customerId: varchar("customer_id"), // CRM company ID (optional link)
  salesInvoiceId: varchar("sales_invoice_id").references(() => salesInvoices.id),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(), // bank_transfer, cash, check, credit_card
  bankAccount: varchar("bank_account", { length: 50 }),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("UZS"),
  exchangeRate: numericMoney("exchange_rate").default(1),
  reference: varchar("reference", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("received"), // received, applied, refunded
  appliedAt: timestamp("applied_at"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_customer_payments_customer_id").on(t.customerId),
  index("idx_customer_payments_status").on(t.status),
  index("idx_customer_payments_created_at").on(t.createdAt),
]);


export const insertCustomerPaymentSchema = createInsertSchema(customerPayments, {
  paymentNumber: z.string().min(1, "To'lov raqami kerak"),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  paymentMethod: z.enum(["bank_transfer", "cash", "check", "credit_card"]),
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
  status: z.enum(["received", "applied", "refunded"]),
}).omit({ id: true, createdAt: true } as never);


export type CustomerPayment = typeof customerPayments.$inferSelect;

export type InsertCustomerPayment = z.infer<typeof insertCustomerPaymentSchema>;


// ========== 16. MOLIYA VA BUXGALTERIYA (FINANCE & ACCOUNTING) ==========


// Bank Accounts (Bank hisobvaraqlari)
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  accountNumber: varchar("account_number", { length: 50 }).notNull().unique(),
  bankName: text("bank_name").notNull(),
  bankNameRu: text("bank_name_ru"),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  accountType: varchar("account_type", { length: 20 }).notNull().default("current"), // current, savings, credit
  balance: numericMoney("balance").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_bank_accounts_currency").on(t.currency),
  index("idx_bank_accounts_account_type").on(t.accountType),
]);


export const insertBankAccountSchema = createInsertSchema(bankAccounts, {
  accountNumber: z.string().min(5, "Hisob raqami kamida 5 ta belgidan iborat bo'lishi kerak"),
  bankName: z.string().min(2, "Bank nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  currency: z.string().length(3, "Valyuta kodi 3 ta belgidan iborat bo'lishi kerak"),
  accountType: z.enum(["current", "savings", "credit"]),
  balance: z.number(),
}).omit({ id: true, createdAt: true } as never);


export type BankAccount = typeof bankAccounts.$inferSelect;

export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;


// Cash Flow Transactions (Kundalik pul oqimlari)
export const cashFlowTransactions = pgTable("cash_flow_transactions", {
  id: serial("id").primaryKey(),
  transactionDate: varchar("transaction_date", { length: 10 }).notNull(), // YYYY-MM-DD
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // inflow, outflow
  category: varchar("category", { length: 30 }).notNull(), // sales, purchase, salary, tax, loan, other
  amount: numericMoney("amount").notNull(),
  bankAccountId: varchar("bank_account_id").references(() => bankAccounts.id),
  description: text("description"),
  referenceType: varchar("reference_type", { length: 50 }), // invoice, order, payroll, etc.
  referenceId: varchar("reference_id", { length: 100 }), // Related document ID
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_cash_flow_transactions_bank_account_id").on(t.bankAccountId),
  index("idx_cash_flow_transactions_transaction_type").on(t.transactionType),
  index("idx_cash_flow_transactions_category").on(t.category),
  index("idx_cash_flow_transactions_created_at").on(t.createdAt),
]);


export const insertCashFlowTransactionSchema = createInsertSchema(cashFlowTransactions, {
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  transactionType: z.enum(["inflow", "outflow"]),
  category: z.enum(["sales", "purchase", "salary", "tax", "loan", "other"]),
  amount: z.number().positive("Summa musbat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type CashFlowTransaction = typeof cashFlowTransactions.$inferSelect;

export type InsertCashFlowTransaction = z.infer<typeof insertCashFlowTransactionSchema>;


// Budgets (Byudjet rejasi)
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  budgetName: text("budget_name").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  periodType: varchar("period_type", { length: 20 }).notNull().default("annual"), // annual, quarterly, monthly
  startDate: varchar("start_date", { length: 10 }).notNull(), // YYYY-MM-DD
  endDate: varchar("end_date", { length: 10 }).notNull(), // YYYY-MM-DD
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, approved, active, closed
  totalAmount: numericMoney("total_amount").notNull().default(0),
  createdBy: integer("created_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_budgets_fiscal_year").on(t.fiscalYear),
  index("idx_budgets_status").on(t.status),
  index("idx_budgets_period_type").on(t.periodType),
]);

