/**
 * @module crm-activities
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, date, uuid, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { Assignment } from "./lms-schema";
import { Design, Order, Product, designOrders } from "./pp-schema";
import { crmInvoicePayments, crmInvoices, crmProducts, crmDealProducts, crmProductCategories } from "./crm-deals";
import { crmDocuments } from "./crm-docs";

export const insertCrmDocumentSchema = createInsertSchema(crmDocuments, {
  code: z.string().min(1, "Kod kerak"),
  title: z.string().min(1, "Sarlavha kerak"),
  entityType: z.enum(["deal", "lead", "contact", "company", "proposal", "invoice"]),
  documentType: z.enum(["contract", "agreement", "act", "letter", "invoice", "proposal"]),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type CrmDocument = typeof crmDocuments.$inferSelect;

export type InsertCrmDocument = z.infer<typeof insertCrmDocumentSchema>;
// CRM Activity Types (Ish turlari)
export const crmActivityTypes = pgTable("crm_activity_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // call, meeting, task, email, whatsapp
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  icon: varchar("icon", { length: 50 }), // lucide icon name
  color: varchar("color", { length: 20 }).default("#2196f3"),
  
  // Configuration
  requiresDeadline: boolean("requires_deadline").default(true),
  requiresDescription: boolean("requires_description").default(false),
  allowsAttachments: boolean("allows_attachments").default(true),
  
  isSystem: boolean("is_system").default(false), // Tizim turlari o'chirilmaydi
  isActive: boolean("is_active").default(true),
  sort: integer("sort").default(100),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertCrmActivityTypeSchema = createInsertSchema(crmActivityTypes, {
  code: z.string().min(1, "Kod kerak"),
  name: z.string().min(1, "Nom kerak"),
}).omit({ id: true, createdAt: true } as never);


export type CrmActivityType = typeof crmActivityTypes.$inferSelect;

export type InsertCrmActivityType = z.infer<typeof insertCrmActivityTypeSchema>;
// CRM Comments (Izohlar)
export const crmComments = pgTable("crm_comments", {
  id: serial("id").primaryKey(),
  
  entityType: varchar("entity_type", { length: 20 }).notNull(),
  entityId: integer("entity_id").notNull(),
  
  content: text("content").notNull(),
  
  // Attachments
  attachments: jsonb("attachments"), // [{filename, path, size, mimeType}]
  
  // Mentions
  mentionedUserIds: jsonb("mentioned_user_ids").$type<string[]>().default(sql`'[]'::jsonb`),
  
  authorId: varchar("author_id").references(() => users.id, { onDelete: 'restrict' }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  check("crm_comments_entity_type_chk", sql`${t.entityType} IN ('deal','lead','contact','company','proposal','invoice')`),
]);


export const insertCrmCommentSchema = createInsertSchema(crmComments, {
  entityType: z.enum(["deal", "lead", "contact", "company", "proposal", "invoice"]),
  entityId: z.number().int().positive(),
  content: z.string().min(1, "Izoh matni kerak"),
}).omit({ id: true, createdAt: true, updatedAt: true } as never);


export type CrmComment = typeof crmComments.$inferSelect;

export type InsertCrmComment = z.infer<typeof insertCrmCommentSchema>;


// CRM Entity History (Tarix)
export const crmEntityHistory = pgTable("crm_entity_history", {
  id: serial("id").primaryKey(),
  
  entityType: varchar("entity_type", { length: 20 }).notNull(),
  entityId: integer("entity_id").notNull(),
  
  action: varchar("action", { length: 30 }).notNull(), // created, updated, stage_changed, deleted, restored
  
  // Changes
  fieldName: varchar("field_name", { length: 100 }),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  
  // For stage changes
  oldStageId: varchar("old_stage_id", { length: 50 }),
  newStageId: varchar("new_stage_id", { length: 50 }),
  
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("crm_entity_history_action_chk", sql`${t.action} IN ('created','updated','stage_changed','deleted','restored')`),
]);


export const insertCrmEntityHistorySchema = createInsertSchema(crmEntityHistory, {
  entityType: z.string().min(1),
  entityId: z.number().int().positive(),
  action: z.enum(["created", "updated", "stage_changed", "deleted", "restored"]),
}).omit({ id: true, createdAt: true } as never);


export type CrmEntityHistory = typeof crmEntityHistory.$inferSelect;

export type InsertCrmEntityHistory = z.infer<typeof insertCrmEntityHistorySchema>;


// CRM Invoice Stages (Hisob bosqichlari)
export const crmInvoiceStages = pgTable("crm_invoice_stages", {
  id: serial("id").primaryKey(),
  stageId: varchar("stage_id", { length: 50 }).notNull().unique(), // N, P, D, I, S - Bitrix style
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  color: varchar("color", { length: 20 }).default("#2196f3"),
  sort: integer("sort").default(100),
  semanticId: varchar("semantic_id", { length: 20 }), // process, success, fail
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertCrmInvoiceStageSchema = createInsertSchema(crmInvoiceStages, {
  stageId: z.string().min(1, "Stage ID kerak"),
  name: z.string().min(1, "Stage nomi kerak"),
}).omit({ id: true, createdAt: true } as never);


export type CrmInvoiceStage = typeof crmInvoiceStages.$inferSelect;

export type InsertCrmInvoiceStage = z.infer<typeof insertCrmInvoiceStageSchema>;


// ============================================
// CRM FOLLOWUP ACTIVITIES (Simple - CRMWorkspace UI)
// ============================================

export const crmFollowupActivities = pgTable("crm_followup_activities", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull().default("call"), // call, meeting, email, follow_up, other
  subject: text("subject").notNull(),
  note: text("note"),
  dueDate: timestamp("due_date"),
  isDone: boolean("is_done").notNull().default(false),
  entityType: varchar("entity_type", { length: 50 }), // lead, deal, contact
  entityId: integer("entity_id"),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  check("crm_followup_type_chk", sql`${t.type} IN ('call','meeting','email','follow_up','other')`),
  check("crm_followup_entity_chk", sql`${t.entityType} IS NULL OR ${t.entityType} IN ('lead','deal','contact','company')`),
]);

export const insertCrmFollowupActivitySchema = createInsertSchema(crmFollowupActivities, {
  type: z.enum(["call", "meeting", "email", "follow_up", "other"]).default("call"),
  subject: z.string().min(1, "Mavzu kerak"),
  note: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  entityType: z.enum(["lead", "deal", "contact", "company"]).optional().nullable(),
  entityId: z.number().int().positive().optional().nullable(),
}).omit({ id: true, createdAt: true } as never);

export type CrmFollowupActivity = typeof crmFollowupActivities.$inferSelect;
export type InsertCrmFollowupActivity = z.infer<typeof insertCrmFollowupActivitySchema>;

// ============================================
// MARKETING MODULE TABLES
// ============================================

