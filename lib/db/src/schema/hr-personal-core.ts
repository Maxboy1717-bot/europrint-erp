/**
 * @module hr-personal-core
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Admin, Position, admins, departments, positions, users } from "./core-schema";
import { cameraZones, cameras } from "./iot-schema";
import { Mentor, courses, progress, skills } from "./lms-schema";
import { workCenters } from "./pp-schema";
import { certificates, employeePassports, employeeBankAccounts, employeeEmergencyContacts, employmentContracts, salaryHistory, cashAdvances, bonusPayments, employeeFines, overtimePayments, leaveRequests, sickLeaves, businessTrips, questionnaireTemplates, questionnaireQuestions, questionnaireResponses, jobTemplates, vacancies, candidates, interviews, insertQuestionnaireTemplateSchema, insertQuestionnaireQuestionSchema, insertQuestionnaireResponseSchema, insertJobTemplateSchema, insertVacancySchema, insertCandidateSchema, insertInterviewSchema } from "./hr-recruitment";

export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issuedAt: true, certificateNumber: true } as never);

export const insertEmployeePassportSchema = createInsertSchema(employeePassports).omit({ id: true, createdAt: true } as never);

export const insertEmployeeBankAccountSchema = createInsertSchema(employeeBankAccounts).omit({ id: true, createdAt: true } as never);

export const insertEmployeeEmergencyContactSchema = createInsertSchema(employeeEmergencyContacts).omit({ id: true, createdAt: true } as never);

export const insertEmploymentContractSchema = createInsertSchema(employmentContracts).omit({ id: true, createdAt: true } as never);

export const insertSalaryHistorySchema = createInsertSchema(salaryHistory).omit({ id: true, createdAt: true } as never);

export const insertCashAdvanceSchema = createInsertSchema(cashAdvances).omit({ id: true, createdAt: true } as never);

export const insertBonusPaymentSchema = createInsertSchema(bonusPayments).omit({ id: true, createdAt: true } as never);

export const insertEmployeeFineSchema = createInsertSchema(employeeFines).omit({ id: true, createdAt: true } as never);

export const insertOvertimePaymentSchema = createInsertSchema(overtimePayments).omit({ id: true, createdAt: true } as never);

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true, createdAt: true } as never);

export const insertSickLeaveSchema = createInsertSchema(sickLeaves).omit({ id: true, createdAt: true } as never);

export const insertBusinessTripSchema = createInsertSchema(businessTrips).omit({ id: true, createdAt: true } as never);

export type QuestionnaireTemplate = typeof questionnaireTemplates.$inferSelect;

export type InsertQuestionnaireTemplate = z.infer<typeof insertQuestionnaireTemplateSchema>;

export type QuestionnaireQuestion = typeof questionnaireQuestions.$inferSelect;

export type InsertQuestionnaireQuestion = z.infer<typeof insertQuestionnaireQuestionSchema>;

export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;

export type InsertQuestionnaireResponse = z.infer<typeof insertQuestionnaireResponseSchema>;

export type JobTemplate = typeof jobTemplates.$inferSelect;

export type InsertJobTemplate = z.infer<typeof insertJobTemplateSchema>;

export type Vacancy = typeof vacancies.$inferSelect;

export type InsertVacancy = z.infer<typeof insertVacancySchema>;

export type Candidate = typeof candidates.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type Interview = typeof interviews.$inferSelect;

export type InsertInterview = z.infer<typeof insertInterviewSchema>;

export type Certificate = typeof certificates.$inferSelect;

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;

export type EmployeePassport = typeof employeePassports.$inferSelect;

export type InsertEmployeePassport = z.infer<typeof insertEmployeePassportSchema>;

export type EmployeeBankAccount = typeof employeeBankAccounts.$inferSelect;

export type InsertEmployeeBankAccount = z.infer<typeof insertEmployeeBankAccountSchema>;

export type EmployeeEmergencyContact = typeof employeeEmergencyContacts.$inferSelect;

export type InsertEmployeeEmergencyContact = z.infer<typeof insertEmployeeEmergencyContactSchema>;

export type EmploymentContract = typeof employmentContracts.$inferSelect;

export type InsertEmploymentContract = z.infer<typeof insertEmploymentContractSchema>;

export type SalaryHistory = typeof salaryHistory.$inferSelect;

export type InsertSalaryHistory = z.infer<typeof insertSalaryHistorySchema>;

export type CashAdvance = typeof cashAdvances.$inferSelect;

export type InsertCashAdvance = z.infer<typeof insertCashAdvanceSchema>;

export type BonusPayment = typeof bonusPayments.$inferSelect;

export type InsertBonusPayment = z.infer<typeof insertBonusPaymentSchema>;

export type EmployeeFine = typeof employeeFines.$inferSelect;

export type InsertEmployeeFine = z.infer<typeof insertEmployeeFineSchema>;

export type OvertimePayment = typeof overtimePayments.$inferSelect;

export type InsertOvertimePayment = z.infer<typeof insertOvertimePaymentSchema>;

export type LeaveRequest = typeof leaveRequests.$inferSelect;

export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

export type SickLeave = typeof sickLeaves.$inferSelect;

export type InsertSickLeave = z.infer<typeof insertSickLeaveSchema>;

export type BusinessTrip = typeof businessTrips.$inferSelect;

export type InsertBusinessTrip = z.infer<typeof insertBusinessTripSchema>;


// Position Required Courses (lavozim bo'yicha majburiy kurslar)
export const positionRequiredCourses = pgTable("position_required_courses", {
  id: serial("id").primaryKey(),
  positionId: varchar("position_id").notNull().references(() => positions.id, { onDelete: "cascade" }),
  courseId: varchar("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  isOnboarding: boolean("is_onboarding").notNull().default(false), // Is this an onboarding course?
  daysToComplete: integer("days_to_complete"), // How many days to complete after hire
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// Discipline Records (hayfsan/mukofot)
export const disciplineRecords = pgTable("discipline_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // warning, penalty, reward
  amount: numericMoney("amount"), // Bonus or penalty amount
  reason: text("reason").notNull(),
  reasonRu: text("reason_ru"),
  givenBy: integer("given_by").references(() => users.id, { onDelete: 'set null' }), // Admin/HR who issued
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


// Attendance (davomat)
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  checkIn: varchar("check_in", { length: 8 }), // HH:MM:SS
  checkOut: varchar("check_out", { length: 8 }), // HH:MM:SS
  isLate: boolean("is_late").notNull().default(false),
  isEarlyLeave: boolean("is_early_leave").notNull().default(false),
  minutesLate: integer("minutes_late").default(0),
  minutesEarly: integer("minutes_early").default(0),
  status: varchar("status", { length: 20 }).notNull().default("present"), // present, absent, leave, sick
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// ABC Performance Analysis