/**
 * ARCHITECTURE.md §41.2 talab qilgan yetishmagan HR jadvallar.
 *
 * Migration: lib/db/drizzle/0007_hr_architecture_additions.sql
 *
 * Mavjud `employees`, `positions`, `users`, `vacancies`, `candidates` jadvallariga
 * bog'lanadi (FK).
 *
 * NOTE: leaveBalances, salaryBands, disciplineAppeals, exitInterviews,
 *       jobTemplates, questionnaireTemplates, questionnaireQuestions,
 *       aiCvScreenings are re-exported from their canonical files.
 *       Only payrollJournalEntries, careerDevelopmentPlans, and
 *       aiInterviewSessionsExt are defined here.
 */
import { sql } from "drizzle-orm";
import {
  pgTable, serial, integer, varchar, text, timestamp, date,
  jsonb, index, check,
} from "drizzle-orm/pg-core";
import { numericMoney } from "./numeric-money";
import { employees } from "./employees";
import { positions } from "./positions";

// ─── Re-exports from canonical files ─────────────────────────────────────────
export { leaveBalances } from "./leave";
export { salaryBands } from "./payroll";
export { disciplineAppeals } from "./discipline";
export { exitInterviews } from "./assessment";
export { jobTemplates, questionnaireTemplates, questionnaireQuestions, aiCvScreenings } from "./recruitment";

// ─── 3. payroll_journal_entries ──────────────────────────────────────────────
// FI integratsiyasi: ish haqi → GL postings
export const payrollJournalEntries = pgTable("payroll_journal_entries", {
  id: serial("id").primaryKey(),
  payrollPeriodId: integer("payroll_period_id"),       // FK keyinroq qo'shiladi (payroll_periods)
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
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

// ─── 5. career_development_plans ─────────────────────────────────────────────
// Rivojlanish reja, mentor
export const careerDevelopmentPlans = pgTable("career_development_plans", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  mentorId: integer("mentor_id").references(() => employees.id, { onDelete: "set null" }),
  targetPositionId: integer("target_position_id").references(() => positions.id, { onDelete: "set null" }),
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

