import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, uuid, index, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Admin, Position, admins, departments, positions, users } from "./core-schema";
import { cameraZones, cameras } from "./iot-schema";
import { Mentor, courses, progress, skills } from "./lms-schema";
import { workCenters } from "./pp-schema";
import { candidates, vacancies } from "./hr-recruitment";

export const faceRecognitionLogs = pgTable("face_recognition_logs", {
  id: serial("id").primaryKey(),
  cameraId: varchar("camera_id").references(() => cameras.id),
  zoneId: varchar("zone_id").references(() => cameraZones.id),
  employeeId: varchar("employee_id").references(() => users.id), // null if unknown
  isRecognized: boolean("is_recognized").default(false),
  confidence: numericMoney("confidence").default(0),
  faceImageUrl: text("face_image_url"), // Snapshot of detected face
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"), // age, gender, expression, etc.
  flaggedAs: varchar("flagged_as", { length: 30 }), // correct, false_positive, false_negative
  flaggedBy: varchar("flagged_by").references(() => users.id, { onDelete: 'set null' }),
  flaggedAt: timestamp("flagged_at"),
});


export type FaceRecognitionLog = typeof faceRecognitionLogs.$inferSelect;

export const insertFaceRecognitionLogSchema = createInsertSchema(faceRecognitionLogs).omit({ id: true, timestamp: true } as never);


export const employeeDailyKpi = pgTable("employee_daily_kpi", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  evaluationDate: varchar("evaluation_date", { length: 10 }).notNull(),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: 'set null' }),
  attendanceScore: numericMoney("attendance_score").default(0),
  taskCompletionScore: numericMoney("task_completion_score").default(0),
  qualityScore: numericMoney("quality_score").default(0),
  productivityScore: numericMoney("productivity_score").default(0),
  teamworkScore: numericMoney("teamwork_score").default(0),
  disciplineScore: numericMoney("discipline_score").default(0),
  overallScore: numericMoney("overall_score").default(0),
  bonusPercent: numericMoney("bonus_percent").default(0),
  penaltyPercent: numericMoney("penalty_percent").default(0),
  netScore: numericMoney("net_score").default(0),
  evaluatorId: varchar("evaluator_id").references(() => users.id, { onDelete: 'set null' }),
  aiGenerated: boolean("ai_generated").default(false),
  aiConfidence: numericMoney("ai_confidence"),
  notes: text("notes"),
  factors: jsonb("factors"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertEmployeeDailyKpiSchema = createInsertSchema(employeeDailyKpi, {
  userId: z.string().min(1, "Xodim ID kerak"),
  evaluationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD formatida"),
  attendanceScore: z.number().min(0).max(100),
  taskCompletionScore: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  productivityScore: z.number().min(0).max(100),
  teamworkScore: z.number().min(0).max(100),
  disciplineScore: z.number().min(0).max(100),
}).omit({ id: true, createdAt: true } as never);


export type EmployeeDailyKpi = typeof employeeDailyKpi.$inferSelect;

export type InsertEmployeeDailyKpi = z.infer<typeof insertEmployeeDailyKpiSchema>;


// ========== HR AI AUTOMATION ==========

export const aiCvScreenings = pgTable("ai_cv_screenings", {
  id: serial("id").primaryKey(),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id),
  vacancyId: varchar("vacancy_id").references(() => vacancies.id),
  resumeText: text("resume_text"),
  ocrRawText: text("ocr_raw_text"),
  extractedData: jsonb("extracted_data"),
  hrCapitalCategory: varchar("hr_capital_category", { length: 30 }),
  productivityScore: integer("productivity_score"),
  stabilityScore: integer("stability_score"),
  overallScore: integer("overall_score"),
  matchScore: integer("match_score"),
  strengths: jsonb("strengths"),
  weaknesses: jsonb("weaknesses"),
  redFlags: jsonb("red_flags"),
  recommendation: varchar("recommendation", { length: 20 }),
  aiAnalysis: text("ai_analysis"),
  aiModel: varchar("ai_model", { length: 50 }),
  tokensUsed: integer("tokens_used"),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export const aiInterviewSessions = pgTable("ai_interview_sessions", {
  id: serial("id").primaryKey(),
  candidateId: varchar("candidate_id").notNull().references(() => candidates.id),
  vacancyId: varchar("vacancy_id").references(() => vacancies.id),
  interviewType: varchar("interview_type", { length: 20 }).notNull().default("text"),
  language: varchar("language", { length: 5 }).notNull().default("uz"),
  currentStage: integer("current_stage").notNull().default(1),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  scores: jsonb("scores"),
  evaluation: jsonb("evaluation"),
  systemPrompt: text("system_prompt"),
  aiModel: varchar("ai_model", { length: 50 }),
  totalTokensUsed: integer("total_tokens_used").default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});


export const aiInterviewMessages = pgTable("ai_interview_messages", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull().references(() => aiInterviewSessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  stage: integer("stage"),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
// ============================================================================
// FAZA 3B: YAGONA XODIM REYTING TIZIMI
// ============================================================================

export const employeeRatings = pgTable("employee_ratings", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id).notNull(),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  productivityScore: numericMoney("productivity_score").default(0),
  productivityWeight: numericMoney("productivity_weight").default(40),
  disciplineScore: numericMoney("discipline_score").default(0),
  disciplineWeight: numericMoney("discipline_weight").default(20),
  qualityScore: numericMoney("quality_score").default(0),
  qualityWeight: numericMoney("quality_weight").default(20),
  skillsScore: numericMoney("skills_score").default(0),
  skillsWeight: numericMoney("skills_weight").default(10),
  teamworkScore: numericMoney("teamwork_score").default(0),
  teamworkWeight: numericMoney("teamwork_weight").default(10),
  compositeScore: numericMoney("composite_score").default(0),
  rank: integer("rank"),
  trend: varchar("trend", { length: 10 }),
  cameraPresenceHours: numericMoney("camera_presence_hours").default(0),
  productionOutput: numericMoney("production_output").default(0),
  taskCompletionRate: numericMoney("task_completion_rate").default(0),
  qcPassRate: numericMoney("qc_pass_rate").default(0),
  attendanceRate: numericMoney("attendance_rate").default(0),
  lmsCoursesCompleted: integer("lms_courses_completed").default(0),
  calculatedAt: timestamp("calculated_at").defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertEmployeeRatingSchema = createInsertSchema(employeeRatings).omit({ id: true, createdAt: true } as never);

export type EmployeeRating = typeof employeeRatings.$inferSelect;

export type InsertEmployeeRating = z.infer<typeof insertEmployeeRatingSchema>;


export const performanceGoals = pgTable("performance_goals", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id).notNull(),
  goalType: varchar("goal_type", { length: 30 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetValue: numericMoney("target_value").notNull(),
  currentValue: numericMoney("current_value").default(0),
  unit: varchar("unit", { length: 30 }),
  startDate: varchar("start_date", { length: 20 }).notNull(),
  endDate: varchar("end_date", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertPerformanceGoalSchema = createInsertSchema(performanceGoals, {
  goalType: z.enum(["PRODUCTIVITY", "QUALITY", "ATTENDANCE", "LEARNING", "TEAMWORK"]),
  status: z.enum(["active", "completed", "missed", "cancelled"]).default("active"),
}).omit({ id: true, createdAt: true } as never);

export type PerformanceGoal = typeof performanceGoals.$inferSelect;

export type InsertPerformanceGoal = z.infer<typeof insertPerformanceGoalSchema>;


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
});


export const insertPositionSkillRequirementSchema = createInsertSchema(positionSkillRequirements, {
  skillCategory: z.enum(["TECHNICAL", "SAFETY", "QUALITY", "MANAGEMENT", "LANGUAGE", "SOFTWARE"]),
}).omit({ id: true, createdAt: true } as never);

export type PositionSkillRequirement = typeof positionSkillRequirements.$inferSelect;

export type InsertPositionSkillRequirement = z.infer<typeof insertPositionSkillRequirementSchema>;


export const employeeSkills = pgTable("employee_skills", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id").references(() => users.id).notNull(),
  skillName: varchar("skill_name", { length: 255 }).notNull(),
  skillCategory: varchar("skill_category", { length: 50 }).notNull(),
  currentLevel: integer("current_level").notNull().default(1),
  requiredLevel: integer("required_level"),
  certificationId: varchar("certification_id"),
  certifiedDate: varchar("certified_date", { length: 20 }),
  expiryDate: varchar("expiry_date", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  verifiedBy: varchar("verified_by").references(() => users.id, { onDelete: 'set null' }),
  skillCode: varchar("skill_code", { length: 50 }),
  selfScore: integer("self_score"),
  managerScore: integer("manager_score"),
  finalScore: decimal("final_score", { precision: 4, scale: 1 }),
  assessmentDate: date("assessment_date"),
  confirmedBy: integer("confirmed_by"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const insertEmployeeSkillSchema = createInsertSchema(employeeSkills, {
  status: z.enum(["active", "expired", "pending_renewal", "revoked"]).default("active"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type EmployeeSkill = typeof employeeSkills.$inferSelect;

export type InsertEmployeeSkill = z.infer<typeof insertEmployeeSkillSchema>;


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
});


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
});


export const insertShiftHandoverSchema = createInsertSchema(shiftHandovers, {
  status: z.enum(["pending", "acknowledged", "completed"]).default("pending"),
}).omit({ id: true, createdAt: true } as never);

export type ShiftHandover = typeof shiftHandovers.$inferSelect;

export type InsertShiftHandover = z.infer<typeof insertShiftHandoverSchema>;

