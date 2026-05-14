/**
 * @module departments
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, varchar, integer, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  nameUz: varchar("name_uz", { length: 150 }).notNull(),
  nameRu: varchar("name_ru", { length: 150 }),
  parentId: integer("parent_id").references((): any => departments.id, { onDelete: "set null" }),
  managerId: integer("manager_id"),
  vysotskiyFunction: varchar("vysotskiy_function", { length: 50 }),
  level: integer("level").default(1),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;
