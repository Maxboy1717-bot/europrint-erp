/**
 * @module master-config
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, varchar, integer, boolean, timestamp, text, decimal, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  nameUz: varchar("name_uz", { length: 100 }).notNull(),
  nameRu: varchar("name_ru", { length: 100 }),
  maxDaysPerYear: integer("max_days_per_year"),
  isPaid: boolean("is_paid").default(true).notNull(),
  requiresMedicalCert: boolean("requires_medical_cert").default(false).notNull(),
  requiresDirectorApproval: boolean("requires_director_approval").default(false).notNull(),
  minDaysBeforeRequest: integer("min_days_before_request").default(5),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("leave_types_max_days_chk", sql`${t.maxDaysPerYear} IS NULL OR ${t.maxDaysPerYear} >= 0`),
  check("leave_types_min_days_chk", sql`${t.minDaysBeforeRequest} IS NULL OR ${t.minDaysBeforeRequest} >= 0`),
]);

export const shiftTypes = pgTable("shift_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  nameUz: varchar("name_uz", { length: 100 }).notNull(),
  nameRu: varchar("name_ru", { length: 100 }),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  durationHours: decimal("duration_hours", { precision: 4, scale: 1 }).notNull(),
  isOvernight: boolean("is_overnight").default(false).notNull(),
  overtimeMultiplier: decimal("overtime_multiplier", { precision: 3, scale: 1 }).default("1.5"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skillCategories = pgTable("skill_categories", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  nameUz: varchar("name_uz", { length: 100 }).notNull(),
  nameRu: varchar("name_ru", { length: 100 }),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const abcThresholds = pgTable("abc_thresholds", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 1 }).notNull().unique(),
  minScore: decimal("min_score", { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal("max_score", { precision: 5, scale: 2 }).notNull(),
  bonusPercentage: decimal("bonus_percentage", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  attendanceWeight: decimal("attendance_weight", { precision: 5, scale: 2 }).default("0.40"),
  qualityWeight: decimal("quality_weight", { precision: 5, scale: 2 }).default("0.25"),
  taskWeight: decimal("task_weight", { precision: 5, scale: 2 }).default("0.20"),
  lmsWeight: decimal("lms_weight", { precision: 5, scale: 2 }).default("0.15"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("abc_thresholds_category_chk", sql`${t.category} IN ('A','B','C','D')`),
  check("abc_thresholds_score_range_chk", sql`${t.minScore} <= ${t.maxScore}`),
]);

export const insertLeaveTypeSchema = createInsertSchema(leaveTypes).omit({ id: true, createdAt: true } as never);
export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;
export type LeaveType = typeof leaveTypes.$inferSelect;

export const insertShiftTypeSchema = createInsertSchema(shiftTypes).omit({ id: true, createdAt: true } as never);
export type InsertShiftType = z.infer<typeof insertShiftTypeSchema>;
export type ShiftType = typeof shiftTypes.$inferSelect;

export const insertSkillCategorySchema = createInsertSchema(skillCategories).omit({ id: true, createdAt: true } as never);
export type InsertSkillCategory = z.infer<typeof insertSkillCategorySchema>;
export type SkillCategory = typeof skillCategories.$inferSelect;

export const insertAbcThresholdSchema = createInsertSchema(abcThresholds).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertAbcThreshold = z.infer<typeof insertAbcThresholdSchema>;
export type AbcThreshold = typeof abcThresholds.$inferSelect;


