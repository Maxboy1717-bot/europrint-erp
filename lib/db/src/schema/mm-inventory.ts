/**
 * @module mm-inventory
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

export const aiMaterialInsights = pgTable("ai_material_insights", {
  id: serial("id").primaryKey(),
  materialId: varchar("material_id").references(() => rawMaterials.id, { onDelete: "set null" }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  insightType: varchar("insight_type", { length: 30 }).notNull(), // forecast, anomaly, recommendation, trend
  insightDate: varchar("insight_date", { length: 10 }).notNull(), // YYYY-MM-DD
  confidence: numericMoney("confidence"), // 0-100
  priority: varchar("priority", { length: 10 }).default("medium"), // low, medium, high, critical
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  description: text("description").notNull(),
  descriptionRu: text("description_ru"),
  payload: jsonb("payload"), // Qo'shimcha ma'lumotlar (forecast values, etc.)
  actionRequired: boolean("action_required").notNull().default(false),
  actionTaken: boolean("action_taken").notNull().default(false),
  actionTakenBy: varchar("action_taken_by").references(() => users.id, { onDelete: "set null" }),
  actionTakenAt: timestamp("action_taken_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_ai_material_insights_material_id").on(t.materialId),
  index("idx_ai_material_insights_warehouse_id").on(t.warehouseId),
  index("idx_ai_material_insights_priority").on(t.priority),
  index("idx_ai_material_insights_created_at").on(t.createdAt),
]);


export const insertAiMaterialInsightSchema = createInsertSchema(aiMaterialInsights, {
  insightType: z.enum(["forecast", "anomaly", "recommendation", "trend"]),
  insightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  confidence: z.number().min(0).max(100).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  description: z.string().min(10, "Tavsif kamida 10 ta belgidan iborat bo'lishi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type AiMaterialInsight = typeof aiMaterialInsights.$inferSelect;

export type InsertAiMaterialInsight = z.infer<typeof insertAiMaterialInsightSchema>;


// ============================================
// INVENTARIZATSIYA (INVENTORY VALUATION)
// ============================================

// Inventory Counts (Inventarizatsiya hisob-kitoblari)
export const inventoryCounts = pgTable("inventory_counts", {
  id: serial("id").primaryKey(),
  countNumber: varchar("count_number", { length: 50 }).notNull().unique(),
  countDate: varchar("count_date", { length: 10 }).notNull(), // YYYY-MM-DD
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  countType: varchar("count_type", { length: 20 }).notNull(), // full, cycle, spot
  status: varchar("status", { length: 20 }).notNull().default("planned"), // planned, in_progress, completed, approved
  totalItems: integer("total_items").default(0),
  countedItems: integer("counted_items").default(0),
  varianceItems: integer("variance_items").default(0),
  totalBookValue: numericMoney("total_book_value").default(0),
  totalCountedValue: numericMoney("total_counted_value").default(0),
  totalVariance: numericMoney("total_variance").default(0),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  approvedAt: timestamp("approved_at"),
  // --- live-DB superset columns (schema-convergence A5; ADD-ONLY) ---
  countedBy: integer("counted_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at"),
  materialId: integer("material_id"), // single-material count (alongside line-level detail)
  countedQty: numericMoney("counted_qty"),
  systemQty: numericMoney("system_qty"),
  startedBy: integer("started_by"),
  isWarehouseLocked: boolean("is_warehouse_locked").default(false),
  systemSnapshotAt: timestamp("system_snapshot_at"),
  totalVarianceValue: numericMoney("total_variance_value"),
  glDocumentId: varchar("gl_document_id"),
  pdfPath: text("pdf_path"),
  conductedBy: integer("conducted_by"),
}, (t) => [
  check("inventory_counts_status_chk", sql`${t.status} IN ('planned','in_progress','completed','approved')`),
  check("inventory_counts_count_type_chk", sql`${t.countType} IN ('full','cycle','spot')`),
  check("inventory_counts_total_items_chk", sql`${t.totalItems} IS NULL OR ${t.totalItems} >= 0`),
  check("inventory_counts_book_value_chk", sql`${t.totalBookValue} IS NULL OR ${t.totalBookValue} >= 0`),
  check("inventory_counts_counted_value_chk", sql`${t.totalCountedValue} IS NULL OR ${t.totalCountedValue} >= 0`),
  index("idx_inventory_counts_warehouse_id").on(t.warehouseId),
  index("idx_inventory_counts_status").on(t.status),
  index("idx_inventory_counts_count_date").on(t.countDate),
  index("idx_inventory_counts_created_at").on(t.createdAt),
]);


export const insertInventoryCountSchema = createInsertSchema(inventoryCounts, {
  countNumber: z.string().optional().default(""), // Auto-generated server-side
  countDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  countType: z.enum(["full", "cycle", "spot"]),
  status: z.enum(["draft", "planned", "in_progress", "completed", "approved"]).default("planned"),
  assignedTo: z.union([z.number().int(), z.string().transform(v => v === "" ? null : parseInt(v, 10))]).optional().nullable(),
  approvedBy: z.union([z.number().int(), z.string().transform(v => v === "" ? null : parseInt(v, 10))]).optional().nullable(),
}).omit({ id: true, createdAt: true } as never);


export type InventoryCount = typeof inventoryCounts.$inferSelect;

export type InsertInventoryCount = z.infer<typeof insertInventoryCountSchema>;


// Inventory Count Lines (Inventarizatsiya qatorlari)
export const inventoryCountLines = pgTable("inventory_count_lines", {
  id: serial("id").primaryKey(),
  countId: integer("count_id").notNull().references(() => inventoryCounts.id, { onDelete: "cascade" }),
  materialId: integer("material_id").references(() => rawMaterials.id, { onDelete: "set null" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  itemType: varchar("item_type", { length: 20 }).notNull(), // material, product
  bookQuantity: numericMoney("book_quantity").notNull(),
  countedQuantity: numericMoney("counted_quantity"),
  variance: numericMoney("variance"),
  variancePercent: numericMoney("variance_percent"),
  unitCost: numericMoney("unit_cost").notNull(),
  bookValue: numericMoney("book_value").notNull(),
  countedValue: numericMoney("counted_value"),
  valueVariance: numericMoney("value_variance"),
  reason: text("reason"), // Farq sababi
  countedBy: integer("counted_by").references(() => users.id, { onDelete: "set null" }),
  countedAt: timestamp("counted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_inventory_count_lines_count_id").on(t.countId),
  index("idx_inventory_count_lines_material_id").on(t.materialId),
  index("idx_inventory_count_lines_product_id").on(t.productId),
  index("idx_inventory_count_lines_created_at").on(t.createdAt),
]);


export const insertInventoryCountLineSchema = createInsertSchema(inventoryCountLines, {
  itemType: z.enum(["material", "product"]),
  bookQuantity: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
  bookValue: z.number().nonnegative(),
}).omit({ id: true, createdAt: true } as never);


export type InventoryCountLine = typeof inventoryCountLines.$inferSelect;

export type InsertInventoryCountLine = z.infer<typeof insertInventoryCountLineSchema>;


// ========== AI MATERIAL RESERVATION ==========
export const aiReservationRequests = pgTable("ai_reservation_requests", {
  id: serial("id").primaryKey(),
  orderId: varchar("order_id"),
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "set null" }),
  materialType: varchar("material_type", { length: 50 }).notNull(),
  requiredQuantity: numericMoney("required_quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("kg"),
  requiredByDate: varchar("required_by_date", { length: 10 }),
  priority: varchar("priority", { length: 10 }).notNull().default("normal"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  aiRecommendation: jsonb("ai_recommendation"),
  reservedBatches: jsonb("reserved_batches"),
  totalReserved: numericMoney("total_reserved").default(0),
  shortageAmount: numericMoney("shortage_amount").default(0),
  aiConfidence: numericMoney("ai_confidence").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  // --- live-DB superset columns (schema-convergence A5; ADD-ONLY) ---
  quantity: numericMoney("quantity"), // alias of required_quantity (legacy column)
  neededBy: varchar("needed_by", { length: 10 }), // YYYY-MM-DD (alias of required_by_date)
  optimization: jsonb("optimization"), // AI optimization result payload
}, (t) => [
  index("idx_ai_reservation_requests_status").on(t.status),
  index("idx_ai_reservation_requests_priority").on(t.priority),
  index("idx_ai_reservation_requests_created_at").on(t.createdAt),
]);


export const aiMaterialBatches = pgTable("ai_material_batches", {
  id: serial("id").primaryKey(),
  batchNumber: varchar("batch_number", { length: 30 }).notNull(),
  materialId: varchar("material_id"),
  materialName: text("material_name").notNull(),
  materialType: varchar("material_type", { length: 50 }),
  quantity: numericMoney("quantity").notNull(),
  reservedQuantity: numericMoney("reserved_quantity").default(0),
  availableQuantity: numericMoney("available_quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("kg"),
  expiryDate: varchar("expiry_date", { length: 10 }),
  receivedDate: varchar("received_date", { length: 10 }),
  warehouseId: varchar("warehouse_id"),
  location: text("location"),
  costPerUnit: numericMoney("cost_per_unit").default(0),
  qualityGrade: varchar("quality_grade", { length: 10 }).default("A"),
  status: varchar("status", { length: 20 }).notNull().default("available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_ai_material_batches_material_id").on(t.materialId),
  index("idx_ai_material_batches_warehouse_id").on(t.warehouseId),
  index("idx_ai_material_batches_status").on(t.status),
  index("idx_ai_material_batches_created_at").on(t.createdAt),
]);


export const insertAiReservationRequestSchema = createInsertSchema(aiReservationRequests).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const insertAiMaterialBatchSchema = createInsertSchema(aiMaterialBatches).omit({ id: true, createdAt: true } as never);


export type AiReservationRequest = typeof aiReservationRequests.$inferSelect;

export type InsertAiReservationRequest = z.infer<typeof insertAiReservationRequestSchema>;

export type AiMaterialBatch = typeof aiMaterialBatches.$inferSelect;

export type InsertAiMaterialBatch = z.infer<typeof insertAiMaterialBatchSchema>;


// =====================================================
// BARCODE WAREHOUSE MANAGEMENT SYSTEM (World-Class)
// Material Barcode Registry + Movement Tracking + 
// Production Consumption + Operator Balance + Exit Control
// =====================================================

// Material Barcodes — har bir fizik material birligining barcode pasporti
export const materialBarcodes = pgTable("material_barcodes", {
  id: serial("id").primaryKey(),
  barcodeId: varchar("barcode_id", { length: 100 }).notNull().unique(),
  materialCardId: varchar("material_id").references(() => materialCards.id, { onDelete: "set null" }),
  lotNumber: varchar("lot_number", { length: 50 }),
  quantity: numericMoney("quantity").notNull(),
  remainingQuantity: numericMoney("remaining_quantity").notNull(),
  reservedQuantity: numericMoney("reserved_quantity").notNull().default(0),
  uom: varchar("uom", { length: 20 }).notNull(),
  currentLocation: varchar("current_location", { length: 100 }).notNull().default("RECEIVING"),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  binId: varchar("bin_id").references(() => warehouseBins.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("QC_HOLD"),
  receivedDate: timestamp("received_date"),
  productionDate: varchar("production_date", { length: 10 }),
  expiryDate: varchar("expiry_date", { length: 10 }),
  gtin: varchar("gtin", { length: 14 }),
  sscc: varchar("sscc", { length: 18 }),
  vendorId: varchar("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
  poNumber: varchar("po_number", { length: 50 }),
  goodsReceiptId: varchar("goods_receipt_id"),
  parentBarcodeId: varchar("parent_barcode_id"),
  unitCost: numericMoney("unit_cost").default(0),
  totalCost: numericMoney("total_cost").default(0),
  qcStatus: varchar("qc_status", { length: 20 }).default("pending"),
  qcNotes: text("qc_notes"),
  qcInspectorId: varchar("qc_inspector_id").references(() => users.id, { onDelete: "set null" }),
  qcDate: timestamp("qc_date"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  index("idx_material_barcodes_material_card_id").on(t.materialCardId),
  index("idx_material_barcodes_warehouse_id").on(t.warehouseId),
  index("idx_material_barcodes_status").on(t.status),
  index("idx_material_barcodes_vendor_id").on(t.vendorId),
  index("idx_material_barcodes_qc_status").on(t.qcStatus),
  index("idx_material_barcodes_created_at").on(t.createdAt),
]);


export const insertMaterialBarcodeSchema = createInsertSchema(materialBarcodes, {
  barcodeId: z.string().min(1, "Barcode ID kerak"),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
  remainingQuantity: z.number().min(0),
  uom: z.string().min(1, "O'lchov birligi kerak"),
  status: z.enum(["QC_HOLD", "AVAILABLE", "RESERVED", "ISSUED", "CONSUMED", "RETURNED", "REJECTED", "SHIPPED", "SCRAPPED"]).default("QC_HOLD"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type MaterialBarcode = typeof materialBarcodes.$inferSelect;

export type InsertMaterialBarcode = z.infer<typeof insertMaterialBarcodeSchema>;


// Production Consumption — operator sarflash hisoboti (ishlatildi + chiqindi + qaytarish)
export const productionConsumption = pgTable("production_consumption", {
  id: serial("id").primaryKey(),
  productionOrderId: varchar("production_order_id").notNull(),
  barcodeId: varchar("barcode_id").references(() => materialBarcodes.id, { onDelete: "cascade" }).notNull(),
  operatorId: varchar("operator_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  qtyIssued: numericMoney("qty_issued").notNull(),
  qtyUsed: numericMoney("qty_used").default(0),
  qtyScrap: numericMoney("qty_scrap").default(0),
  qtyReturned: numericMoney("qty_returned").default(0),
  variance: numericMoney("variance").default(0),
  verified: boolean("verified").default(false),
  issuedAt: timestamp("issued_at"),
  confirmedAt: timestamp("confirmed_at"),
  returnBarcodeId: varchar("return_barcode_id"),
  scrapReason: text("scrap_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_production_consumption_production_order_id").on(t.productionOrderId),
  index("idx_production_consumption_barcode_id").on(t.barcodeId),
  index("idx_production_consumption_operator_id").on(t.operatorId),
  index("idx_production_consumption_created_at").on(t.createdAt),
]);


export const insertProductionConsumptionSchema = createInsertSchema(productionConsumption, {
  qtyIssued: z.number().positive("Berilgan miqdor musbat bo'lishi kerak"),
  qtyUsed: z.number().min(0),
  qtyScrap: z.number().min(0),
  qtyReturned: z.number().min(0),
}).omit({ id: true, createdAt: true } as never);

export type ProductionConsumption = typeof productionConsumption.$inferSelect;

export type InsertProductionConsumption = z.infer<typeof insertProductionConsumptionSchema>;


// Operator Material Balance — material qarz tizimi (0.5 kg tolerance)