/**
 * @module ai-providers-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { serial, pgTable, varchar, text, integer, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";



// RESTORED (2026-07-02): aiProviderConfigs pgTable — this table definition was
// missing from lib/db while its real, live consumer
// (apps/api/src/modules/ai/infrastructure/repositories/drizzle-ai-provider-config.repo.ts)
// still performs real select/insert/upsert DB queries against ai_provider_configs
// via @workspace/db (Q-29 verified: NOT dead code — pre-existing regression,
// unrelated to the orfan-cleanup pass; columns match live DB exactly).
export const aiProviderConfigs = pgTable("ai_provider_configs", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull().unique(),
  apiKeyHint: varchar("api_key_hint", { length: 100 }),
  defaultModel: varchar("default_model", { length: 100 }),
  dailyBudgetUsd: numeric("daily_budget_usd", { precision: 10, scale: 2 }).notNull().default("50.00"),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedByUserId: integer("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
});

export const insertAiProviderConfigSchema = createInsertSchema(aiProviderConfigs).omit({ id: true, updatedAt: true } as never);

export type AiProviderConfig = typeof aiProviderConfigs.$inferSelect;
export type InsertAiProviderConfig = z.infer<typeof insertAiProviderConfigSchema>;


export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 50 }).notNull(),
  taskType: varchar("task_type", { length: 100 }),
  model: varchar("model", { length: 100 }),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 6 }).default("0"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: varchar("session_id", { length: 100 }),
  requestSummary: text("request_summary"),
  responseSummary: text("response_summary"),
  latencyMs: integer("latency_ms"),
  status: varchar("status", { length: 20 }).default("success"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  // ─── live-DB superset columns (ADD-ONLY) ───
  module: varchar("module", { length: 50 }),
  action: varchar("action", { length: 100 }),
  cost: numeric("cost", { precision: 10, scale: 6 }).default("0"),
});


export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({ id: true, createdAt: true } as never);

export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;
