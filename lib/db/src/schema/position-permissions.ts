import { pgTable, serial, integer, varchar, boolean, timestamp, date, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { positions } from "./positions";

export const positionPermissions = pgTable("position_permissions", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").references(() => positions.id).notNull(),
  moduleCode: varchar("module_code", { length: 50 }).notNull(),
  accessLevel: varchar("access_level", { length: 20 }).notNull(),
  extraActions: jsonb("extra_actions"),
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_pos_perm_position_module").on(table.positionId, table.moduleCode),
]);

export const positionFeatureFlags = pgTable("position_feature_flags", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").references(() => positions.id).notNull(),
  featureKey: varchar("feature_key", { length: 100 }).notNull(),
  isAllowed: boolean("is_allowed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_pos_ff_position_feature").on(table.positionId, table.featureKey),
]);

export const insertPositionPermissionSchema = createInsertSchema(positionPermissions).omit({ id: true, createdAt: true } as never);
export type InsertPositionPermission = z.infer<typeof insertPositionPermissionSchema>;
export type PositionPermission = typeof positionPermissions.$inferSelect;

export const insertPositionFeatureFlagSchema = createInsertSchema(positionFeatureFlags).omit({ id: true, createdAt: true } as never);
export type InsertPositionFeatureFlag = z.infer<typeof insertPositionFeatureFlagSchema>;
export type PositionFeatureFlag = typeof positionFeatureFlags.$inferSelect;
