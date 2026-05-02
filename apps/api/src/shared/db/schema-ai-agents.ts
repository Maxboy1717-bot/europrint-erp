import {
  pgTable, uuid, text, boolean, integer, jsonb,
  timestamp, numeric, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const aiDecisionLog = pgTable('ai_decision_log', {
  id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  agentCode:     text('agent_code').notNull(),
  entityType:    text('entity_type').notNull(),
  entityId:      uuid('entity_id').notNull(),
  inputHash:     text('input_hash').notNull(),
  bucketHour:    timestamp('bucket_hour', { withTimezone: true }).notNull().default(sql`date_trunc('hour', now())`),
  decision:      jsonb('decision').notNull(),
  confidence:    numeric('confidence', { precision: 4, scale: 3 }).notNull(),
  modelVersion:  text('model_version').notNull(),
  autoExecuted:  boolean('auto_executed').notNull().default(false),
  humanOverride: jsonb('human_override'),
  latencyMs:     integer('latency_ms').notNull(),
  costUsd:       numeric('cost_usd', { precision: 10, scale: 6 }),
  createdAt:     timestamp('created_at', { withTimezone: true }).default(sql`now()`),
}, (t) => [
  index('ai_decision_log_agent_idx').on(t.agentCode, t.createdAt),
  index('ai_decision_log_entity_idx').on(t.entityType, t.entityId),
  uniqueIndex('ai_decision_log_idempotency_idx').on(t.agentCode, t.inputHash, t.bucketHour),
]);

export type AiDecisionLogRow  = typeof aiDecisionLog.$inferSelect;
export type AiDecisionLogInsert = typeof aiDecisionLog.$inferInsert;
