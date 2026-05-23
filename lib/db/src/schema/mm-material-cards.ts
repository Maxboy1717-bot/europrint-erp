/**
 * @module mm-material-cards
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
import { vendors, rawMaterials, goodsReceipts } from "./mm-procurement";

export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  batchNumber: varchar("batch_number", { length: 50 }).notNull().unique(),
  productId: varchar("product_id").references(() => products.id, { onDelete: "set null" }),
  productionOrderId: varchar("production_order_id").references(() => productionOrders.id, { onDelete: "set null" }),
  quantity: numericMoney("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  manufacturingDate: varchar("manufacturing_date", { length: 10 }).notNull(),
  expiryDate: varchar("expiry_date", { length: 10 }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("available"), // available, reserved, blocked, consumed
  qualityStatus: varchar("quality_status", { length: 20 }).default("pending"), // pending, approved, rejected
  remainingQuantity: numericMoney("remaining_quantity"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_batches_product_id").on(t.productId),
  index("idx_batches_production_order_id").on(t.productionOrderId),
  index("idx_batches_warehouse_id").on(t.warehouseId),
  index("idx_batches_status").on(t.status),
  index("idx_batches_created_at").on(t.createdAt),
  check("batches_status_chk", sql`${t.status} IN ('available','reserved','blocked','consumed')`),
  check("batches_quality_chk", sql`${t.qualityStatus} IS NULL OR ${t.qualityStatus} IN ('pending','approved','rejected')`),
  check("batches_qty_chk", sql`${t.quantity} > 0`),
]);


export const insertBatchSchema = createInsertSchema(batches, {
  batchNumber: z.string().min(1, "Partiya raqami kerak"),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
  manufacturingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  status: z.enum(["available", "reserved", "blocked", "consumed"]),
}).omit({ id: true, createdAt: true } as never);


export type Batch = typeof batches.$inferSelect;

export type InsertBatch = z.infer<typeof insertBatchSchema>;


// ========== WAREHOUSE MANAGEMENT (Ombor) ==========

// Material Cards (Material kartochka)
export const materialCards = pgTable("material_cards", {
  id: serial("id").primaryKey(),
  kod: varchar("kod", { length: 50 }).notNull().unique(), // Unikal kod
  xomAshyo: text("xom_ashyo").notNull(), // Material nomi
  xomAshyoRu: text("xom_ashyo_ru"),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }).notNull(), // kg, dona, m2, rlon
  category: varchar("category", { length: 30 }), // qogoz, kley, plastina, boshqa
  // Format (qog'oz uchun)
  formatA: numericMoney("format_a"),
  formatB: numericMoney("format_b"),
  grammage: numericMoney("grammage"), // gramm
  // Qoldiq
  currentStock: numericMoney("current_stock").default(0),
  reservedStock: numericMoney("reserved_stock").default(0),
  availableStock: numericMoney("available_stock").default(0),
  // Min/Max
  minStock: numericMoney("min_stock").default(0),
  maxStock: numericMoney("max_stock"),
  reorderPoint: numericMoney("reorder_point"),
  // Narx
  unitPrice: numericMoney("unit_price"),
  currency: varchar("currency", { length: 10 }).default("UZS"),
  lastPurchasePrice: numericMoney("last_purchase_price"),
  lastPurchaseDate: varchar("last_purchase_date", { length: 10 }),
  supplierName: text("supplier_name"),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  description: text("description"),
  rawMaterialId: varchar("raw_material_id").references(() => rawMaterials.id, { onDelete: "set null" }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  materialType: varchar("material_type", { length: 30 }).default("raw_material"), // raw_material, chemical, consumable, spare_part, packaging
  storageConditions: jsonb("storage_conditions"), // { temp_min, temp_max, humidity_max, notes }
  shelfLifeDays: integer("shelf_life_days"), // maksimal saqlash muddati (kun)
  abcSegment: varchar("abc_segment", { length: 1 }).default("C"), // A/B/C (ABC tahlil)
  barcode: varchar("barcode", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  index("idx_material_cards_warehouse_id").on(t.warehouseId),
  index("idx_material_cards_category").on(t.category),
  index("idx_material_cards_is_active").on(t.isActive),
  index("idx_material_cards_vendor_id").on(t.vendorId),
  index("idx_material_cards_abc_segment").on(t.abcSegment),
  check("material_cards_type_chk", sql`${t.materialType} IS NULL OR ${t.materialType} IN ('raw_material','chemical','consumable','spare_part','packaging')`),
  check("material_cards_abc_chk", sql`${t.abcSegment} IS NULL OR ${t.abcSegment} IN ('A','B','C')`),
  check("material_cards_stock_chk", sql`${t.currentStock} IS NULL OR ${t.currentStock} >= 0`),
  check("material_cards_reserved_chk", sql`${t.reservedStock} IS NULL OR ${t.reservedStock} >= 0`),
]);


export const insertMaterialCardSchema = createInsertSchema(materialCards, {
  kod: z.string().min(1, "Kod kerak"),
  xomAshyo: z.string().min(1, "Material nomi kerak"),
  unitOfMeasure: z.string().min(1, "O'lchov birligi kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type MaterialCard = typeof materialCards.$inferSelect;

export type InsertMaterialCard = z.infer<typeof insertMaterialCardSchema>;


// Min Stock Alerts (Kam qoldiq ogohlantirishlari)
export const minStockAlerts = pgTable("min_stock_alerts", {
  id: serial("id").primaryKey(),
  materialCardId: varchar("material_id").references(() => materialCards.id, { onDelete: "cascade" }).notNull(),
  alertDate: varchar("alert_date", { length: 10 }).notNull(),
  alertType: varchar("alert_type", { length: 20 }).default("min_stock"), // min_stock | expiring | zero_stock | price_change | reorder
  currentStock: numericMoney("current_stock").notNull(),
  minStock: numericMoney("min_stock").notNull(),
  deficit: numericMoney("deficit").notNull(), // min - current
  severity: varchar("severity", { length: 20 }).notNull(), // warning, critical
  // Holat
  isAcknowledged: boolean("is_acknowledged").default(false),
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id, { onDelete: "set null" }),
  acknowledgedAt: timestamp("acknowledged_at"),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  // Xabar
  telegramSent: boolean("telegram_sent").default(false),
  telegramSentAt: timestamp("telegram_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_min_stock_alerts_material_card_id").on(t.materialCardId),
  index("idx_min_stock_alerts_severity").on(t.severity),
  index("idx_min_stock_alerts_is_resolved").on(t.isResolved),
  index("idx_min_stock_alerts_created_at").on(t.createdAt),
  check("min_stock_alerts_type_chk", sql`${t.alertType} IS NULL OR ${t.alertType} IN ('min_stock','expiring','zero_stock','price_change','reorder')`),
  check("min_stock_alerts_severity_chk", sql`${t.severity} IN ('warning','critical')`),
]);


export type MinStockAlert = typeof minStockAlerts.$inferSelect;


// Consumption Suggestions (Chiqim tavsiyalari)
export const consumptionSuggestions = pgTable("consumption_suggestions", {
  id: serial("id").primaryKey(),
  papkaOrderId: varchar("papka_order_id").references(() => papkaOrders.id, { onDelete: "cascade" }).notNull(),
  materialCardId: varchar("material_id").references(() => materialCards.id, { onDelete: "cascade" }).notNull(),
  formulaId: varchar("formula_id").references(() => formulaDefinitions.id, { onDelete: "set null" }),
  // Tavsiya
  suggestedQuantity: numericMoney("suggested_quantity").notNull(),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }).notNull(),
  calculationDetails: jsonb("calculation_details"), // Formula natijalari
  // Holat
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, executed
  approvedBy: varchar("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  executedTransactionId: varchar("executed_transaction_id").references(() => warehouseTransactions.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_consumption_suggestions_papka_order_id").on(t.papkaOrderId),
  index("idx_consumption_suggestions_material_card_id").on(t.materialCardId),
  index("idx_consumption_suggestions_status").on(t.status),
  index("idx_consumption_suggestions_created_at").on(t.createdAt),
  check("consumption_suggestions_status_chk", sql`${t.status} IN ('pending','approved','rejected','executed')`),
]);


export type ConsumptionSuggestion = typeof consumptionSuggestions.$inferSelect;


// Material Batches (partiyalar)
export const materialBatches = pgTable("material_batches", {
  id: serial("id").primaryKey(),
  batchNumber: varchar("batch_number", { length: 50 }).notNull(),
  materialCardId: varchar("material_id").references(() => materialCards.id, { onDelete: "set null" }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  binId: varchar("bin_id").references(() => warehouseBins.id, { onDelete: "set null" }),
  quantity: numericMoney("quantity").notNull(),
  remainingQuantity: numericMoney("remaining_quantity").notNull(),
  unitCost: numericMoney("unit_cost").default(0),
  productionDate: varchar("production_date", { length: 10 }),
  expiryDate: varchar("expiry_date", { length: 10 }),
  supplierId: varchar("supplier_id"),
  supplierBatchNumber: varchar("supplier_batch_number", { length: 100 }),
  goodsReceiptId: varchar("goods_receipt_id").references(() => goodsReceipts.id, { onDelete: "set null" }),
  qcStatus: varchar("qc_status", { length: 20 }).default("pending"),
  barcode: varchar("barcode", { length: 100 }).unique(),
  qrCode: text("qr_code"),
  status: varchar("status", { length: 20 }).default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_material_batches_material_card_id").on(t.materialCardId),
  index("idx_material_batches_warehouse_id").on(t.warehouseId),
  index("idx_material_batches_status").on(t.status),
  index("idx_material_batches_qc_status").on(t.qcStatus),
  index("idx_material_batches_created_at").on(t.createdAt),
  check("material_batches_qc_status_chk", sql`${t.qcStatus} IS NULL OR ${t.qcStatus} IN ('pending','approved','rejected')`),
  check("material_batches_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('active','consumed','expired','blocked')`),
]);

