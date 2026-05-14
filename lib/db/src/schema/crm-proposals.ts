/**
 * @module crm-proposals
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, date, uuid, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { Assignment } from "./lms-schema";
import { Design, Order, Product, designOrders } from "./pp-schema";
import { crmDeals, crmContacts, crmCompanies, crmLeads, crmPipelines, crmStages } from "./crm-core";
import { crmProducts, crmProductCategories, crmDealProducts } from "./crm-deal-products";

export const crmProposals = pgTable("crm_proposals", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull(), // TPF-2024-001
  title: text("title").notNull(),
  
  // Related entities
  dealId: integer("deal_id").references(() => crmDeals.id, { onDelete: "set null" }),
  contactId: integer("contact_id").references(() => crmContacts.id, { onDelete: "set null" }),
  companyId: integer("company_id").references(() => crmCompanies.id, { onDelete: "set null" }),
  
  // Status: draft, sent, approved, declined
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  
  // Financial
  totalAmount: numericMoney("total_amount").default(0),
  currency: varchar("currency", { length: 10 }).default("UZS"),
  taxAmount: numericMoney("tax_amount").default(0),
  discountAmount: numericMoney("discount_amount").default(0),
  discountPercent: numericMoney("discount_percent").default(0),
  
  // Dates
  validUntil: timestamp("valid_until"),
  sentAt: timestamp("sent_at"),
  approvedAt: timestamp("approved_at"),
  
  // Content
  description: text("description"),
  terms: text("terms"),
  notes: text("notes"),
  
  // Document
  documentPath: text("document_path"), // PDF fayl yo'li
  templateId: integer("template_id"),
  
  // Assignment
  assignedById: integer("assigned_by_id").references(() => users.id, { onDelete: 'set null' }),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("crm_proposals_status_chk", sql`${t.status} IN ('draft','calculated','sent','revised','approved','declined')`),
]);


export const insertCrmProposalSchema = createInsertSchema(crmProposals, {
  title: z.string().min(1, "Taklif nomi kerak"),
  number: z.string().min(1, "Taklif raqami kerak"),
  status: z.enum(["draft", "calculated", "sent", "revised", "approved", "declined"]).default("draft"),
  currency: z.string().default("UZS"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

// TZ-04: Proposal holatlari uchun o'zbek tilidagi labellar
export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  draft:      "Qoralama",
  calculated: "Hisoblangan",
  sent:       "Yuborilgan",
  revised:    "Qayta ko'rilgan",
  approved:   "Tasdiqlangan",
  declined:   "Rad etilgan",
};

export type CrmProposalStatus = "draft" | "calculated" | "sent" | "revised" | "approved" | "declined";

export type CrmProposal = typeof crmProposals.$inferSelect;

export type InsertCrmProposal = z.infer<typeof insertCrmProposalSchema>;


// CRM Proposal Products (Taklif tovarlari)
export const crmProposalProducts = pgTable("crm_proposal_products", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => crmProposals.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => crmProducts.id, { onDelete: "set null" }),
  
  productName: text("product_name").notNull(),
  productDescription: text("product_description"),
  sku: varchar("sku", { length: 100 }),
  
  quantity: numericMoney("quantity").notNull().default(1),
  unitPrice: numericMoney("unit_price").notNull().default(0),
  discount: numericMoney("discount").default(0),
  discountType: varchar("discount_type", { length: 20 }).default("percent"), // percent, fixed
  taxRate: numericMoney("tax_rate").default(0),
  totalPrice: numericMoney("total_price").notNull().default(0),

  sort: integer("sort").default(100),
}, (t) => [
  check("crm_proposal_products_discount_type_chk", sql`${t.discountType} IS NULL OR ${t.discountType} IN ('percent','fixed')`),
]);


export const insertCrmProposalProductSchema = createInsertSchema(crmProposalProducts, {
  proposalId: z.number().int().positive(),
  productName: z.string().min(1, "Tovar nomi kerak"),
  quantity: z.number().min(0.01, "Miqdor kerak"),
}).omit({ id: true } as never);


export type CrmProposalProduct = typeof crmProposalProducts.$inferSelect;

export type InsertCrmProposalProduct = z.infer<typeof insertCrmProposalProductSchema>;


// CRM Invoices (Hisob-fakturalar - Schetlar)
export const crmInvoices = pgTable("crm_invoices", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 50 }).notNull(), // SCH-2024-001
  title: text("title").notNull(),
  
  // Related entities
  dealId: integer("deal_id").references(() => crmDeals.id, { onDelete: "set null" }),
  proposalId: integer("proposal_id").references(() => crmProposals.id, { onDelete: "set null" }),
  contactId: integer("contact_id").references(() => crmContacts.id, { onDelete: "set null" }),
  companyId: integer("company_id").references(() => crmCompanies.id, { onDelete: "set null" }),
  
  // Status: draft, sent, paid, partial, overdue, cancelled
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  stageId: varchar("stage_id", { length: 50 }),
  
  // Financial
  totalAmount: numericMoney("total_amount").default(0),
  paidAmount: numericMoney("paid_amount").default(0),
  currency: varchar("currency", { length: 10 }).default("UZS"),
  taxAmount: numericMoney("tax_amount").default(0),
  discountAmount: numericMoney("discount_amount").default(0),
  
  // Dates
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  
  // Payment
  paymentMethod: varchar("payment_method", { length: 50 }), // bank_transfer, cash, card
  bankDetails: jsonb("bank_details"),
  
  // Content
  description: text("description"),
  terms: text("terms"),
  notes: text("notes"),
  
  // Document
  documentPath: text("document_path"),
  templateId: integer("template_id"),
  
  // Assignment
  assignedById: integer("assigned_by_id").references(() => users.id, { onDelete: 'set null' }),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("crm_invoices_status_chk", sql`${t.status} IN ('draft','sent','paid','partial','overdue','cancelled')`),
  check("crm_invoices_payment_method_chk", sql`${t.paymentMethod} IS NULL OR ${t.paymentMethod} IN ('bank_transfer','cash','card')`),
]);


export const insertCrmInvoiceSchema = createInsertSchema(crmInvoices, {
  title: z.string().min(1, "Hisob nomi kerak"),
  number: z.string().min(1, "Hisob raqami kerak"),
  status: z.enum(["draft", "sent", "paid", "partial", "overdue", "cancelled"]).default("draft"),
  currency: z.string().default("UZS"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type CrmInvoice = typeof crmInvoices.$inferSelect;

export type InsertCrmInvoice = z.infer<typeof insertCrmInvoiceSchema>;


// CRM Invoice Products (Hisob tovarlari)
export const crmInvoiceProducts = pgTable("crm_invoice_products", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => crmInvoices.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => crmProducts.id, { onDelete: "set null" }),
  
  productName: text("product_name").notNull(),
  productDescription: text("product_description"),
  sku: varchar("sku", { length: 100 }),
  
  quantity: numericMoney("quantity").notNull().default(1),
  unitPrice: numericMoney("unit_price").notNull().default(0),
  discount: numericMoney("discount").default(0),
  discountType: varchar("discount_type", { length: 20 }).default("percent"),
  taxRate: numericMoney("tax_rate").default(0),
  totalPrice: numericMoney("total_price").notNull().default(0),
  
  sort: integer("sort").default(100),
});


export const insertCrmInvoiceProductSchema = createInsertSchema(crmInvoiceProducts, {
  invoiceId: z.number().int().positive(),
  productName: z.string().min(1, "Tovar nomi kerak"),
  quantity: z.number().min(0.01, "Miqdor kerak"),
}).omit({ id: true } as never);


export type CrmInvoiceProduct = typeof crmInvoiceProducts.$inferSelect;

export type InsertCrmInvoiceProduct = z.infer<typeof insertCrmInvoiceProductSchema>;


// CRM Invoice Payments (To'lovlar)
export const crmInvoicePayments = pgTable("crm_invoice_payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => crmInvoices.id, { onDelete: "cascade" }).notNull(),
  
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("UZS"),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),
  
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

