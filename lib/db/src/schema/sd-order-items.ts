/**
 * @module sd-order-items
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
import { salesOrders, salesInvoices } from "./sd-orders";

export const insertSalesOrderSchema = createInsertSchema(salesOrders, {
  documentNumber: z.string().regex(/^SO-\d{10}$/, "Format: SO-XXXXXXXXXX"),
  documentType: z.enum(["OR", "TA", "CR"]),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  requestedDeliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak").optional(),
  pricingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  overallStatus: z.enum(["IN_PROCESS", "COMPLETED", "CANCELLED"]),
  deliveryStatus: z.enum(["NOT_DELIVERED", "PARTIALLY", "FULLY"]),
  billingStatus: z.enum(["NOT_BILLED", "PARTIALLY", "FULLY"]),
  netValue: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative(),
  totalValue: z.coerce.number().nonnegative(),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type SalesOrder = typeof salesOrders.$inferSelect;

export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;

// ============================================================
// 14 TA HOLAT ZANJIRI KONSTANTALARI (TZ Hujjat §6.1 - §6.14)
// ============================================================

// §6.1 Lead holat zanjiri (CRM)
export const LEAD_STATUS_CHAIN = [
  "new", "assigned", "contacted", "qualified",
  "quotation_preparing", "quotation_sent", "negotiation",
  "won", "lost", "dormant",
] as const;
export type LeadStatus = typeof LEAD_STATUS_CHAIN[number];

// §6.2 Taklifnoma (Quotation) holat zanjiri
export const QUOTATION_STATUS_CHAIN = [
  "draft", "sent", "accepted", "rejected", "expired", "converted",
] as const;
export type QuotationStatus = typeof QUOTATION_STATUS_CHAIN[number];

// §6.3 Savdo buyurtmasi (Sales Order) — asosiy master zanjir
export const MASTER_STATUS_CHAIN = [
  "draft", "incomplete", "pending_design", "pending_sample_lab",
  "pending_manager_completion", "pending_technology", "pending_advance",
  "ready_for_planning", "planned", "released_to_production", "in_production",
  "pending_qc_final", "qc_failed", "rework", "ready_for_fg_warehouse",
  "in_fg_warehouse", "delivery_planned", "in_delivery", "delivered",
  "partially_paid", "fully_paid", "closed", "cancelled",
] as const;
export type MasterStatus = typeof MASTER_STATUS_CHAIN[number];

// §6.4 Dizayn holat zanjiri (Task #6: 8 ta holat)
export const DESIGN_STATUS_CHAIN = [
  "new",
  "ai_generated",
  "designer_review",
  "waiting_customer_approval",
  "revision_requested",
  "approved",
  "rejected",
  "archived",
] as const;
export type SdDesignStatus = typeof DESIGN_STATUS_CHAIN[number];

// §6.5 Qolip (Mold) holat zanjiri
export const MOLD_STATUS_CHAIN = [
  "not_required", "designing", "ordered",
  "received", "tested", "approved", "rejected",
] as const;
export type MoldStatus = typeof MOLD_STATUS_CHAIN[number];

// §6.6 QC (Sifat nazorati) holat zanjiri
export const QC_STATUS_CHAIN = [
  "pending", "in_progress", "passed",
  "conditional_pass", "failed", "rework_required",
] as const;
export type QcStatus = typeof QC_STATUS_CHAIN[number];

// §6.7 Texnolog tasdiqlash holat zanjiri
export const TECH_STATUS_CHAIN = [
  "pending", "bom_approved", "routing_approved",
  "techcard_approved", "completed", "rejected",
] as const;
export type TechStatus = typeof TECH_STATUS_CHAIN[number];

// §6.8 PP (Ishlab chiqarish rejalashtirish) holat zanjiri
export const PP_STATUS_CHAIN = [
  "pending", "scheduled", "released",
  "rescheduled", "on_hold", "cancelled", "completed",
] as const;
export type PpStatus = typeof PP_STATUS_CHAIN[number];

// §6.9 MES (Ishlab chiqarish ijrosi) holat zanjiri
export const MES_STATUS_CHAIN = [
  "pending", "setup", "in_progress",
  "paused", "teardown", "completed", "rejected",
] as const;
export type MesStatus = typeof MES_STATUS_CHAIN[number];

// §6.10 WMS material (Ombor material rezervi) holat zanjiri
export const WMS_MATERIAL_STATUS_CHAIN = [
  "pending", "reserved", "issued",
  "partially_returned", "returned", "completed",
] as const;
export type WmsMaterialStatus = typeof WMS_MATERIAL_STATUS_CHAIN[number];

// §6.11 Logistika (Yetkazib berish) holat zanjiri
export const DELIVERY_STATUS_CHAIN = [
  "PICKING", "PACKING", "GOODS_ISSUE", "COMPLETED",
] as const;
export type DeliveryStatus = typeof DELIVERY_STATUS_CHAIN[number];

// §6.12 To'lov (Billing) holat zanjiri
export const BILLING_STATUS_CHAIN = [
  "OPEN", "PARTIALLY_PAID", "PAID", "CANCELLED",
] as const;
export type BillingStatus = typeof BILLING_STATUS_CHAIN[number];

// §6.13 Avans holat zanjiri
export const ADVANCE_STATUS_CHAIN = [
  "no_advance", "partial_advance", "advance_completed",
  "balance_pending", "overdue", "paid", "closed", "bypassed",
] as const;
export type AdvanceStatus = typeof ADVANCE_STATUS_CHAIN[number];

// §6.14 Xodim (Employee) holat zanjiri
export const EMPLOYEE_STATUS_CHAIN = [
  "active", "probation", "on_leave",
  "suspended", "terminated", "resigned",
] as const;
export type EmployeeStatus = typeof EMPLOYEE_STATUS_CHAIN[number];

// Barcha 14 ta holat zanjiri uchun umumiy ro'yxat (meta)
export const ALL_STATUS_CHAINS = {
  lead:        { chain: LEAD_STATUS_CHAIN,            section: "§6.1", module: "CRM" },
  quotation:   { chain: QUOTATION_STATUS_CHAIN,       section: "§6.2", module: "SD" },
  salesOrder:  { chain: MASTER_STATUS_CHAIN,          section: "§6.3", module: "SD" },
  design:      { chain: DESIGN_STATUS_CHAIN,          section: "§6.4", module: "SD" },
  mold:        { chain: MOLD_STATUS_CHAIN,            section: "§6.5", module: "SD" },
  qc:          { chain: QC_STATUS_CHAIN,              section: "§6.6", module: "QC" },
  technologist:{ chain: TECH_STATUS_CHAIN,            section: "§6.7", module: "TECH" },
  pp:          { chain: PP_STATUS_CHAIN,              section: "§6.8", module: "PP" },
  mes:         { chain: MES_STATUS_CHAIN,             section: "§6.9", module: "MES" },
  wmsMaterial: { chain: WMS_MATERIAL_STATUS_CHAIN,    section: "§6.10", module: "WMS" },
  delivery:    { chain: DELIVERY_STATUS_CHAIN,        section: "§6.11", module: "LOGISTICS" },
  billing:     { chain: BILLING_STATUS_CHAIN,         section: "§6.12", module: "FI" },
  advance:     { chain: ADVANCE_STATUS_CHAIN,         section: "§6.13", module: "SD" },
  employee:    { chain: EMPLOYEE_STATUS_CHAIN,        section: "§6.14", module: "HR" },
} as const;

// Order Status Logs — har status o'zgarishini qayd etish
export const orderStatusLogs = pgTable("order_status_logs", {
  id: serial("id").primaryKey(),
  salesOrderId: varchar("sales_order_id").notNull().references(() => salesOrders.id, { onDelete: "cascade" }),
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }).notNull(),
  changedBy: varchar("changed_by").references(() => users.id, { onDelete: "set null" }),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  reason: varchar("reason", { length: 200 }),
  notes: text("notes"),
  triggeredBy: varchar("triggered_by", { length: 100 }), // manual | system | ai | advance_check | qc_result | ...
});

export type OrderStatusLog = typeof orderStatusLogs.$inferSelect;

// Sales Order Items (Buyurtma satrlari)
export const salesOrderItems = pgTable("sales_order_items", {
  id: serial("id").primaryKey(),
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id, { onDelete: "cascade" }).notNull(),
  itemNumber: varchar("item_number", { length: 10 }).notNull(), // 000010, 000020, 000030
  
  // Material data
  materialId: varchar("material_id").references(() => products.id, { onDelete: "set null" }),
  // Finished-good ordered (owner 2026-06-05): order line-items bind to products; material_id is the
  // production/material-consumption side (vision #10).
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  materialNumber: varchar("material_number", { length: 50 }),
  description: text("description").notNull(),
  
  // Quantity
  orderQuantity: numericMoney("order_quantity").notNull(),
  deliveredQuantity: numericMoney("delivered_quantity").notNull().default(0),
  openQuantity: numericMoney("open_quantity").notNull().default(0), // order - delivered
  unit: varchar("unit", { length: 10 }).notNull().default("PC"),
  
  // Pricing
  netPrice: numericMoney("net_price").notNull(),
  taxCode: varchar("tax_code", { length: 10 }).notNull().default("V1"), // V1 = 12% VAT
  taxAmount: numericMoney("tax_amount").notNull().default(0),
  totalPrice: numericMoney("total_price").notNull().default(0),
  
  // Plant/Location
  plant: varchar("plant", { length: 10 }).notNull().default("P001"),
  storageLocation: varchar("storage_location", { length: 10 }).notNull().default("SL02"),
  
  // Schedule lines
  deliveryDate: varchar("delivery_date", { length: 10 }),
  confirmedQuantity: numericMoney("confirmed_quantity").notNull().default(0),
  
  // Status per item
  deliveryStatus: varchar("delivery_status", { length: 20 }).notNull().default("NOT_DELIVERED"),
  billingStatus: varchar("billing_status", { length: 20 }).notNull().default("NOT_BILLED"),
  
  // Integration references
  productionOrderId: varchar("production_order_id").references(() => productionOrders.id, { onDelete: "set null" }),
  deliveryItemId: varchar("delivery_item_id"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("sales_order_items_delivery_status_chk", sql`${t.deliveryStatus} IN ('NOT_DELIVERED','PARTIALLY','FULLY')`),
  check("sales_order_items_billing_status_chk", sql`${t.billingStatus} IN ('NOT_BILLED','PARTIALLY','FULLY')`),
]);


export const insertSalesOrderItemSchema = createInsertSchema(salesOrderItems, {
  itemNumber: z.string().regex(/^\d{6}$/, "Format: 000010"),
  orderQuantity: z.coerce.number().positive(),
  deliveredQuantity: z.coerce.number().nonnegative(),
  netPrice: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative(),
  totalPrice: z.coerce.number().nonnegative(),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak").optional(),
}).omit({ id: true, createdAt: true } as never);


export type SalesOrderItem = typeof salesOrderItems.$inferSelect;

export type InsertSalesOrderItem = z.infer<typeof insertSalesOrderItemSchema>;


// Deliveries (Yetkazib berish)