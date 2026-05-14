/**
 * HR TZ-2 Foundation Schema
 * 12 missing tables for AI Interview, Territory Tracking, Talent Management,
 * Inspection, Internal Mobility, Contract History, and Recruiter KPIs.
 *
 * All PKs: uuid (defaultRandom)
 * All FKs to existing tables: match actual column types (integer / serial)
 * All jsonb fields: typed with .$type<T>()
 * All tables: created_at + updated_at
 */

import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  integer,
  varchar,
  text,
  boolean,
  date,
  numeric,
  timestamp,
  jsonb,
  index,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { positions } from "./positions";
import { departments } from "./departments";
import { vacancies } from "./hr-questionnaire";

// ─────────────────────────────────────────────────────────────────────────────
// pgvector: vector(dim) custom type for face/text embeddings
// Extension `vector` is pre-installed: CREATE EXTENSION IF NOT EXISTS vector;
// ─────────────────────────────────────────────────────────────────────────────

const vectorType = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 512})`;
  },
  fromDriver(value: string): number[] {
    return value.replace(/[\[\]]/g, "").split(",").map(Number);
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
});

/**
 * Declare a pgvector column.
 * @example embedding: vector("embedding", { dimensions: 512 })
 */
export const vector = (name: string, config?: { dimensions?: number }) =>
  vectorType(name, { dimensions: config?.dimensions ?? 512 });

// ─────────────────────────────────────────────────────────────────────────────
// 1. hr_tz2_territory_logs — Employee territory/room entry-exit events
// ─────────────────────────────────────────────────────────────────────────────

export const hrTz2TerritoryLogs = pgTable(
  "hr_tz2_territory_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 30 }).notNull(),
    cameraId: uuid("camera_id"),
    ts: timestamp("ts").notNull(),
    faceConfidence: numeric("face_confidence", { precision: 5, scale: 2 }),
    roomCode: varchar("room_code", { length: 50 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("hrtz2_territory_emp_ts_idx").on(t.employeeId, t.ts),
    index("hrtz2_territory_event_idx").on(t.eventType),
    check("hrtz2_territory_event_chk", sql`${t.eventType} IN ('entry','exit')`),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. hr_tz2_attendance_photos — AI camera photo every 2 hours
// ─────────────────────────────────────────────────────────────────────────────

type AttendancePhotoAnalysis = {
  emotion: string;
  fatigue_score: number;
  posture_score: number;
  anomaly: boolean;
  anomaly_reason?: string;
};

export const hrTz2AttendancePhotos = pgTable(
  "hr_tz2_attendance_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    photoUrl: text("photo_url").notNull(),
    takenAt: timestamp("taken_at").notNull(),
    roomCode: varchar("room_code", { length: 50 }),
    analysisResult: jsonb("analysis_result")
      .$type<AttendancePhotoAnalysis>(),
    processed: boolean("processed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("hrtz2_photos_emp_taken_idx").on(t.employeeId, t.takenAt),
    index("hrtz2_photos_processed_idx").on(t.processed),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. hr_tz2_ai_question_banks — AI interview question bank by position
// ─────────────────────────────────────────────────────────────────────────────

type QuestionScoringRubric = {
  score_1: string;
  score_3: string;
  score_5: string;
};

export const hrTz2AiQuestionBanks = pgTable(
  "hr_tz2_ai_question_banks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    positionId: integer("position_id").references(() => positions.id, {
      onDelete: "set null",
    }),
    positionCode: varchar("position_code", { length: 50 }),
    category: varchar("category", { length: 30 }).notNull(),
    questionUz: text("question_uz").notNull(),
    questionRu: text("question_ru"),
    questionEn: text("question_en"),
    expectedKeywords: jsonb("expected_keywords").$type<string[]>(),
    scoringRubric: jsonb("scoring_rubric").$type<QuestionScoringRubric>(),
    followUpQuestions: jsonb("follow_up_questions").$type<string[]>(),
    difficulty: integer("difficulty").notNull().default(3),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("hrtz2_qbank_position_idx").on(t.positionId),
    index("hrtz2_qbank_category_idx").on(t.category),
    index("hrtz2_qbank_active_idx").on(t.isActive),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. hr_tz2_room_reference_photos — Ideal room state photos for inspection
// ─────────────────────────────────────────────────────────────────────────────

export const hrTz2RoomReferencePhotos = pgTable(
  "hr_tz2_room_reference_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomCode: varchar("room_code", { length: 50 }).notNull().unique(),
    roomName: varchar("room_name", { length: 200 }).notNull(),
    departmentCode: varchar("department_code", { length: 50 }),
    photoUrl: text("photo_url").notNull(),
    description: text("description"),
    lastUpdatedAt: timestamp("last_updated_at"),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("hrtz2_room_ref_code_idx").on(t.roomCode)],
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. hr_tz2_ai_room_analysis — AI room comparison results (every 2 hours)
// ─────────────────────────────────────────────────────────────────────────────

type RoomAnomaly = {
  type: string;
  description: string;
  severity: string;
};

export const hrTz2AiRoomAnalysis = pgTable(
  "hr_tz2_ai_room_analysis",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomCode: varchar("room_code", { length: 50 }).notNull(),
    referencePhotoId: uuid("reference_photo_id").references(
      () => hrTz2RoomReferencePhotos.id,
      { onDelete: "set null" },
    ),
    currentPhotoUrl: text("current_photo_url").notNull(),
    analyzedAt: timestamp("analyzed_at").notNull(),
    cleanlinessScore: numeric("cleanliness_score", {
      precision: 5,
      scale: 2,
    }),
    orderScore: numeric("order_score", { precision: 5, scale: 2 }),
    equipmentOk: boolean("equipment_ok"),
    issues: jsonb("issues").$type<string[]>(),
    anomalies: jsonb("anomalies").$type<RoomAnomaly[]>(),
    notifiedHr: boolean("notified_hr").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("hrtz2_room_analysis_code_idx").on(t.roomCode),
    index("hrtz2_room_analysis_at_idx").on(t.analyzedAt),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. hr_tz2_internal_job_postings — Internal vacancy announcements
// ─────────────────────────────────────────────────────────────────────────────

type SalaryRange = {
  min: number;
  max: number;
  currency: string;
};

export const hrTz2InternalJobPostings = pgTable(
  "hr_tz2_internal_job_postings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vacancyId: integer("vacancy_id").references(() => vacancies.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 200 }).notNull(),
    departmentId: integer("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    minExperienceMonths: integer("min_experience_months"),
    requiredSkills: jsonb("required_skills").$type<string[]>(),
    salaryRange: jsonb("salary_range").$type<SalaryRange>(),
    deadline: date("deadline"),
    status: varchar("status", { length: 20 }).notNull().default("OPEN"),
    applicantsCount: integer("applicants_count").notNull().default(0),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    closedAt: timestamp("closed_at"),
  },
  (t) => [
    index("hrtz2_ijp_status_idx").on(t.status),
    index("hrtz2_ijp_dept_idx").on(t.departmentId),
    index("hrtz2_ijp_deadline_idx").on(t.deadline),
    check("hrtz2_ijp_status_chk", sql`${t.status} IN ('OPEN','CLOSED','DRAFT','CANCELLED')`),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. hr_tz2_internal_applications — Internal job posting applications
// ─────────────────────────────────────────────────────────────────────────────

export const hrTz2InternalApplications = pgTable(
  "hr_tz2_internal_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postingId: uuid("posting_id")
      .notNull()
      .references(() => hrTz2InternalJobPostings.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    coverLetter: text("cover_letter"),
    currentPosition: varchar("current_position", { length: 200 }),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("hrtz2_iapp_posting_idx").on(t.postingId),
    index("hrtz2_iapp_employee_idx").on(t.employeeId),
    index("hrtz2_iapp_status_idx").on(t.status),
    unique("hrtz2_iapp_posting_emp_uniq").on(t.postingId, t.employeeId),
    check("hrtz2_iapp_status_chk", sql`${t.status} IN ('PENDING','REVIEWING','APPROVED','REJECTED','WITHDRAWN')`),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. hr_tz2_talent_pool — Talent reserve / succession planning
// ─────────────────────────────────────────────────────────────────────────────

export const hrTz2TalentPool = pgTable(
  "hr_tz2_talent_pool",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: integer("employee_id")
      .notNull()
      .unique()
      .references(() => employees.id, { onDelete: "cascade" }),
    readinessLevel: varchar("readiness_level", { length: 20 }),
    targetPositionIds: jsonb("target_position_ids").$type<string[]>(),
    developmentPlan: text("development_plan"),
    strengths: jsonb("strengths").$type<string[]>(),
    gaps: jsonb("gaps").$type<string[]>(),
    mentorId: integer("mentor_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    nextReviewDate: date("next_review_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("hrtz2_talent_readiness_idx").on(t.readinessLevel),
    index("hrtz2_talent_mentor_idx").on(t.mentorId),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. hr_tz2_contract_versions — Employment contract version history
// ─────────────────────────────────────────────────────────────────────────────

export const hrTz2ContractVersions = pgTable(
  "hr_tz2_contract_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    contractType: varchar("contract_type", { length: 30 }),
    startDate: date("start_date"),
    endDate: date("end_date"),
    positionId: integer("position_id").references(() => positions.id, {
      onDelete: "set null",
    }),
    departmentId: integer("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    salaryAmount: numeric("salary_amount", { precision: 15, scale: 2 }),
    salaryCurrency: varchar("salary_currency", { length: 5 })
      .notNull()
      .default("UZS"),
    changesSummary: text("changes_summary"),
    documentUrl: text("document_url"),
    signedByEmployee: boolean("signed_by_employee").notNull().default(false),
    signedByHr: boolean("signed_by_hr").notNull().default(false),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("hrtz2_contract_emp_version_uniq").on(
      t.employeeId,
      t.versionNumber,
    ),
    index("hrtz2_contract_emp_idx").on(t.employeeId),
    index("hrtz2_contract_type_idx").on(t.contractType),
    check("hrtz2_contract_type_chk", sql`${t.contractType} IS NULL OR ${t.contractType} IN ('indefinite','fixed_term','seasonal','part_time')`),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 10. hr_tz2_signed_policies — Policy and regulation signature records
// ─────────────────────────────────────────────────────────────────────────────

export const hrTz2SignedPolicies = pgTable(
  "hr_tz2_signed_policies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    policyName: varchar("policy_name", { length: 200 }).notNull(),
    policyVersion: varchar("policy_version", { length: 20 }),
    policyUrl: text("policy_url"),
    signedAt: timestamp("signed_at"),
    signatureMethod: varchar("signature_method", { length: 20 }),
    signatureEvidenceUrl: text("signature_evidence_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("hrtz2_policy_emp_name_ver_uniq").on(
      t.employeeId,
      t.policyName,
      t.policyVersion,
    ),
    index("hrtz2_policy_emp_idx").on(t.employeeId),
    index("hrtz2_policy_name_idx").on(t.policyName),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 11. hr_tz2_recruiter_kpi_daily — Recruiter daily KPI tracking
// ─────────────────────────────────────────────────────────────────────────────

export const hrTz2RecruiterKpiDaily = pgTable(
  "hr_tz2_recruiter_kpi_daily",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recruiterId: integer("recruiter_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    vacanciesOwned: integer("vacancies_owned").notNull().default(0),
    candidatesScreened: integer("candidates_screened").notNull().default(0),
    aiInterviewsSent: integer("ai_interviews_sent").notNull().default(0),
    liveInterviewsScheduled: integer("live_interviews_scheduled")
      .notNull()
      .default(0),
    offersMade: integer("offers_made").notNull().default(0),
    hiresClosed: integer("hires_closed").notNull().default(0),
    avgTimeToHireDays: numeric("avg_time_to_hire_days", {
      precision: 5,
      scale: 1,
    }),
    slaBreaches: integer("sla_breaches").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("hrtz2_kpi_recruiter_date_uniq").on(t.recruiterId, t.date),
    index("hrtz2_kpi_recruiter_idx").on(t.recruiterId),
    index("hrtz2_kpi_date_idx").on(t.date),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// 12. hr_tz2_monthly_employee_cards — Monthly personal report card
// ─────────────────────────────────────────────────────────────────────────────

export const hrTz2MonthlyEmployeeCards = pgTable(
  "hr_tz2_monthly_employee_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    yearMonth: varchar("year_month", { length: 7 }).notNull(),
    workDaysTotal: integer("work_days_total"),
    workDaysActual: integer("work_days_actual"),
    lateCount: integer("late_count"),
    absenceCount: integer("absence_count"),
    dailyReportsSubmitted: integer("daily_reports_submitted"),
    dailyReportsMissed: integer("daily_reports_missed"),
    avg360Score: numeric("avg_360_score", { precision: 4, scale: 2 }),
    avgKpiScore: numeric("avg_kpi_score", { precision: 4, scale: 2 }),
    rewardsCount: integer("rewards_count"),
    penaltiesTotal: numeric("penalties_total", { precision: 15, scale: 2 }),
    penaltiesCurrency: varchar("penalties_currency", { length: 5 })
      .notNull()
      .default("UZS"),
    salaryBase: numeric("salary_base", { precision: 15, scale: 2 }),
    salaryBonus: numeric("salary_bonus", { precision: 15, scale: 2 }),
    salaryAdvance: numeric("salary_advance", { precision: 15, scale: 2 }),
    salaryDeductions: numeric("salary_deductions", { precision: 15, scale: 2 }),
    salaryNet: numeric("salary_net", { precision: 15, scale: 2 }),
    pdfUrl: text("pdf_url"),
    generatedAt: timestamp("generated_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("hrtz2_monthly_emp_month_uniq").on(t.employeeId, t.yearMonth),
    index("hrtz2_monthly_emp_idx").on(t.employeeId),
    index("hrtz2_monthly_yearmonth_idx").on(t.yearMonth),
  ],
);

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const hrTz2TerritoryLogsRelations = relations(
  hrTz2TerritoryLogs,
  ({ one }) => ({
    employee: one(employees, {
      fields: [hrTz2TerritoryLogs.employeeId],
      references: [employees.id],
    }),
  }),
);

export const hrTz2AttendancePhotosRelations = relations(
  hrTz2AttendancePhotos,
  ({ one }) => ({
    employee: one(employees, {
      fields: [hrTz2AttendancePhotos.employeeId],
      references: [employees.id],
    }),
  }),
);

export const hrTz2AiQuestionBanksRelations = relations(
  hrTz2AiQuestionBanks,
  ({ one }) => ({
    position: one(positions, {
      fields: [hrTz2AiQuestionBanks.positionId],
      references: [positions.id],
    }),
  }),
);

export const hrTz2RoomReferencePhotosRelations = relations(
  hrTz2RoomReferencePhotos,
  ({ many }) => ({
    analyses: many(hrTz2AiRoomAnalysis),
  }),
);

export const hrTz2AiRoomAnalysisRelations = relations(
  hrTz2AiRoomAnalysis,
  ({ one }) => ({
    referencePhoto: one(hrTz2RoomReferencePhotos, {
      fields: [hrTz2AiRoomAnalysis.referencePhotoId],
      references: [hrTz2RoomReferencePhotos.id],
    }),
  }),
);

export const hrTz2InternalJobPostingsRelations = relations(
  hrTz2InternalJobPostings,
  ({ one, many }) => ({
    vacancy: one(vacancies, {
      fields: [hrTz2InternalJobPostings.vacancyId],
      references: [vacancies.id],
    }),
    department: one(departments, {
      fields: [hrTz2InternalJobPostings.departmentId],
      references: [departments.id],
    }),
    applications: many(hrTz2InternalApplications),
  }),
);

export const hrTz2InternalApplicationsRelations = relations(
  hrTz2InternalApplications,
  ({ one }) => ({
    posting: one(hrTz2InternalJobPostings, {
      fields: [hrTz2InternalApplications.postingId],
      references: [hrTz2InternalJobPostings.id],
    }),
    employee: one(employees, {
      fields: [hrTz2InternalApplications.employeeId],
      references: [employees.id],
    }),
  }),
);

export const hrTz2TalentPoolRelations = relations(
  hrTz2TalentPool,
  ({ one }) => ({
    employee: one(employees, {
      fields: [hrTz2TalentPool.employeeId],
      references: [employees.id],
      relationName: "talentPoolEmployee",
    }),
    mentor: one(employees, {
      fields: [hrTz2TalentPool.mentorId],
      references: [employees.id],
      relationName: "talentPoolMentor",
    }),
  }),
);

export const hrTz2ContractVersionsRelations = relations(
  hrTz2ContractVersions,
  ({ one }) => ({
    employee: one(employees, {
      fields: [hrTz2ContractVersions.employeeId],
      references: [employees.id],
    }),
    position: one(positions, {
      fields: [hrTz2ContractVersions.positionId],
      references: [positions.id],
    }),
    department: one(departments, {
      fields: [hrTz2ContractVersions.departmentId],
      references: [departments.id],
    }),
  }),
);

export const hrTz2SignedPoliciesRelations = relations(
  hrTz2SignedPolicies,
  ({ one }) => ({
    employee: one(employees, {
      fields: [hrTz2SignedPolicies.employeeId],
      references: [employees.id],
    }),
  }),
);

export const hrTz2RecruiterKpiDailyRelations = relations(
  hrTz2RecruiterKpiDaily,
  ({ one }) => ({
    recruiter: one(employees, {
      fields: [hrTz2RecruiterKpiDaily.recruiterId],
      references: [employees.id],
    }),
  }),
);

export const hrTz2MonthlyEmployeeCardsRelations = relations(
  hrTz2MonthlyEmployeeCards,
  ({ one }) => ({
    employee: one(employees, {
      fields: [hrTz2MonthlyEmployeeCards.employeeId],
      references: [employees.id],
    }),
  }),
);
