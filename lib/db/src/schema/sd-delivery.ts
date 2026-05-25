/**
 * @module sd-delivery
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
import { salesOrders, salesInvoices, salesOrderItems, orderStatusLogs } from "./sd-core";

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  deliveryNumber: varchar("delivery_number", { length: 50 }).notNull().unique(), // DLV-8000012345
  deliveryType: varchar("delivery_type", { length: 10 }).notNull().default("LF"), // LF = Standard delivery

  // Shipping points
  shippingPoint: varchar("shipping_point", { length: 10 }).notNull().default("SP01"),
  loadingPoint: varchar("loading_point", { length: 10 }).notNull().default("LP01"),

  // References
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id, { onDelete: "set null" }),
  customerId: integer("customer_id").references(() => crmCompanies.id, { onDelete: 'set null' }),

  // Dates
  plannedGoodsMovementDate: varchar("planned_goods_movement_date", { length: 10 }),
  actualGoodsMovementDate: varchar("actual_goods_movement_date", { length: 10 }),

  // Status
  deliveryStatus: varchar("delivery_status", { length: 20 }).notNull().default("PICKING"), // PICKING, PACKING, GOODS_ISSUE, COMPLETED

  // Logistics
  totalWeight: numericMoney("total_weight"),
  totalVolume: numericMoney("total_volume"),
  numberOfPackages: integer("number_of_packages"),

  // Driver info
  driverName: varchar("driver_name", { length: 100 }),
  vehicleNumber: varchar("vehicle_number", { length: 20 }),

  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_deliveries_sales_order_id").on(t.salesOrderId),
  index("idx_deliveries_customer_id").on(t.customerId),
  index("idx_deliveries_status").on(t.deliveryStatus),
  index("idx_deliveries_created_at").on(t.createdAt),
  check("deliveries_status_chk", sql`${t.deliveryStatus} IN ('PICKING','PACKING','GOODS_ISSUE','COMPLETED')`),
]);


export const insertDeliverySchema = createInsertSchema(deliveries, {
  deliveryNumber: z.string().regex(/^DLV-\d{10}$/, "Format: DLV-XXXXXXXXXX"),
  deliveryStatus: z.enum(["PICKING", "PACKING", "GOODS_ISSUE", "COMPLETED"]),
  plannedGoodsMovementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak").optional(),
  actualGoodsMovementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak").optional(),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true } as never);


export type Delivery = typeof deliveries.$inferSelect;

export type InsertDelivery = z.infer<typeof insertDeliverySchema>;


// Delivery Items
export const deliveryItems = pgTable("delivery_items", {
  id: serial("id").primaryKey(),
  deliveryId: varchar("delivery_id").references(() => deliveries.id, { onDelete: "cascade" }).notNull(),
  itemNumber: varchar("item_number", { length: 10 }).notNull(),

  salesOrderItemId: varchar("sales_order_item_id").references(() => salesOrderItems.id, { onDelete: "set null" }),

  materialId: varchar("material_id").references(() => products.id, { onDelete: "set null" }),
  deliveryQuantity: numericMoney("delivery_quantity").notNull(),
  pickedQuantity: numericMoney("picked_quantity").notNull().default(0),

  plant: varchar("plant", { length: 10 }).notNull().default("P001"),
  storageLocation: varchar("storage_location", { length: 10 }).notNull().default("SL02"),

  batch: varchar("batch", { length: 50 }),

  pickingStatus: varchar("picking_status", { length: 20 }).notNull().default("NOT_PICKED"),
  goodsIssueStatus: varchar("goods_issue_status", { length: 20 }).notNull().default("NOT_ISSUED"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_delivery_items_delivery_id").on(t.deliveryId),
  index("idx_delivery_items_material_id").on(t.materialId),
  index("idx_delivery_items_picking_status").on(t.pickingStatus),
  check("delivery_items_picking_status_chk", sql`${t.pickingStatus} IN ('NOT_PICKED','PICKING','PICKED','PARTIAL')`),
  check("delivery_items_gi_status_chk", sql`${t.goodsIssueStatus} IN ('NOT_ISSUED','PARTIALLY_ISSUED','ISSUED')`),
]);


export const insertDeliveryItemSchema = createInsertSchema(deliveryItems, {
  deliveryQuantity: z.coerce.number().positive(),
  pickedQuantity: z.coerce.number().nonnegative(),
}).omit({ id: true, createdAt: true } as never);


export type DeliveryItem = typeof deliveryItems.$inferSelect;

export type InsertDeliveryItem = z.infer<typeof insertDeliveryItemSchema>;


// Billing Documents (Hisob-fakturalar)
export const billingDocuments = pgTable("billing_documents", {
  id: serial("id").primaryKey(),
  billingNumber: varchar("billing_number", { length: 50 }).notNull().unique(), // INV-9000012345
  billingType: varchar("billing_type", { length: 10 }).notNull().default("F2"), // F2 = Invoice, G2 = Credit memo
  billingDate: varchar("billing_date", { length: 10 }).notNull(),

  // References
  salesOrderId: varchar("sales_order_id").references(() => salesOrders.id, { onDelete: "set null" }),
  deliveryId: varchar("delivery_id").references(() => deliveries.id, { onDelete: "set null" }),
  customerId: integer("customer_id").references(() => crmCompanies.id, { onDelete: 'set null' }),

  // Amounts
  netValue: numericMoney("net_value").notNull(),
  taxAmount: numericMoney("tax_amount").notNull(),
  totalValue: numericMoney("total_value").notNull(),

  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  paymentTerms: varchar("payment_terms", { length: 10 }).default("0014"),

  // Accounting document
  accountingDocument: varchar("accounting_document", { length: 50 }),
  fiscalYear: integer("fiscal_year"),

  // Status
  billingStatus: varchar("billing_status", { length: 20 }).notNull().default("OPEN"), // OPEN, PARTIALLY_PAID, PAID, CANCELLED

  // Cancellation
  cancelled: boolean("cancelled").notNull().default(false),
  cancelledBy: varchar("cancelled_by"),
  cancellationOf: varchar("cancellation_of"), // Reference to original invoice if this is cancellation

  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_billing_documents_sales_order_id").on(t.salesOrderId),
  index("idx_billing_documents_customer_id").on(t.customerId),
  index("idx_billing_documents_billing_status").on(t.billingStatus),
  index("idx_billing_documents_created_at").on(t.createdAt),
  check("billing_documents_status_chk", sql`${t.billingStatus} IN ('OPEN','PARTIALLY_PAID','PAID','CANCELLED')`),
  check("billing_documents_type_chk", sql`${t.billingType} IN ('F2','G2')`),
]);


export const insertBillingDocumentSchema = createInsertSchema(billingDocuments, {
  billingNumber: z.string().regex(/^INV-\d{10}$/, "Format: INV-XXXXXXXXXX"),
  billingType: z.enum(["F2", "G2"]),
  billingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  netValue: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative(),
  totalValue: z.coerce.number().nonnegative(),
  billingStatus: z.enum(["OPEN", "PARTIALLY_PAID", "PAID", "CANCELLED"]),
}).omit({ id: true, createdAt: true, deletedAt: true } as never);


export type BillingDocument = typeof billingDocuments.$inferSelect;

export type InsertBillingDocument = z.infer<typeof insertBillingDocumentSchema>;


// Billing Items
export const billingItems = pgTable("billing_items", {
  id: serial("id").primaryKey(),
  billingDocumentId: varchar("billing_document_id").references(() => billingDocuments.id, { onDelete: "cascade" }).notNull(),
  itemNumber: varchar("item_number", { length: 10 }).notNull(),

  salesOrderItemId: varchar("sales_order_item_id").references(() => salesOrderItems.id, { onDelete: "set null" }),
  deliveryItemId: varchar("delivery_item_id").references(() => deliveryItems.id, { onDelete: "set null" }),

  materialId: varchar("material_id").references(() => products.id, { onDelete: "set null" }),
  billedQuantity: numericMoney("billed_quantity").notNull(),

  netPrice: numericMoney("net_price").notNull(),
  taxCode: varchar("tax_code", { length: 10 }).notNull().default("V1"),
  taxAmount: numericMoney("tax_amount").notNull(),
  totalPrice: numericMoney("total_price").notNull(),

  // Revenue account determination
  revenueAccount: varchar("revenue_account", { length: 20 }).default("400000"),
  costCenter: varchar("cost_center", { length: 20 }),
  profitCenter: varchar("profit_center", { length: 20 }),

  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_billing_items_billing_document_id").on(t.billingDocumentId),
  index("idx_billing_items_material_id").on(t.materialId),
]);


export const insertBillingItemSchema = createInsertSchema(billingItems, {
  billedQuantity: z.coerce.number().positive(),
  netPrice: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative(),
  totalPrice: z.coerce.number().nonnegative(),
}).omit({ id: true, createdAt: true } as never);


export type BillingItem = typeof billingItems.$inferSelect;

export type InsertBillingItem = z.infer<typeof insertBillingItemSchema>;


// ============================================================================
// SAP ERP TABLES - SD Module: Quotations and Pricing
// ============================================================================

// Quotations (Narx takliflari)
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: varchar("quotation_number", { length: 50 }).notNull().unique(), // QT-XXXXXXXXXX

  // Customer info
  customerId: integer("customer_id").references(() => crmCompanies.id, { onDelete: 'set null' }),
  customerName: text("customer_name").notNull(),

  // Dates
  quotationDate: varchar("quotation_date", { length: 10 }).notNull(), // YYYY-MM-DD
  validUntil: varchar("valid_until", { length: 10 }).notNull(), // YYYY-MM-DD

  // Status
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sent, accepted, rejected, expired, converted

  // Pricing
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  netValue: numericMoney("net_value").notNull().default(0),
  taxAmount: numericMoney("tax_amount").notNull().default(0),
  totalValue: numericMoney("total_value").notNull().default(0),

  // Terms
  paymentTerms: varchar("payment_terms", { length: 50 }),
  notes: text("notes"),

  // SD Europrint — narx hisoblash
  markupPercent: numericMoney("markup_percent").default(35),
  vatRate: numericMoney("vat_rate").default(12),
  managerId: varchar("manager_id"),

  // Conversion reference
  convertedToOrderId: varchar("converted_to_order_id"),

  // Audit
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_quotations_customer_id").on(t.customerId),
  index("idx_quotations_status").on(t.status),
  index("idx_quotations_created_at").on(t.createdAt),
]);

