/**
 * @module hr-safety
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";

export { shiftSwapRequests, insertShiftSwapRequestSchema, InsertShiftSwapRequest, ShiftSwapRequest } from "./shifts";


// ======== TZ_11 (11-01): Operator kunlik statistika jadvali ========
export { operatorDailyStats, insertOperatorDailyStatsSchema, InsertOperatorDailyStats, OperatorDailyStats } from "./kpi";

// ======== TZ_13 (13-01): RFID kirish/chiqish — attendance_records ========
export { attendanceRecords, insertAttendanceRecordSchema, InsertAttendanceRecord, AttendanceRecord } from "./attendance";

// ======== Employee 360° Assessments ========
export { employee360Assessments, insertEmployee360AssessmentSchema, InsertEmployee360Assessment, Employee360Assessment } from "./assessment";

// ======== Employee Career Profile ========
export const employeeCareerProfiles = pgTable("employee_career_profiles", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  nextRecommendedPosition: varchar("next_recommended_position", { length: 300 }),
  successionFor: varchar("succession_for", { length: 300 }),
  crossTrainingStatus: varchar("cross_training_status", { length: 20 }).default("not_started"),
  crossTrainingNotes: text("cross_training_notes"),
  careerPathDirection: varchar("career_path_direction", { length: 300 }),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("emp_career_cross_training_chk", sql`${t.crossTrainingStatus} IS NULL OR ${t.crossTrainingStatus} IN ('not_started','in_progress','completed')`),
]);

export const insertEmployeeCareerProfileSchema = createInsertSchema(employeeCareerProfiles).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type EmployeeCareerProfile = typeof employeeCareerProfiles.$inferSelect;
export type InsertEmployeeCareerProfile = z.infer<typeof insertEmployeeCareerProfileSchema>;

// ======== HR Capital Profile ========
export const hrCapitalProfiles = pgTable("hr_capital_profiles", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  visotskiyCategory: varchar("visotskiy_category", { length: 30 }), // Flagman, Performer, Troublemaker
  toolTestScore: varchar("tool_test_score", { length: 5 }), // A-J
  psychologicalProfile: varchar("psychological_profile", { length: 200 }),
  onboardingStatus: varchar("onboarding_status", { length: 20 }).default("not_started"),
  offboardingStatus: varchar("offboarding_status", { length: 200 }),
  recruitingChannel: varchar("recruiting_channel", { length: 200 }),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("hr_capital_visotskiy_chk", sql`${t.visotskiyCategory} IS NULL OR ${t.visotskiyCategory} IN ('Flagman','Performer','Troublemaker')`),
  check("hr_capital_onboarding_chk", sql`${t.onboardingStatus} IS NULL OR ${t.onboardingStatus} IN ('not_started','in_progress','completed')`),
]);

export const insertHrCapitalProfileSchema = createInsertSchema(hrCapitalProfiles).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type HrCapitalProfile = typeof hrCapitalProfiles.$inferSelect;
export type InsertHrCapitalProfile = z.infer<typeof insertHrCapitalProfileSchema>;

// ============= HEALTH & SAFETY =============
export { safetyIncidents, insertSafetyIncidentSchema, InsertSafetyIncident, SafetyIncident } from "./safety";
export { ppeCompliance, insertPpeComplianceSchema, InsertPpeCompliance, PpeCompliance } from "./safety";
export { safetyTrainings, insertSafetyTrainingSchema, InsertSafetyTraining, SafetyTraining } from "./safety";
export { hazardZones, insertHazardZoneSchema, InsertHazardZone, HazardZone } from "./safety";

// HR Conflict Reports (Muammo va nizolarni qaydlash)
export const hrConflictReports = pgTable("hr_conflict_reports", {
  id: varchar("id", { length: 64 }).primaryKey(),
  party1: text("party1").notNull(),
  party2: text("party2").notNull(),
  description: text("description").notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("low"), // low, medium, high
  status: varchar("status", { length: 30 }).notNull().default("open"), // open, investigating, resolved
  createdBy: integer("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("hr_conflict_severity_chk", sql`${t.severity} IN ('low','medium','high')`),
  check("hr_conflict_status_chk", sql`${t.status} IN ('open','investigating','resolved')`),
]);

export const insertHrConflictReportSchema = createInsertSchema(hrConflictReports).omit({ createdAt: true, updatedAt: true } as never);
export type HrConflictReport = typeof hrConflictReports.$inferSelect;
export type InsertHrConflictReport = z.infer<typeof insertHrConflictReportSchema>;

// Succession Plans (Kadrlar zaxirasi rejalari)
export { successionPlans, insertSuccessionPlanSchema, InsertSuccessionPlan, SuccessionPlan } from "./assessment";

export const notificationLogs = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id"),
  triggerName: varchar("trigger_name", { length: 100 }).notNull(),
  channel: varchar("channel", { length: 20 }).notNull().default("telegram"),
  recipientChatId: varchar("recipient_chat_id", { length: 100 }),
  message: text("message"),
  status: varchar("status", { length: 20 }).notNull().default("sent"),
  errorDetail: text("error_detail"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("notification_logs_channel_chk", sql`${t.channel} IN ('telegram','email','sms')`),
  check("notification_logs_status_chk", sql`${t.status} IN ('sent','failed','pending')`),
]);

export type NotificationLog = typeof notificationLogs.$inferSelect;
