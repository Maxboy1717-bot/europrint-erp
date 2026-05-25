/**
 * @module adaptation
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, boolean, text, date, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const adaptationPrograms = pgTable("adaptation_programs", {
  id: serial("id").primaryKey(),
  programName: varchar("program_name", { length: 200 }).notNull(),
  positionId: integer("position_id"),
  departmentId: integer("department_id"),
  durationDays: integer("duration_days").default(90),
  description: text("description"),
  milestones: text("milestones"),
  mentorRequired: boolean("mentor_required").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adaptationRecords = pgTable("adaptation_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  programId: integer("program_id").references(() => adaptationPrograms.id, { onDelete: "cascade" }).notNull(),
  mentorId: integer("mentor_id").references(() => employees.id, { onDelete: "set null" }),
  professionalMasterId: integer("professional_master_id").references(() => employees.id, { onDelete: "set null" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: varchar("status", { length: 20 }).default("in_progress"),
  currentMilestone: integer("current_milestone").default(1),
  totalMilestones: integer("total_milestones"),
  progressPercent: integer("progress_percent").default(0),
  mentorFeedback: text("mentor_feedback"),
  employeeFeedback: text("employee_feedback"),
  hrNotes: text("hr_notes"),
  completedDate: date("completed_date"),
  isExtended: boolean("is_extended").default(false),
  extensionReason: text("extension_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("adaptation_records_status_chk", sql`${t.status} IN ('in_progress','completed','cancelled','extended','at_risk')`),
  check("adaptation_records_progress_chk", sql`${t.progressPercent} IS NULL OR (${t.progressPercent} >= 0 AND ${t.progressPercent} <= 100)`),
]);

export const insertAdaptationProgramSchema = createInsertSchema(adaptationPrograms).omit({ id: true, createdAt: true } as never);
export type InsertAdaptationProgram = z.infer<typeof insertAdaptationProgramSchema>;
export type AdaptationProgram = typeof adaptationPrograms.$inferSelect;

export const insertAdaptationRecordSchema = createInsertSchema(adaptationRecords).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertAdaptationRecord = z.infer<typeof insertAdaptationRecordSchema>;
export type AdaptationRecord = typeof adaptationRecords.$inferSelect;

