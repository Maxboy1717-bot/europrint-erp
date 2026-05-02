import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { Assignment } from "./lms-schema";
import { Design, Order, Product, designOrders } from "./pp-schema";
import { crmContacts, crmCompanies, crmLeads } from "./crm-contacts";
import { customerContacts } from "./crm-contacts";

export const customerInteractions = pgTable("customer_interactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => crmCompanies.id, { onDelete: 'set null' }),
  type: varchar("type", { length: 20 }).notNull(), // call, email, meeting, note, chat
  direction: varchar("direction", { length: 10 }).default("out"), // in, out
  contactId: integer("contact_id").references(() => customerContacts.id),
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
});

export const insertCustomerInteractionSchema = createInsertSchema(customerInteractions).omit({ id: true, createdAt: true } as never);
export type CustomerInteraction = typeof customerInteractions.$inferSelect;
export type InsertCustomerInteraction = z.infer<typeof insertCustomerInteractionSchema>;

// Mijoz hujjatlari
export const customerDocuments = pgTable("customer_documents", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => crmCompanies.id, { onDelete: 'set null' }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 30 }).notNull(), // contract, certificate, nda, invoice, act, other
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  expiresAt: date("expires_at"),
  uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerDocumentSchema = createInsertSchema(customerDocuments).omit({ id: true, createdAt: true } as never);
export type CustomerDocument = typeof customerDocuments.$inferSelect;
export type InsertCustomerDocument = z.infer<typeof insertCustomerDocumentSchema>;

// Mijoz shikoyatlari
export const customerComplaints = pgTable("customer_complaints", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => crmCompanies.id, { onDelete: 'set null' }),
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
});

export const insertCustomerComplaintSchema = createInsertSchema(customerComplaints).omit({ id: true, createdAt: true, updatedAt: true } as never);
export type CustomerComplaint = typeof customerComplaints.$inferSelect;
export type InsertCustomerComplaint = z.infer<typeof insertCustomerComplaintSchema>;

// Mijoz raqobatchilari (Tab 8)
export const customerCompetitors = pgTable("customer_competitors", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => crmCompanies.id, { onDelete: 'set null' }),
  competitorName: varchar("competitor_name", { length: 255 }).notNull(),
  productType: varchar("product_type", { length: 100 }),
  estimatedSharePercent: numeric("estimated_share_percent", { precision: 5, scale: 2 }),
  reason: varchar("reason", { length: 50 }), // price, deadline, quality, assortment, other
  winBackPotential: varchar("win_back_potential", { length: 20 }).default("medium"), // high, medium, low
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerCompetitorSchema = createInsertSchema(customerCompetitors).omit({ id: true, createdAt: true } as never);
export type CustomerCompetitor = typeof customerCompetitors.$inferSelect;
export type InsertCustomerCompetitor = z.infer<typeof insertCustomerCompetitorSchema>;


export const insertCrmCompanySchema = createInsertSchema(crmCompanies, {
  title: z.string().min(1, "Kompaniya nomi kerak"),
  phones: z.array(z.object({
    value: z.string().min(1),
    type: z.string().default("WORK"),
  })).default([]),
  emails: z.array(z.object({
    value: z.string().email(),
    type: z.string().default("WORK"),
  })).default([]),
}).omit({ id: true, dateCreate: true, dateModify: true } as never);


export type CrmCompany = typeof crmCompanies.$inferSelect;

export type InsertCrmCompany = z.infer<typeof insertCrmCompanySchema>;


// CRM Pipelines (Voronkalar - b_crm_deal_category)
export const crmPipelines = pgTable("crm_pipelines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  sort: integer("sort").default(500),
  isDefault: boolean("is_default").default(false),
  createdDate: timestamp("created_date").notNull().defaultNow(),
});


export const insertCrmPipelineSchema = createInsertSchema(crmPipelines, {
  name: z.string().min(1, "Voronka nomi kerak"),
}).omit({ id: true, createdDate: true } as never);


export type CrmPipeline = typeof crmPipelines.$inferSelect;

export type InsertCrmPipeline = z.infer<typeof insertCrmPipelineSchema>;


// CRM Stages (Bosqichlar - b_crm_status)
export const crmStages = pgTable("crm_stages", {
  id: serial("id").primaryKey(),
  statusId: varchar("status_id", { length: 50 }).notNull().unique(), // C0:NEW, C0:PREPARATION
  entityId: varchar("entity_id", { length: 50 }).notNull().default("DEAL_STAGE"), // DEAL_STAGE, LEAD_STATUS
  categoryId: integer("category_id").default(0).references(() => crmPipelines.id), // pipeline reference
  
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  sort: integer("sort").default(500),
  color: varchar("color", { length: 20 }),
  semantics: varchar("semantics", { length: 20 }), // process, success, fail
});


export const insertCrmStageSchema = createInsertSchema(crmStages, {
  statusId: z.string().min(1, "Status ID kerak"),
  name: z.string().min(1, "Bosqich nomi kerak"),
  entityId: z.string().default("DEAL_STAGE"),
  semantics: z.enum(["process", "success", "fail"]).optional(),
}).omit({ id: true } as never);


export type CrmStage = typeof crmStages.$inferSelect;

export type InsertCrmStage = z.infer<typeof insertCrmStageSchema>;


// CRM Deals (Kelishuvlar - b_crm_deal) - MARKAZIY ENTITY
export const crmDeals = pgTable("crm_deals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  
  // Pipeline & Stage
  categoryId: integer("category_id").default(0).references(() => crmPipelines.id), // voronka
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
  companyId: integer("company_id").references(() => crmCompanies.id, { onDelete: 'set null' }),
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
});


export const insertCrmDealSchema = createInsertSchema(crmDeals, {
  title: z.string().min(1, "Kelishuv nomi kerak"),
  opportunity: z.number().min(0, "Summa 0 dan katta bo'lishi kerak"),
  stageId: z.string().default("C0:NEW"),
  probability: z.number().min(0).max(100).default(0),
  contactIds: z.array(z.number()).default([]),
}).omit({ id: true, dateCreate: true, dateModify: true } as never);


export type CrmDeal = typeof crmDeals.$inferSelect;

export type InsertCrmDeal = z.infer<typeof insertCrmDealSchema>;


// CRM Product Categories