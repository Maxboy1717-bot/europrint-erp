/**
 * @module crm-deal-products
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
import { crmDeals, crmContacts, crmCompanies, crmLeads, crmPipelines, crmStages } from "./crm-core";

export const crmProductCategories = pgTable("crm_product_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  sort: integer("sort").default(500),
  active: boolean("active").default(true),
  deletedAt: timestamp("deleted_at"),
});


export const insertCrmProductCategorySchema = createInsertSchema(crmProductCategories, {
  name: z.string().min(1, "Kategoriya nomi kerak"),
}).omit({ id: true } as never);


export type CrmProductCategory = typeof crmProductCategories.$inferSelect;

export type InsertCrmProductCategory = z.infer<typeof insertCrmProductCategorySchema>;


// CRM Products (Mahsulotlar - b_crm_product)
export const crmProducts = pgTable("crm_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  categoryId: integer("category_id").references(() => crmProductCategories.id, { onDelete: "set null" }),
  
  price: numericMoney("price").notNull(),
  currencyId: varchar("currency_id", { length: 3 }).default("UZS"),
  
  vatId: varchar("vat_id", { length: 50 }), // QQS
  vatIncluded: boolean("vat_included").default(true),
  
  measureCode: integer("measure_code"), // o'lchov birligi kodi
  measureName: varchar("measure_name", { length: 50 }),
  
  description: text("description"),
  descriptionRu: text("description_ru"),
  
  active: boolean("active").default(true),
  sort: integer("sort").default(500),
});


export const insertCrmProductSchema = createInsertSchema(crmProducts, {
  name: z.string().min(1, "Mahsulot nomi kerak"),
  price: z.number().min(0, "Narx 0 dan katta bo'lishi kerak"),
}).omit({ id: true } as never);


export type CrmProduct = typeof crmProducts.$inferSelect;

export type InsertCrmProduct = z.infer<typeof insertCrmProductSchema>;


// CRM Deal Products (Kelishuv mahsulotlari - b_crm_product_row)
export const crmDealProducts = pgTable("crm_deal_products", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => crmDeals.id, { onDelete: "cascade" }),
  ownerType: varchar("owner_type", { length: 20 }).default("D"), // D=Deal, L=Lead, Q=Quote
  
  productId: integer("product_id").references(() => crmProducts.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  
  price: numericMoney("price").notNull(),
  priceExclusive: numericMoney("price_exclusive"),
  priceNetto: numericMoney("price_netto"),
  priceBrutto: numericMoney("price_brutto"),
  
  quantity: numericMoney("quantity").notNull(),
  discountTypeId: varchar("discount_type_id", { length: 20 }), // percentage, amount
  discountRate: numericMoney("discount_rate"),
  discountSum: numericMoney("discount_sum"),
  
  taxRate: numericMoney("tax_rate"),
  taxIncluded: boolean("tax_included").default(true),
  
  measureCode: integer("measure_code"),
  measureName: varchar("measure_name", { length: 50 }),
  
  sort: integer("sort").default(500),
});


export const insertCrmDealProductSchema = createInsertSchema(crmDealProducts, {
  ownerId: z.number().int().positive(),
  productName: z.string().min(1, "Mahsulot nomi kerak"),
  price: z.number().min(0, "Narx 0 dan katta bo'lishi kerak"),
  quantity: z.number().min(0.0001, "Miqdor 0 dan katta bo'lishi kerak"),
}).omit({ id: true } as never);


export type CrmDealProduct = typeof crmDealProducts.$inferSelect;

export type InsertCrmDealProduct = z.infer<typeof insertCrmDealProductSchema>;
// CRM Activities (Faoliyatlar - b_crm_activity)
export const crmActivities = pgTable("crm_activities", {
  id: serial("id").primaryKey(),
  
  // Owner entity
  ownerTypeId: integer("owner_type_id").notNull(), // 1=Lead, 2=Deal, 3=Contact, 4=Company
  ownerId: integer("owner_id").notNull(),
  
  // Activity type
  typeId: integer("type_id").notNull(), // 1=Email, 2=Call, 3=Meeting, 4=Task
  provider: varchar("provider", { length: 50 }),
  providerTypeId: varchar("provider_type_id", { length: 50 }),
  
  // Content
  subject: text("subject").notNull(),
  description: text("description"),
  descriptionRu: text("description_ru"),
  
  // Timing
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  deadline: timestamp("deadline"),
  
  // Status
  completed: boolean("completed").default(false),
  status: varchar("status", { length: 50 }), // waiting, completed, notcompleted
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high

  // Assignment
  responsibleId: varchar("responsible_id").references(() => users.id, { onDelete: 'restrict' }).notNull(),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),

  // Metadata
  dateCreate: timestamp("date_create").notNull().defaultNow(),
  dateModify: timestamp("date_modify").notNull().defaultNow(),

  // Communication
  direction: varchar("direction", { length: 20 }), // incoming, outgoing
  communicationChannel: varchar("communication_channel", { length: 50 }), // phone, email, telegram
  communicationData: jsonb("communication_data"),
}, (t) => [
  check("crm_activities_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('waiting','completed','notcompleted')`),
  check("crm_activities_priority_chk", sql`${t.priority} IS NULL OR ${t.priority} IN ('low','medium','high')`),
  check("crm_activities_direction_chk", sql`${t.direction} IS NULL OR ${t.direction} IN ('incoming','outgoing')`),
]);


export const insertCrmActivitySchema = createInsertSchema(crmActivities, {
  ownerTypeId: z.number().int().min(1).max(4),
  ownerId: z.number().int().positive(),
  typeId: z.number().int().positive(),
  subject: z.string().min(1, "Mavzu kerak"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
}).omit({ id: true, dateCreate: true, dateModify: true } as never);


export type CrmActivity = typeof crmActivities.$inferSelect;

export type InsertCrmActivity = z.infer<typeof insertCrmActivitySchema>;


// ========================
// CRM EXTENDED BITRIX24-STYLE
// ========================

// CRM Lead Stages (Lid bosqichlari - Bitrix24 uslubi)
export const crmLeadStages = pgTable("crm_lead_stages", {
  id: serial("id").primaryKey(),
  stageId: varchar("stage_id", { length: 50 }).notNull().unique(), // NEW, IN_PROCESS, CONVERTED, JUNK
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  color: varchar("color", { length: 20 }).default("#2196f3"),
  sort: integer("sort").default(100),
  semanticId: varchar("semantic_id", { length: 20 }), // process, success, fail
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const insertCrmLeadStageSchema = createInsertSchema(crmLeadStages, {
  stageId: z.string().min(1, "Stage ID kerak"),
  name: z.string().min(1, "Stage nomi kerak"),
  color: z.string().default("#2196f3"),
}).omit({ id: true, createdAt: true } as never);


export type CrmLeadStage = typeof crmLeadStages.$inferSelect;

export type InsertCrmLeadStage = z.infer<typeof insertCrmLeadStageSchema>;


// CRM Proposals (Takliflar - Kommercheskoe predlojeniye)