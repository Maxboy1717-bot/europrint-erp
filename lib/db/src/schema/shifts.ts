/**
 * @module shifts
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, text, date, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const shiftAssignments = pgTable("shift_assignments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  shiftTypeId: integer("shift_type_id").notNull(),
  assignmentDate: date("assignment_date").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  assignedBy: integer("assigned_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_shift_emp_date").on(table.employeeId, table.assignmentDate),
]);

export const shiftSwapRequests = pgTable("shift_swap_requests", {
  id: serial("id").primaryKey(),
  requestingEmployeeId: integer("requesting_employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  targetEmployeeId: integer("target_employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  requestingShiftId: integer("requesting_shift_id").references(() => shiftAssignments.id, { onDelete: "set null" }),
  targetShiftId: integer("target_shift_id").references(() => shiftAssignments.id, { onDelete: "set null" }),
  swapDate: date("swap_date"),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default("pending"),
  approvedBy: integer("approved_by"),
  approvedDate: date("approved_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("shift_swap_requests_status_chk", sql`${t.status} IN ('pending','approved','rejected','cancelled')`),
]);

export const insertShiftAssignmentSchema = createInsertSchema(shiftAssignments).omit({ id: true, createdAt: true } as never);
export type InsertShiftAssignment = z.infer<typeof insertShiftAssignmentSchema>;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;

export const insertShiftSwapRequestSchema = createInsertSchema(shiftSwapRequests).omit({ id: true, createdAt: true } as never);
export type InsertShiftSwapRequest = z.infer<typeof insertShiftSwapRequestSchema>;
export type ShiftSwapRequest = typeof shiftSwapRequests.$inferSelect;
