import { pgTable, serial, integer, timestamp, varchar, boolean, text, date } from "drizzle-orm/pg-core";
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
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  programId: integer("program_id").references(() => adaptationPrograms.id).notNull(),
  mentorId: integer("mentor_id").references(() => employees.id),
  professionalMasterId: integer("professional_master_id").references(() => employees.id),
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
});

export const adaptationMilestones = pgTable("adaptation_milestones", {
  id: serial("id").primaryKey(),
  recordId: integer("record_id").references(() => adaptationRecords.id).notNull(),
  milestoneNumber: integer("milestone_number").notNull(),
  milestoneTitle: varchar("milestone_title", { length: 200 }),
  description: text("description"),
  dueDate: date("due_date"),
  completedDate: date("completed_date"),
  status: varchar("status", { length: 20 }).default("pending"),
  verifiedBy: integer("verified_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdaptationProgramSchema = createInsertSchema(adaptationPrograms).omit({ id: true, createdAt: true } as never);
export type InsertAdaptationProgram = z.infer<typeof insertAdaptationProgramSchema>;
export type AdaptationProgram = typeof adaptationPrograms.$inferSelect;

export const insertAdaptationRecordSchema = createInsertSchema(adaptationRecords).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertAdaptationRecord = z.infer<typeof insertAdaptationRecordSchema>;
export type AdaptationRecord = typeof adaptationRecords.$inferSelect;

export const insertAdaptationMilestoneSchema = createInsertSchema(adaptationMilestones).omit({ id: true, createdAt: true } as never);
export type InsertAdaptationMilestone = z.infer<typeof insertAdaptationMilestoneSchema>;
export type AdaptationMilestone = typeof adaptationMilestones.$inferSelect;
