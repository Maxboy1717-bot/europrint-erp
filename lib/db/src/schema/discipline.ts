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
  // HR Nazorat fix (2026-07-13, verified live: POST /api/hr/discipline-records — the
  // main "Intizom" page create flow — ALWAYS 500'd with a NOT NULL violation): reason/
  // given_by exist as NOT NULL columns on the live DB (added by fix-discipline-schema.sql,
  // outside Drizzle) but were never declared here, so no Drizzle-typed insert path could
  // ever satisfy them. reason mirrors `description` (kept as a separate column since the
  // legacy discipline-records-compat.service.ts raw-SQL path already writes both
  // independently); given_by is the HR user who issued the record.
  reason: text("reason").notNull(),
  reasonRu: text("reason_ru"),
  givenBy: integer("given_by").notNull(),
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
  // Owner directive 2026-07-13 (HR Nazorat 4-page fix): reprimands auto soft-archive after
  // business_settings `hr.discipline_archive_after_months` (default 6) — see discipline.cron.ts
  // expireOldRecords(). Soft-archive = hidden from the active Intizom list (findDisciplineRecords /
  // discipline-records-compat getDisciplineRecords filter is_archived=false), never hard-deleted
  // (Q-46) and still counted cumulatively for escalation (discipline-escalation.helper.ts).
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  // Escalation stage per vision: verbal -> written -> fine -> dismissal, based on the employee's
  // cumulative violation count within a rolling window (business_settings hr.discipline_written_
  // threshold/hr.discipline_fine_threshold/hr.discipline_dismissal_threshold, defaults 3/5/8 —
  // same figures as the prior magic-numbers audit's late-count thresholds, generalised to ALL
  // violation types). Computed + stamped at insert time by discipline-escalation.helper.ts.
  escalationStage: varchar("escalation_stage", { length: 20 }).default("verbal"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("discipline_records_status_chk", sql`${t.status} IN ('issued','appealed','overturned','expired','cancelled')`),
  check("discipline_records_severity_chk", sql`${t.severity} IS NULL OR ${t.severity} IN ('minor','moderate','serious','critical')`),
  check("discipline_records_fine_amount_chk", sql`${t.fineAmount} IS NULL OR ${t.fineAmount} >= 0`),
  check("discipline_records_suspension_days_chk", sql`${t.suspensionDays} IS NULL OR ${t.suspensionDays} >= 0`),
  check("discipline_records_escalation_stage_chk", sql`${t.escalationStage} IS NULL OR ${t.escalationStage} IN ('verbal','written','fine','dismissal')`),
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
