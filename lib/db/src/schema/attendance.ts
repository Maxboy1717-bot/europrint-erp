/**
 * @module attendance
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, date, uniqueIndex, jsonb, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  // Multi-tenancy (Phase 2 / Task 2.1). See employees.ts for rationale.
  tenantId: integer("tenant_id").notNull().default(1),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  attendanceDate: date("attendance_date").notNull(),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  status: varchar("status", { length: 20 }).default("present"),
  lateMinutes: integer("late_minutes").default(0),
  earlyLeaveMinutes: integer("early_leave_minutes").default(0),
  overtimeMinutes: integer("overtime_minutes").default(0),
  source: varchar("source", { length: 50 }),
  verifiedBy: integer("verified_by"),
  verificationTimestamp: timestamp("verification_timestamp"),
  notes: text("notes"),
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Convergence additions (live-DB superset)
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  userId: integer("user_id"),
  date: date("date"),
  isEarlyLeave: boolean("is_early_leave"),
  minutesLate: integer("minutes_late"),
  minutesEarly: integer("minutes_early"),
  hoursWorked: decimal("hours_worked", { precision: 6, scale: 2 }),
}, (table) => [
  check("attendance_status_chk", sql`${table.status} IN ('present','absent','late','half_day','on_leave','sick_leave','business_trip','remote','holiday')`),
  check("attendance_late_minutes_chk", sql`${table.lateMinutes} >= 0`),
  check("attendance_early_leave_chk", sql`${table.earlyLeaveMinutes} >= 0`),
  check("attendance_overtime_chk", sql`${table.overtimeMinutes} >= 0`),
  uniqueIndex("uq_attendance_emp_date").on(table.employeeId, table.attendanceDate),
  index("idx_attendance_employee_id").on(table.employeeId),
  index("idx_attendance_attendance_date").on(table.attendanceDate),
  index("idx_attendance_status").on(table.status),
]);

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  eventType: varchar("event_type", { length: 10 }).notNull(),
  eventTime: timestamp("event_time").notNull(),
  source: varchar("source", { length: 50 }),
  faceConfidence: decimal("face_confidence", { precision: 5, scale: 3 }),
  locationId: integer("location_id"),
  deviceId: varchar("device_id", { length: 50 }),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  check("attendance_records_event_type_chk", sql`${table.eventType} IN ('in','out')`),
  index("idx_attendance_records_employee_id").on(table.employeeId),
  index("idx_attendance_records_event_time").on(table.eventTime),
  index("idx_attendance_records_event_type").on(table.eventType),
]);

export const dailyAttendanceSummary = pgTable("daily_attendance_summary", {
  id: serial("id").primaryKey(),
  attendanceDate: date("attendance_date").notNull(),
  totalEmployees: integer("total_employees"),
  presentCount: integer("present_count"),
  absentCount: integer("absent_count"),
  lateCount: integer("late_count"),
  onLeaveCount: integer("on_leave_count"),
  sickLeaveCount: integer("sick_leave_count"),
  businessTripCount: integer("business_trip_count"),
  departmentId: integer("department_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_daily_summary_date_dept").on(table.attendanceDate, table.departmentId),
]);

export const abcAnalysis = pgTable("abc_analysis", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  analysisPeriodStart: date("analysis_period_start").notNull(),
  analysisPeriodEnd: date("analysis_period_end").notNull(),
  attendanceScore: decimal("attendance_score", { precision: 5, scale: 2 }),
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  taskCompletionScore: decimal("task_completion_score", { precision: 5, scale: 2 }),
  lmsTrainingScore: decimal("lms_training_score", { precision: 5, scale: 2 }),
  safetyComplianceScore: decimal("safety_compliance_score", { precision: 5, scale: 2 }),
  teamworkCollaborationScore: decimal("teamwork_collaboration_score", { precision: 5, scale: 2 }),
  totalScore: decimal("total_score", { precision: 5, scale: 2 }),
  category: varchar("category", { length: 1 }),
  previousCategory: varchar("previous_category", { length: 1 }),
  categoryChange: varchar("category_change", { length: 20 }),
  bonusPercentage: decimal("bonus_percentage", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  check("abc_analysis_category_chk", sql`${table.category} IS NULL OR ${table.category} IN ('A','B','C')`),
  uniqueIndex("uq_abc_emp_period").on(table.employeeId, table.analysisPeriodStart),
]);


export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({ id: true, createdAt: true } as never);
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

export const insertDailyAttendanceSummarySchema = createInsertSchema(dailyAttendanceSummary).omit({ id: true, createdAt: true } as never);
export type InsertDailyAttendanceSummary = z.infer<typeof insertDailyAttendanceSummarySchema>;
export type DailyAttendanceSummary = typeof dailyAttendanceSummary.$inferSelect;

export const insertAbcAnalysisSchema = createInsertSchema(abcAnalysis).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertAbcAnalysis = z.infer<typeof insertAbcAnalysisSchema>;
export type AbcAnalysis = typeof abcAnalysis.$inferSelect;

