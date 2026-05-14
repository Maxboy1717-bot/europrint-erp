/**
 * @module weekly-plans-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, text, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const weeklyPlans = pgTable("weekly_plans", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  weekStart: varchar("week_start", { length: 10 }).notNull(),
  gsdTarget: text("gsd_target").notNull(),
  top5Tasks: jsonb("top5_tasks").notNull().default([]),
  successFactors: text("success_factors"),
  resourcesNeeded: text("resources_needed"),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWeeklyPlanSchema = createInsertSchema(weeklyPlans);

export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type InsertWeeklyPlan = typeof weeklyPlans.$inferInsert;
