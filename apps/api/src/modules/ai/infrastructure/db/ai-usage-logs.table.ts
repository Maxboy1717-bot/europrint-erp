/**
 * @module ai-usage-logs.table
 * @description Source module. See exports for details.
 */

import { pgTable, text, varchar, integer, numeric, serial, timestamp, index } from 'drizzle-orm/pg-core';

export const aiUsageLogsTable = pgTable(
  'ai_usage_logs',
  {
    id: serial('id').primaryKey(),
    provider: varchar('provider', { length: 50 }).notNull(),
    taskType: varchar('task_type', { length: 100 }),
    model: varchar('model', { length: 100 }),
    inputTokens: integer('input_tokens').default(0),
    outputTokens: integer('output_tokens').default(0),
    totalTokens: integer('total_tokens').default(0),
    estimatedCostUsd: numeric('estimated_cost', { precision: 10, scale: 6 }).default('0'),
    userId: integer('user_id'),
    sessionId: varchar('session_id', { length: 100 }),
    requestSummary: text('request_summary'),
    responseSummary: text('response_summary'),
    latencyMs: integer('latency_ms'),
    status: varchar('status', { length: 20 }).default('success'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('ai_usage_logs_user_id_idx').on(table.userId),
    createdAtIdx: index('ai_usage_logs_created_at_idx').on(table.createdAt),
    providerIdx: index('ai_usage_logs_provider_idx').on(table.provider),
    taskTypeIdx: index('ai_usage_logs_task_type_idx').on(table.taskType),
  }),
);
