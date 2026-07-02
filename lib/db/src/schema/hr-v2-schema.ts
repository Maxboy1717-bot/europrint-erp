/**
 * @module hr-v2-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import {
  pgTable, serial, integer, varchar, boolean, text, timestamp, date, decimal, jsonb, unique, uniqueIndex, check
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { employees } from "./employees";
import { positions } from "./positions";
import { departments } from "./departments";

// IMPORTANT: `disciplineRecords` and `notifications` tables are intentionally NOT defined here.
// They were previously duplicated in this file, which caused esbuild "Ambiguous import" errors
// when the api-server bundled both this file and hr-personal-core.ts (which contains the
// authoritative definitions). The duplicates were removed to restore the build.
//
// Both tables remain accessible via the schema index chain:
//   lib/db/schema/index.ts → hr-schema.ts → hr-personal.ts → hr-personal-core.ts
// Do NOT re-add definitions here — doing so will re-introduce the ambiguous import build failure.

// ─── Violation Catalog ───────────────────────────────────────────────────────
export const violationCatalog = pgTable("violation_catalog", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  category: varchar("category", { length: 50 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  nameRu: varchar("name_ru", { length: 200 }),
  severity: varchar("severity", { length: 30 }).default("warning"),
  defaultFinePercent: decimal("default_fine_percent", { precision: 5, scale: 2 }).default("0"),
  defaultFineAmount: decimal("default_fine_amount", { precision: 10, scale: 2 }).default("0"),
  pointsDeducted: integer("points_deducted").default(0),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("violation_catalog_severity_chk", sql`${t.severity} IS NULL OR ${t.severity} IN ('warning','major','critical')`),
]);

// ─── Absence Tracking ────────────────────────────────────────────────────────
export const absenceTracking = pgTable("absence_tracking", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  absenceDate: date("absence_date").notNull(),
  consecutiveDayCount: integer("consecutive_day_count").default(1),
  isExcused: boolean("is_excused").default(false),
  excuseReason: text("excuse_reason"),
  excuseDocumentUrl: text("excuse_document_url"),
  excusedBy: integer("excused_by"),
  excusedAt: timestamp("excused_at"),
  autoBlocked: boolean("auto_blocked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [unique().on(t.employeeId, t.absenceDate)]);

// ─── Employee Blocks ─────────────────────────────────────────────────────────
export const employeeBlocks = pgTable("employee_blocks", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason"),
  blockedBy: integer("blocked_by"),
  blockedAt: timestamp("blocked_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  unblockedAt: timestamp("unblocked_at"),
  unblockedBy: integer("unblocked_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Badge Catalog ───────────────────────────────────────────────────────────
export const badgeCatalog = pgTable("badge_catalog", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  nameRu: varchar("name_ru", { length: 100 }),
  icon: varchar("icon", { length: 100 }).default("🏅"),
  description: text("description"),
  criteria: text("criteria"),
  pointValue: integer("point_value").default(0),
  isAutoAward: boolean("is_auto_award").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ORFAN CLEANUP (2026-07-02): employeeBadges/gamificationPoints/gamificationTotals
// pgTables removed — dead lib/db duplicates, Q-29 verified: never imported via
// @workspace/db anywhere in apps/.

// ─── HR Daily Reports ─────────────────────────────────────────────────────────
export const hrDailyReports = pgTable("hr_daily_reports", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  reportDate: date("report_date").notNull(),
  tasksCompleted: text("tasks_completed"),
  metrics: text("metrics"),
  tomorrowPlan: text("tomorrow_plan"),
  submittedAt: timestamp("submitted_at"),
  status: varchar("status", { length: 20 }).default("draft"),
  isAutoAbsent: boolean("is_auto_absent").default(false),
  isMachineOperatorReport: boolean("is_machine_operator_report").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.employeeId, t.reportDate),
  check("hr_daily_reports_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('draft','submitted','approved','rejected')`),
]);

// ─── HR Daily Report Audit ────────────────────────────────────────────────────
export const hrDailyReportAudit = pgTable("hr_daily_report_audit", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  hrUserId: integer("hr_user_id"),
  previousStatus: varchar("previous_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Career Paths ────────────────────────────────────────────────────────────
export const careerPaths = pgTable("career_paths", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  currentPositionId: integer("current_position_id").references(() => positions.id, { onDelete: "set null" }),
  targetPositionId: integer("target_position_id").references(() => positions.id, { onDelete: "set null" }),
  startDate: date("start_date"),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("draft"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdBy: integer("created_by"),
  estimatedMonths: integer("estimated_months").default(12),
  progressPercent: integer("progress_percent").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("career_paths_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('draft','active','completed','cancelled')`),
  check("career_paths_progress_chk", sql`${t.progressPercent} IS NULL OR (${t.progressPercent} >= 0 AND ${t.progressPercent} <= 100)`),
]);

// ─── Career Path Steps ───────────────────────────────────────────────────────
export const careerPathSteps = pgTable("career_path_steps", {
  id: serial("id").primaryKey(),
  careerPathId: integer("career_path_id").references(() => careerPaths.id, { onDelete: "cascade" }).notNull(),
  stepOrder: integer("step_order").default(1),
  positionId: integer("position_id").references(() => positions.id, { onDelete: "set null" }),
  positionTitle: varchar("position_title", { length: 200 }),
  requiredMonths: integer("required_months").default(12),
  requiredSkills: text("required_skills"),
  requiredCourses: text("required_courses"),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
});

// ORFAN CLEANUP (2026-07-02): skillCatalog pgTable removed — dead lib/db
// duplicate, Q-29 verified: never imported via @workspace/db anywhere in apps/.
// Canonical live snake_case stub is
// apps/api/src/shared/db/schema-business-c-2-misc.ts.

// ─── Employee Skill Scores ────────────────────────────────────────────────────
export const employeeSkillScores = pgTable(
  "employee_skill_scores",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
    skillCode: varchar("skill_code", { length: 50 }).notNull(),
    currentLevel: integer("current_level").default(0).notNull(),
    assessedBy: integer("assessed_by"),
    lastAssessedAt: timestamp("last_assessed_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({ uniq: uniqueIndex("ess_emp_skill_uniq").on(t.employeeId, t.skillCode) }),
);

// ─── eNPS Surveys ────────────────────────────────────────────────────────────
export const enpsSurveys = pgTable("enps_surveys", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  questions: jsonb("questions"),
  period: varchar("period", { length: 20 }).default("quarterly"),
  status: varchar("status", { length: 20 }).default("draft"),
  createdBy: integer("created_by"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("enps_surveys_period_chk", sql`${t.period} IS NULL OR ${t.period} IN ('monthly','quarterly','annual')`),
  check("enps_surveys_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('draft','active','completed','closed')`),
]);

// ─── eNPS Responses ──────────────────────────────────────────────────────────
export const enpsResponses = pgTable("enps_responses", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id").references(() => enpsSurveys.id, { onDelete: "cascade" }).notNull(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  score: integer("score"),
  comment: text("comment"),
  answers: jsonb("answers"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

// ─── PIP Plans ───────────────────────────────────────────────────────────────
export const pipPlans = pgTable("pip_plans", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  createdBy: integer("created_by"),
  supervisorId: integer("supervisor_id"),
  durationDays: integer("duration_days").default(30),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  goals: text("goals"),
  successCriteria: text("success_criteria"),
  status: varchar("status", { length: 20 }).default("draft"),
  acknowledgedAt: timestamp("acknowledged_at"),
  completedAt: timestamp("completed_at"),
  outcome: varchar("outcome", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("pip_plans_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('draft','active','completed','failed','cancelled')`),
  check("pip_plans_outcome_chk", sql`${t.outcome} IS NULL OR ${t.outcome} IN ('success','failure','transferred','extended')`),
]);

// ─── PIP Progress Updates ────────────────────────────────────────────────────
export const pipProgressUpdates = pgTable("pip_progress_updates", {
  id: serial("id").primaryKey(),
  pipId: integer("pip_id").references(() => pipPlans.id, { onDelete: "cascade" }).notNull(),
  updatedBy: integer("updated_by"),
  notes: text("notes"),
  status: varchar("status", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ORFAN CLEANUP (2026-07-02): visitorLog/documentWorkflowRoutes pgTables
// removed — dead lib/db duplicates, Q-29 verified: never imported via
// @workspace/db anywhere in apps/. Canonical live snake_case stubs are in
// apps/api/src/shared/db/schema-business-c-2-misc.ts /
// schema-business-c-2-hr-safety.ts.

export const hrDocuments = pgTable("hr_documents", {
  id: serial("id").primaryKey(),
  documentType: varchar("document_type", { length: 50 }),
  title: varchar("title", { length: 300 }),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
  initiatedBy: integer("initiated_by"),
  currentStep: integer("current_step").default(1),
  totalSteps: integer("total_steps").default(1),
  status: varchar("status", { length: 30 }).default("pending"),
  content: jsonb("content"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentApprovalSteps = pgTable("document_approval_steps", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => hrDocuments.id, { onDelete: "cascade" }).notNull(),
  stepNumber: integer("step_number").notNull(),
  approverRole: varchar("approver_role", { length: 50 }),
  approverId: integer("approver_id"),
  status: varchar("status", { length: 20 }).default("pending"),
  comment: text("comment"),
  actionAt: timestamp("action_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentSignatures = pgTable("document_signatures", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => hrDocuments.id, { onDelete: "cascade" }).notNull(),
  signerId: integer("signer_id"),
  signedAt: timestamp("signed_at").defaultNow().notNull(),
  signatureHash: varchar("signature_hash", { length: 200 }),
  ipAddress: varchar("ip_address", { length: 45 }),
});

// ORFAN CLEANUP (2026-07-02): hrInterviewSessions pgTable removed — dead
// lib/db duplicate, Q-29 verified: never imported via @workspace/db anywhere
// in apps/.

// ─── AI Interview Question Bank ──────────────────────────────────────────────
export const hrInterviewQuestions = pgTable("hr_interview_questions", {
  id: serial("id").primaryKey(),
  jobTitle: varchar("job_title", { length: 200 }),
  question: text("question").notNull(),
  questionUz: text("question_uz"),
  questionRu: text("question_ru"),
  questionEn: text("question_en"),
  category: varchar("category", { length: 50 }).default("general"),
  difficulty: varchar("difficulty", { length: 20 }).default("medium"),
  expectedKeywords: text("expected_keywords"),
  maxScore: integer("max_score").default(10),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("hr_interview_questions_difficulty_chk", sql`${t.difficulty} IS NULL OR ${t.difficulty} IN ('easy','medium','hard')`),
]);

// ORFAN CLEANUP (2026-07-02): offboardingCases/offboardingChecklistItems
// pgTables removed — dead lib/db duplicates, Q-29 verified: never imported
// via @workspace/db anywhere in apps/.

// ─── Shift Schedule ──────────────────────────────────────────────────────────
export const shiftSchedules = pgTable("shift_schedules", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  shiftDate: date("shift_date").notNull(),
  shiftType: varchar("shift_type", { length: 20 }).default("day"),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  status: varchar("status", { length: 20 }).default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  unique().on(t.employeeId, t.shiftDate),
  check("shift_schedules_type_chk", sql`${t.shiftType} IS NULL OR ${t.shiftType} IN ('day','night','morning','evening')`),
  check("shift_schedules_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('scheduled','completed','cancelled','absent')`),
]);

