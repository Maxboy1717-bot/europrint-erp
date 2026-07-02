/**
 * @module crm-pipelines
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, date, uuid, check, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { Assignment } from "./lms-schema";
import { Design, Order, Product, designOrders } from "./pp-schema";
import { customerContacts } from "./crm-contacts";

// ============================================================================
// ORFAN CLEANUP (2026-07-02): crm_pipelines, crm_stages pgTable declarations
// removed from here (dead lib/db duplicates — no consumer anywhere, Q-29
// verified). insertCrmCompanySchema/CrmCompany type also removed — depended
// on crmCompanies, which was deleted from ./crm-contacts (also dead, Q-29).
// crmDeals (below) IS live/canonical — re-exported as crm_deals from
// apps/api/src/shared/db/schema-ext-b-2.ts via `@workspace/db`. Its FKs to
// the now-removed crmPipelines/crmCompanies were converted to plain columns.
// ============================================================================

export const customerInteractions = pgTable("customer_interactions", {
  id: serial("id").primaryKey(),
  // FK to crmCompanies removed 2026-07-02 (orphan table deleted, see note above)
  customerId: integer("customer_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // call, email, meeting, note, chat
  direction: varchar("direction", { length: 10 }).default("out"), // in, out
  contactId: integer("contact_id").references(() => customerContacts.id, { onDelete: "set null" }),
  managerId: integer("manager_id").references(() => users.id, { onDelete: 'set null' }),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  outcome: text("outcome"),
  nextAction: text("next_action"),
  nextActionDate: timestamp("next_action_date"),
  durationMinutes: integer("duration_minutes"),
  interactionDate: timestamp("interaction_date").notNull().defaultNow(),
  fileUrl: varchar("file_url", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("customer_interactions_type_chk", sql`${t.type} IN ('call','email','meeting','note','chat')`),
  check("customer_interactions_direction_chk", sql`${t.direction} IS NULL OR ${t.direction} IN ('in','out')`),
  index("idx_customer_interactions_customer_id").on(t.customerId),
  index("idx_customer_interactions_manager_id").on(t.managerId),
  index("idx_customer_interactions_contact_id").on(t.contactId),
  index("idx_customer_interactions_date").on(t.interactionDate),
]);

export const insertCustomerInteractionSchema = createInsertSchema(customerInteractions).omit({ id: true, createdAt: true } as never);
export type CustomerInteraction = typeof customerInteractions.$inferSelect;
export type InsertCustomerInteraction = z.infer<typeof insertCustomerInteractionSchema>;

// Mijoz hujjatlari
export const customerDocuments = pgTable("customer_documents", {
  id: serial("id").primaryKey(),
  // FK to crmCompanies removed 2026-07-02 (orphan table deleted, see note above)
  customerId: integer("customer_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(), // contract, certificate, nda, invoice, act, other
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  expiresAt: date("expires_at"),
  uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("customer_documents_type_chk", sql`${t.type} IN ('contract','certificate','nda','invoice','act','other')`),
  index("idx_customer_documents_customer_id").on(t.customerId),
  index("idx_customer_documents_uploaded_by").on(t.uploadedBy),
]);

export const insertCustomerDocumentSchema = createInsertSchema(customerDocuments).omit({ id: true, createdAt: true } as never);
export type CustomerDocument = typeof customerDocuments.$inferSelect;
export type InsertCustomerDocument = z.infer<typeof insertCustomerDocumentSchema>;

// Mijoz shikoyatlari
export const customerComplaints = pgTable("customer_complaints", {
  id: serial("id").primaryKey(),
  // FK to crmCompanies removed 2026-07-02 (orphan table deleted, see note above)
  customerId: integer("customer_id").notNull(),
  orderId: varchar("order_id", { length: 50 }),
  complaintNumber: varchar("complaint_number", { length: 20 }),
  type: varchar("type", { length: 30 }).notNull().default("other"), // quality, deadline, delivery, price, other
  description: text("description").notNull(),
  responsibleDepartment: varchar("responsible_department", { length: 50 }), // production, logistics, sales
  status: varchar("status", { length: 20 }).notNull().default("new"), // new, in_progress, resolved, closed
  resolution: text("resolution"),
  compensationAmount: numeric("compensation_amount", { precision: 15, scale: 2 }),
  satisfactionScore: integer("satisfaction_score"), // 1-5
  resolvedBy: integer("resolved_by").references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp("resolved_at"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("customer_complaints_status_chk", sql`${t.status} IN ('new','in_progress','resolved','closed')`),
  check("customer_complaints_type_chk", sql`${t.type} IN ('quality','deadline','delivery','price','other')`),
  check("customer_complaints_satisfaction_chk", sql`${t.satisfactionScore} IS NULL OR (${t.satisfactionScore} >= 1 AND ${t.satisfactionScore} <= 5)`),
  check("customer_complaints_compensation_chk", sql`${t.compensationAmount} IS NULL OR ${t.compensationAmount} >= 0`),
  index("idx_customer_complaints_customer_id").on(t.customerId),
  index("idx_customer_complaints_status").on(t.status),
  index("idx_customer_complaints_resolved_by").on(t.resolvedBy),
]);

export const insertCustomerComplaintSchema = createInsertSchema(customerComplaints).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type CustomerComplaint = typeof customerComplaints.$inferSelect;
export type InsertCustomerComplaint = z.infer<typeof insertCustomerComplaintSchema>;

// Mijoz raqobatchilari (Tab 8)
export const customerCompetitors = pgTable("customer_competitors", {
  id: serial("id").primaryKey(),
  // FK to crmCompanies removed 2026-07-02 (orphan table deleted, see note above)
  customerId: integer("customer_id").notNull(),
  competitorName: varchar("competitor_name", { length: 255 }).notNull(),
  productType: varchar("product_type", { length: 100 }),
  estimatedSharePercent: numeric("estimated_share_percent", { precision: 5, scale: 2 }),
  reason: varchar("reason", { length: 50 }), // price, deadline, quality, assortment, other
  winBackPotential: varchar("win_back_potential", { length: 20 }).default("medium"), // high, medium, low
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("customer_competitors_reason_chk", sql`${t.reason} IS NULL OR ${t.reason} IN ('price','deadline','quality','assortment','other')`),
  check("customer_competitors_win_back_chk", sql`${t.winBackPotential} IS NULL OR ${t.winBackPotential} IN ('high','medium','low')`),
  index("idx_customer_competitors_customer_id").on(t.customerId),
]);

export const insertCustomerCompetitorSchema = createInsertSchema(customerCompetitors).omit({ id: true, createdAt: true } as never);
export type CustomerCompetitor = typeof customerCompetitors.$inferSelect;
export type InsertCustomerCompetitor = z.infer<typeof insertCustomerCompetitorSchema>;


// CRM Deals (Kelishuvlar - b_crm_deal) - MARKAZIY ENTITY
export const crmDeals = pgTable("crm_deals", {
  id: serial("id").primaryKey(),
  // Multi-tenancy column. DEFAULT 1 is intentional — every row backfilled to
  // tenant 1 on migration; future writers MUST set this from TenantContext.
  tenantId: integer("tenant_id").notNull().default(1),
  title: text("title").notNull(),

  // Pipeline & Stage
  // FK to crmPipelines removed 2026-07-02 (orphan table deleted, see note above)
  categoryId: integer("category_id").default(0), // voronka
  stageId: varchar("stage_id", { length: 50 }).notNull().default("C0:NEW"), // NEW, PREPARATION, etc.
  stageSemanticId: varchar("stage_semantic_id", { length: 20 }), // process, success, fail

  // Flags
  isNew: boolean("is_new").default(true),
  isRecurring: boolean("is_recurring").default(false),
  isReturnCustomer: boolean("is_return_customer").default(false),
  isRepeatedApproach: boolean("is_repeated_approach").default(false),

  // Financial
  probability: integer("probability").default(0), // 0-100
  currencyId: varchar("currency_id", { length: 3 }).default("UZS"),
  opportunity: numericMoney("opportunity").notNull(), // summa
  isManualOpportunity: boolean("is_manual_opportunity").default(false),
  taxValue: numericMoney("tax_value"),

  // Relations
  // FK to crmCompanies removed 2026-07-02 (orphan table deleted, see note above)
  companyId: integer("company_id"),
  contactIds: jsonb("contact_ids").$type<number[]>().default(sql`'[]'::jsonb`), // multiple contacts

  // Dates
  beginDate: varchar("begin_date", { length: 10 }), // YYYY-MM-DD
  closeDate: varchar("close_date", { length: 10 }), // YYYY-MM-DD

  // Assignment
  assignedById: integer("assigned_by_id").references(() => users.id, { onDelete: 'restrict' }).notNull(),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  modifyById: integer("modify_by_id").references(() => users.id, { onDelete: 'set null' }),

  // Metadata
  dateCreate: timestamp("date_create").notNull().defaultNow(),
  dateModify: timestamp("date_modify").notNull().defaultNow(),
  opened: boolean("opened").default(true),
  closed: boolean("closed").default(false),
  comments: text("comments"),
  additionalInfo: text("additional_info"),

  // External source
  originatorId: varchar("originator_id", { length: 50 }),
  originId: varchar("origin_id", { length: 255 }),

  // Sales Order link (for idempotency - one deal = one sales order)
  salesOrderId: varchar("sales_order_id"),

  // Bitrix24-style extended fields
  forecastAmount: numeric("forecast_amount"), // Weighted forecast
  slaDeadline: timestamp("sla_deadline"), // Service level deadline
  isRepeating: boolean("is_repeating").default(false), // Repeating deal flag
  lastActivityAt: timestamp("last_activity_at"),
  nextActivityAt: timestamp("next_activity_at"),
  deletedAt: timestamp("deleted_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),

  // Legacy / live-DB superset columns (ADD-ONLY convergence 2026-05-27)
  leadId: integer("lead_id"),
  amount: numeric("amount", { precision: 18, scale: 2 }),
  value: numeric("value", { precision: 18, scale: 2 }),
  currency: varchar("currency", { length: 3 }),
  status: text("status"),
  wonAt: timestamp("won_at"),
  closedAt: timestamp("closed_at"),
  lostReason: text("lost_reason"),
  createdBy: integer("created_by"),
  customerId: integer("customer_id"),
  managerId: integer("manager_id"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  check("crm_deals_probability_chk", sql`${t.probability} IS NULL OR (${t.probability} >= 0 AND ${t.probability} <= 100)`),
  check("crm_deals_stage_semantic_chk", sql`${t.stageSemanticId} IS NULL OR ${t.stageSemanticId} IN ('process','success','fail')`),
  index("idx_crm_deals_company_id").on(t.companyId),
  index("idx_crm_deals_assigned_by_id").on(t.assignedById),
  index("idx_crm_deals_category_id").on(t.categoryId),
  index("idx_crm_deals_stage_id").on(t.stageId),
  index("idx_crm_deals_created_by_id").on(t.createdById),
  index("idx_crm_deals_date_create").on(t.dateCreate),
  index("idx_crm_deals_close_date").on(t.closeDate),
  index("idx_crm_deals_deleted_at").on(t.deletedAt),
  index("idx_crm_deals_opened").on(t.opened),
  index("idx_crm_deals_tenant_id").on(t.tenantId),
  index("idx_crm_deals_closed").on(t.closed),
  index("idx_crm_deals_next_activity_at").on(t.nextActivityAt),
]);


export const insertCrmDealSchema = createInsertSchema(crmDeals, {
  title: z.string().min(1, "Kelishuv nomi kerak"),
  opportunity: z.number().min(0, "Summa 0 dan katta bo'lishi kerak"),
  stageId: z.string().default("C0:NEW"),
  probability: z.number().min(0).max(100).default(0),
  contactIds: z.array(z.number()).default([]),
}).omit({ id: true, dateCreate: true, dateModify: true } as never);


export type CrmDeal = typeof crmDeals.$inferSelect;

export type InsertCrmDeal = z.infer<typeof insertCrmDealSchema>;
