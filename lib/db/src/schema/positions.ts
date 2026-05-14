/**
 * @module positions
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, varchar, integer, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { departments } from "./departments";

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  nameUz: varchar("name_uz", { length: 150 }).notNull(),
  nameRu: varchar("name_ru", { length: 150 }),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  level: integer("level").default(1),
  rbacTier: varchar("rbac_tier", { length: 20 }).notNull().default("standard"),
  isManagement: boolean("is_management").default(false).notNull(),
  minSalary: integer("min_salary"),
  maxSalary: integer("max_salary"),
  headcount: integer("headcount").default(1),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPositionSchema = createInsertSchema(positions).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;
