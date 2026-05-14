/**
 * @module recruitment
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, date, jsonb, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const vacancies = pgTable("vacancies", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id"),
  departmentId: integer("department_id"),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  salaryMin: decimal("salary_min", { precision: 12, scale: 2 }),
  salaryMax: decimal("salary_max", { precision: 12, scale: 2 }),
  experienceYears: integer("experience_years"),
  educationLevel: varchar("education_level", { length: 50 }),
  employmentType: varchar("employment_type", { length: 20 }),
  numberOfPositions: integer("number_of_positions").default(1),
  priority: varchar("priority", { length: 20 }).default("normal"),
  publishDate: date("publish_date"),
  closingDate: date("closing_date"),
  requestedBy: integer("requested_by"),
  approvedBy: integer("approved_by"),
  status: varchar("status", { length: 20 }).default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("vacancies_status_chk", sql`${t.status} IN ('draft','open','closed','cancelled','on_hold')`),
  check("vacancies_priority_chk", sql`${t.priority} IN ('low','normal','high','urgent')`),
  check("vacancies_salary_chk", sql`${t.salaryMin} IS NULL OR ${t.salaryMax} IS NULL OR ${t.salaryMin} <= ${t.salaryMax}`),
  check("vacancies_number_of_positions_chk", sql`${t.numberOfPositions} IS NULL OR ${t.numberOfPositions} > 0`),
]);

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  vacancyId: integer("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  resumeUrl: text("resume_url"),
  coverLetterUrl: text("cover_letter_url"),
  source: varchar("source", { length: 50 }),
  experienceYears: integer("experience_years"),
  currentSalary: decimal("current_salary", { precision: 12, scale: 2 }),
  expectedSalary: decimal("expected_salary", { precision: 12, scale: 2 }),
  skills: text("skills"),
  educationLevel: varchar("education_level", { length: 50 }),
  status: varchar("status", { length: 20 }).default("new"),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("candidates_status_chk", sql`${t.status} IN ('new','screening','interview','offer','hired','rejected','withdrawn')`),
  check("candidates_rating_chk", sql`${t.rating} IS NULL OR (${t.rating} >= 0 AND ${t.rating} <= 5)`),
  check("candidates_expected_salary_chk", sql`${t.expectedSalary} IS NULL OR ${t.expectedSalary} >= 0`),
]);

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  vacancyId: integer("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
  interviewDate: timestamp("interview_date"),
  interviewType: varchar("interview_type", { length: 30 }),
  interviewerId: integer("interviewer_id"),
  location: varchar("location", { length: 200 }),
  duration: integer("duration"),
  overallRating: decimal("overall_rating", { precision: 3, scale: 1 }),
  technicalRating: decimal("technical_rating", { precision: 3, scale: 1 }),
  communicationRating: decimal("communication_rating", { precision: 3, scale: 1 }),
  cultureFitRating: decimal("culture_fit_rating", { precision: 3, scale: 1 }),
  recommendation: varchar("recommendation", { length: 20 }),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("interviews_status_chk", sql`${t.status} IN ('scheduled','completed','cancelled','no_show')`),
  check("interviews_recommendation_chk", sql`${t.recommendation} IS NULL OR ${t.recommendation} IN ('hire','reject','consider','next_round')`),
  check("interviews_overall_rating_chk", sql`${t.overallRating} IS NULL OR (${t.overallRating} >= 0 AND ${t.overallRating} <= 5)`),
]);

export const jobTemplates = pgTable("job_templates", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id"),
  templateName: varchar("template_name", { length: 200 }),
  description: text("description"),
  requirements: text("requirements"),
  responsibilities: text("responsibilities"),
  skills: text("skills"),
  educationLevel: varchar("education_level", { length: 50 }),
  experienceYears: integer("experience_years"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questionnaireTemplates = pgTable("questionnaire_templates", {
  id: serial("id").primaryKey(),
  templateName: varchar("template_name", { length: 200 }),
  templateType: varchar("template_type", { length: 50 }),
  positionId: integer("position_id"),
  departmentId: integer("department_id"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questionnaireQuestions = pgTable("questionnaire_questions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => questionnaireTemplates.id, { onDelete: "cascade" }).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 30 }),
  options: jsonb("options"),
  correctAnswer: text("correct_answer"),
  weight: decimal("weight", { precision: 3, scale: 1 }).default("1.0"),
  sortOrder: integer("sort_order").default(0),
  isRequired: boolean("is_required").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiCvScreenings = pgTable("ai_cv_screenings", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  vacancyId: integer("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
  resumeUrl: text("resume_url"),
  aiScore: decimal("ai_score", { precision: 5, scale: 2 }),
  matchPercentage: decimal("match_percentage", { precision: 5, scale: 2 }),
  skillsMatch: jsonb("skills_match"),
  experienceMatch: jsonb("experience_match"),
  educationMatch: jsonb("education_match"),
  recommendation: varchar("recommendation", { length: 20 }),
  aiNotes: text("ai_notes"),
  modelVersion: varchar("model_version", { length: 30 }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiInterviewSessions = pgTable("ai_interview_sessions", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").references(() => candidates.id, { onDelete: "cascade" }).notNull(),
  vacancyId: integer("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
  sessionToken: varchar("session_token", { length: 100 }).unique(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalQuestions: integer("total_questions"),
  answeredQuestions: integer("answered_questions"),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  technicalScore: decimal("technical_score", { precision: 5, scale: 2 }),
  softSkillsScore: decimal("soft_skills_score", { precision: 5, scale: 2 }),
  aiEvaluation: text("ai_evaluation"),
  recommendation: varchar("recommendation", { length: 20 }),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiInterviewMessages = pgTable("ai_interview_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => aiInterviewSessions.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 20 }),
  content: text("content"),
  questionNumber: integer("question_number"),
  scoreForAnswer: decimal("score_for_answer", { precision: 5, scale: 2 }),
  feedbackForAnswer: text("feedback_for_answer"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertVacancySchema = createInsertSchema(vacancies).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertVacancy = z.infer<typeof insertVacancySchema>;
export type Vacancy = typeof vacancies.$inferSelect;

export const insertCandidateSchema = createInsertSchema(candidates).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true, createdAt: true } as never);
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;

export const insertJobTemplateSchema = createInsertSchema(jobTemplates).omit({ id: true, createdAt: true } as never);
export type InsertJobTemplate = z.infer<typeof insertJobTemplateSchema>;
export type JobTemplate = typeof jobTemplates.$inferSelect;

export const insertQuestionnaireTemplateSchema = createInsertSchema(questionnaireTemplates).omit({ id: true, createdAt: true } as never);
export type InsertQuestionnaireTemplate = z.infer<typeof insertQuestionnaireTemplateSchema>;
export type QuestionnaireTemplate = typeof questionnaireTemplates.$inferSelect;

export const insertQuestionnaireQuestionSchema = createInsertSchema(questionnaireQuestions).omit({ id: true, createdAt: true } as never);
export type InsertQuestionnaireQuestion = z.infer<typeof insertQuestionnaireQuestionSchema>;
export type QuestionnaireQuestion = typeof questionnaireQuestions.$inferSelect;

export const insertAiCvScreeningSchema = createInsertSchema(aiCvScreenings).omit({ id: true, createdAt: true } as never);
export type InsertAiCvScreening = z.infer<typeof insertAiCvScreeningSchema>;
export type AiCvScreening = typeof aiCvScreenings.$inferSelect;

export const insertAiInterviewSessionSchema = createInsertSchema(aiInterviewSessions).omit({ id: true, createdAt: true } as never);
export type InsertAiInterviewSession = z.infer<typeof insertAiInterviewSessionSchema>;
export type AiInterviewSession = typeof aiInterviewSessions.$inferSelect;

export const insertAiInterviewMessageSchema = createInsertSchema(aiInterviewMessages).omit({ id: true } as never);
export type InsertAiInterviewMessage = z.infer<typeof insertAiInterviewMessageSchema>;
export type AiInterviewMessage = typeof aiInterviewMessages.$inferSelect;
