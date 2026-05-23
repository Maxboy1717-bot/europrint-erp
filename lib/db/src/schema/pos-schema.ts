/**
 * @module pos-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import {
  serial, pgTable, text, varchar, integer, boolean,
  timestamp, jsonb, unique, check, index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { warehouses } from "./wms-schema";
import { posMovementLines as posMovementLinesV2 } from "./pos-schema-v2";

// ─── §38 POS MODULE — 9 jadval ───────────────────────────────────────────────

/**
 * 1. pos_movement_types — Harakatlar turlari (kirish, chiqish, ko'chirish, inventarizatsiya)
 */
export const posMovementTypes = pgTable("pos_movement_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  direction: varchar("direction", { length: 10 }).notNull().default("in"), // in | out | transfer | adjustment
  requiresDocument: boolean("requires_document").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("pos_movement_types_dir_chk", sql`${t.direction} IN ('in','out','transfer','adjustment')`),
]);

export const insertPosMovementTypeSchema = createInsertSchema(posMovementTypes, {
  code: z.string().min(1),
  name: z.string().min(1),
  direction: z.enum(["in", "out", "transfer", "adjustment"]),
});

/**
 * 2. pos_warehouse_access — Foydalanuvchi omborlarga kirish huquqi
 */
export const posWarehouseAccess = pgTable("pos_warehouse_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  warehouseId: varchar("warehouse_id", { length: 50 }).notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  canRead: boolean("can_read").notNull().default(true),
  canWrite: boolean("can_write").notNull().default(false),
  canApprove: boolean("can_approve").notNull().default(false),
  grantedBy: integer("granted_by").references(() => users.id, { onDelete: "set null" }),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (t) => ({
  uniq: unique().on(t.userId, t.warehouseId),
}));

export const insertPosWarehouseAccessSchema = createInsertSchema(posWarehouseAccess);

/**
 * 3. role_movement_permissions — Rol → harakatlar turi ruxsati
 */
export const roleMovementPermissions = pgTable("role_movement_permissions", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 50 }).notNull(),
  movementTypeId: integer("movement_type_id").notNull().references(() => posMovementTypes.id, { onDelete: "cascade" }),
  canCreate: boolean("can_create").notNull().default(false),
  canApprove: boolean("can_approve").notNull().default(false),
  canCancel: boolean("can_cancel").notNull().default(false),
  maxAmount: numericMoney("max_amount"), // Maksimal summa chegarasi
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  uniq: unique().on(t.role, t.movementTypeId),
}));

export const insertRoleMovementPermissionSchema = createInsertSchema(roleMovementPermissions);

/**
 * 4. pos_telegram_routes — Telegram bot marshrutlari (bildirishnomalar uchun)
 */
export const posTelegramRoutes = pgTable("pos_telegram_routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  chatId: varchar("chat_id", { length: 100 }).notNull(),
  movementTypeId: integer("movement_type_id").references(() => posMovementTypes.id, { onDelete: "set null" }),
  warehouseId: varchar("warehouse_id", { length: 50 }).references(() => warehouses.id, { onDelete: "set null" }),
  events: jsonb("events").notNull().default(sql`'[]'::jsonb`), // ['created', 'approved', 'cancelled']
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPosTelegramRouteSchema = createInsertSchema(posTelegramRoutes, {
  chatId: z.string().min(1),
  name: z.string().min(1),
});

/**
 * 5. inventory_passports — Mahsulot pasporti (QR/barcode bilan)
 */
export const inventoryPassports = pgTable("inventory_passports", {
  id: serial("id").primaryKey(),
  passportNumber: varchar("passport_number", { length: 100 }).notNull().unique(),
  productId: varchar("product_id", { length: 50 }).notNull(),
  productName: text("product_name").notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default("dona"),
  warehouseId: varchar("warehouse_id", { length: 50 }).references(() => warehouses.id, { onDelete: "set null" }),
  batchNumber: varchar("batch_number", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  manufacturedAt: timestamp("manufactured_at"),
  expiresAt: timestamp("expires_at"),
  specifications: jsonb("specifications").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInventoryPassportSchema = createInsertSchema(inventoryPassports, {
  passportNumber: z.string().min(1),
  productName: z.string().min(1),
});

/**
 * 6. inventory_barcode_assignments — Barkod → mahsulot pasporti bog'lanishi
 */
export const inventoryBarcodeAssignments = pgTable("inventory_barcode_assignments", {
  id: serial("id").primaryKey(),
  barcode: varchar("barcode", { length: 200 }).notNull().unique(),
  barcodeType: varchar("barcode_type", { length: 20 }).notNull().default("qr"), // qr | ean13 | code128 | datamatrix
  passportId: integer("passport_id").notNull().references(() => inventoryPassports.id, { onDelete: "cascade" }),
  quantity: numericMoney("quantity").notNull().default(sql`'1'`),
  isPrimary: boolean("is_primary").notNull().default(false),
  printedAt: timestamp("printed_at"),
  printedBy: integer("printed_by").references(() => users.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("inventory_barcode_type_chk", sql`${t.barcodeType} IN ('qr','ean13','code128','datamatrix')`),
]);

export const insertInventoryBarcodeAssignmentSchema = createInsertSchema(inventoryBarcodeAssignments, {
  barcode: z.string().min(1),
  barcodeType: z.enum(["qr", "ean13", "code128", "datamatrix"]),
});

// pos_movements and pos_movement_lines are canonical in pos-schema-v2.ts (richer schema)
// Re-exported here for backwards compatibility
export { posMovements, posMovementLines, insertPosMovementSchema } from "./pos-schema-v2";
// insertPosMovementLineSchema not in v2 — derived locally (import is at top of file)
export const insertPosMovementLineSchema = createInsertSchema(posMovementLinesV2, {
  quantity: z.string().min(1),
});

/**
 * 9. pos_pdf_templates — PDF hujjat shablonlari (harakatlar uchun)
 */
export const posPdfTemplates = pgTable("pos_pdf_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  movementTypeId: integer("movement_type_id").references(() => posMovementTypes.id, { onDelete: "set null" }),
  templateContent: text("template_content").notNull(), // Handlebars/HTML shablon
  paperSize: varchar("paper_size", { length: 10 }).notNull().default("A4"),
  orientation: varchar("orientation", { length: 10 }).notNull().default("portrait"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPosPdfTemplateSchema = createInsertSchema(posPdfTemplates, {
  name: z.string().min(1),
  code: z.string().min(1),
  templateContent: z.string().min(1),
  orientation: z.enum(["portrait", "landscape"]),
  paperSize: z.enum(["A4", "A5", "Letter"]),
});
