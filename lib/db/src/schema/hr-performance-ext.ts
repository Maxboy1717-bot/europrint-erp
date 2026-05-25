/**
 * @module hr-performance-ext
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { cameraZones, cameras } from "./iot-schema";

export const faceRecognitionLogs = pgTable("face_recognition_logs", {
  id: serial("id").primaryKey(),
  cameraId: varchar("camera_id").references(() => cameras.id, { onDelete: "set null" }),
  zoneId: varchar("zone_id").references(() => cameraZones.id, { onDelete: "set null" }),
  employeeId: varchar("employee_id").references(() => users.id, { onDelete: "set null" }), // null if unknown
  isRecognized: boolean("is_recognized").default(false),
  confidence: numericMoney("confidence").default(0),
  faceImageUrl: text("face_image_url"), // Snapshot of detected face
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"), // age, gender, expression, etc.
  flaggedAs: varchar("flagged_as", { length: 30 }), // correct, false_positive, false_negative
  flaggedBy: varchar("flagged_by").references(() => users.id, { onDelete: 'set null' }),
  flaggedAt: timestamp("flagged_at"),
}, (t) => [
  check("face_recog_logs_flagged_chk", sql`${t.flaggedAs} IS NULL OR ${t.flaggedAs} IN ('correct','false_positive','false_negative')`),
]);


export type FaceRecognitionLog = typeof faceRecognitionLogs.$inferSelect;

export const insertFaceRecognitionLogSchema = createInsertSchema(faceRecognitionLogs).omit({ id: true, timestamp: true } as never);


// Re-exports from canonical kpi.ts
export { employeeDailyKpi, insertEmployeeDailyKpiSchema } from "./kpi";
export type { EmployeeDailyKpi, InsertEmployeeDailyKpi } from "./kpi";


// ========== HR AI AUTOMATION ==========
// Re-exports from canonical recruitment.ts
export { aiCvScreenings, aiInterviewSessions, aiInterviewMessages } from "./recruitment";
// ============================================================================
// FAZA 3B: YAGONA XODIM REYTING TIZIMI
// ============================================================================
// Re-exports from canonical kpi.ts
export { employeeRatings, insertEmployeeRatingSchema, performanceGoals, insertPerformanceGoalSchema } from "./kpi";
export type { EmployeeRating, InsertEmployeeRating, PerformanceGoal, InsertPerformanceGoal } from "./kpi";


// ============================================================================
// FAZA 3C: HR ↔ LMS INTEGRATSIYA
// ============================================================================

export const positionSkillRequirements = pgTable("position_skill_requirements", {
  id: serial("id").primaryKey(),
  positionId: varchar("position_id"),
  positionName: varchar("position_name", { length: 255 }).notNull(),
  skillName: varchar("skill_name", { length: 255 }).notNull(),
  skillCategory: varchar("skill_category", { length: 50 }).notNull(),
  requiredLevel: integer("required_level").notNull().default(1),
  isMandatory: boolean("is_mandatory").notNull().default(true),
  courseId: varchar("course_id"),
  certificationRequired: boolean("certification_required").default(false),
  certificationValidityMonths: integer("certification_validity_months"),
  skillCode: varchar("skill_code", { length: 50 }),
  requirementType: varchar("requirement_type", { length: 30 }).default("MUST_HAVE"),
  minScore: integer("min_score").default(3),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("pos_skill_req_category_chk", sql`${t.skillCategory} IN ('TECHNICAL','SAFETY','QUALITY','MANAGEMENT','LANGUAGE','SOFTWARE')`),
  check("pos_skill_req_type_chk", sql`${t.requirementType} IS NULL OR ${t.requirementType} IN ('MUST_HAVE','NICE_TO_HAVE')`),
]);


export const insertPositionSkillRequirementSchema = createInsertSchema(positionSkillRequirements, {
  skillCategory: z.enum(["TECHNICAL", "SAFETY", "QUALITY", "MANAGEMENT", "LANGUAGE", "SOFTWARE"]),
}).omit({ id: true, createdAt: true } as never);

export type PositionSkillRequirement = typeof positionSkillRequirements.$inferSelect;

export type InsertPositionSkillRequirement = z.infer<typeof insertPositionSkillRequirementSchema>;


// Re-exports from canonical skills.ts
export { employeeSkills, insertEmployeeSkillSchema } from "./skills";
export type { EmployeeSkill, InsertEmployeeSkill } from "./skills";


// ============================================================================
// FAZA 4A: 24 SOATLIK SHIFT SCHEDULING
// ============================================================================

export const shiftRequirements = pgTable("shift_requirements", {
  id: serial("id").primaryKey(),
  shiftType: varchar("shift_type", { length: 30 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  requiredWorkers: integer("required_workers").notNull(),
  requiredSkills: text("required_skills"),
  machineId: varchar("machine_id"),
  effectiveFrom: varchar("effective_from", { length: 20 }).notNull(),
  effectiveTo: varchar("effective_to", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("shift_requirements_type_chk", sql`${t.shiftType} IN ('MORNING','AFTERNOON','NIGHT')`),
]);


export const insertShiftRequirementSchema = createInsertSchema(shiftRequirements, {
  shiftType: z.enum(["MORNING", "AFTERNOON", "NIGHT"]),
}).omit({ id: true, createdAt: true } as never);

export type ShiftRequirement = typeof shiftRequirements.$inferSelect;

export type InsertShiftRequirement = z.infer<typeof insertShiftRequirementSchema>;


export const shiftHandovers = pgTable("shift_handovers", {
  id: serial("id").primaryKey(),
  fromShiftId: varchar("from_shift_id"),
  toShiftId: varchar("to_shift_id"),
  handoverDate: varchar("handover_date", { length: 20 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  machineStatus: text("machine_status"),
  pendingTasks: text("pending_tasks"),
  qualityIssues: text("quality_issues"),
  safetyNotes: text("safety_notes"),
  materialStatus: text("material_status"),
  handedOverBy: integer("handed_over_by").notNull().default(0),
  receivedBy: integer("received_by"),
  signatureData: text("signature_data"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("shift_handovers_status_chk", sql`${t.status} IN ('pending','acknowledged','completed')`),
]);


export const insertShiftHandoverSchema = createInsertSchema(shiftHandovers, {
  status: z.enum(["pending", "acknowledged", "completed"]).default("pending"),
}).omit({ id: true, createdAt: true } as never);

export type ShiftHandover = typeof shiftHandovers.$inferSelect;

export type InsertShiftHandover = z.infer<typeof insertShiftHandoverSchema>;

