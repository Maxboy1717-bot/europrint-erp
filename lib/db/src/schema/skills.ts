/**
 * @module skills
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, text, decimal, date, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const employeeSkills = pgTable("employee_skills", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  skillCategoryId: integer("skill_category_id"),
  skillName: varchar("skill_name", { length: 100 }).notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 20 }),
  proficiencyScore: decimal("proficiency_score", { precision: 3, scale: 1 }),
  certifiedDate: date("certified_date"),
  expiryDate: date("expiry_date"),
  verifiedBy: integer("verified_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("employee_skills_level_chk", sql`${t.proficiencyLevel} IS NULL OR ${t.proficiencyLevel} IN ('beginner','intermediate','advanced','expert')`),
  check("employee_skills_score_chk", sql`${t.proficiencyScore} IS NULL OR (${t.proficiencyScore} >= 0 AND ${t.proficiencyScore} <= 10)`),
]);

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
