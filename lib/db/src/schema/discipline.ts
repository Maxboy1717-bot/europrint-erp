import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const disciplineRecords = pgTable("discipline_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  catalogCode: varchar("catalog_code", { length: 50 }),
  violationType: varchar("violation_type", { length: 100 }),
  disciplineType: varchar("discipline_type", { length: 30 }),
  severity: varchar("severity", { length: 20 }),
  violationDate: date("violation_date").notNull(),
  description: text("description"),
  evidenceUrl: text("evidence_url"),
  issuedBy: integer("issued_by"),
  issuedDate: date("issued_date").notNull(),
  effectiveDate: date("effective_date"),
  isFirstWarning: boolean("is_first_warning").default(false),
  isSecondWarning: boolean("is_second_warning").default(false),
  isFinalWarning: boolean("is_final_warning").default(false),
  previousWarningId: integer("previous_warning_id"),
  fineAmount: decimal("fine_amount", { precision: 12, scale: 2 }),
  suspensionDays: integer("suspension_days"),
  violationCountThisCategory: integer("violation_count_this_category").default(1),
  isExpired: boolean("is_expired").default(false),
  status: varchar("status", { length: 20 }).default("issued"),
  isSoftDeleted: boolean("is_soft_deleted").default(false),
  softDeleteReason: varchar("soft_delete_reason", { length: 255 }),
  softDeletedBy: integer("soft_deleted_by"),
  softDeletedAt: timestamp("soft_deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const disciplineAppeals = pgTable("discipline_appeals", {
  id: serial("id").primaryKey(),
  disciplineRecordId: integer("discipline_record_id").references(() => disciplineRecords.id).notNull(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  appealDate: date("appeal_date").notNull(),
  appealReason: text("appeal_reason"),
  supportingDocumentUrl: text("supporting_document_url"),
  reviewedBy: integer("reviewed_by"),
  reviewDate: date("review_date"),
  decision: varchar("decision", { length: 20 }),
  decisionNotes: text("decision_notes"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDisciplineRecordSchema = createInsertSchema(disciplineRecords).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertDisciplineRecord = z.infer<typeof insertDisciplineRecordSchema>;
export type DisciplineRecord = typeof disciplineRecords.$inferSelect;

export const insertDisciplineAppealSchema = createInsertSchema(disciplineAppeals).omit({ id: true, createdAt: true } as never);
export type InsertDisciplineAppeal = z.infer<typeof insertDisciplineAppealSchema>;
export type DisciplineAppeal = typeof disciplineAppeals.$inferSelect;
