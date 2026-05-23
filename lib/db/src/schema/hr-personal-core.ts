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


// positionRequiredCourses — canonical: lms.ts
export { positionRequiredCourses } from "./lms";

// disciplineRecords — canonical: discipline.ts
export { disciplineRecords } from "./discipline";


// Attendance (davomat) — canonical: attendance.ts
export { attendance } from "./attendance";


// ABC Performance Analysis