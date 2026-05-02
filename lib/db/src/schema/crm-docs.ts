import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { Assignment } from "./lms-schema";
import { Design, Order, Product, designOrders } from "./pp-schema";
import { crmInvoicePayments, crmInvoices, crmProducts, crmDealProducts, crmProductCategories } from "./crm-deals";

export const insertCrmInvoicePaymentSchema = createInsertSchema(crmInvoicePayments, {
  invoiceId: z.number().int().positive(),
  amount: z.number().positive("Summa kerak"),
}).omit({ id: true, createdAt: true } as never);


export type CrmInvoicePayment = typeof crmInvoicePayments.$inferSelect;

export type InsertCrmInvoicePayment = z.infer<typeof insertCrmInvoicePaymentSchema>;


// ============================================================================
// BITRIX24-STYLE CRM EXTENDED FEATURES (2025-01-09)
// ============================================================================

// CRM Watchers (Entity observers - Nablyudateli)
export const crmWatchers = pgTable("crm_watchers", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // lead, deal, contact, company, proposal, invoice
  entityId: integer("entity_id").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


export const insertCrmWatcherSchema = createInsertSchema(crmWatchers, {
  entityType: z.enum(["lead", "deal", "contact", "company", "proposal", "invoice"]),
  entityId: z.number().int().positive(),
  userId: z.string().optional(),
}).omit({ id: true, createdAt: true } as never);


export type CrmWatcher = typeof crmWatchers.$inferSelect;

export type InsertCrmWatcher = z.infer<typeof insertCrmWatcherSchema>;


// CRM Custom Fields (Custom field definitions - Maxsus maydonlar)
export const crmCustomFields = pgTable("crm_custom_fields", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // lead, deal, contact, company
  fieldName: varchar("field_name", { length: 100 }).notNull(),
  fieldLabel: varchar("field_label", { length: 255 }).notNull(),
  fieldLabelRu: varchar("field_label_ru", { length: 255 }),
  fieldType: varchar("field_type", { length: 50 }).notNull(), // text, number, date, select, multiselect, checkbox, phone, email
  options: jsonb("options"), // For select/multiselect: [{value: "opt1", label: "Option 1"}]
  isRequired: boolean("is_required").default(false),
  isVisible: boolean("is_visible").default(true),
  sort: integer("sort").default(500),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


export const insertCrmCustomFieldSchema = createInsertSchema(crmCustomFields, {
  entityType: z.enum(["lead", "deal", "contact", "company"]),
  fieldName: z.string().min(1, "Field name kerak"),
  fieldLabel: z.string().min(1, "Field label kerak"),
  fieldType: z.enum(["text", "number", "date", "select", "multiselect", "checkbox", "phone", "email"]),
  isRequired: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  sort: z.number().int().default(500),
}).omit({ id: true, createdAt: true } as never);


export type CrmCustomField = typeof crmCustomFields.$inferSelect;

export type InsertCrmCustomField = z.infer<typeof insertCrmCustomFieldSchema>;


// CRM Robots (Automation robots - Avtomatlashtirish robotlari)
export const crmRobots = pgTable("crm_robots", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // leads, deals, contacts, companies
  stageId: varchar("stage_id", { length: 50 }), // Which stage triggers the robot
  name: varchar("name", { length: 255 }).notNull(),
  nameRu: varchar("name_ru", { length: 255 }),
  description: text("description"), // Robot description
  triggerType: varchar("trigger_type", { length: 50 }).notNull(), // STAGE_CHANGED, CREATED, FIELD_CHANGED, TIME_ELAPSED
  triggerConditions: jsonb("trigger_conditions"), // Trigger-specific conditions
  delayMinutes: integer("delay_minutes"), // Delay in minutes (for TIME_ELAPSED)
  actionType: varchar("action_type", { length: 50 }).notNull(), // SEND_NOTIFICATION, CREATE_TASK, CHANGE_STAGE, CHANGE_FIELD, SEND_EMAIL, SEND_TELEGRAM, AI_ANALYZE
  actionConfig: jsonb("action_config"), // Action-specific configuration
  targetType: varchar("target_type", { length: 50 }), // responsible, manager, specific_user
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: 'set null' }),
  isActive: boolean("is_active").default(true),
  sort: integer("sort").default(500),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});


export const insertCrmRobotSchema = createInsertSchema(crmRobots, {
  entityType: z.enum(["leads", "deals", "contacts", "companies"]),
  name: z.string().min(1, "Robot nomi kerak"),
  description: z.string().optional(),
  triggerType: z.enum(["STAGE_CHANGED", "CREATED", "FIELD_CHANGED", "TIME_ELAPSED"]),
  triggerConditions: z.unknown().optional(),
  actionType: z.enum(["SEND_NOTIFICATION", "CREATE_TASK", "CHANGE_STAGE", "CHANGE_FIELD", "SEND_EMAIL", "SEND_TELEGRAM", "AI_ANALYZE"]),
  targetType: z.enum(["responsible", "manager", "specific_user"]).optional(),
  isActive: z.boolean().default(true),
  sort: z.number().int().default(500),
}).omit({ id: true, createdAt: true } as never);


export type CrmRobot = typeof crmRobots.$inferSelect;

export type InsertCrmRobot = z.infer<typeof insertCrmRobotSchema>;
// CRM Documents (Hujjatlar va shablonlar)
export const crmDocuments = pgTable("crm_documents", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // DOC-001
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  
  // Related entity
  entityType: varchar("entity_type", { length: 20 }).notNull(), // deal, lead, contact, company, proposal, invoice
  entityId: integer("entity_id"),
  
  // Document type
  documentType: varchar("document_type", { length: 50 }).notNull(), // contract, agreement, act, letter
  
  // File info
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  
  // Template
  isTemplate: boolean("is_template").default(false),
  templateContent: text("template_content"), // HTML/Markdown template
  templateVariables: jsonb("template_variables"), // {customer_name, amount, date}
  
  // Status
  status: varchar("status", { length: 30 }).default("draft"), // draft, active, signed, archived
  
  // Signature
  signedAt: timestamp("signed_at"),
  signedById: varchar("signed_by_id").references(() => users.id, { onDelete: 'set null' }),
  
  // Assignment
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

