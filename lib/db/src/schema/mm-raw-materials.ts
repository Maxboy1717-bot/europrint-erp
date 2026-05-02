import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, unique, uuid, pgSequence, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { glDocuments } from "./fi-schema";
import { Order, equipment, formulaDefinitions, machineTasks, mrpResults, mrpRuns, papkaOrders, productionOrders, productionSessions, products } from "./pp-schema";
import { warehouseBins, warehouseTransactions, warehouses } from "./wms-schema";
import { materialCards } from "./mm-materials";


// Raw Materials (xom ashyo)
export const rawMaterials = pgTable("raw_materials", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // SKU
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  category: varchar("category", { length: 50 }).notNull(), // paperboard, glue, ink, packaging, other
  unit: varchar("unit", { length: 20 }).notNull(), // kg, meter, liter, piece, roll
  minimumStock: numericMoney("minimum_stock").notNull().default(0), // Minimal zaxira
  currentStock: numericMoney("current_stock").notNull().default(0), // Joriy zaxira
  unitPrice: numericMoney("unit_price").notNull().default(0), // Birlik narxi
  supplierName: text("supplier_name"),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_raw_materials_vendor_id").on(t.vendorId),
  index("idx_raw_materials_warehouse_id").on(t.warehouseId),
  index("idx_raw_materials_category").on(t.category),
  index("idx_raw_materials_is_active").on(t.isActive),
  index("idx_raw_materials_created_at").on(t.createdAt),
]);


export const insertRawMaterialSchema = createInsertSchema(rawMaterials, {
  code: z.string().min(1, "Kod talab qilinadi"),
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  category: z.enum(["paperboard", "glue", "ink", "packaging", "other"]),
  unit: z.enum(["kg", "meter", "liter", "piece", "roll", "box"]),
  minimumStock: z.number().nonnegative("Minimal zaxira 0 yoki katta bo'lishi kerak"),
  currentStock: z.number().nonnegative("Joriy zaxira 0 yoki katta bo'lishi kerak"),
  unitPrice: z.number().nonnegative("Narx 0 yoki katta bo'lishi kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true } as never);


export type RawMaterial = typeof rawMaterials.$inferSelect;

export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;


// Purchase Invoices (xarid hujjatlari)
export const purchaseInvoices = pgTable("purchase_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  invoiceDate: varchar("invoice_date", { length: 10 }).notNull(), // YYYY-MM-DD
  supplierName: text("supplier_name").notNull(),
  vendorId: varchar("vendor_id").references(() => vendors.id),
  totalAmount: numericMoney("total_amount").notNull(),
  paidAmount: numericMoney("paid_amount").notNull().default(0),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("unpaid"), // unpaid, partial, paid
  dueDate: varchar("due_date", { length: 10 }), // YYYY-MM-DD
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_purchase_invoices_vendor_id").on(t.vendorId),
  index("idx_purchase_invoices_payment_status").on(t.paymentStatus),
  index("idx_purchase_invoices_invoice_date").on(t.invoiceDate),
  index("idx_purchase_invoices_created_at").on(t.createdAt),
]);


export const insertPurchaseInvoiceSchema = createInsertSchema(purchaseInvoices, {
  invoiceNumber: z.string().min(1, "Hujjat raqami talab qilinadi"),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  supplierName: z.string().min(2, "Yetkazib beruvchi nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  totalAmount: z.number().nonnegative("Umumiy summa 0 yoki katta bo'lishi kerak"),
  paymentStatus: z.enum(["unpaid", "partial", "paid"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type PurchaseInvoice = typeof purchaseInvoices.$inferSelect;

export type InsertPurchaseInvoice = z.infer<typeof insertPurchaseInvoiceSchema>;


// Purchase requisition number sequence (xarid talabi raqami uchun)
export const purchaseRequisitionSeq = pgSequence("purchase_requisition_seq", {
  startWith: 1,
  increment: 1,
  minValue: 1,
  cache: 1,
});

// Purchase Requisitions (Xarid talablari)
export const purchaseRequisitions = pgTable("purchase_requisitions", {
  id: serial("id").primaryKey(),
  requisitionNumber: varchar("requisition_number", { length: 50 }).notNull().unique(), // PR-2025-001
  mrpResultId: varchar("mrp_result_id").references(() => mrpResults.id), // MRP natijasiga bog'liq (optional)
  mrpRunId: varchar("mrp_run_id").references(() => mrpRuns.id), // MRP run'ga bog'liq (idempotency uchun)
  materialId: integer("material_id").notNull(), // Xom ashyo
  requiredQuantity: numericMoney("required_quantity").notNull(), // Kerakli miqdor
  requiredDate: varchar("required_date", { length: 10 }).notNull(), // Kerakli sana
  priority: varchar("priority", { length: 20 }).notNull().default("normal"), // low, normal, high, urgent
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, ordered, received, cancelled
  supplierSuggestion: varchar("supplier_suggestion", { length: 200 }), // Tavsiya etilgan ta'minotchi
  supplierId: varchar("supplier_id"), // Yangi qo'shilgan: Ta'minotchi ID
  estimatedCost: numericMoney("estimated_cost"), // Taxminiy narx
  purchaseOrderId: varchar("purchase_order_id"), // Xarid buyurtmasi ID (keyinchalik qo'shiladi)
  requestedBy: integer("requested_by"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_purchase_requisitions_material_id").on(t.materialId),
  index("idx_purchase_requisitions_status").on(t.status),
  index("idx_purchase_requisitions_priority").on(t.priority),
  index("idx_purchase_requisitions_required_date").on(t.requiredDate),
  index("idx_purchase_requisitions_created_at").on(t.createdAt),
]);


export const insertPurchaseRequisitionSchema = createInsertSchema(purchaseRequisitions, {
  requisitionNumber: z.string().min(1, "Talab raqami kerak"),
  materialId: z.string().min(1, "Material tanlash kerak"),
  requiredQuantity: z.number().positive("Kerakli miqdor musbat bo'lishi kerak"),
  requiredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  status: z.enum(["pending", "approved", "ordered", "received", "cancelled"]),
  supplierId: z.string().optional().nullable(),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true } as never);


export type PurchaseRequisition = typeof purchaseRequisitions.$inferSelect;

export type InsertPurchaseRequisition = z.infer<typeof insertPurchaseRequisitionSchema>;


// ========================
// MM (MATERIAL MANAGEMENT) MODULE
// ========================

// Vendors (Supplier Master Data - Yetkazib beruvchilar)
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  vendorCode: varchar("vendor_code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  taxId: varchar("tax_id", { length: 50 }),
  paymentTerms: varchar("payment_terms", { length: 50 }), // NET30, NET60, etc.
  currency: varchar("currency", { length: 10 }).default("UZS"), // UZS, USD, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_vendors_is_active").on(t.isActive),
  index("idx_vendors_created_at").on(t.createdAt),
]);


export const insertVendorSchema = createInsertSchema(vendors, {
  vendorCode: z.string().min(1, "Vendor code kerak"),
  name: z.string().min(1, "Nomi kerak"),
  email: z.string().email().optional().or(z.literal("")),
}).omit({ id: true, createdAt: true, deletedAt: true } as never);


export type Vendor = typeof vendors.$inferSelect;

export type InsertVendor = z.infer<typeof insertVendorSchema>;


// Purchase Orders (Xarid buyurtmalari)
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  orderDate: varchar("order_date", { length: 10 }).notNull(), // YYYY-MM-DD
  deliveryDate: varchar("delivery_date", { length: 10 }), // YYYY-MM-DD
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, sent, confirmed, received, cancelled
  totalAmount: numericMoney("total_amount").default(0),
  currency: varchar("currency", { length: 10 }).default("UZS"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_purchase_orders_vendor_id").on(t.vendorId),
  index("idx_purchase_orders_status").on(t.status),
  index("idx_purchase_orders_created_at").on(t.createdAt),
]);

