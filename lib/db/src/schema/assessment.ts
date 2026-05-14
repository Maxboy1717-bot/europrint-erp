/**
 * @module assessment
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, text, decimal, date, boolean, jsonb, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const employee360Assessments = pgTable("employee_360_assessments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  assessmentPeriod: varchar("assessment_period", { length: 30 }),
  assessmentYear: integer("assessment_year"),
  selfRating: decimal("self_rating", { precision: 3, scale: 1 }),
  managerRating: decimal("manager_rating", { precision: 3, scale: 1 }),
  peerRating: decimal("peer_rating", { precision: 3, scale: 1 }),
  subordinateRating: decimal("subordinate_rating", { precision: 3, scale: 1 }),
  averageRating: decimal("average_rating", { precision: 3, scale: 1 }),
  strengths: text("strengths"),
  areasForImprovement: text("areas_for_improvement"),
  developmentPlan: text("development_plan"),
  status: varchar("status", { length: 20 }).default("draft"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("employee_360_assessments_status_chk", sql`${t.status} IN ('draft','in_progress','completed','cancelled')`),
  check("employee_360_assessments_avg_rating_chk", sql`${t.averageRating} IS NULL OR (${t.averageRating} >= 0 AND ${t.averageRating} <= 5)`),
]);

export const employee360Responses = pgTable("employee_360_responses", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").references(() => employee360Assessments.id, { onDelete: "cascade" }).notNull(),
  respondentId: integer("respondent_id").references(() => employees.id, { onDelete: "set null" }),
  respondentType: varchar("respondent_type", { length: 20 }), // self, manager, peer, subordinate
  questionCategory: varchar("question_category", { length: 50 }),
  questionText: text("question_text"),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  comments: text("comments"),
  isAnonymous: boolean("is_anonymous").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("employee_360_responses_type_chk", sql`${t.respondentType} IS NULL OR ${t.respondentType} IN ('self','manager','peer','subordinate')`),
  check("employee_360_responses_rating_chk", sql`${t.rating} IS NULL OR (${t.rating} >= 0 AND ${t.rating} <= 5)`),
]);

export const employeeStrengthsWeaknesses = pgTable("employee_strengths_weaknesses", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  category: varchar("category", { length: 50 }),
  description: text("description"),
  evidenceDescription: text("evidence_description"),
  identifiedBy: integer("identified_by"),
  identifiedDate: date("identified_date"),
  actionPlan: text("action_plan"),
  targetDate: date("target_date"),
  status: varchar("status", { length: 20 }).default("identified"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("employee_sw_type_chk", sql`${t.type} IN ('strength','weakness')`),
  check("employee_sw_status_chk", sql`${t.status} IN ('identified','in_progress','improved','resolved')`),
]);

export const successionPlans = pgTable("succession_plans", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id"),
  currentHolderId: integer("current_holder_id").references(() => employees.id, { onDelete: "set null" }),
  candidateId: integer("candidate_id").references(() => employees.id, { onDelete: "set null" }),
  readinessLevel: varchar("readiness_level", { length: 20 }), // ready_now, 1_2_years, 3_5_years, not_ready
  developmentGaps: text("development_gaps"),
  developmentPlan: text("development_plan"),
  targetDate: date("target_date"),
  priority: integer("priority").default(1),
  status: varchar("status", { length: 20 }).default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("succession_plans_readiness_chk", sql`${t.readinessLevel} IS NULL OR ${t.readinessLevel} IN ('ready_now','1_2_years','3_5_years','not_ready')`),
  check("succession_plans_status_chk", sql`${t.status} IN ('draft','active','completed','cancelled')`),
]);

export const employeeTransferHistory = pgTable("employee_transfer_history", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  transferDate: date("transfer_date").notNull(),
  fromDepartmentId: integer("from_department_id"),
  toDepartmentId: integer("to_department_id"),
  fromPositionId: integer("from_position_id"),
  toPositionId: integer("to_position_id"),
  transferType: varchar("transfer_type", { length: 30 }),
  reason: text("reason"),
  approvedBy: integer("approved_by"),
  salaryBefore: decimal("salary_before", { precision: 12, scale: 2 }),
  salaryAfter: decimal("salary_after", { precision: 12, scale: 2 }),
  orderNumber: varchar("order_number", { length: 50 }),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exitInterviews = pgTable("exit_interviews", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  interviewDate: date("interview_date").notNull(),
  interviewedBy: integer("interviewed_by"),
  reasonForLeaving: varchar("reason_for_leaving", { length: 100 }),
  satisfactionRating: integer("satisfaction_rating"),
  wouldRecommend: boolean("would_recommend"),
  wouldReturn: boolean("would_return"),
  feedbackManagement: text("feedback_management"),
  feedbackWorkEnvironment: text("feedback_work_environment"),
  feedbackCompensation: text("feedback_compensation"),
  feedbackGrowth: text("feedback_growth"),
  suggestions: text("suggestions"),
  overallComments: text("overall_comments"),
  // Offboarding V2 extensions — structured answers + settlement block
  offboardingCaseId: integer("offboarding_case_id"),
  answers: jsonb("answers"),
  blocksSettlement: boolean("blocks_settlement").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmployee360AssessmentSchema = createInsertSchema(employee360Assessments).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertEmployee360Assessment = z.infer<typeof insertEmployee360AssessmentSchema>;
export type Employee360Assessment = typeof employee360Assessments.$inferSelect;

export const insertEmployee360ResponseSchema = createInsertSchema(employee360Responses).omit({ id: true, createdAt: true } as never);
export type InsertEmployee360Response = z.infer<typeof insertEmployee360ResponseSchema>;
export type Employee360Response = typeof employee360Responses.$inferSelect;

export const insertEmployeeStrengthsWeaknessesSchema = createInsertSchema(employeeStrengthsWeaknesses).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertEmployeeStrengthsWeaknesses = z.infer<typeof insertEmployeeStrengthsWeaknessesSchema>;
export type EmployeeStrengthsWeakness = typeof employeeStrengthsWeaknesses.$inferSelect;

export const insertSuccessionPlanSchema = createInsertSchema(successionPlans).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertSuccessionPlan = z.infer<typeof insertSuccessionPlanSchema>;
export type SuccessionPlan = typeof successionPlans.$inferSelect;

export const insertEmployeeTransferHistorySchema = createInsertSchema(employeeTransferHistory).omit({ id: true, createdAt: true } as never);
export type InsertEmployeeTransferHistory = z.infer<typeof insertEmployeeTransferHistorySchema>;
export type EmployeeTransferHistory = typeof employeeTransferHistory.$inferSelect;

export const insertExitInterviewSchema = createInsertSchema(exitInterviews).omit({ id: true, createdAt: true } as never);
export type InsertExitInterview = z.infer<typeof insertExitInterviewSchema>;
export type ExitInterview = typeof exitInterviews.$inferSelect;
