/**
 * @module core-rules
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "../numeric-money";
import { serial, pgTable, text, varchar, integer, boolean, timestamp, jsonb, type AnyPgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-users";

export const unitOfMeasures = pgTable("unit_of_measures", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  category: varchar("category", { length: 30 }).notNull(),
  baseUnitId: varchar("base_unit_id").references((): AnyPgColumn => unitOfMeasures.id, { onDelete: "set null" }),
  conversionFactor: numericMoney("conversion_factor").default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type UnitOfMeasure = typeof unitOfMeasures.$inferSelect;

export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: varchar("alert_type", { length: 30 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  message: text("message").notNull(),
  messageRu: text("message_ru"),
  sourceType: varchar("source_type", { length: 50 }),
  sourceId: varchar("source_id"),
  relatedTable: varchar("related_table", { length: 100 }),
  relatedRecordId: varchar("related_record_id"),
  actionRequired: boolean("action_required").notNull().default(false),
  actionUrl: text("action_url"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  readBy: varchar("read_by").references(() => users.id, { onDelete: "set null" }),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolutionNotes: text("resolution_notes"),
  notifiedUsers: jsonb("notified_users"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SystemAlert = typeof systemAlerts.$inferSelect;

export const insertUnitOfMeasureSchema = createInsertSchema(unitOfMeasures).omit({ id: true, createdAt: true } as never);
export type InsertUnitOfMeasure = z.infer<typeof insertUnitOfMeasureSchema>;

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({ id: true, createdAt: true } as never);
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
