/**
 * @module hr-employees-docs
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { questionnaireTemplates, questionnaireQuestions, questionnaireResponses, jobTemplates, vacancies, candidates, interviews } from "./hr-questionnaire";

// Employee Passports — canonical: employees.ts (types exported via hr-personal-core)
export { employeePassports } from "./employees";

// Employee Bank Accounts — canonical: employees.ts (types exported via hr-personal-core)
export { employeeBankAccounts } from "./employees";

// Employee Emergency Contacts — canonical: employees.ts (types exported via hr-personal-core)
export { employeeEmergencyContacts } from "./employees";

// Employment Contracts — canonical: employees.ts (types exported via hr-personal-core)
export { employmentContracts } from "./employees";

// Salary History — canonical: payroll.ts (types exported via hr-personal-core)
export { salaryHistory } from "./payroll";

// Cash Advances — canonical: payroll.ts (types exported via hr-personal-core)
export { cashAdvances } from "./payroll";

// Bonus Payments — canonical: payroll.ts (types exported via hr-personal-core)
export { bonusPayments } from "./payroll";

// Employee Fines — canonical: payroll.ts (types exported via hr-personal-core)
export { employeeFines } from "./payroll";

// Overtime Payments — canonical: payroll.ts (types exported via hr-personal-core)
export { overtimePayments } from "./payroll";

// Leave Requests — canonical: leave.ts (types exported via hr-personal-core)
export { leaveRequests } from "./leave";

// Sick Leaves — canonical: leave.ts (types exported via hr-personal-core)
export { sickLeaves } from "./leave";

// Business Trips — canonical: leave.ts (types exported via hr-personal-core)
export { businessTrips } from "./leave";

export const insertQuestionnaireTemplateSchema = createInsertSchema(questionnaireTemplates).omit({ id: true, createdAt: true } as never);

export const insertQuestionnaireQuestionSchema = createInsertSchema(questionnaireQuestions).omit({ id: true, createdAt: true } as never);

export const insertQuestionnaireResponseSchema = createInsertSchema(questionnaireResponses).omit({ id: true, createdAt: true } as never);

export const insertJobTemplateSchema = createInsertSchema(jobTemplates).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const insertVacancySchema = createInsertSchema(vacancies).omit({ id: true, createdAt: true } as never);

export const insertCandidateSchema = createInsertSchema(candidates).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true, createdAt: true } as never);
