/**
 * TZ-17 SaaS Infratuzilma — Tenant va litsenziya jadvallari
 */
import { serial, pgTable, varchar, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========== TENANT MODULES — Tenant uchun modul sozlamalari ==========
// NOTE: `tenants` (saas_tenants) pgTable removed 2026-07-02 — orphan in lib/db (no
// consumer via @workspace/db or @europrint/schemas). Dependent tables below keep their
// tenant_id column but no longer hold a Drizzle-level FK to the deleted table.

export const tenantModules = pgTable("saas_tenant_modules", {
  id: serial("id").primaryKey(),
  tenantId: varchar("tenant_id").notNull(),
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
  tenantId: varchar("tenant_id"),
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
  tenantId: varchar("tenant_id"),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  apiCalls: integer("api_calls").notNull().default(0),
  storageUsedMb: integer("storage_used_mb").default(0),
  activeUsers: integer("active_users").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type TenantApiUsage = typeof tenantApiUsage.$inferSelect;
