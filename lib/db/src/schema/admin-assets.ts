/**
 * @module admin-assets
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { sql } from "drizzle-orm";
import {
  pgTable, uuid, text, boolean, integer, timestamp, index, check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const assetItems = pgTable("asset_items", {
  id:            uuid("id").primaryKey().defaultRandom(),
  name:          text("name").notNull(),
  assetCode:     text("asset_code"),
  category:      text("category").notNull().default("equipment"),
  status:        text("status").notNull().default("active"),
  purchaseDate:  timestamp("purchase_date", { withTimezone: true }),
  purchaseValue: text("purchase_value"),
  currentValue:  text("current_value"),
  location:      text("location"),
  assignedTo:    text("assigned_to"),
  departmentId:  integer("department_id"),
  serialNumber:  text("serial_number"),
  notes:         text("notes"),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  // ─── live-DB superset columns (ADD-ONLY) ───
  nameRu:                  text("name_ru"),
  purchasePrice:           text("purchase_price"),
  depreciationMethod:      text("depreciation_method"),
  usefulLife:              integer("useful_life"),
  salvageValue:            text("salvage_value"),
  accumulatedDepreciation: text("accumulated_depreciation"),
  condition:               text("condition"),
  lastInventoryDate:       timestamp("last_inventory_date", { withTimezone: true }),
}, (t) => [
  check("asset_items_status_chk", sql`${t.status} IN ('active','inactive','maintenance','disposed')`),
  check("asset_items_category_chk", sql`${t.category} IN ('equipment','vehicle','it','furniture','building','other')`),
  index("asset_items_status_idx").on(t.status),
  index("asset_items_category_idx").on(t.category),
]);

export const insertAssetItemSchema = createInsertSchema(assetItems, {
  status: z.enum(["active", "inactive", "maintenance", "disposed"]).default("active"),
  category: z.enum(["equipment", "vehicle", "it", "furniture", "building", "other"]).default("equipment"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type AssetItem = typeof assetItems.$inferSelect;
export type InsertAssetItem = z.infer<typeof insertAssetItemSchema>;


export const assetMaintenance = pgTable("asset_maintenance", {
  id:              uuid("id").primaryKey().defaultRandom(),
  assetId:         uuid("asset_id").notNull(),
  maintenanceType: text("maintenance_type").notNull().default("routine"),
  scheduledAt:     timestamp("scheduled_at", { withTimezone: true }),
  completedAt:     timestamp("completed_at", { withTimezone: true }),
  cost:            text("cost"),
  notes:           text("notes"),
  status:          text("status").notNull().default("scheduled"),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  check("asset_maint_status_chk", sql`${t.status} IN ('scheduled','in_progress','completed','cancelled')`),
  check("asset_maint_type_chk", sql`${t.maintenanceType} IN ('routine','emergency','preventive','corrective')`),
]);

export const insertAssetMaintenanceSchema = createInsertSchema(assetMaintenance, {
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  maintenanceType: z.enum(["routine", "emergency", "preventive", "corrective"]).default("routine"),
}).omit({ id: true, createdAt: true } as never);

export type AssetMaintenance = typeof assetMaintenance.$inferSelect;
export type InsertAssetMaintenance = z.infer<typeof insertAssetMaintenanceSchema>;


export const assetDisposals = pgTable("asset_disposals", {
  id:           uuid("id").primaryKey().defaultRandom(),
  assetId:      uuid("asset_id").notNull(),
  disposalType: text("disposal_type").notNull().default("retired"),
  disposalDate: timestamp("disposal_date", { withTimezone: true }),
  saleValue:    text("sale_value"),
  reason:       text("reason"),
  approvedBy:   text("approved_by"),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  // ─── live-DB superset columns (ADD-ONLY) ───
  disposalMethod:      text("disposal_method"),
  disposalValue:       text("disposal_value"),
  bookValueAtDisposal: text("book_value_at_disposal"),
  gainLoss:            text("gain_loss"),
  notes:               text("notes"),
}, (t) => [
  check("asset_disposals_type_chk", sql`${t.disposalType} IN ('retired','sold','donated','scrapped','transferred')`),
]);

export const insertAssetDisposalSchema = createInsertSchema(assetDisposals, {
  disposalType: z.enum(["retired", "sold", "donated", "scrapped", "transferred"]).default("retired"),
}).omit({ id: true, createdAt: true } as never);

export type AssetDisposal = typeof assetDisposals.$inferSelect;
export type InsertAssetDisposal = z.infer<typeof insertAssetDisposalSchema>;


export const assetTransfers = pgTable("asset_transfers", {
  id:           uuid("id").primaryKey().defaultRandom(),
  assetId:      uuid("asset_id").notNull(),
  fromDeptId:   integer("from_dept_id"),
  toDeptId:     integer("to_dept_id"),
  transferDate: timestamp("transfer_date", { withTimezone: true }),
  reason:       text("reason"),
  approvedBy:   text("approved_by"),
  createdAt:    timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  // ─── live-DB superset columns (ADD-ONLY) ───
  fromDepartmentId: integer("from_department_id"),
  toDepartmentId:   integer("to_department_id"),
  fromLocation:     text("from_location"),
  toLocation:       text("to_location"),
  transferredBy:    text("transferred_by"),
  receivedBy:       text("received_by"),
  status:           text("status"),
  notes:            text("notes"),
});

export const insertAssetTransferSchema = createInsertSchema(assetTransfers).omit({ id: true, createdAt: true } as never);

export type AssetTransfer = typeof assetTransfers.$inferSelect;
export type InsertAssetTransfer = z.infer<typeof insertAssetTransferSchema>;
