/**
 * @module safety
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { pgTable, serial, integer, timestamp, varchar, boolean, text, decimal, date, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { employees } from "./employees";

export const safetyIncidents = pgTable("safety_incidents", {
  id: serial("id").primaryKey(),
  reportedBy: integer("reported_by").references(() => employees.id, { onDelete: "set null" }),
  affectedEmployeeId: integer("affected_employee_id").references(() => employees.id, { onDelete: "set null" }),
  incidentDate: date("incident_date").notNull(),
  incidentTime: varchar("incident_time", { length: 5 }),
  incidentType: varchar("incident_type", { length: 50 }),
  severity: varchar("severity", { length: 20 }),
  locationDescription: text("location_description"),
  departmentId: integer("department_id"),
  workCenterId: integer("work_center_id"),
  description: text("description"),
  rootCause: text("root_cause"),
  correctiveAction: text("corrective_action"),
  preventiveAction: text("preventive_action"),
  investigationStatus: varchar("investigation_status", { length: 20 }).default("open"),
  investigatedBy: integer("investigated_by"),
  medicalTreatment: text("medical_treatment"),
  daysLost: integer("days_lost").default(0),
  costEstimate: decimal("cost_estimate", { precision: 12, scale: 2 }),
  evidenceUrls: text("evidence_urls"),
  status: varchar("status", { length: 20 }).default("reported"),
  closedBy: integer("closed_by"),
  closedDate: date("closed_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  check("safety_incidents_severity_chk", sql`${t.severity} IS NULL OR ${t.severity} IN ('minor','moderate','severe','critical')`),
  check("safety_incidents_inv_status_chk", sql`${t.investigationStatus} IS NULL OR ${t.investigationStatus} IN ('open','in_progress','closed')`),
  check("safety_incidents_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('reported','investigating','closed','rejected')`),
  check("safety_incidents_days_lost_chk", sql`${t.daysLost} IS NULL OR ${t.daysLost} >= 0`),
]);

export const ppeCompliance = pgTable("ppe_compliance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  ppeType: varchar("ppe_type", { length: 50 }),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  isCompliant: boolean("is_compliant").default(true),
  lastCheckDate: date("last_check_date"),
  checkedBy: integer("checked_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const safetyTrainings = pgTable("safety_trainings", {
  id: serial("id").primaryKey(),
  trainingTitle: varchar("training_title", { length: 200 }),
  trainingType: varchar("training_type", { length: 50 }),
  description: text("description"),
  departmentId: integer("department_id"),
  isMandatory: boolean("is_mandatory").default(false),
  validityPeriodDays: integer("validity_period_days"),
  maxParticipants: integer("max_participants"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const safetyTrainingRecords = pgTable("safety_training_records", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id").references(() => safetyTrainings.id, { onDelete: "cascade" }).notNull(),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  completedDate: date("completed_date"),
  expiryDate: date("expiry_date"),
  score: decimal("score", { precision: 5, scale: 2 }),
  isPassed: boolean("is_passed").default(false),
  certificateUrl: text("certificate_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  check("safety_training_records_score_chk", sql`${t.score} IS NULL OR (${t.score} >= 0 AND ${t.score} <= 100)`),
]);

export const hazardZones = pgTable("hazard_zones", {
  id: serial("id").primaryKey(),
  zoneName: varchar("zone_name", { length: 100 }),
  zoneCode: varchar("zone_code", { length: 30 }).unique(),
  departmentId: integer("department_id"),
  hazardLevel: varchar("hazard_level", { length: 20 }),
  requiredPpe: text("required_ppe"),
  maxOccupancy: integer("max_occupancy"),
  emergencyProcedure: text("emergency_procedure"),
  isActive: boolean("is_active").default(true),
  lastInspectionDate: date("last_inspection_date"),
  nextInspectionDate: date("next_inspection_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSafetyIncidentSchema = createInsertSchema(safetyIncidents).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type InsertSafetyIncident = z.infer<typeof insertSafetyIncidentSchema>;
export type SafetyIncident = typeof safetyIncidents.$inferSelect;

export const insertPpeComplianceSchema = createInsertSchema(ppeCompliance).omit({ id: true, createdAt: true } as never);
export type InsertPpeCompliance = z.infer<typeof insertPpeComplianceSchema>;
export type PpeCompliance = typeof ppeCompliance.$inferSelect;

export const insertSafetyTrainingSchema = createInsertSchema(safetyTrainings).omit({ id: true, createdAt: true } as never);
export type InsertSafetyTraining = z.infer<typeof insertSafetyTrainingSchema>;
export type SafetyTraining = typeof safetyTrainings.$inferSelect;

export const insertSafetyTrainingRecordSchema = createInsertSchema(safetyTrainingRecords).omit({ id: true, createdAt: true } as never);
export type InsertSafetyTrainingRecord = z.infer<typeof insertSafetyTrainingRecordSchema>;
export type SafetyTrainingRecord = typeof safetyTrainingRecords.$inferSelect;

export const insertHazardZoneSchema = createInsertSchema(hazardZones).omit({ id: true, createdAt: true } as never);
export type InsertHazardZone = z.infer<typeof insertHazardZoneSchema>;
export type HazardZone = typeof hazardZones.$inferSelect;
