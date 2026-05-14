/**
 * @module ideal-rasm-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, varchar, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const idealRasmTargets = pgTable("ideal_rasm_targets", {
  id: serial("id").primaryKey(),
  targetName: varchar("target_name", { length: 100 }).notNull(),
  targetKey: varchar("target_key", { length: 50 }).notNull().unique(),
  targetValue: numeric("target_value", { precision: 20, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 30 }).notNull(),
  horizonYears: integer("horizon_years").notNull().default(3),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIdealRasmTargetSchema = createInsertSchema(idealRasmTargets);

export type IdealRasmTarget = typeof idealRasmTargets.$inferSelect;
export type InsertIdealRasmTarget = typeof idealRasmTargets.$inferInsert;
