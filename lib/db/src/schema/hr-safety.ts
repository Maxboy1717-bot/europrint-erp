/**
 * @module hr-safety
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, uuid, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Admin, Position, admins, departments, positions, users } from "./core-schema";
import { cameraZones, cameras } from "./iot-schema";
import { Mentor, courses, progress, skills } from "./lms-schema";
import { workCenters } from "./pp-schema";
import { candidates, vacancies } from "./hr-recruitment";

export const shiftSwapRequests = pgTable("shift_swap_requests", {
  id: serial("id").primaryKey(),
  requestedBy: varchar("requested_by").references(() => users.id, { onDelete: "restrict" }).notNull(),
  swapWith: varchar("swap_with").references(() => users.id, { onDelete: 'set null' }),
  originalShiftDate: varchar("original_shift_date", { length: 20 }).notNull(),
  originalShiftType: varchar("original_shift_type", { length: 30 }).notNull(),
  requestedShiftDate: varchar("requested_shift_date", { length: 20 }),
  requestedShiftType: varchar("requested_shift_type", { length: 30 }),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("shift_swap_requests_status_chk", sql`${t.status} IN ('pending','approved','rejected','cancelled')`),
]);


export const insertShiftSwapRequestSchema = createInsertSchema(shiftSwapRequests, {
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).default("pending"),
}).omit({ id: true, createdAt: true } as never);

export type ShiftSwapRequest = typeof shiftSwapRequests.$inferSelect;

export type InsertShiftSwapRequest = z.infer<typeof insertShiftSwapRequestSchema>;


// ======== TZ_11 (11-01): Operator kunlik statistika jadvali ========
export const operatorDailyStats = pgTable("operator_daily_stats", {
  id: serial("id").primaryKey(),
  operatorId: varchar("operator_id").references(() => users.id, { onDelete: 'set null' }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  machineTaskId: varchar("machine_task_id", { length: 100 }),
  papkaOrderId: varchar("papka_order_id", { length: 100 }),
  equipmentId: varchar("equipment_id", { length: 100 }),
  plannedQty: integer("planned_qty").default(0),
  actualQty: integer("actual_qty").default(0),
  defectQty: integer("defect_qty").default(0),
  productionTimeMin: integer("production_time_min").default(0), // daqiqa
  efficiencyPercent: numericMoney("efficiency_percent").default(0), // actual/planned %
  overtimeMin: integer("overtime_min").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOperatorDailyStatSchema = createInsertSchema(operatorDailyStats).omit({ id: true, createdAt: true } as never);
export type OperatorDailyStat = typeof operatorDailyStats.$inferSelect;
export type InsertOperatorDailyStat = z.infer<typeof insertOperatorDailyStatSchema>;

// ======== TZ_13 (13-01): RFID kirish/chiqish — attendance_records ========
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  rfidCard: varchar("rfid_card", { length: 100 }),
  eventType: varchar("event_type", { length: 10 }).notNull(), // "entry" | "exit"
  deviceId: varchar("device_id", { length: 100 }),
  location: varchar("location", { length: 200 }),
  eventAt: timestamp("event_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("attendance_records_event_type_chk", sql`${t.eventType} IN ('entry','exit')`),
]);

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({ id: true, createdAt: true } as never);
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;

// ======== Employee 360° Assessments ========
export const employee360Assessments = pgTable("employee_360_assessments", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reviewerType: varchar("reviewer_type", { length: 30 }).notNull(), // manager, peer, subordinate, service_chain, self
  reviewerName: varchar("reviewer_name", { length: 200 }),
  score: integer("score").notNull(), // 1-5
  comment: text("comment"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("emp_360_reviewer_type_chk", sql`${t.reviewerType} IN ('manager','peer','subordinate','service_chain','self')`),
  check("emp_360_score_chk", sql`${t.score} >= 1 AND ${t.score} <= 5`),
]);

export const insertEmployee360AssessmentSchema = createInsertSchema(employee360Assessments).omit({ id: true, createdAt: true } as never);
export type Employee360Assessment = typeof employee360Assessments.$inferSelect;
export type InsertEmployee360Assessment = z.infer<typeof insertEmployee360AssessmentSchema>;

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

export const safetyIncidents = pgTable("safety_incidents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  incidentType: varchar("incident_type", { length: 50 }).notNull().default("near_miss"), // injury, near_miss, violation
  severity: varchar("severity", { length: 20 }).notNull().default("minor"), // minor, major, critical
  status: varchar("status", { length: 20 }).notNull().default("open"), // open, investigating, closed
  incidentDate: varchar("incident_date", { length: 10 }).notNull(), // YYYY-MM-DD
  location: varchar("location", { length: 255 }),
  description: text("description").notNull(),
  rootCause: text("root_cause"),
  correctiveAction: text("corrective_action"),
  reportedBy: varchar("reported_by").references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("safety_incidents_type_chk", sql`${t.incidentType} IN ('injury','near_miss','violation')`),
  check("safety_incidents_severity_chk", sql`${t.severity} IN ('minor','major','critical')`),
  check("safety_incidents_status_chk", sql`${t.status} IN ('open','investigating','closed')`),
]);

export const ppeCompliance = pgTable("ppe_compliance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  ppeType: varchar("ppe_type", { length: 50 }).notNull(), // helmet, goggles, gloves, vest, boots, mask
  status: varchar("status", { length: 20 }).notNull().default("compliant"), // compliant, non_compliant, expired
  issuedDate: varchar("issued_date", { length: 10 }), // YYYY-MM-DD
  expiryDate: varchar("expiry_date", { length: 10 }), // YYYY-MM-DD
  notes: text("notes"),
  checkedBy: varchar("checked_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("ppe_compliance_status_chk", sql`${t.status} IN ('compliant','non_compliant','expired')`),
]);

export const safetyTrainings = pgTable("safety_trainings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  trainingName: varchar("training_name", { length: 255 }).notNull(),
  trainingType: varchar("training_type", { length: 50 }).default("safety"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, expired
  scheduledDate: varchar("scheduled_date", { length: 10 }), // YYYY-MM-DD
  completedDate: varchar("completed_date", { length: 10 }), // YYYY-MM-DD (was completed_at)
  expiryDate: varchar("expiry_date", { length: 10 }), // YYYY-MM-DD
  trainer: varchar("trainer", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("safety_trainings_status_chk", sql`${t.status} IN ('pending','completed','expired')`),
]);

export const hazardZones = pgTable("hazard_zones", {
  id: serial("id").primaryKey(),
  zoneName: varchar("zone_name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  riskLevel: varchar("risk_level", { length: 20 }).notNull().default("medium"), // low, medium, high, critical
  hazardType: varchar("hazard_type", { length: 100 }),
  description: text("description"),
  controlMeasures: text("control_measures"),
  responsibleUserId: integer("responsible_user_id").references(() => users.id, { onDelete: 'set null' }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("hazard_zones_risk_level_chk", sql`${t.riskLevel} IN ('low','medium','high','critical')`),
]);

export const insertSafetyIncidentSchema = createInsertSchema(safetyIncidents).omit({ id: true, createdAt: true, updatedAt: true } as never);
export const insertPpeComplianceSchema = createInsertSchema(ppeCompliance).omit({ id: true, createdAt: true, updatedAt: true } as never);
export const insertSafetyTrainingSchema = createInsertSchema(safetyTrainings).omit({ id: true, createdAt: true, updatedAt: true } as never);
export const insertHazardZoneSchema = createInsertSchema(hazardZones).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type SafetyIncident = typeof safetyIncidents.$inferSelect;
export type InsertSafetyIncident = z.infer<typeof insertSafetyIncidentSchema>;
export type PpeCompliance = typeof ppeCompliance.$inferSelect;
export type InsertPpeCompliance = z.infer<typeof insertPpeComplianceSchema>;
export type SafetyTraining = typeof safetyTrainings.$inferSelect;
export type InsertSafetyTraining = z.infer<typeof insertSafetyTrainingSchema>;
export type HazardZone = typeof hazardZones.$inferSelect;
export type InsertHazardZone = z.infer<typeof insertHazardZoneSchema>;

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
export const successionPlans = pgTable("succession_plans", {
  id: varchar("id", { length: 64 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetPositionId: varchar("target_position_id"),
  targetDate: varchar("target_date", { length: 10 }),
  notes: text("notes"),
  status: varchar("status", { length: 30 }).notNull().default("on_track"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  check("succession_plans_status_chk", sql`${t.status} IN ('on_track','at_risk','off_track','completed','cancelled')`),
]);

export const insertSuccessionPlanSchema = createInsertSchema(successionPlans).omit({ createdAt: true, updatedAt: true } as never);
export type SuccessionPlan = typeof successionPlans.$inferSelect;
export type InsertSuccessionPlan = z.infer<typeof insertSuccessionPlanSchema>;

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
