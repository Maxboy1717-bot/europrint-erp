/**
 * @module sd-customer-relations
 * @description Drizzle ORM schema for SD customer relation tables.
 *   - sd_customer_contacts      — contact persons linked to a customer
 *   - sd_customer_interactions  — interaction / communication history
 *   - sd_customer_documents     — documents / contracts attached to a customer
 *   - sd_customer_competitors   — competitor share data per customer
 *   - sd_customer_complaints    — complaint / issue tracking per customer
 *
 * All five tables are referenced by raw SQL queries in
 * apps/api/src/modules/sd/infrastructure/repositories/drizzle-sd-customers.repo.ts
 * and were missing from the Drizzle schema.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  numeric,
  index,
  check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sdCustomers } from "./sd-europrint-schema";

// ============================================================================
// 1. SD_CUSTOMER_CONTACTS — Contact persons for a customer
// ============================================================================

export const sdCustomerContacts = pgTable("sd_customer_contacts", {
  id: serial("id").primaryKey(),
  // Multi-tenancy column (A90). DEFAULT 1 backfills existing rows to tenant 1.
  tenantId: integer("tenant_id").notNull().default(1),
  customerId: integer("customer_id")
    .notNull()
    .references(() => sdCustomers.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  position: varchar("position", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  telegram: varchar("telegram", { length: 100 }),
  contactType: varchar("contact_type", { length: 30 }).default("primary"),
  isPrimary: boolean("is_primary").default(false),
  isDecisionMaker: boolean("is_decision_maker").default(false),
  influenceLevel: integer("influence_level").default(3), // 1-5 scale
  department: varchar("department", { length: 100 }),
  linkedinUrl: text("linkedin_url"),
  roleNote: text("role_note"),
  isActive: boolean("is_active").default(true),
  // Soft-delete audit (A93/T11-08). O'chirish = deletedAt=NOW()+deletedBy=user; faol=deletedAt IS NULL.
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_sd_customer_contacts_customer_id").on(t.customerId),
  index("idx_sd_customer_contacts_is_primary").on(t.isPrimary),
  index("idx_sd_customer_contacts_is_decision_maker").on(t.isDecisionMaker),
  check(
    "sd_customer_contacts_contact_type_chk",
    sql`${t.contactType} IS NULL OR ${t.contactType} IN ('primary','accounting','technical','director','other')`,
  ),
  check(
    "sd_customer_contacts_influence_level_chk",
    sql`${t.influenceLevel} IS NULL OR (${t.influenceLevel} >= 1 AND ${t.influenceLevel} <= 5)`,
  ),
]);

export const insertSdCustomerContactSchema = createInsertSchema(sdCustomerContacts, {
  fullName: z.string().min(1, "Ism kerak"),
  contactType: z.enum(["primary", "accounting", "technical", "director", "other"]).default("primary"),
  influenceLevel: z.number().int().min(1).max(5).default(3),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);

export type SdCustomerContact = typeof sdCustomerContacts.$inferSelect;
export type InsertSdCustomerContact = z.infer<typeof insertSdCustomerContactSchema>;

// ============================================================================
// 2. SD_CUSTOMER_INTERACTIONS — Communication / interaction history
// ============================================================================

export const sdCustomerInteractions = pgTable("sd_customer_interactions", {
  id: serial("id").primaryKey(),
  // Multi-tenancy column (A90). DEFAULT 1 backfills existing rows to tenant 1.
  tenantId: integer("tenant_id").notNull().default(1),
  customerId: integer("customer_id")
    .notNull()
    .references(() => sdCustomers.id, { onDelete: "cascade" }),
  // "type" matches the repo column alias used in get360View (i.interaction_type / i.type)
  interactionType: varchar("interaction_type", { length: 50 }).default("note"),
  // The repo selects "i.type" in get360View but "type" in addInteraction INSERT — both
  // resolve to the same physical column. We name the Drizzle column "interactionType"
  // (DB col: interaction_type) AND add a generated alias "type" for legacy compat via view
  // if needed in the future. For now the raw SQL in the repo uses column aliases anyway.
  channel: varchar("channel", { length: 50 }),
  direction: varchar("direction", { length: 10 }).default("outbound"), // inbound, outbound
  subject: varchar("subject", { length: 500 }),
  description: text("description"),
  notes: text("notes"),
  employeeId: integer("employee_id"), // loose FK to employees.id (avoids circular import)
  outcome: text("outcome"),
  nextAction: text("next_action"),
  nextActionDate: timestamp("next_action_date"),
  interactionDate: timestamp("interaction_date").defaultNow(),
  durationMinutes: integer("duration_minutes"),
  satisfactionRating: numeric("satisfaction_rating", { precision: 3, scale: 1 }),
  sentimentScore: numeric("sentiment_score", { precision: 4, scale: 3 }),
  // Soft-delete audit (A93/T11-08). O'chirish = deletedAt=NOW()+deletedBy=user; faol=deletedAt IS NULL.
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_sd_customer_interactions_customer_id").on(t.customerId),
  index("idx_sd_customer_interactions_type").on(t.interactionType),
  index("idx_sd_customer_interactions_created_at").on(t.createdAt),
  index("idx_sd_customer_interactions_employee_id").on(t.employeeId),
  check(
    "sd_customer_interactions_direction_chk",
    sql`${t.direction} IS NULL OR ${t.direction} IN ('inbound','outbound')`,
  ),
  check(
    "sd_customer_interactions_satisfaction_chk",
    sql`${t.satisfactionRating} IS NULL OR (${t.satisfactionRating} >= 1 AND ${t.satisfactionRating} <= 5)`,
  ),
]);

export const insertSdCustomerInteractionSchema = createInsertSchema(sdCustomerInteractions, {
  interactionType: z.string().max(50).default("note"),
  direction: z.enum(["inbound", "outbound"]).default("outbound"),
  durationMinutes: z.number().int().min(0).optional().nullable(),
}).omit({ id: true, createdAt: true } as never);

export type SdCustomerInteraction = typeof sdCustomerInteractions.$inferSelect;
export type InsertSdCustomerInteraction = z.infer<typeof insertSdCustomerInteractionSchema>;

// ============================================================================
// 3. SD_CUSTOMER_DOCUMENTS — Documents and contracts attached to a customer
// ============================================================================

export const sdCustomerDocuments = pgTable("sd_customer_documents", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => sdCustomers.id, { onDelete: "cascade" }),
  documentType: varchar("document_type", { length: 50 }).default("other"),
  // Legacy aliases: the repo reads both "d.name" and "d.title"; "name" is canonical.
  documentName: varchar("document_name", { length: 500 }).notNull(),
  // Legacy aliases: the repo reads both "d.file_url" and "d.url"; "file_url" is canonical.
  fileUrl: text("file_url"),
  fileSize: integer("file_size"), // bytes
  uploadedBy: integer("uploaded_by"), // loose FK to employees.id
  isVerified: boolean("is_verified").default(false),
  // Legacy aliases: the repo reads both "d.expires_at" and "d.end_date".
  expiresAt: timestamp("expires_at"),
  startDate: timestamp("start_date"),
  status: varchar("status", { length: 20 }).default("active"),
  notes: text("notes"),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_sd_customer_documents_customer_id").on(t.customerId),
  index("idx_sd_customer_documents_type").on(t.documentType),
  index("idx_sd_customer_documents_expires_at").on(t.expiresAt),
  check(
    "sd_customer_documents_status_chk",
    sql`${t.status} IS NULL OR ${t.status} IN ('active','expired','revoked','draft')`,
  ),
]);

export const insertSdCustomerDocumentSchema = createInsertSchema(sdCustomerDocuments, {
  documentName: z.string().min(1, "Hujjat nomi kerak"),
  documentType: z.string().max(50).default("other"),
  fileSize: z.number().int().min(0).optional().nullable(),
}).omit({ id: true, createdAt: true } as never);

export type SdCustomerDocument = typeof sdCustomerDocuments.$inferSelect;
export type InsertSdCustomerDocument = z.infer<typeof insertSdCustomerDocumentSchema>;

// ============================================================================
// 4. SD_CUSTOMER_COMPETITORS — Competitor share data per customer
// ============================================================================

export const sdCustomerCompetitors = pgTable("sd_customer_competitors", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => sdCustomers.id, { onDelete: "cascade" }),
  competitorName: varchar("competitor_name", { length: 255 }).notNull(),
  // The repo also reads "c.name" — that is a legacy alias; competitorName is canonical.
  productType: varchar("product_type", { length: 100 }),
  ourSharePct: numeric("our_share_pct", { precision: 5, scale: 2 }),
  competitorSharePct: numeric("competitor_share_pct", { precision: 5, scale: 2 }),
  // The repo also reads "c.estimated_share_pct" — same physical column kept for compat.
  estimatedSharePct: numeric("estimated_share_pct", { precision: 5, scale: 2 }),
  switchRisk: varchar("switch_risk", { length: 20 }).default("medium"),
  // The repo reads "c.win_back_potential"
  winBackPotential: varchar("win_back_potential", { length: 20 }),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("idx_sd_customer_competitors_customer_id").on(t.customerId),
  check(
    "sd_customer_competitors_switch_risk_chk",
    sql`${t.switchRisk} IS NULL OR ${t.switchRisk} IN ('low','medium','high')`,
  ),
]);

export const insertSdCustomerCompetitorSchema = createInsertSchema(sdCustomerCompetitors, {
  competitorName: z.string().min(1, "Raqib nomi kerak"),
  switchRisk: z.enum(["low", "medium", "high"]).default("medium"),
  ourSharePct: z.number().min(0).max(100).optional().nullable(),
  competitorSharePct: z.number().min(0).max(100).optional().nullable(),
  estimatedSharePct: z.number().min(0).max(100).optional().nullable(),
}).omit({ id: true, updatedAt: true } as never);

export type SdCustomerCompetitor = typeof sdCustomerCompetitors.$inferSelect;
export type InsertSdCustomerCompetitor = z.infer<typeof insertSdCustomerCompetitorSchema>;

// ============================================================================
// 5. SD_CUSTOMER_COMPLAINTS — Complaint / issue tracking per customer
// ============================================================================

export const sdCustomerComplaints = pgTable("sd_customer_complaints", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => sdCustomers.id, { onDelete: "cascade" }),
  complaintType: varchar("complaint_type", { length: 50 }).default("general"),
  severity: varchar("severity", { length: 20 }).default("medium"),
  status: varchar("status", { length: 20 }).notNull().default("open"),
  description: text("description"),
  assignedTo: integer("assigned_to"), // loose FK to employees.id
  resolution: text("resolution"),
  // The repo also uses "cp.resolved_by" for the JOIN with employees.
  resolvedBy: integer("resolved_by"), // loose FK to employees.id
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_sd_customer_complaints_customer_id").on(t.customerId),
  index("idx_sd_customer_complaints_status").on(t.status),
  index("idx_sd_customer_complaints_severity").on(t.severity),
  check(
    "sd_customer_complaints_status_chk",
    sql`${t.status} IN ('open','in_progress','resolved','closed')`,
  ),
  check(
    "sd_customer_complaints_severity_chk",
    sql`${t.severity} IS NULL OR ${t.severity} IN ('low','medium','high','critical')`,
  ),
]);

export const insertSdCustomerComplaintSchema = createInsertSchema(sdCustomerComplaints, {
  complaintType: z.string().max(50).default("general"),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
}).omit({ id: true, createdAt: true } as never);

export type SdCustomerComplaint = typeof sdCustomerComplaints.$inferSelect;
export type InsertSdCustomerComplaint = z.infer<typeof insertSdCustomerComplaintSchema>;
