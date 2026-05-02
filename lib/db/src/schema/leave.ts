import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
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
});

export const sickLeaves = pgTable("sick_leaves", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
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
});

export const businessTrips = pgTable("business_trips", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
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
});

export const leaveBalances = pgTable("leave_balances", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  leaveType: varchar("leave_type", { length: 20 }).notNull(),
  year: integer("year").notNull(),
  totalEntitlement: integer("total_entitlement").default(24),
  usedDays: integer("used_days").default(0),
  pendingDays: integer("pending_days").default(0),
  remainingDays: integer("remaining_days").default(24),
  carriedOverDays: integer("carried_over_days").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_leave_balance_emp_type_year").on(table.employeeId, table.leaveType, table.year),
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
