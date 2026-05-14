/**
 * @module payroll
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const salaryHistory = pgTable("salary_history", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  salaryPeriodStart: date("salary_period_start").notNull(),
  salaryPeriodEnd: date("salary_period_end").notNull(),
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }),
  daysWorked: integer("days_worked"),
  hoursWorked: decimal("hours_worked", { precision: 6, scale: 2 }),
  salaryEarned: decimal("salary_earned", { precision: 12, scale: 2 }),
  abcBonus: decimal("abc_bonus", { precision: 12, scale: 2 }),
  performanceBonus: decimal("performance_bonus", { precision: 12, scale: 2 }),
  attendanceBonus: decimal("attendance_bonus", { precision: 12, scale: 2 }),
  otherBonuses: decimal("other_bonuses", { precision: 12, scale: 2 }),
  totalBonuses: decimal("total_bonuses", { precision: 12, scale: 2 }),
  overtimeHours15x: decimal("overtime_hours_1_5x", { precision: 6, scale: 2 }),
  overtimeHours20x: decimal("overtime_hours_2_0x", { precision: 6, scale: 2 }),
  overtimePayment: decimal("overtime_payment", { precision: 12, scale: 2 }),
  inps12Percent: decimal("inps_12_percent", { precision: 12, scale: 2 }),
  jshd12Percent: decimal("jshd_12_percent", { precision: 12, scale: 2 }),
  taxPersonalIncome: decimal("tax_personal_income", { precision: 12, scale: 2 }),
  otherDeductions: decimal("other_deductions", { precision: 12, scale: 2 }),
  totalDeductions: decimal("total_deductions", { precision: 12, scale: 2 }),
  fines: decimal("fines", { precision: 12, scale: 2 }),
  cashAdvanceRepayment: decimal("cash_advance_repayment", { precision: 12, scale: 2 }),
  netSalary: decimal("net_salary", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 20 }).default("draft"),
  paidDate: date("paid_date"),
  paidBy: integer("paid_by"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bonusPayments = pgTable("bonus_payments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  bonusType: varchar("bonus_type", { length: 30 }),
  bonusPeriodStart: date("bonus_period_start"),
  bonusPeriodEnd: date("bonus_period_end"),
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }),
  bonusPercentage: decimal("bonus_percentage", { precision: 5, scale: 2 }),
  bonusAmount: decimal("bonus_amount", { precision: 12, scale: 2 }),
  reason: text("reason"),
  approvedBy: integer("approved_by"),
  approvalDate: date("approval_date"),
  paymentDate: date("payment_date"),
  status: varchar("status", { length: 20 }).default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const overtimePayments = pgTable("overtime_payments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  overtimeDate: date("overtime_date").notNull(),
  overtimeHours: decimal("overtime_hours", { precision: 6, scale: 2 }),
  overtimeType: varchar("overtime_type", { length: 20 }),
  multiplier: decimal("multiplier", { precision: 3, scale: 1 }),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  overtimePayment: decimal("overtime_payment", { precision: 12, scale: 2 }),
  approvedBy: integer("approved_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employeeFines = pgTable("employee_fines", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  fineDate: date("fine_date").notNull(),
  fineAmount: decimal("fine_amount", { precision: 12, scale: 2 }),
  fineReason: varchar("fine_reason", { length: 255 }),
  relatedDisciplineId: integer("related_discipline_id"),
  approvedBy: integer("approved_by"),
  status: varchar("status", { length: 20 }).default("pending"),
  paymentDate: date("payment_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cashAdvances = pgTable("cash_advances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  advanceAmount: decimal("advance_amount", { precision: 12, scale: 2 }),
  advanceDate: date("advance_date").notNull(),
  requestedDate: date("requested_date"),
  approvedBy: integer("approved_by"),
  approvalDate: date("approval_date"),
  repaymentStartDate: date("repayment_start_date"),
  repaymentMonths: integer("repayment_months"),
  monthlyRepayment: decimal("monthly_repayment", { precision: 12, scale: 2 }),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default("requested"),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salaryBands = pgTable("salary_bands", {
  id: serial("id").primaryKey(),
  positionId: integer("position_id"),
  departmentId: integer("department_id"),
  minSalary: decimal("min_salary", { precision: 12, scale: 2 }),
  maxSalary: decimal("max_salary", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("UZS"),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSalaryHistorySchema = createInsertSchema(salaryHistory).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertSalaryHistory = z.infer<typeof insertSalaryHistorySchema>;
export type SalaryHistory = typeof salaryHistory.$inferSelect;

export const insertBonusPaymentSchema = createInsertSchema(bonusPayments).omit({ id: true, createdAt: true } as never);
export type InsertBonusPayment = z.infer<typeof insertBonusPaymentSchema>;
export type BonusPayment = typeof bonusPayments.$inferSelect;

export const insertOvertimePaymentSchema = createInsertSchema(overtimePayments).omit({ id: true, createdAt: true } as never);
export type InsertOvertimePayment = z.infer<typeof insertOvertimePaymentSchema>;
export type OvertimePayment = typeof overtimePayments.$inferSelect;

export const insertEmployeeFineSchema = createInsertSchema(employeeFines).omit({ id: true, createdAt: true } as never);
export type InsertEmployeeFine = z.infer<typeof insertEmployeeFineSchema>;
export type EmployeeFine = typeof employeeFines.$inferSelect;

export const insertCashAdvanceSchema = createInsertSchema(cashAdvances).omit({ id: true, createdAt: true } as never);
export type InsertCashAdvance = z.infer<typeof insertCashAdvanceSchema>;
export type CashAdvance = typeof cashAdvances.$inferSelect;

export const insertSalaryBandSchema = createInsertSchema(salaryBands).omit({ id: true, createdAt: true } as never);
export type InsertSalaryBand = z.infer<typeof insertSalaryBandSchema>;
export type SalaryBand = typeof salaryBands.$inferSelect;
