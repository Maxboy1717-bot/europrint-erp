/**
 * @module positions
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, varchar, integer, boolean, timestamp, text, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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
  // Convergence additions (live-DB superset)
  name: varchar("name", { length: 150 }),
  nameEn: varchar("name_en", { length: 150 }),
  officialTitle: varchar("official_title", { length: 200 }),
  ckp: text("ckp"),
  organizationNumber: varchar("organization_number", { length: 50 }),
  aiExamEnabled: boolean("ai_exam_enabled"),
  descriptionRu: text("description_ru"),
  vep: text("vep"),
  vepRu: text("vep_ru"),
  statisticsType: varchar("statistics_type", { length: 50 }),
  managerId: integer("manager_id"),
  title: varchar("title", { length: 200 }),
}, (t) => [
  index("idx_positions_department_id").on(t.departmentId),
  index("idx_positions_is_active").on(t.isActive),
  check("positions_rbac_tier_chk", sql`${t.rbacTier} IN ('owner','c-level','director','manager','supervisor','specialist','operator','standard')`),
]);

export const insertPositionSchema = createInsertSchema(positions).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;
