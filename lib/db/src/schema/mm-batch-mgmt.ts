/**
 * @module mm-batch-mgmt
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
import { materialBatches, materialCards } from "./mm-material-cards";

export const insertMaterialBatchSchema = createInsertSchema(materialBatches, {
  batchNumber: z.string().min(1, "Partiya raqami kerak"),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
  remainingQuantity: z.number().min(0, "Qoldiq miqdor 0 dan kam bo'lmasligi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type MaterialBatch = typeof materialBatches.$inferSelect;

export type InsertMaterialBatch = z.infer<typeof insertMaterialBatchSchema>;


// Stock Reservations (zaxira qo'yish)
export const stockReservations = pgTable("stock_reservations", {
  id: serial("id").primaryKey(),
  reservationNumber: varchar("reservation_number", { length: 50 }).notNull().unique(),
  reservationDate: varchar("reservation_date", { length: 10 }).notNull(),
  materialCardId: varchar("material_id").references(() => materialCards.id, { onDelete: "set null" }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  orderId: varchar("order_id"),
  orderType: varchar("order_type", { length: 30 }),
  quantity: numericMoney("quantity").notNull(),
  reservedQuantity: numericMoney("reserved_quantity").default(0),
  issuedQuantity: numericMoney("issued_quantity").default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  priority: integer("priority").default(5),
  requiredDate: varchar("required_date", { length: 10 }),
  expiryDate: varchar("expiry_date", { length: 10 }),
  batchNumber: varchar("batch_number", { length: 50 }),
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "set null" }),
  reservedBy: varchar("reserved_by").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reservedAt: timestamp("reserved_at"),
  issuedAt: timestamp("issued_at"),
}, (t) => [
  index("idx_stock_reservations_material_card_id").on(t.materialCardId),
  index("idx_stock_reservations_warehouse_id").on(t.warehouseId),
  index("idx_stock_reservations_status").on(t.status),
  index("idx_stock_reservations_required_date").on(t.requiredDate),
  index("idx_stock_reservations_created_at").on(t.createdAt),
  check("stock_reservations_status_chk", sql`${t.status} IN ('pending','reserved','partial','issued','cancelled')`),
  check("stock_reservations_priority_chk", sql`${t.priority} IS NULL OR (${t.priority} >= 1 AND ${t.priority} <= 10)`),
  check("stock_reservations_qty_chk", sql`${t.quantity} > 0`),
]);


export const insertStockReservationSchema = createInsertSchema(stockReservations, {
  reservationNumber: z.string().min(1, "Zaxira raqami kerak"),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida"),
  quantity: z.number().positive("Miqdor musbat bo'lishi kerak"),
  status: z.enum(["pending", "reserved", "partial", "issued", "cancelled"]).default("pending"),
  priority: z.number().min(1).max(10).default(5),
}).omit({ id: true, createdAt: true, reservedAt: true, issuedAt: true } as never);


export type StockReservation = typeof stockReservations.$inferSelect;

export type InsertStockReservation = z.infer<typeof insertStockReservationSchema>;


// Material Categories (Material kategoriyalari)
export const materialCategories = pgTable("material_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // kraska, kley, skotch, ip, tozalash, begovka
  icon: varchar("icon", { length: 50 }), // lucide icon name
  unit: varchar("unit", { length: 20 }).notNull(), // kg, litr, rulon, dona, metr
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export type MaterialCategory = typeof materialCategories.$inferSelect;


// Material Kits (Buyurtma uchun material to'plamlari)
export const materialKits = pgTable("material_kits", {
  id: serial("id").primaryKey(),
  kitNumber: varchar("kit_number", { length: 50 }).notNull().unique(), // ORD-156-KIT
  orderId: varchar("order_id").references(() => papkaOrders.id, { onDelete: "cascade" }).notNull(),
  machineTaskId: varchar("machine_task_id").references(() => machineTasks.id, { onDelete: "set null" }),
  equipmentId: varchar("equipment_id").references(() => equipment.id, { onDelete: "set null" }),
  scheduledDate: varchar("scheduled_date", { length: 10 }).notNull(), // YYYY-MM-DD
  scheduledTime: varchar("scheduled_time", { length: 5 }), // HH:MM
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // pending, prepared, delivered, confirmed, in_use, completed
  preparedBy: varchar("prepared_by").references(() => users.id, { onDelete: "set null" }), // Omborchi
  preparedAt: timestamp("prepared_at"),
  deliveredBy: varchar("delivered_by").references(() => users.id, { onDelete: "set null" }), // Roklerchi
  deliveredAt: timestamp("delivered_at"),
  confirmedBy: varchar("confirmed_by").references(() => users.id, { onDelete: "set null" }), // Master
  confirmedAt: timestamp("confirmed_at"),
  barcode: text("barcode"), // To'plam shtrix kodi
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_material_kits_order_id").on(t.orderId),
  index("idx_material_kits_status").on(t.status),
  index("idx_material_kits_scheduled_date").on(t.scheduledDate),
  index("idx_material_kits_created_at").on(t.createdAt),
  check("material_kits_status_chk", sql`${t.status} IN ('pending','prepared','delivered','confirmed','in_use','completed')`),
]);


export const insertMaterialKitSchema = createInsertSchema(materialKits).omit({ id: true, createdAt: true, deletedAt: true } as never);

export type MaterialKit = typeof materialKits.$inferSelect;

export type InsertMaterialKit = z.infer<typeof insertMaterialKitSchema>;


// Material Kit Items (To'plam ichidagi materiallar)
export const materialKitItems = pgTable("material_kit_items", {
  id: serial("id").primaryKey(),
  kitId: varchar("kit_id").references(() => materialKits.id, { onDelete: "cascade" }).notNull(),
  materialId: varchar("material_id").references(() => rawMaterials.id, { onDelete: "set null" }),
  materialName: text("material_name").notNull(), // Fallback if material deleted
  categoryId: varchar("category_id").references(() => materialCategories.id, { onDelete: "set null" }),
  requiredQuantity: numericMoney("required_quantity").notNull(),
  issuedQuantity: numericMoney("issued_quantity").default(0),
  returnedQuantity: numericMoney("returned_quantity").default(0),
  consumedQuantity: numericMoney("consumed_quantity").default(0),
  unit: varchar("unit", { length: 20 }).notNull(),
  itemBarcode: text("item_barcode"), // Individual item barcode
  isScanned: boolean("is_scanned").default(false), // Master skanerladimi
  scannedAt: timestamp("scanned_at"),
  scannedBy: varchar("scanned_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_material_kit_items_kit_id").on(t.kitId),
  index("idx_material_kit_items_material_id").on(t.materialId),
  index("idx_material_kit_items_created_at").on(t.createdAt),
]);


export const insertMaterialKitItemSchema = createInsertSchema(materialKitItems).omit({ id: true, createdAt: true } as never);

export type MaterialKitItem = typeof materialKitItems.$inferSelect;

export type InsertMaterialKitItem = z.infer<typeof insertMaterialKitItemSchema>;


// Material Movements - Ishlab chiqarish paytida real-time material harakatlari
export const materialMovements = pgTable("material_movements", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").references(() => productionSessions.id, { onDelete: "cascade" }).notNull(),
  orderId: varchar("order_id").references(() => papkaOrders.id, { onDelete: "set null" }),
  kitId: varchar("kit_id").references(() => materialKits.id, { onDelete: "set null" }),
  materialId: varchar("material_id").references(() => rawMaterials.id, { onDelete: "set null" }),
  materialName: text("material_name").notNull(),
  // Harakat turi
  movementType: varchar("movement_type", { length: 20 }).notNull(),
  // initial_issue (dastlabki berish), additional_issue (qo'shimcha olish), 
  // return (qaytarish), waste (chiqindi), adjustment (tuzatish)
  quantity: numericMoney("quantity").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
  // Shtrix kod skanerlash
  barcode: text("barcode"),
  scannedAt: timestamp("scanned_at"),
  // Kim, qayerda
  performedBy: varchar("performed_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  equipmentId: varchar("equipment_id").references(() => equipment.id, { onDelete: "set null" }),
  // Izoh
  reason: text("reason"), // Qo'shimcha olish/qaytarish sababi
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_material_movements_session_id").on(t.sessionId),
  index("idx_material_movements_order_id").on(t.orderId),
  index("idx_material_movements_kit_id").on(t.kitId),
  index("idx_material_movements_material_id").on(t.materialId),
  index("idx_material_movements_movement_type").on(t.movementType),
  index("idx_material_movements_created_at").on(t.createdAt),
]);


export const insertMaterialMovementSchema = createInsertSchema(materialMovements).omit({ id: true, createdAt: true } as never);

export type MaterialMovement = typeof materialMovements.$inferSelect;

export type InsertMaterialMovement = z.infer<typeof insertMaterialMovementSchema>;


// ============================================
// MATERIAL ACCOUNTING (MATERIAL BUXGALTERIYA)
// ============================================

// Material Inventory Valuations (Material inventar baholash)
export const materialInventoryValuations = pgTable("material_inventory_valuations", {
  id: serial("id").primaryKey(),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  materialId: varchar("material_id").references(() => rawMaterials.id, { onDelete: "set null" }),
  valuationDate: varchar("valuation_date", { length: 10 }).notNull(), // YYYY-MM-DD
  valuationMethod: varchar("valuation_method", { length: 20 }).notNull().default("weighted_avg"), // fifo, lifo, weighted_avg
  quantity: numericMoney("quantity").notNull(),
  unitCost: numericMoney("unit_cost").notNull(),
  totalCost: numericMoney("total_cost").notNull(),
  previousQuantity: numericMoney("previous_quantity"),
  previousCost: numericMoney("previous_cost"),
  variance: numericMoney("variance"), // Farq
  variancePercent: numericMoney("variance_percent"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_material_inventory_valuations_warehouse_id").on(t.warehouseId),
  index("idx_material_inventory_valuations_material_id").on(t.materialId),
  index("idx_material_inventory_valuations_valuation_date").on(t.valuationDate),
  index("idx_material_inventory_valuations_created_at").on(t.createdAt),
]);


export const insertMaterialInventoryValuationSchema = createInsertSchema(materialInventoryValuations, {
  valuationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  valuationMethod: z.enum(["fifo", "lifo", "weighted_avg"]).default("weighted_avg"),
  quantity: z.number().nonnegative("Miqdor 0 dan kam bo'lmasligi kerak"),
  unitCost: z.number().nonnegative("Birlik narxi 0 dan kam bo'lmasligi kerak"),
  totalCost: z.number().nonnegative("Umumiy narx 0 dan kam bo'lmasligi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type MaterialInventoryValuation = typeof materialInventoryValuations.$inferSelect;

export type InsertMaterialInventoryValuation = z.infer<typeof insertMaterialInventoryValuationSchema>;


// AI Material Insights (AI material tahliллari)