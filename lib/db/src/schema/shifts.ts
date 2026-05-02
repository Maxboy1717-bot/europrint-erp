import { pgTable, serial, integer, timestamp, varchar, text, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const shiftAssignments = pgTable("shift_assignments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
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
  requestingEmployeeId: integer("requesting_employee_id").references(() => employees.id).notNull(),
  targetEmployeeId: integer("target_employee_id").references(() => employees.id).notNull(),
  requestingShiftId: integer("requesting_shift_id").references(() => shiftAssignments.id),
  targetShiftId: integer("target_shift_id").references(() => shiftAssignments.id),
  swapDate: date("swap_date"),
  reason: text("reason"),
  status: varchar("status", { length: 20 }).default("pending"),
  approvedBy: integer("approved_by"),
  approvedDate: date("approved_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertShiftAssignmentSchema = createInsertSchema(shiftAssignments).omit({ id: true, createdAt: true } as never);
export type InsertShiftAssignment = z.infer<typeof insertShiftAssignmentSchema>;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;

export const insertShiftSwapRequestSchema = createInsertSchema(shiftSwapRequests).omit({ id: true, createdAt: true } as never);
export type InsertShiftSwapRequest = z.infer<typeof insertShiftSwapRequestSchema>;
export type ShiftSwapRequest = typeof shiftSwapRequests.$inferSelect;
