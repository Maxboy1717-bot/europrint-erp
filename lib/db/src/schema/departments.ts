/**
 * @module departments
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, varchar, integer, boolean, timestamp, text, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  // Multi-tenancy column. DEFAULT 1 is intentional — every row backfilled to
  // tenant 1 on migration; future writers MUST set this from TenantContext.
  tenantId: integer("tenant_id").notNull().default(1),
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
  // Convergence additions (live-DB superset)
  name: varchar("name", { length: 150 }),
  nameEn: varchar("name_en", { length: 150 }),
  organizationNumber: varchar("organization_number", { length: 50 }),
  descriptionRu: text("description_ru"),
  vep: text("vep"),
  vepRu: text("vep_ru"),
  statisticsType: varchar("statistics_type", { length: 50 }),
  departmentCode: varchar("department_code", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 30 }),
  headId: integer("head_id"),
}, (t) => [
  index("idx_departments_parent_id").on(t.parentId),
  index("idx_departments_is_active").on(t.isActive),
  index("idx_departments_tenant_id").on(t.tenantId),
]);

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;
