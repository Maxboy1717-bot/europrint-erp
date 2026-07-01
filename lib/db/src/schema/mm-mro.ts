/**
 * @module mm-mro
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, pgSequence, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { glDocuments } from "./fi-schema";
import { Order, equipment, formulaDefinitions, machineTasks, mrpResults, mrpRuns, papkaOrders, productionOrders, productionSessions, products } from "./pp-schema";
import { warehouseBins, warehouseTransactions, warehouses } from "./wms-schema";
import { rawMaterials, vendors, purchaseOrders, goodsReceipts } from "./mm-procurement";
import { materialCards, materialBatches, batches } from "./mm-materials";
import { materialBarcodes } from "./mm-inventory";

export const operatorMaterialBalance = pgTable("operator_material_balance", {
  id: serial("id").primaryKey(),
  operatorId: varchar("operator_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  barcodeId: varchar("barcode_id").references(() => materialBarcodes.id, { onDelete: "cascade" }).notNull(),
  productionOrderId: varchar("production_order_id").notNull(),
  qtyDebt: numericMoney("qty_debt").notNull(),
  reason: varchar("reason", { length: 30 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  supervisorId: varchar("supervisor_id").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at"),
  resolutionNote: text("resolution_note"),
  deductionAmount: numericMoney("deduction_amount"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertOperatorMaterialBalanceSchema = createInsertSchema(operatorMaterialBalance, {
  qtyDebt: z.number(),
  reason: z.enum(["NOT_RETURNED", "OVER_CONSUMPTION", "LOST", "DAMAGED"]),
  status: z.enum(["PENDING", "EXPLAINED", "DEDUCTED", "RESOLVED"]).default("PENDING"),
}).omit({ id: true, createdAt: true } as never);

export type OperatorMaterialBalance = typeof operatorMaterialBalance.$inferSelect;

export type InsertOperatorMaterialBalance = z.infer<typeof insertOperatorMaterialBalanceSchema>;


// ============================================================================
// FAZA 1B: 3-WAY MATCH (PO + GR + INVOICE) TIZIMI
// ============================================================================

export const vendorInvoices = pgTable("vendor_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "cascade" }).notNull(),
  purchaseOrderId: varchar("purchase_order_id").references(() => purchaseOrders.id, { onDelete: "set null" }),
  goodsReceiptId: varchar("goods_receipt_id").references(() => goodsReceipts.id, { onDelete: "set null" }),
  invoiceDate: varchar("invoice_date", { length: 20 }).notNull(),
  dueDate: varchar("due_date", { length: 20 }),
  totalAmount: numericMoney("total_amount").notNull(),
  taxAmount: numericMoney("tax_amount").default(0),
  currency: varchar("currency", { length: 5 }).notNull().default("UZS"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  matchStatus: varchar("match_status", { length: 20 }).notNull().default("unmatched"),
  matchScore: numericMoney("match_score").default(0),
  priceVariance: numericMoney("price_variance").default(0),
  quantityVariance: numericMoney("quantity_variance").default(0),
  glDocumentId: varchar("gl_document_id").references(() => glDocuments.id, { onDelete: "set null" }),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const insertVendorInvoiceSchema = createInsertSchema(vendorInvoices, {
  status: z.enum(["pending", "verified", "approved", "posted", "rejected", "paid"]).default("pending"),
  matchStatus: z.enum(["unmatched", "partial_match", "full_match", "mismatch"]).default("unmatched"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type VendorInvoice = typeof vendorInvoices.$inferSelect;

export type InsertVendorInvoice = z.infer<typeof insertVendorInvoiceSchema>;


export const vendorInvoiceLines = pgTable("vendor_invoice_lines", {
  id: serial("id").primaryKey(),
  invoiceId: varchar("invoice_id").references(() => vendorInvoices.id, { onDelete: "cascade" }).notNull(),
  poLineId: varchar("po_line_id"),
  materialId: varchar("material_id"),
  description: varchar("description", { length: 500 }),
  quantity: numericMoney("quantity").notNull(),
  unitPrice: numericMoney("unit_price").notNull(),
  totalPrice: numericMoney("total_price").notNull(),
  poQuantity: numericMoney("po_quantity"),
  poUnitPrice: numericMoney("po_unit_price"),
  grQuantity: numericMoney("gr_quantity"),
  priceMatch: boolean("price_match").default(false),
  quantityMatch: boolean("quantity_match").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertVendorInvoiceLineSchema = createInsertSchema(vendorInvoiceLines).omit({ id: true, createdAt: true } as never);

export type VendorInvoiceLine = typeof vendorInvoiceLines.$inferSelect;

export type InsertVendorInvoiceLine = z.infer<typeof insertVendorInvoiceLineSchema>;


export const threeWayMatchResults = pgTable("three_way_match_results", {
  id: serial("id").primaryKey(),
  invoiceId: varchar("invoice_id").references(() => vendorInvoices.id, { onDelete: "cascade" }).notNull(),
  purchaseOrderId: varchar("purchase_order_id").references(() => purchaseOrders.id, { onDelete: "cascade" }).notNull(),
  goodsReceiptId: varchar("goods_receipt_id").references(() => goodsReceipts.id, { onDelete: "set null" }),
  poTotalAmount: numericMoney("po_total_amount").notNull(),
  grTotalAmount: numericMoney("gr_total_amount"),
  invoiceTotalAmount: numericMoney("invoice_total_amount").notNull(),
  priceVariancePercent: numericMoney("price_variance_percent").default(0),
  quantityVariancePercent: numericMoney("quantity_variance_percent").default(0),
  overallStatus: varchar("overall_status", { length: 20 }).notNull().default("pending"),
  tolerancePercent: numericMoney("tolerance_percent").default(5),
  autoApproved: boolean("auto_approved").default(false),
  matchedBy: varchar("matched_by").references(() => users.id, { onDelete: "set null" }),
  matchedAt: timestamp("matched_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertThreeWayMatchResultSchema = createInsertSchema(threeWayMatchResults, {
  overallStatus: z.enum(["pending", "matched", "partial", "mismatch", "approved", "rejected"]),
}).omit({ id: true, createdAt: true } as never);

export type ThreeWayMatchResult = typeof threeWayMatchResults.$inferSelect;

export type InsertThreeWayMatchResult = z.infer<typeof insertThreeWayMatchResultSchema>;


// ============================================================================
// FAZA 2B: MRO / XO'JALIK BO'LIMI MODULI
// ============================================================================

export const mroItems = pgTable("mro_items", {
  id: serial("id").primaryKey(),
  itemCode: varchar("item_code", { length: 30 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameRu: varchar("name_ru", { length: 255 }),
  category: varchar("category", { length: 50 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("dona"),
  minStock: numericMoney("min_stock").default(0),
  maxStock: numericMoney("max_stock"),
  currentStock: numericMoney("current_stock").notNull().default(0),
  unitCost: numericMoney("unit_cost").default(0),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertMroItemSchema = createInsertSchema(mroItems, {
  category: z.enum(["LUBRICANT", "SPARE_PART", "TOOL", "CLEANING", "ELECTRICAL", "PLUMBING", "SAFETY", "OTHER"]),
}).omit({ id: true, createdAt: true } as never);

export type MroItem = typeof mroItems.$inferSelect;

export type InsertMroItem = z.infer<typeof insertMroItemSchema>;


export const mroRequests = pgTable("mro_requests", {
  id: serial("id").primaryKey(),
  requestNumber: varchar("request_number", { length: 30 }).notNull(),
  itemId: varchar("item_id").references(() => mroItems.id, { onDelete: "cascade" }).notNull(),
  requestedQuantity: numericMoney("requested_quantity").notNull(),
  approvedQuantity: numericMoney("approved_quantity"),
  issuedQuantity: numericMoney("issued_quantity"),
  purpose: text("purpose"),
  equipmentId: varchar("equipment_id"),
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  department: varchar("department", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  issuedBy: varchar("issued_by").references(() => users.id, { onDelete: "set null" }),
  issuedAt: timestamp("issued_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertMroRequestSchema = createInsertSchema(mroRequests, {
  status: z.enum(["pending", "approved", "issued", "rejected", "cancelled"]).default("pending"),
}).omit({ id: true, createdAt: true } as never);

export type MroRequest = typeof mroRequests.$inferSelect;

export type InsertMroRequest = z.infer<typeof insertMroRequestSchema>;


export const mroConsumption = pgTable("mro_consumption", {
  id: serial("id").primaryKey(),
  requestId: varchar("request_id").references(() => mroRequests.id, { onDelete: "set null" }),
  itemId: varchar("item_id").references(() => mroItems.id, { onDelete: "cascade" }).notNull(),
  quantity: numericMoney("quantity").notNull(),
  unitCost: numericMoney("unit_cost").default(0),
  totalCost: numericMoney("total_cost").default(0),
  consumedBy: varchar("consumed_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  department: varchar("department", { length: 100 }),
  equipmentId: varchar("equipment_id"),
  purpose: varchar("purpose", { length: 500 }),
  consumedAt: timestamp("consumed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertMroConsumptionSchema = createInsertSchema(mroConsumption).omit({ id: true, createdAt: true } as never);

export type MroConsumption = typeof mroConsumption.$inferSelect;

export type InsertMroConsumption = z.infer<typeof insertMroConsumptionSchema>;


export const mroBudgets = pgTable("mro_budgets", {
  id: serial("id").primaryKey(),
  department: varchar("department", { length: 100 }).notNull(),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  budgetAmount: numericMoney("budget_amount").notNull(),
  spentAmount: numericMoney("spent_amount").notNull().default(0),
  remainingAmount: numericMoney("remaining_amount").notNull(),
  currency: varchar("currency", { length: 5 }).notNull().default("UZS"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("mro_budgets_status_chk", sql`${t.status} IN ('active','exceeded','closed')`),
]);


// ============================================================================
// MRO Sozlamalari (MRO sozlama-hub) — generic key-value, marketing_settings
// patterniga ko'ra (lib/db/src/schema/marketing-schema.ts:552).
// APPROVED: egasi vizyon-qurish 2026-07-01, FAZA "Sozlama har bo'limda"
// ============================================================================
export const mroSettings = pgTable("mro_settings", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  category: varchar("category", { length: 100 }).default("general"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMroSettingSchema = createInsertSchema(mroSettings, {
  key: z.string().min(2),
}).omit({ id: true, updatedAt: true } as never);

export type MroSetting = typeof mroSettings.$inferSelect;
export type InsertMroSetting = z.infer<typeof insertMroSettingSchema>;

