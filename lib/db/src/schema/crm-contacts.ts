/**
 * @module crm-contacts
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { numericMoney } from "./numeric-money";
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, serial, numeric, unique, date, uuid, index, check } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";
import { Assignment } from "./lms-schema";
import { Design, Order, Product, designOrders } from "./pp-schema";


// ============================================================================
// BITRIX24-STYLE CRM SYSTEM (Rebuild 2025-11-20)
// ============================================================================

// CRM Leads (Potensial mijozlar - b_crm_lead)
export const crmLeads = pgTable("crm_leads", {
  id: serial("id").primaryKey(),
  // Multi-tenancy column. DEFAULT 1 is intentional — every row backfilled to
  // tenant 1 on migration; future writers MUST set this from TenantContext.
  tenantId: integer("tenant_id").notNull().default(1),
  title: text("title").notNull(),
  
  // Personal Info
  name: text("name"),
  secondName: text("second_name"),
  lastName: text("last_name"),
  companyTitle: text("company_title"),
  
  // Source & Status
  sourceId: varchar("source_id", { length: 50 }), // sayt, telefon, referal
  sourceDescription: text("source_description"),
  statusId: varchar("status_id", { length: 50 }).notNull().default("NEW"), // NEW, IN_PROCESS, CONVERTED, JUNK
  statusDescription: text("status_description"),
  
  // Multifield (Bitrix specialty - JSONB arrays)
  phones: jsonb("phones").$type<{value: string, type: string}[]>().default(sql`'[]'::jsonb`),
  emails: jsonb("emails").$type<{value: string, type: string}[]>().default(sql`'[]'::jsonb`),
  websites: jsonb("websites").$type<{value: string, type: string}[]>().default(sql`'[]'::jsonb`),
  
  // Assignment
  assignedById: integer("assigned_by_id").references(() => users.id, { onDelete: 'set null' }),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  modifyById: integer("modify_by_id").references(() => users.id, { onDelete: 'set null' }),
  
  // Metadata
  dateCreate: timestamp("date_create").notNull().defaultNow(),
  dateModify: timestamp("date_modify").notNull().defaultNow(),
  opened: boolean("opened").default(false),
  comments: text("comments"),
  
  // UTM tracking (marketing analytics)
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  
  // Bitrix24-style extended fields
  budget: numeric("budget"), // Estimated budget
  opportunityAmount: numeric("opportunity_amount"), // Potential deal amount
  sourceScore: integer("source_score"), // Lead scoring 1-100
  callStatus: varchar("call_status", { length: 50 }), // none, scheduled, answered, missed
  lastActivityAt: timestamp("last_activity_at"),
  nextActivityAt: timestamp("next_activity_at"),
  deletedAt: timestamp("deleted_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),

  // Legacy / live-DB superset columns (ADD-ONLY convergence 2026-05-27)
  customerId: integer("customer_id"),
  managerId: integer("manager_id"),
  status: varchar("status", { length: 50 }),
  source: varchar("source", { length: 50 }),
  contactName: varchar("contact_name", { length: 200 }),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactEmail: varchar("contact_email", { length: 200 }),
  notes: text("notes"),
  fullName: text("full_name"),
  phone: text("phone"),
  email: text("email"),
  stageId: integer("stage_id"),
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  check("crm_leads_status_id_chk", sql`${t.statusId} IN ('NEW','IN_PROCESS','CONVERTED','JUNK')`),
  check("crm_leads_source_score_chk", sql`${t.sourceScore} IS NULL OR (${t.sourceScore} >= 1 AND ${t.sourceScore} <= 100)`),
  index("idx_crm_leads_status_id").on(t.statusId),
  index("idx_crm_leads_assigned_by_id").on(t.assignedById),
  index("idx_crm_leads_created_by_id").on(t.createdById),
  index("idx_crm_leads_source_id").on(t.sourceId),
  index("idx_crm_leads_date_create").on(t.dateCreate),
  index("idx_crm_leads_deleted_at").on(t.deletedAt),
  index("idx_crm_leads_tenant_id").on(t.tenantId),
  index("idx_crm_leads_next_activity_at").on(t.nextActivityAt),
  check("crm_leads_call_status_chk", sql`${t.callStatus} IS NULL OR ${t.callStatus} IN ('none','scheduled','answered','missed')`),
  check("crm_leads_budget_chk", sql`${t.budget} IS NULL OR ${t.budget} >= 0`),
  check("crm_leads_opportunity_amount_chk", sql`${t.opportunityAmount} IS NULL OR ${t.opportunityAmount} >= 0`),
]);


export const insertCrmLeadSchema = createInsertSchema(crmLeads, {
  title: z.string().min(1, "Lead nomi kerak"),
  statusId: z.string().default("NEW"),
  phones: z.array(z.object({
    value: z.string().min(1),
    type: z.string().default("WORK"),
  })).default([]),
  emails: z.array(z.object({
    value: z.string().email(),
    type: z.string().default("WORK"),
  })).default([]),
}).omit({ id: true, dateCreate: true, dateModify: true } as never);


export type CrmLead = typeof crmLeads.$inferSelect;

export type InsertCrmLead = z.infer<typeof insertCrmLeadSchema>;


// CRM Contacts (Shaxslar - b_crm_contact)
export const crmContacts = pgTable("crm_contacts", {
  id: serial("id").primaryKey(),
  // Multi-tenancy column. DEFAULT 1 is intentional — every row backfilled to
  // tenant 1 on migration; future writers MUST set this from TenantContext.
  tenantId: integer("tenant_id").notNull().default(1),

  // Personal Info
  name: text("name"),
  secondName: text("second_name"),
  lastName: text("last_name"),
  photo: text("photo"),
  birthdate: varchar("birthdate", { length: 10 }), // YYYY-MM-DD
  
  // Multifield (Bitrix pattern)
  phones: jsonb("phones").$type<{value: string, type: string, valueType: string}[]>().default(sql`'[]'::jsonb`),
  emails: jsonb("emails").$type<{value: string, type: string, valueType: string}[]>().default(sql`'[]'::jsonb`),
  websites: jsonb("websites").$type<{value: string, type: string}[]>().default(sql`'[]'::jsonb`),
  im: jsonb("im").$type<{value: string, type: string}[]>().default(sql`'[]'::jsonb`), // telegram, whatsapp
  
  // Work Info
  post: varchar("post", { length: 255 }), // lavozim
  companyId: integer("company_id").references(() => crmCompanies.id, { onDelete: 'set null' }),
  
  // Assignment
  assignedById: integer("assigned_by_id").references(() => users.id, { onDelete: 'set null' }),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  modifyById: integer("modify_by_id").references(() => users.id, { onDelete: 'set null' }),
  
  // Metadata
  dateCreate: timestamp("date_create").notNull().defaultNow(),
  dateModify: timestamp("date_modify").notNull().defaultNow(),
  opened: boolean("opened").default(true),
  comments: text("comments"),
  
  // Source tracking
  sourceId: varchar("source_id", { length: 50 }),
  sourceDescription: text("source_description"),
  
  // Bitrix24-style extended fields
  whatsappNumber: varchar("whatsapp_number", { length: 50 }),
  telegramUsername: varchar("telegram_username", { length: 100 }),
  customerJourney: jsonb("customer_journey"), // Customer path tracking
  lastContactedAt: timestamp("last_contacted_at"),
  deletedAt: timestamp("deleted_at"),

  // Legacy / live-DB superset columns (ADD-ONLY convergence 2026-05-27)
  firstName: text("first_name"),
  email: text("email"),
  phone: text("phone"),
  position: text("position"),
  notes: text("notes"),
  fullName: text("full_name"),
  leadId: integer("lead_id"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  index("idx_crm_contacts_company_id").on(t.companyId),
  index("idx_crm_contacts_assigned_by_id").on(t.assignedById),
  index("idx_crm_contacts_created_by_id").on(t.createdById),
  index("idx_crm_contacts_deleted_at").on(t.deletedAt),
  index("idx_crm_contacts_tenant_id").on(t.tenantId),
]);


export const insertCrmContactSchema = createInsertSchema(crmContacts, {
  phones: z.array(z.object({
    value: z.string().min(1),
    type: z.string().default("WORK"),
    valueType: z.string().default("PHONE"),
  })).default([]),
  emails: z.array(z.object({
    value: z.string().email(),
    type: z.string().default("WORK"),
    valueType: z.string().default("EMAIL"),
  })).default([]),
  im: z.array(z.object({
    value: z.string().min(1),
    type: z.string().default("TELEGRAM"),
  })).default([]),
}).omit({ id: true, dateCreate: true, dateModify: true } as never);


export type CrmContact = typeof crmContacts.$inferSelect;

export type InsertCrmContact = z.infer<typeof insertCrmContactSchema>;

// CRM Contact-Company many-to-many junction table
export const crmContactCompanies = pgTable("crm_contact_companies", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").notNull().references(() => crmContacts.id, { onDelete: 'cascade' }),
  companyId: integer("company_id").notNull().references(() => crmCompanies.id, { onDelete: 'cascade' }),
  role: varchar("role", { length: 100 }), // e.g. "director", "accountant"
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueContactCompany: unique("crm_contact_companies_unique").on(table.contactId, table.companyId),
}));

export const insertCrmContactCompanySchema = createInsertSchema(crmContactCompanies).omit({ id: true, createdAt: true } as never);
export type CrmContactCompany = typeof crmContactCompanies.$inferSelect;
export type InsertCrmContactCompany = z.infer<typeof insertCrmContactCompanySchema>;


// CRM Companies (Kompaniyalar - b_crm_company)
export const crmCompanies = pgTable("crm_companies", {
  id: serial("id").primaryKey(),
  // Multi-tenancy column. DEFAULT 1 is intentional — every row backfilled to
  // tenant 1 on migration; future writers MUST set this from TenantContext.
  tenantId: integer("tenant_id").notNull().default(1),
  title: text("title").notNull(),
  
  // Mijoz kodi (avtomatik: CUS-YYYY-NNNN)
  customerCode: varchar("customer_code", { length: 20 }),

  // Mijoz turi (Yuridik / Jismoniy)
  customerType: varchar("customer_type", { length: 20 }).default("legal"), // legal, individual

  // Holat (active/inactive/blacklist)
  status: varchar("status", { length: 20 }).default("active"),

  // Yuridik shaxs uchun
  stir: varchar("stir", { length: 20 }),
  directorName: varchar("director_name", { length: 255 }),
  companySize: varchar("company_size", { length: 20 }), // small, medium, large

  // Jismoniy shaxs uchun
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  passportNumber: varchar("passport_number", { length: 20 }),
  birthDate: date("birth_date"),

  // ABC Segmentatsiya
  customerCategory: varchar("customer_category", { length: 1 }).default("C"), // A, B, C, D
  abcScore: numeric("abc_score", { precision: 5, scale: 2 }).default('0'),

  // Manbaa (qayerdan kelgan)
  source: varchar("source", { length: 30 }).default("other"), // ads, referral, website, exhibition, other

  // To'lov shartlari
  paymentTermsDays: integer("payment_terms_days").default(30),
  discountRate: numeric("discount_rate", { precision: 5, scale: 2 }).default('0'),

  // Company Info
  companyType: varchar("company_type", { length: 50 }), // customer, partner, competitor
  industry: varchar("industry", { length: 100 }),
  employees: integer("employees"),
  revenue: numericMoney("revenue"),
  currencyId: varchar("currency_id", { length: 3 }).default("UZS"),
  
  // Multifield
  phones: jsonb("phones").$type<{value: string, type: string}[]>().default(sql`'[]'::jsonb`),
  emails: jsonb("emails").$type<{value: string, type: string}[]>().default(sql`'[]'::jsonb`),
  websites: jsonb("websites").$type<{value: string, type: string}[]>().default(sql`'[]'::jsonb`),
  
  // Location
  address: text("address"),
  addressLegal: text("address_legal"),
  
  // Banking
  bankingDetails: text("banking_details"),
  
  // Assignment
  assignedById: integer("assigned_by_id").references(() => users.id, { onDelete: 'set null' }),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  modifyById: integer("modify_by_id").references(() => users.id, { onDelete: 'set null' }),
  
  // Metadata
  dateCreate: timestamp("date_create").notNull().defaultNow(),
  dateModify: timestamp("date_modify").notNull().defaultNow(),
  opened: boolean("opened").default(true),
  comments: text("comments"),
  
  // Bitrix24-style extended fields
  parentCompanyId: integer("parent_company_id"),
  annualRevenue: numeric("annual_revenue"),
  employeeCount: integer("employee_count"),
  lastContactedAt: timestamp("last_contacted_at"),
  
  // Credit limit management
  creditLimit: numeric("credit_limit", { precision: 15, scale: 2 }).default('100000000'),
  creditUsed: numeric("credit_used", { precision: 15, scale: 2 }).default('0'),

  // SD Module — Europrint segmentatsiya
  segment: varchar("segment", { length: 20 }).default("new"), // vip, regular, new, potential
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockReason: text("block_reason"),
  openDebt: numericMoney("open_debt").default(0),

  deletedAt: timestamp("deleted_at"),

  // Legacy / live-DB superset columns (ADD-ONLY convergence 2026-05-27)
  inn: text("inn"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
}, (t) => [
  index("idx_crm_companies_status").on(t.status),
  index("idx_crm_companies_customer_type").on(t.customerType),
  index("idx_crm_companies_customer_category").on(t.customerCategory),
  index("idx_crm_companies_segment").on(t.segment),
  index("idx_crm_companies_assigned_by_id").on(t.assignedById),
  index("idx_crm_companies_created_by_id").on(t.createdById),
  index("idx_crm_companies_deleted_at").on(t.deletedAt),
  index("idx_crm_companies_is_blocked").on(t.isBlocked),
  index("idx_crm_companies_tenant_id").on(t.tenantId),
  index("idx_crm_companies_customer_code").on(t.customerCode),
  check("crm_companies_type_chk", sql`${t.customerType} IS NULL OR ${t.customerType} IN ('legal','individual')`),
  check("crm_companies_status_chk", sql`${t.status} IS NULL OR ${t.status} IN ('active','inactive','blacklist')`),
  check("crm_companies_size_chk", sql`${t.companySize} IS NULL OR ${t.companySize} IN ('small','medium','large')`),
  check("crm_companies_category_chk", sql`${t.customerCategory} IS NULL OR ${t.customerCategory} IN ('A','B','C','D')`),
  check("crm_companies_source_chk", sql`${t.source} IS NULL OR ${t.source} IN ('ads','referral','website','exhibition','other')`),
  check("crm_companies_segment_chk", sql`${t.segment} IS NULL OR ${t.segment} IN ('vip','regular','new','potential')`),
]);

// Mijoz kontaktlari
export const customerContacts = pgTable("customer_contacts", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => crmCompanies.id, { onDelete: 'set null' }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  position: varchar("position", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  telegram: varchar("telegram", { length: 50 }),
  contactType: varchar("contact_type", { length: 30 }).default("primary"), // primary, accounting, technical, director
  isPrimary: boolean("is_primary").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("idx_customer_contacts_customer_id").on(t.customerId),
]);

export const insertCustomerContactSchema = createInsertSchema(customerContacts).omit({ id: true, createdAt: true } as never);
export type CustomerContact = typeof customerContacts.$inferSelect;
export type InsertCustomerContact = z.infer<typeof insertCustomerContactSchema>;

// Mijoz bilan aloqa tarixi