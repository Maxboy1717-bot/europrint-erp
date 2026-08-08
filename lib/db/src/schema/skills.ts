/**
 * @module skills
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, text, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

// Audit 2026-08-08 (docs/audit/HR-MODUL-PRODUCTION-TAYYORLIK-2026-08-08.md): jonli jadval
// bu deklaratsiyadan ANCHA kengroq (skill_category/current_level/status/self_score/
// manager_score/final_score/... — boshqa, kattaroq "baholash" feature qoldig'i) va HECH
// QANDAY CHECK constraint yo'q (level/score chegaralari faqat shu faylda, DB'da emas).
// `skillCategory` shu yerga qo'shildi — `skill_category` NOT NULL, DEFAULT yo'q, uni
// yubormasdan INSERT doim xato berardi (hr-compat-a.repository.ts createEmployeeSkill).
export const employeeSkills = pgTable("employee_skills", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  skillCategoryId: integer("skill_category_id"),
  skillCategory: varchar("skill_category", { length: 50 }),
  skillName: varchar("skill_name", { length: 100 }).notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 20 }),
  proficiencyScore: decimal("proficiency_score", { precision: 3, scale: 1 }),
  certifiedDate: date("certified_date"),
  expiryDate: date("expiry_date"),
  verifiedBy: integer("verified_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const skillRequirements = pgTable("skill_requirements", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id"),
  skillCategoryId: integer("skill_category_id"),
  skillName: varchar("skill_name", { length: 100 }).notNull(),
  requiredLevel: varchar("required_level", { length: 20 }),
  isMandatory: integer("is_mandatory").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmployeeSkillSchema = createInsertSchema(employeeSkills).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertEmployeeSkill = z.infer<typeof insertEmployeeSkillSchema>;
export type EmployeeSkill = typeof employeeSkills.$inferSelect;

export const insertSkillRequirementSchema = createInsertSchema(skillRequirements).omit({ id: true, createdAt: true } as never);
export type InsertSkillRequirement = z.infer<typeof insertSkillRequirementSchema>;
export type SkillRequirement = typeof skillRequirements.$inferSelect;
