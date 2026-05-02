import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, unique, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { Admin, Position, admins, departments, positions, users } from "./core-schema";
import { cameraZones, cameras } from "./iot-schema";
import { Mentor, courses, progress, skills } from "./lms-schema";
import { workCenters } from "./pp-schema";
import { questionnaireTemplates, questionnaireQuestions, questionnaireResponses, jobTemplates, vacancies, candidates, interviews } from "./hr-questionnaire";

export const employeePassports = pgTable("employee_passports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  passportNumber: varchar("passport_number", { length: 20 }).notNull(),
  passportSeries: varchar("passport_series", { length: 10 }),
  issuedBy: varchar("issued_by", { length: 255 }), // Kim tomonidan berilgan
  issuedDate: varchar("issued_date", { length: 10 }), // Berilgan sana (YYYY-MM-DD)
  expiryDate: varchar("expiry_date", { length: 10 }), // Amal qilish muddati (YYYY-MM-DD)
  birthPlace: varchar("birth_place", { length: 255 }), // Tug'ilgan joy
  citizenship: varchar("citizenship", { length: 100 }).default("Uzbekistan"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_employee_passports_user_id").on(t.userId),
]);


// Employee Bank Accounts
export const employeeBankAccounts = pgTable("employee_bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  cardNumber: varchar("card_number", { length: 50 }),
  cardHolderName: varchar("card_holder_name", { length: 255 }),
  mfo: varchar("mfo", { length: 20 }), // Bank MFO kodi
  inn: varchar("inn", { length: 20 }), // INN raqami
  isPrimary: boolean("is_primary").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_employee_bank_accounts_user_id").on(t.userId),
]);


// Employee Emergency Contacts
export const employeeEmergencyContacts = pgTable("employee_emergency_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contactName: varchar("contact_name", { length: 255 }).notNull(), // Ism
  relationship: varchar("relationship", { length: 100 }).notNull(), // Qarindoshlik
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  alternativePhone: varchar("alternative_phone", { length: 20 }),
  address: text("address"),
  isPrimary: boolean("is_primary").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_employee_emergency_contacts_user_id").on(t.userId),
]);


// Employment Contracts (Mehnat shartnomalari)
export const employmentContracts = pgTable("employment_contracts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contractNumber: varchar("contract_number", { length: 50 }).notNull(),
  contractType: varchar("contract_type", { length: 30 }).notNull(), // indefinite, fixed_term, seasonal, part_time
  startDate: varchar("start_date", { length: 10 }).notNull(), // YYYY-MM-DD
  endDate: varchar("end_date", { length: 10 }), // null for indefinite
  salary: numericMoney("salary").notNull(),
  salaryCurrency: varchar("salary_currency", { length: 3 }).notNull().default("UZS"),
  probationEndDate: varchar("probation_end_date", { length: 10 }),
  workSchedule: varchar("work_schedule", { length: 50 }), // 5x8, 6x6, shift
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_employment_contracts_user_id").on(t.userId),
  index("idx_employment_contracts_is_active").on(t.isActive),
]);


// Salary History (Maosh tarixi)
export const salaryHistory = pgTable("salary_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  effectiveDate: varchar("effective_date", { length: 10 }).notNull(), // YYYY-MM-DD
  previousSalary: numericMoney("previous_salary"),
  newSalary: numericMoney("new_salary").notNull(),
  changeType: varchar("change_type", { length: 30 }).notNull(), // promotion, annual_review, adjustment, probation_end
  changePercent: numericMoney("change_percent"),
  reason: text("reason"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_salary_history_user_id").on(t.userId),
]);


// Cash Advances (Avanslar)
export const cashAdvances = pgTable("cash_advances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  requestDate: varchar("request_date", { length: 10 }).notNull(),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, paid
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedDate: varchar("approved_date", { length: 10 }),
  paidDate: varchar("paid_date", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_cash_advances_user_id").on(t.userId),
  index("idx_cash_advances_status").on(t.status),
]);


// Bonus Payments (Bonuslar)
export const bonusPayments = pgTable("bonus_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paymentDate: varchar("payment_date", { length: 10 }).notNull(),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  bonusType: varchar("bonus_type", { length: 30 }).notNull(), // performance, annual, holiday, project, other
  description: text("description"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_bonus_payments_user_id").on(t.userId),
]);


// Employee Fines (Jarimalar)
export const employeeFines = pgTable("employee_fines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fineDate: varchar("fine_date", { length: 10 }).notNull(),
  amount: numericMoney("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  fineType: varchar("fine_type", { length: 30 }).notNull(), // late, absence, damage, quality, safety, other
  description: text("description"),
  deductedFromSalary: boolean("deducted_from_salary").notNull().default(false),
  deductionDate: varchar("deduction_date", { length: 10 }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_employee_fines_user_id").on(t.userId),
]);


// Overtime Payments (Overtaym to'lovlar)
export const overtimePayments = pgTable("overtime_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workDate: varchar("work_date", { length: 10 }).notNull(),
  hours: numericMoney("hours").notNull(),
  hourlyRate: numericMoney("hourly_rate").notNull(),
  multiplier: numericMoney("multiplier").notNull().default(1.5), // 1.5x, 2x for holidays
  totalAmount: numericMoney("total_amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  reason: text("reason"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_overtime_payments_user_id").on(t.userId),
]);


// Leave Requests (Ta'til so'rovlari)
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  leaveType: varchar("leave_type", { length: 30 }).notNull(), // annual, sick, unpaid, maternity, paternity, study
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, cancelled
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedDate: varchar("approved_date", { length: 10 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  index("idx_leave_requests_user_id").on(t.userId),
  index("idx_leave_requests_status").on(t.status),
  index("idx_leave_requests_created_at").on(t.createdAt),
  index("idx_leave_requests_leave_type").on(t.leaveType),
]);


// Sick Leaves (Kasallik varaqalari)
export const sickLeaves = pgTable("sick_leaves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  totalDays: integer("total_days").notNull(),
  diagnosis: text("diagnosis"),
  hospitalName: varchar("hospital_name", { length: 255 }),
  doctorName: varchar("doctor_name", { length: 255 }),
  documentNumber: varchar("document_number", { length: 50 }),
  isPaid: boolean("is_paid").notNull().default(true),
  paymentPercent: integer("payment_percent").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_sick_leaves_user_id").on(t.userId),
]);


// Business Trips (Xizmat safaralari)
export const businessTrips = pgTable("business_trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  destination: varchar("destination", { length: 255 }).notNull(),
  purpose: text("purpose").notNull(),
  startDate: varchar("start_date", { length: 10 }).notNull(),
  endDate: varchar("end_date", { length: 10 }).notNull(),
  totalDays: integer("total_days").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("planned"), // planned, in_progress, completed, cancelled
  dailyAllowance: numericMoney("daily_allowance"),
  transportCost: numericMoney("transport_cost"),
  accommodationCost: numericMoney("accommodation_cost"),
  totalCost: numericMoney("total_cost"),
  currency: varchar("currency", { length: 3 }).notNull().default("UZS"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_business_trips_user_id").on(t.userId),
  index("idx_business_trips_status").on(t.status),
]);

export const insertQuestionnaireTemplateSchema = createInsertSchema(questionnaireTemplates).omit({ id: true, createdAt: true } as never);

export const insertQuestionnaireQuestionSchema = createInsertSchema(questionnaireQuestions).omit({ id: true, createdAt: true } as never);

export const insertQuestionnaireResponseSchema = createInsertSchema(questionnaireResponses).omit({ id: true, createdAt: true } as never);

export const insertJobTemplateSchema = createInsertSchema(jobTemplates).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const insertVacancySchema = createInsertSchema(vacancies).omit({ id: true, createdAt: true } as never);

export const insertCandidateSchema = createInsertSchema(candidates).omit({ id: true, createdAt: true, updatedAt: true } as never);

export const insertInterviewSchema = createInsertSchema(interviews).omit({ id: true, createdAt: true } as never);
