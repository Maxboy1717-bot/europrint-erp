/**
 * @module ai-providers-schema
 * @description Drizzle ORM schema. Table definitions, CHECK constraints, FK relations.
 */

import { serial, pgTable, varchar, text, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./core-schema";



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
});


export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({ id: true, createdAt: true } as never);

export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;
