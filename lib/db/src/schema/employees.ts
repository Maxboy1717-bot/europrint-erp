/**
 * @module employees
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, varchar, integer, boolean, timestamp, text, date, decimal, check, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { departments } from "./departments";
import { positions } from "./positions";
import { users } from "./users";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }).unique(),
  employeeCode: varchar("employee_code", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  gender: varchar("gender", { length: 10 }),
  birthDate: date("birth_date"),
  hireDate: date("hire_date").notNull(),
  contractType: varchar("contract_type", { length: 20 }).default("permanent"),
  contractStartDate: date("contract_start_date"),
  contractEndDate: date("contract_end_date"),
  probationEndDate: date("probation_end_date"),
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
  positionId: integer("position_id").references(() => positions.id, { onDelete: "set null" }),
  managerId: integer("manager_id").references((): any => employees.id, { onDelete: "set null" }),
  managerDepartmentId: integer("manager_department_id").references(() => departments.id, { onDelete: "set null" }),
  vysotskiyCategory: varchar("vysotskiy_category", { length: 10 }),
  workCenterId: integer("work_center_id"),
  teamId: integer("team_id"),
  passportSeries: varchar("passport_series", { length: 10 }),
  passportNumber: varchar("passport_number", { length: 10 }),
  passportIssueDate: date("passport_issue_date"),
  passportExpiryDate: date("passport_expiry_date"),
  nationalId: varchar("national_id", { length: 20 }),
  addressRegistered: text("address_registered"),
  addressActual: text("address_actual"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  emailPersonal: varchar("email_personal", { length: 100 }),
  emailWork: varchar("email_work", { length: 100 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  bankAccountNumber: varchar("bank_account_number", { length: 34 }),
  bankAccountCurrency: varchar("bank_account_currency", { length: 3 }).default("UZS"),
  bankName: varchar("bank_name", { length: 100 }),
  photoUrl: text("photo_url"),
  faceEncodingId: varchar("face_encoding_id", { length: 36 }),
  telegramChatId: varchar("telegram_chat_id", { length: 50 }),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  employmentStatus: varchar("employment_status", { length: 20 }).default("active"),
  isBlocked: boolean("is_blocked").default(false),
  blockedReason: text("blocked_reason"),
  blockErpAccess: boolean("block_erp_access").default(false),
  isMachineOperator: boolean("is_machine_operator").default(false),
  corporatePhone: varchar("corporate_phone", { length: 50 }),
  corporateEmail: varchar("corporate_email", { length: 255 }),
  retentionYears: integer("retention_years").default(3),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (t) => [
  check("employees_status_chk", sql`${t.status} IN ('active','inactive','terminated','on_leave','probation')`),
  check("employees_contract_type_chk", sql`${t.contractType} IS NULL OR ${t.contractType} IN ('permanent','contract','probation','part_time','temporary')`),
  index("idx_employees_status").on(t.status),
  index("idx_employees_department_id").on(t.departmentId),
  index("idx_employees_deleted_at").on(t.deletedAt),
]);

export const employmentContracts = pgTable("employment_contracts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  contractNumber: varchar("contract_number", { length: 50 }).unique(),
  contractType: varchar("contract_type", { length: 20 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  positionTitle: varchar("position_title", { length: 100 }),
  departmentName: varchar("department_name", { length: 100 }),
  salaryAmount: decimal("salary_amount", { precision: 12, scale: 2 }),
  probationPeriodDays: integer("probation_period_days").default(90),
  probationEndDate: date("probation_end_date"),
  termsConditions: text("terms_conditions"),
  signatureEmployee: date("signature_employee"),
  signatureManager: date("signature_manager"),
  signatureHr: date("signature_hr"),
  documentUrl: text("document_url"),
  status: varchar("status", { length: 20 }).default("draft"),
  terminationReason: varchar("termination_reason", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("emp_contracts_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('draft','active','expired','terminated')`),
  check("emp_contracts_type_chk", sql`${t.contractType} IS NULL OR ${t.contractType} IN ('permanent','contract','probation','part_time','temporary')`),
]);

export const employeePassports = pgTable("employee_passports", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull().unique(),
  passportSeries: varchar("passport_series", { length: 10 }),
  passportNumber: varchar("passport_number", { length: 10 }),
  passportIssueDate: date("passport_issue_date"),
  passportExpiryDate: date("passport_expiry_date"),
  issueLocation: varchar("issue_location", { length: 100 }),
  isExpired: boolean("is_expired").default(false),
  scannedDocumentUrl: text("scanned_document_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employeeBankAccounts = pgTable("employee_bank_accounts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  accountNumber: varchar("account_number", { length: 34 }),
  accountHolderName: varchar("account_holder_name", { length: 100 }),
  bankName: varchar("bank_name", { length: 100 }),
  bankCode: varchar("bank_code", { length: 10 }),
  currency: varchar("currency", { length: 3 }).default("UZS"),
  isPrimary: boolean("is_primary").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employeeEmergencyContacts = pgTable("employee_emergency_contacts", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  contactName: varchar("contact_name", { length: 100 }),
  relationship: varchar("relationship", { length: 50 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  priorityOrder: integer("priority_order"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeFiles = pgTable("employee_files", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }),
  fileType: varchar("file_type", { length: 50 }),
  fileUrl: text("file_url"),
  category: varchar("category", { length: 50 }),
  uploadDate: timestamp("upload_date").defaultNow(),
  uploadedBy: integer("uploaded_by"),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export const insertEmploymentContractSchema = createInsertSchema(employmentContracts).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertEmploymentContract = z.infer<typeof insertEmploymentContractSchema>;
export type EmploymentContract = typeof employmentContracts.$inferSelect;

export const insertEmployeePassportSchema = createInsertSchema(employeePassports).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertEmployeePassport = z.infer<typeof insertEmployeePassportSchema>;
export type EmployeePassport = typeof employeePassports.$inferSelect;

export const insertEmployeeBankAccountSchema = createInsertSchema(employeeBankAccounts).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertEmployeeBankAccount = z.infer<typeof insertEmployeeBankAccountSchema>;
export type EmployeeBankAccount = typeof employeeBankAccounts.$inferSelect;

export const insertEmployeeEmergencyContactSchema = createInsertSchema(employeeEmergencyContacts).omit({ id: true, createdAt: true } as never);
export type InsertEmployeeEmergencyContact = z.infer<typeof insertEmployeeEmergencyContactSchema>;
export type EmployeeEmergencyContact = typeof employeeEmergencyContacts.$inferSelect;

export const insertEmployeeFileSchema = createInsertSchema(employeeFiles).omit({ id: true } as never);
export type InsertEmployeeFile = z.infer<typeof insertEmployeeFileSchema>;
export type EmployeeFile = typeof employeeFiles.$inferSelect;
