/**
 * @module leave
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, date, uniqueIndex, check, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  // Multi-tenancy (Phase 2 / Task 2.1). See employees.ts for rationale.
  tenantId: integer("tenant_id").notNull().default(1),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  leaveType: varchar("leave_type", { length: 20 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  durationDays: integer("duration_days"),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default("draft"),
  submittedBy: integer("submitted_by"),
  submittedDate: timestamp("submitted_date"),
  managerReviewDate: date("manager_review_date"),
  managerStatus: varchar("manager_status", { length: 20 }).default("pending"),
  managerNotes: text("manager_notes"),
  hrReviewDate: date("hr_review_date"),
  hrStatus: varchar("hr_status", { length: 20 }).default("pending"),
  hrNotes: text("hr_notes"),
  directorReviewDate: date("director_review_date"),
  directorStatus: varchar("director_status", { length: 20 }).default("pending"),
  directorNotes: text("director_notes"),
  medicalCertificateUrl: text("medical_certificate_url"),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Convergence additions (live-DB superset)
  userId: integer("user_id"),
  totalDays: integer("total_days"),
  approvedBy: integer("approved_by"),
  approvedDate: date("approved_date"),
  notes: text("notes"),
  deletedAt: timestamp("deleted_at"),
  daysRequested: integer("days_requested"),
  approvedAt: timestamp("approved_at"),
  rejectedBy: integer("rejected_by"),
  rejectionReason: text("rejection_reason"),
}, (t) => [
  check("leave_requests_status_chk", sql`${t.status} IN ('draft','pending','approved','rejected','cancelled')`),
  check("leave_requests_manager_status_chk", sql`${t.managerStatus} IN ('pending','approved','rejected')`),
  check("leave_requests_hr_status_chk", sql`${t.hrStatus} IN ('pending','approved','rejected')`),
  check("leave_requests_director_status_chk", sql`${t.directorStatus} IN ('pending','approved','rejected')`),
  check("leave_requests_duration_chk", sql`${t.durationDays} IS NULL OR ${t.durationDays} >= 0`),
  check("leave_requests_dates_chk", sql`${t.endDate} >= ${t.startDate}`),
  index("idx_leave_requests_employee_id").on(t.employeeId),
  index("idx_leave_requests_status").on(t.status),
  index("idx_leave_requests_tenant_id").on(t.tenantId),
  index("idx_leave_requests_start_date").on(t.startDate),
  index("idx_leave_requests_leave_type").on(t.leaveType),
]);

export const sickLeaves = pgTable("sick_leaves", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  sickLeaveDate: date("sick_leave_date").notNull(),
  durationDays: integer("duration_days"),
  medicalCertificateNumber: varchar("medical_certificate_number", { length: 50 }),
  medicalCertificateUrl: text("medical_certificate_url"),
  doctorName: varchar("doctor_name", { length: 100 }),
  clinicName: varchar("clinic_name", { length: 100 }),
  diagnosisCode: varchar("diagnosis_code", { length: 10 }),
  isApproved: boolean("is_approved").default(false),
  approvedBy: integer("approved_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_sick_leaves_employee_id").on(t.employeeId),
  index("idx_sick_leaves_sick_leave_date").on(t.sickLeaveDate),
  check("sick_leaves_duration_chk", sql`${t.durationDays} IS NULL OR ${t.durationDays} >= 0`),
]);

export const businessTrips = pgTable("business_trips", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  tripPurpose: varchar("trip_purpose", { length: 255 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  destinationCity: varchar("destination_city", { length: 100 }),
  destinationCountry: varchar("destination_country", { length: 100 }),
  approvedBy: integer("approved_by"),
  approvalDate: date("approval_date"),
  dailyAllowance: decimal("daily_allowance", { precision: 10, scale: 2 }),
  transportCost: decimal("transport_cost", { precision: 12, scale: 2 }),
  accommodationCost: decimal("accommodation_cost", { precision: 12, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 20 }).default("planned"),
  reportUrl: text("report_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("business_trips_status_chk", sql`${t.status} IN ('planned','approved','in_progress','completed','cancelled')`),
  check("business_trips_daily_allowance_chk", sql`${t.dailyAllowance} IS NULL OR ${t.dailyAllowance} >= 0`),
  check("business_trips_transport_cost_chk", sql`${t.transportCost} IS NULL OR ${t.transportCost} >= 0`),
  check("business_trips_accommodation_cost_chk", sql`${t.accommodationCost} IS NULL OR ${t.accommodationCost} >= 0`),
  check("business_trips_total_cost_chk", sql`${t.totalCost} IS NULL OR ${t.totalCost} >= 0`),
  check("business_trips_dates_chk", sql`${t.endDate} >= ${t.startDate}`),
  index("idx_business_trips_employee_id").on(t.employeeId),
  index("idx_business_trips_status").on(t.status),
  index("idx_business_trips_start_date").on(t.startDate),
]);

export const leaveBalances = pgTable("leave_balances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  leaveType: varchar("leave_type", { length: 20 }).notNull(),
  year: integer("year").notNull(),
  totalEntitlement: integer("total_entitlement").default(24),
  usedDays: integer("used_days").default(0),
  pendingDays: integer("pending_days").default(0),
  remainingDays: integer("remaining_days").default(24),
  carriedOverDays: integer("carried_over_days").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  check("leave_balances_used_days_chk", sql`${table.usedDays} >= 0`),
  check("leave_balances_pending_days_chk", sql`${table.pendingDays} >= 0`),
  check("leave_balances_remaining_days_chk", sql`${table.remainingDays} >= 0`),
  uniqueIndex("uq_leave_balance_emp_type_year").on(table.employeeId, table.leaveType, table.year),
  index("idx_leave_balances_employee_id").on(table.employeeId),
  index("idx_leave_balances_year").on(table.year),
]);

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;

export const insertSickLeaveSchema = createInsertSchema(sickLeaves).omit({ id: true, createdAt: true } as never);
export type InsertSickLeave = z.infer<typeof insertSickLeaveSchema>;
export type SickLeave = typeof sickLeaves.$inferSelect;

export const insertBusinessTripSchema = createInsertSchema(businessTrips).omit({ id: true, createdAt: true } as never);
export type InsertBusinessTrip = z.infer<typeof insertBusinessTripSchema>;
export type BusinessTrip = typeof businessTrips.$inferSelect;

export const insertLeaveBalanceSchema = createInsertSchema(leaveBalances).omit({ id: true, updatedAt: true } as never);
export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;
export type LeaveBalance = typeof leaveBalances.$inferSelect;
