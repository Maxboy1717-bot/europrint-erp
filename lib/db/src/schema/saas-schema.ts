/**
 * TZ-17 SaaS Infratuzilma — Tenant va litsenziya jadvallari
 */
import { serial, pgTable, varchar, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { numericMoney } from "./numeric-money";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// ========== TENANTS — Har bir zavod alohida tenant ==========

export const tenants = pgTable("saas_tenants", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  domain: varchar("domain", { length: 100 }).notNull().unique(),
  plan: varchar("plan", { length: 30 }).notNull().default("basic"), // basic, starter, professional, enterprise
  status: varchar("status", { length: 20 }).notNull().default("trial"), // trial, active, suspended, cancelled
  usersCount: integer("users_count").notNull().default(0),
  usersLimit: integer("users_limit").notNull().default(10),
  modulesEnabled: jsonb("modules_enabled").notNull().default(sql`'["crm","sd"]'::jsonb`),
  expiresAt: varchar("expires_at", { length: 10 }), // YYYY-MM-DD
  contactEmail: varchar("contact_email", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 30 }),
  contactName: varchar("contact_name", { length: 200 }),
  country: varchar("country", { length: 50 }).default("UZ"),
  city: varchar("city", { length: 100 }),
  industry: varchar("industry", { length: 100 }),
  notes: text("notes"),
  // Billing
  monthlyFee: numericMoney("monthly_fee").default(0), // USD
  currency: varchar("currency", { length: 10 }).default("USD"),
  lastPaymentAt: varchar("last_payment_at", { length: 10 }),
  nextPaymentAt: varchar("next_payment_at", { length: 10 }),
  // Meta
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const insertTenantSchema = createInsertSchema(tenants, {
  name: z.string().min(2, "Nomi kamida 2 belgi"),
  domain: z.string().min(3, "Domen kamida 3 belgi"),
  plan: z.enum(["basic", "starter", "professional", "enterprise"]),
  status: z.enum(["trial", "active", "suspended", "cancelled"]),
}).omit({ id: true, createdAt: true, updatedAt: true, deletedAt: true } as never);

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

// ========== TENANT MODULES — Tenant uchun modul sozlamalari ==========

export const tenantModules = pgTable("saas_tenant_modules", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  moduleKey: varchar("module_key", { length: 50 }).notNull(), // crm, sd, mes, wms...
  isEnabled: boolean("is_enabled").notNull().default(true),
  enabledAt: timestamp("enabled_at").notNull().defaultNow(),
  disabledAt: timestamp("disabled_at"),
  enabledBy: varchar("enabled_by", { length: 100 }),
  config: jsonb("config"), // Modul-specific config
});

export const insertTenantModuleSchema = createInsertSchema(tenantModules, {
  moduleKey: z.string().min(1),
}).omit({ id: true, enabledAt: true } as never);

export type TenantModule = typeof tenantModules.$inferSelect;
export type InsertTenantModule = z.infer<typeof insertTenantModuleSchema>;

// ========== TENANT ERROR LOGS — Xatolar logi ==========

export const tenantErrorLogs = pgTable("saas_tenant_error_logs", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  level: varchar("level", { length: 10 }).notNull().default("error"), // error, warn, info
  module: varchar("module", { length: 50 }),
  message: text("message").notNull(),
  stack: text("stack"),
  userId: varchar("user_id", { length: 100 }),
  requestPath: varchar("request_path", { length: 255 }),
  requestMethod: varchar("request_method", { length: 10 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TenantErrorLog = typeof tenantErrorLogs.$inferSelect;

// ========== TENANT API USAGE — API chaqiruv statistikasi ==========

export const tenantApiUsage = pgTable("saas_tenant_api_usage", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  apiCalls: integer("api_calls").notNull().default(0),
  storageUsedMb: integer("storage_used_mb").default(0),
  activeUsers: integer("active_users").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TenantApiUsage = typeof tenantApiUsage.$inferSelect;
