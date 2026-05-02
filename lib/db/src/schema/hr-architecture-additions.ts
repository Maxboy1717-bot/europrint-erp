/**
 * ARCHITECTURE.md §41.2 talab qilgan yetishmagan HR jadvallar.
 *
 * Migration: lib/db/drizzle/0007_hr_architecture_additions.sql
 *
 * Mavjud `employees`, `positions`, `users`, `vacancies`, `candidates` jadvallariga
 * bog'lanadi (FK).
 */
import { sql } from "drizzle-orm";
import {
  pgTable, serial, integer, varchar, boolean, text, timestamp, date,
  jsonb, decimal, uniqueIndex, index, check,
} from "drizzle-orm/pg-core";
import { numericMoney } from "./numeric-money";
import { employees } from "./employees";
import { positions } from "./positions";

// ─── 1. leave_balances ───────────────────────────────────────────────────────
// Yillik ta'til qoldig'i (UZ qonuni: 24 ish kuni)
export const leaveBalances = pgTable("leave_balances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  year: integer("year").notNull(),
  totalDays: numericMoney("total_days").notNull().default(24),
  usedDays: numericMoney("used_days").notNull().default(0),
  carriedOverDays: numericMoney("carried_over_days").notNull().default(0),
  expiresAt: date("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("uq_leave_balances_emp_year").on(t.employeeId, t.year),
  check("ck_leave_balances_used_le_total", sql`${t.usedDays} <= ${t.totalDays} + ${t.carriedOverDays}`),
  check("ck_leave_balances_nonneg", sql`${t.totalDays} >= 0 AND ${t.usedDays} >= 0 AND ${t.carriedOverDays} >= 0`),
]);

// ─── 2. salary_bands ─────────────────────────────────────────────────────────
// Lavozim bo'yicha min/max oylik
export const salaryBands = pgTable("salary_bands", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").references(() => positions.id, { onDelete: "cascade" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  minSalary: numericMoney("min_salary").notNull(),
  maxSalary: numericMoney("max_salary").notNull(),
  midSalary: numericMoney("mid_salary"),
  effectiveFrom: date("effective_from").notNull(),
  effectiveTo: date("effective_to"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_salary_bands_position").on(t.positionId),
  check("ck_salary_bands_min_le_max", sql`${t.minSalary} <= ${t.maxSalary}`),
  check("ck_salary_bands_currency_3", sql`length(${t.currency}) = 3`),
]);

// ─── 3. payroll_journal_entries ──────────────────────────────────────────────
// FI integratsiyasi: ish haqi → GL postings
export const payrollJournalEntries = pgTable("payroll_journal_entries", {
  id: serial("id").primaryKey(),
  payrollPeriodId: integer("payroll_period_id"),       // FK keyinroq qo'shiladi (payroll_periods)
  employeeId: integer("employee_id").references(() => employees.id),
  glDocumentId: varchar("gl_document_id"),             // varchar PK glDocuments dan
  entryType: varchar("entry_type", { length: 20 }).notNull(), // accrual / deduction / payment
  debitAccountCode: varchar("debit_account_code", { length: 10 }),
  creditAccountCode: varchar("credit_account_code", { length: 10 }),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  description: text("description"),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
  postedBy: integer("posted_by"),
}, (t) => [
  index("idx_payroll_je_period").on(t.payrollPeriodId),
  index("idx_payroll_je_employee").on(t.employeeId),
  check("ck_payroll_je_amount_pos", sql`${t.amount} >= 0`),
  check("ck_payroll_je_type", sql`${t.entryType} IN ('accrual','deduction','payment')`),
]);

// ─── 4. discipline_appeals ───────────────────────────────────────────────────
// Xodim e'tirozlari (intizomiy choraga)
export const disciplineAppeals = pgTable("discipline_appeals", {
  id: serial("id").primaryKey(),
  disciplineRecordId: integer("discipline_record_id").notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  appealReason: text("appeal_reason").notNull(),
  appealEvidence: jsonb("appeal_evidence").$type<{ url: string; type: string }[]>(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // pending / under_review / approved / rejected / withdrawn
  reviewerId: integer("reviewer_id"),
  reviewerNotes: text("reviewer_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_discipline_appeals_record").on(t.disciplineRecordId),
  index("idx_discipline_appeals_employee").on(t.employeeId),
  check("ck_discipline_appeals_status", sql`${t.status} IN ('pending','under_review','approved','rejected','withdrawn')`),
]);

// ─── 5. career_development_plans ─────────────────────────────────────────────
// Rivojlanish reja, mentor
export const careerDevelopmentPlans = pgTable("career_development_plans", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  mentorId: integer("mentor_id").references(() => employees.id),
  targetPositionId: integer("target_position_id").references(() => positions.id),
  goals: jsonb("goals").$type<Array<{ title: string; description?: string; deadline?: string; status: string }>>(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  reviewFrequencyDays: integer("review_frequency_days").default(90),
  lastReviewedAt: timestamp("last_reviewed_at"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  // active / completed / paused / cancelled
  progressPercent: numericMoney("progress_percent").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_career_dev_employee").on(t.employeeId),
  index("idx_career_dev_mentor").on(t.mentorId),
  check("ck_career_dev_status", sql`${t.status} IN ('active','completed','paused','cancelled')`),
  check("ck_career_dev_progress", sql`${t.progressPercent} >= 0 AND ${t.progressPercent} <= 100`),
]);

// ─── 6. job_templates ────────────────────────────────────────────────────────
// Lavozim sharti shabloni (talablar, mas'uliyat)
export const jobTemplates = pgTable("job_templates", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id").references(() => positions.id),
  code: varchar("code", { length: 50 }).notNull().unique(),
  titleUz: varchar("title_uz", { length: 200 }).notNull(),
  titleRu: varchar("title_ru", { length: 200 }),
  responsibilitiesUz: jsonb("responsibilities_uz").$type<string[]>(),
  responsibilitiesRu: jsonb("responsibilities_ru").$type<string[]>(),
  requirementsUz: jsonb("requirements_uz").$type<string[]>(),
  requirementsRu: jsonb("requirements_ru").$type<string[]>(),
  benefitsUz: jsonb("benefits_uz").$type<string[]>(),
  benefitsRu: jsonb("benefits_ru").$type<string[]>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_job_templates_position").on(t.positionId),
]);

// ─── 7. questionnaire_templates ──────────────────────────────────────────────
// Suhbat / so'rov shablonlari
export const questionnaireTemplates = pgTable("questionnaire_templates", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  // interview / 360_review / exit / nps / pulse
  description: text("description"),
  estimatedMinutes: integer("estimated_minutes").default(15),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("ck_questionnaire_type", sql`${t.type} IN ('interview','360_review','exit','nps','pulse')`),
]);

// ─── 8. questionnaire_questions ──────────────────────────────────────────────
export const questionnaireQuestions = pgTable("questionnaire_questions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => questionnaireTemplates.id, { onDelete: "cascade" }).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 30 }).notNull(),
  // text / scale_1_5 / scale_1_10 / yes_no / multiple_choice / single_choice
  options: jsonb("options").$type<string[]>(),
  isRequired: boolean("is_required").notNull().default(true),
  weight: numericMoney("weight").default(1),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_questionnaire_q_template").on(t.templateId),
  check("ck_questionnaire_q_type", sql`${t.questionType} IN ('text','scale_1_5','scale_1_10','yes_no','multiple_choice','single_choice')`),
]);

// ─── 9. ai_cv_screenings ─────────────────────────────────────────────────────
// GPT-4 CV tahlil natijalari
export const aiCvScreenings = pgTable("ai_cv_screenings", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  vacancyId: integer("vacancy_id").notNull(),
  cvFileUrl: text("cv_file_url"),
  modelName: varchar("model_name", { length: 50 }).notNull(),
  totalScore: integer("total_score").notNull(),
  experienceScore: integer("experience_score"),
  skillsScore: integer("skills_score"),
  educationScore: integer("education_score"),
  cultureFitScore: integer("culture_fit_score"),
  rawAnalysis: jsonb("raw_analysis"),
  recommendation: varchar("recommendation", { length: 30 }),
  // strong / good / weak / not_suitable
  isShortlisted: boolean("is_shortlisted").default(false),
  tokensUsed: integer("tokens_used"),
  costUsd: numericMoney("cost_usd"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_ai_cv_candidate").on(t.candidateId),
  index("idx_ai_cv_vacancy").on(t.vacancyId),
  check("ck_ai_cv_score", sql`${t.totalScore} >= 0 AND ${t.totalScore} <= 100`),
  check("ck_ai_cv_recommendation", sql`${t.recommendation} IN ('strong','good','weak','not_suitable') OR ${t.recommendation} IS NULL`),
]);

// ─── 10. ai_interview_sessions ───────────────────────────────────────────────
export const aiInterviewSessionsExt = pgTable("ai_interview_sessions_ext", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  vacancyId: integer("vacancy_id").notNull(),
  sessionToken: varchar("session_token", { length: 100 }).notNull().unique(),
  videoUrl: text("video_url"),
  transcriptUrl: text("transcript_url"),
  durationSeconds: integer("duration_seconds"),
  totalScore: integer("total_score"),
  logicScore: integer("logic_score"),
  ethicsScore: integer("ethics_score"),
  experienceScore: integer("experience_score"),
  finalRecommendation: varchar("final_recommendation", { length: 30 }),
  // offer / second_round / reject
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_ai_interview_candidate").on(t.candidateId),
  check("ck_ai_interview_recommendation", sql`${t.finalRecommendation} IN ('offer','second_round','reject') OR ${t.finalRecommendation} IS NULL`),
]);

// ─── 11. exit_interviews ─────────────────────────────────────────────────────
export const exitInterviews = pgTable("exit_interviews", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  interviewerId: integer("interviewer_id").references(() => employees.id),
  exitDate: date("exit_date").notNull(),
  reasonCategory: varchar("reason_category", { length: 50 }).notNull(),
  // career_growth / compensation / work_culture / management / personal / relocation / other
  reasonDetails: text("reason_details"),
  recommendCompany: integer("recommend_company"),
  // 0-10 NPS-style
  improvementSuggestions: text("improvement_suggestions"),
  rehireEligible: boolean("rehire_eligible"),
  feedbackJson: jsonb("feedback_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_exit_interviews_employee").on(t.employeeId),
  check("ck_exit_recommend_score", sql`${t.recommendCompany} >= 0 AND ${t.recommendCompany} <= 10`),
]);
