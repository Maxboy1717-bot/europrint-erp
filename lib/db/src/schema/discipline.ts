/**
 * @module discipline
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, date, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const disciplineRecords = pgTable("discipline_records", {
  id: serial("id").primaryKey(),
  // Multi-tenancy (Phase 2 / Task 2.1). See employees.ts for rationale.
  tenantId: integer("tenant_id").notNull().default(1),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
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
}, (t) => [
  check("discipline_records_status_chk", sql`${t.status} IN ('issued','appealed','overturned','expired','cancelled')`),
  check("discipline_records_severity_chk", sql`${t.severity} IS NULL OR ${t.severity} IN ('minor','moderate','serious','critical')`),
  check("discipline_records_fine_amount_chk", sql`${t.fineAmount} IS NULL OR ${t.fineAmount} >= 0`),
  check("discipline_records_suspension_days_chk", sql`${t.suspensionDays} IS NULL OR ${t.suspensionDays} >= 0`),
]);

export const disciplineAppeals = pgTable("discipline_appeals", {
  id: serial("id").primaryKey(),
  disciplineRecordId: integer("discipline_record_id").references(() => disciplineRecords.id, { onDelete: "cascade" }).notNull(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  appealDate: date("appeal_date").notNull(),
  appealReason: text("appeal_reason"),
  supportingDocumentUrl: text("supporting_document_url"),
  reviewedBy: integer("reviewed_by"),
  reviewDate: date("review_date"),
  decision: varchar("decision", { length: 20 }),
  decisionNotes: text("decision_notes"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("discipline_appeals_status_chk", sql`${t.status} IN ('pending','under_review','approved','rejected')`),
  check("discipline_appeals_decision_chk", sql`${t.decision} IS NULL OR ${t.decision} IN ('upheld','overturned','modified')`),
]);

export const insertDisciplineRecordSchema = createInsertSchema(disciplineRecords).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertDisciplineRecord = z.infer<typeof insertDisciplineRecordSchema>;
export type DisciplineRecord = typeof disciplineRecords.$inferSelect;

export const insertDisciplineAppealSchema = createInsertSchema(disciplineAppeals).omit({ id: true, createdAt: true } as never);
export type InsertDisciplineAppeal = z.infer<typeof insertDisciplineAppealSchema>;
export type DisciplineAppeal = typeof disciplineAppeals.$inferSelect;
