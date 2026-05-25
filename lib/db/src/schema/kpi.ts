/**
 * @module kpi
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, text, decimal, date, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const employeeDailyKpi = pgTable("employee_daily_kpi", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  kpiDate: date("kpi_date").notNull(),
  attendanceScore: decimal("attendance_score", { precision: 5, scale: 2 }),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  taskCompletionScore: decimal("task_completion_score", { precision: 5, scale: 2 }),
  lmsScore: decimal("lms_score", { precision: 5, scale: 2 }),
  safetyScore: decimal("safety_score", { precision: 5, scale: 2 }),
  teamworkScore: decimal("teamwork_score", { precision: 5, scale: 2 }),
  totalScore: decimal("total_score", { precision: 5, scale: 2 }),
  notes: text("notes"),
  calculatedBy: varchar("calculated_by", { length: 20 }).default("system"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  check("employee_daily_kpi_scores_chk", sql`(${table.totalScore} IS NULL OR (${table.totalScore} >= 0 AND ${table.totalScore} <= 100))`),
  uniqueIndex("uq_daily_kpi_emp_date").on(table.employeeId, table.kpiDate),
]);

export const performanceGoals = pgTable("performance_goals", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  goalTitle: varchar("goal_title", { length: 200 }).notNull(),
  goalDescription: text("goal_description"),
  goalType: varchar("goal_type", { length: 30 }),
  targetValue: decimal("target_value", { precision: 10, scale: 2 }),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 30 }),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  completedDate: date("completed_date"),
  progressPercent: integer("progress_percent").default(0),
  status: varchar("status", { length: 20 }).default("active"),
  assignedBy: integer("assigned_by"),
  reviewedBy: integer("reviewed_by"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("performance_goals_status_chk", sql`${t.status} IN ('active','completed','cancelled','on_hold')`),
  check("performance_goals_progress_chk", sql`${t.progressPercent} IS NULL OR (${t.progressPercent} >= 0 AND ${t.progressPercent} <= 100)`),
]);

export const employeeRatings = pgTable("employee_ratings", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  ratingPeriod: varchar("rating_period", { length: 20 }),
  ratingYear: integer("rating_year"),
  ratingMonth: integer("rating_month"),
  overallRating: decimal("overall_rating", { precision: 3, scale: 1 }),
  performanceRating: decimal("performance_rating", { precision: 3, scale: 1 }),
  behaviorRating: decimal("behavior_rating", { precision: 3, scale: 1 }),
  skillsRating: decimal("skills_rating", { precision: 3, scale: 1 }),
  managerComments: text("manager_comments"),
  ratedBy: integer("rated_by"),
  ratedAt: timestamp("rated_at"),
  status: varchar("status", { length: 20 }).default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("employee_ratings_status_chk", sql`${t.status} IN ('draft','submitted','approved','rejected')`),
  check("employee_ratings_overall_chk", sql`${t.overallRating} IS NULL OR (${t.overallRating} >= 0 AND ${t.overallRating} <= 5)`),
]);

export const employeeProductivity = pgTable("employee_productivity", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  productivityDate: date("productivity_date").notNull(),
  tasksAssigned: integer("tasks_assigned").default(0),
  tasksCompleted: integer("tasks_completed").default(0),
  qualityDefects: integer("quality_defects").default(0),
  outputUnits: decimal("output_units", { precision: 10, scale: 2 }),
  targetUnits: decimal("target_units", { precision: 10, scale: 2 }),
  efficiencyPercent: decimal("efficiency_percent", { precision: 5, scale: 2 }),
  workCenterId: integer("work_center_id"),
  shiftId: integer("shift_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_productivity_emp_date").on(table.employeeId, table.productivityDate),
]);

export const operatorDailyStats = pgTable("operator_daily_stats", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  statsDate: date("stats_date").notNull(),
  workCenterId: integer("work_center_id"),
  ordersProcessed: integer("orders_processed").default(0),
  itemsProduced: integer("items_produced").default(0),
  defectCount: integer("defect_count").default(0),
  downtimeMinutes: integer("downtime_minutes").default(0),
  setupTimeMinutes: integer("setup_time_minutes").default(0),
  machineEfficiency: decimal("machine_efficiency", { precision: 5, scale: 2 }),
  oeeScore: decimal("oee_score", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_operator_stats_emp_date").on(table.employeeId, table.statsDate),
]);

export const insertEmployeeDailyKpiSchema = createInsertSchema(employeeDailyKpi).omit({ id: true, createdAt: true } as never);
export type InsertEmployeeDailyKpi = z.infer<typeof insertEmployeeDailyKpiSchema>;
export type EmployeeDailyKpi = typeof employeeDailyKpi.$inferSelect;

export const insertPerformanceGoalSchema = createInsertSchema(performanceGoals).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertPerformanceGoal = z.infer<typeof insertPerformanceGoalSchema>;
export type PerformanceGoal = typeof performanceGoals.$inferSelect;

export const insertEmployeeRatingSchema = createInsertSchema(employeeRatings).omit({ id: true, createdAt: true } as never);
export type InsertEmployeeRating = z.infer<typeof insertEmployeeRatingSchema>;
export type EmployeeRating = typeof employeeRatings.$inferSelect;

export const insertEmployeeProductivitySchema = createInsertSchema(employeeProductivity).omit({ id: true, createdAt: true } as never);
export type InsertEmployeeProductivity = z.infer<typeof insertEmployeeProductivitySchema>;
export type EmployeeProductivity = typeof employeeProductivity.$inferSelect;

export const insertOperatorDailyStatsSchema = createInsertSchema(operatorDailyStats).omit({ id: true, createdAt: true } as never);
export type InsertOperatorDailyStats = z.infer<typeof insertOperatorDailyStatsSchema>;
export type OperatorDailyStats = typeof operatorDailyStats.$inferSelect;
