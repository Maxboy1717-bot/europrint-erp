/**
 * @module sd-orders
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { crmCompanies } from "./crm-schema";
import { glDocuments } from "./fi-schema";
import { Module } from "./lms-schema";
import { Order, Product, orders, productionOrders, products } from "./pp-schema";


// Sales Invoices (sotuv hujjatlari)
export const salesInvoices = pgTable("sales_invoices", {
  id: serial("id").primaryKey(),
  // Multi-tenancy column. DEFAULT 1 is intentional — every row backfilled to
  // tenant 1 on migration; future writers MUST set this from TenantContext.
  tenantId: integer("tenant_id").notNull().default(1),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  invoiceDate: varchar("invoice_date", { length: 10 }).notNull(), // YYYY-MM-DD
  customerName: text("customer_name").notNull(),
  customerId: integer("customer_id").references(() => crmCompanies.id, { onDelete: "set null" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  netValue: numericMoney("net_value").notNull().default(0), // Sof summa (QQS dan oldin)
  taxAmount: numericMoney("tax_amount").notNull().default(0), // QQS summasi
  totalAmount: numericMoney("total_amount").notNull(),
  paidAmount: numericMoney("paid_amount").notNull().default(0),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("unpaid"), // unpaid, partial, paid
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, posted
  glDocumentId: varchar("gl_document_id").references(() => glDocuments.id, { onDelete: "set null" }), // Bog'liq GL hujjat
  dueDate: varchar("due_date", { length: 10 }), // YYYY-MM-DD
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("sales_invoices_payment_status_chk", sql`${t.paymentStatus} IN ('unpaid','partial','paid')`),
  check("sales_invoices_status_chk", sql`${t.status} IN ('draft','posted','cancelled')`),
  check("sales_invoices_net_value_chk", sql`${t.netValue} >= 0`),
  check("sales_invoices_tax_amount_chk", sql`${t.taxAmount} >= 0`),
  check("sales_invoices_total_amount_chk", sql`${t.totalAmount} >= 0`),
  check("sales_invoices_paid_amount_chk", sql`${t.paidAmount} >= 0`),
  index("idx_sales_invoices_customer_id").on(t.customerId),
  index("idx_sales_invoices_payment_status").on(t.paymentStatus),
  index("idx_sales_invoices_status").on(t.status),
  index("idx_sales_invoices_created_at").on(t.createdAt),
  index("idx_sales_invoices_tenant_id").on(t.tenantId),
  index("idx_sales_invoices_order_id").on(t.orderId),
  index("idx_sales_invoices_created_by").on(t.createdBy),
  index("idx_sales_invoices_deleted_at").on(t.deletedAt),
  index("idx_sales_invoices_due_date").on(t.dueDate),
]);


export const insertSalesInvoiceSchema = createInsertSchema(salesInvoices, {
  invoiceNumber: z.string().min(1, "Hujjat raqami talab qilinadi"),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  customerName: z.string().min(2, "Mijoz nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  netValue: z.number().nonnegative("Sof summa 0 yoki katta bo'lishi kerak").optional(),
  taxAmount: z.number().nonnegative("QQS summasi 0 yoki katta bo'lishi kerak").optional(),
  totalAmount: z.number().nonnegative("Umumiy summa 0 yoki katta bo'lishi kerak"),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]),
  status: z.enum(["draft", "posted"]).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type SalesInvoice = typeof salesInvoices.$inferSelect;

export type InsertSalesInvoice = z.infer<typeof insertSalesInvoiceSchema>;


// ============================================================================
// SAP ERP TABLES - Sales & Distribution (SD Module)
// ============================================================================

// Sales Orders (Savdo buyurtmalari) - MARKAZIY HUJJAT

// ============================================================================
// SAP ERP TABLES - Sales & Distribution (SD Module)
// ============================================================================

// Sales Orders (Savdo buyurtmalari) - MARKAZIY HUJJAT
export const salesOrders = pgTable("sales_orders", {
  id: serial("id").primaryKey(),
  // Multi-tenancy column. DEFAULT 1 is intentional — every row backfilled to
  // tenant 1 on migration; future writers MUST set this from TenantContext.
  tenantId: integer("tenant_id").notNull().default(1),
  documentNumber: varchar("document_number", { length: 50 }).notNull().unique(), // SO-4500012345
  documentType: varchar("document_type", { length: 10 }).notNull().default("OR"), // OR (Order), TA (Contract), CR (Credit Memo)
  
  // Organizational data
  salesOrg: varchar("sales_org", { length: 10 }).notNull().default("EURO"),
  distributionChannel: varchar("distribution_channel", { length: 10 }).notNull().default("10"),
  division: varchar("division", { length: 10 }).notNull().default("00"),
  
  // Customer references
  customerId: integer("customer_id").references(() => crmCompanies.id, { onDelete: 'set null' }),
  soldToParty: varchar("sold_to_party", { length: 50 }),
  shipToParty: varchar("ship_to_party", { length: 50 }),
  billToParty: varchar("bill_to_party", { length: 50 }),
  
  // Dates (YYYY-MM-DD format)
  orderDate: varchar("order_date", { length: 10 }).notNull(),
  requestedDeliveryDate: varchar("requested_delivery_date", { length: 10 }),
  deliveryDate: varchar("delivery_date", { length: 10 }),
  pricingDate: varchar("pricing_date", { length: 10 }).notNull(),
  
  // Payment
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  paymentTerms: varchar("payment_terms", { length: 10 }).default("0014"), // 14 days
  
  // Status tracking
  overallStatus: varchar("overall_status", { length: 20 }).notNull().default("IN_PROCESS"), // IN_PROCESS, COMPLETED, CANCELLED
  deliveryStatus: varchar("delivery_status", { length: 20 }).notNull().default("NOT_DELIVERED"), // NOT_DELIVERED, PARTIALLY, FULLY
  billingStatus: varchar("billing_status", { length: 20 }).notNull().default("NOT_BILLED"), // NOT_BILLED, PARTIALLY, FULLY
  
  // Totals
  netValue: numericMoney("net_value").notNull().default(0),
  taxAmount: numericMoney("tax_amount").notNull().default(0),
  totalValue: numericMoney("total_value").notNull().default(0),
  
  // Integration references
  quotationId: varchar("quotation_id"),
  crmDealId: varchar("crm_deal_id"),

  // SD Europrint — avans/qoldiq to'lov
  advancePercent: numericMoney("advance_percent").default(70),
  advancePaidAmount: numericMoney("advance_paid_amount").default(0),
  balanceDueAmount: numericMoney("balance_due_amount").default(0),
  advanceDueDate: varchar("advance_due_date", { length: 10 }),
  balanceDueDate: varchar("balance_due_date", { length: 10 }),

  // SD Europrint — modul holat zanjiri (legacy)
  moduleStatus: varchar("module_status", { length: 30 }).default("sales"),
  // sales | design | tech | pp | production | qc | warehouse | delivery | finance | closed

  // SD Europrint — TO'LIQ MASTER STATUS ZANJIRI (TZ algoritm bo'yicha)
  masterStatus: varchar("master_status", { length: 50 }).notNull().default("draft"),
  // draft → incomplete → pending_design → pending_sample_lab → pending_manager_completion
  // → pending_technology → pending_advance → ready_for_planning → planned
  // → released_to_production → in_production → pending_qc_final → qc_failed → rework
  // → ready_for_fg_warehouse → in_fg_warehouse → delivery_planned → in_delivery
  // → delivered → partially_paid → fully_paid → closed | cancelled

  // Buyurtma turlari (trigger flags)
  designFlag: boolean("design_flag").notNull().default(false),       // Yangi dizayn kerakmi?
  sampleFlag: boolean("sample_flag").notNull().default(false),       // Namuna laboratoriyaga kerakmi?
  isVip: boolean("is_vip").notNull().default(false),                 // VIP ustuvorlikmi?
  
  // Avans nazorati (70% qoida)
  advanceRequired: numericMoney("advance_required_percent").notNull().default(70),
  advanceStatus: varchar("advance_status", { length: 30 }).notNull().default("no_advance"),
  // no_advance | partial_advance | advance_completed | balance_pending | overdue | paid | closed

  // PP (Rejalashtirish) uchun
  ppQueuedAt: timestamp("pp_queued_at"),
  ppReleasedAt: timestamp("pp_released_at"),
  
  // Ombor ijara (FG warehouse timer)
  fgWarehouseEntryAt: timestamp("fg_warehouse_entry_at"),
  storageFreedays: integer("storage_free_days").notNull().default(8),
  storageTariffPerM2: numericMoney("storage_tariff_per_m2").notNull().default(500), // UZS/m²/kun
  storageTotalM2: numericMoney("storage_total_m2").default(0),
  storageAccruedAmount: numericMoney("storage_accrued_amount").default(0),

  // SD Europrint — ombor
  storageDays: integer("storage_days").default(0),

  // Texnolog 3-checkpoint (Algoritm bo'lim 11.2 §9) — backend validated
  techBomApproved: boolean("tech_bom_approved").notNull().default(false),
  techRoutingApproved: boolean("tech_routing_approved").notNull().default(false),
  techCardApproved: boolean("tech_card_approved").notNull().default(false),
  techApprovedBy: varchar("tech_approved_by"),
  techApprovedAt: timestamp("tech_approved_at"),
  techNotes: text("tech_notes"),
  
  // Audit
  createdBy: varchar("created_by"),
  changedBy: varchar("changed_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("sales_orders_overall_status_chk", sql`${t.overallStatus} IN ('IN_PROCESS','COMPLETED','CANCELLED')`),
  check("sales_orders_delivery_status_chk", sql`${t.deliveryStatus} IN ('NOT_DELIVERED','PARTIALLY','FULLY')`),
  check("sales_orders_billing_status_chk", sql`${t.billingStatus} IN ('NOT_BILLED','PARTIALLY','FULLY')`),
  check("sales_orders_net_value_chk", sql`${t.netValue} >= 0`),
  check("sales_orders_tax_amount_chk", sql`${t.taxAmount} >= 0`),
  check("sales_orders_total_value_chk", sql`${t.totalValue} >= 0`),
  index("idx_sales_orders_status").on(t.overallStatus),
  index("idx_sales_orders_customer_id").on(t.customerId),
  index("idx_sales_orders_master_status").on(t.masterStatus),
  index("idx_sales_orders_created_at").on(t.createdAt),
  index("idx_sales_orders_tenant_id").on(t.tenantId),
  index("idx_sales_orders_delivery_status").on(t.deliveryStatus),
  index("idx_sales_orders_billing_status").on(t.billingStatus),
  index("idx_sales_orders_deleted_at").on(t.deletedAt),
  check("sales_orders_master_status_chk", sql`${t.masterStatus} IN ('draft','incomplete','pending_design','pending_sample_lab','pending_manager_completion','pending_technology','pending_advance','ready_for_planning','planned','released_to_production','in_production','pending_qc_final','qc_failed','rework','ready_for_fg_warehouse','in_fg_warehouse','delivery_planned','in_delivery','delivered','partially_paid','fully_paid','closed','cancelled')`),
  check("sales_orders_advance_status_chk", sql`${t.advanceStatus} IN ('no_advance','partial_advance','advance_completed','balance_pending','overdue','paid','closed')`),
]);

