/**
 * @module aisha-schema
 * @description Drizzle ORM schema for AIsha (Director voice assistant).
 *
 * Four tables:
 *  - aisha_conversations   — one row per voice session (start/end/status)
 *  - aisha_tool_calls      — every tool the LLM invoked + provenance metadata
 *  - aisha_voice_audit     — transcript + timestamp the raw audio was purged
 *  - aisha_pending_approvals — high-stake action awaiting voice "yes" or PIN
 *
 * Canonical source: apps/api/src/shared/db/schema-aisha.ts
 */

import { pgTable, uuid, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const aishaConversations = pgTable(
  'aisha_conversations',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    tenantId:  integer('tenant_id').notNull().default(1),
    userId:    integer('user_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt:   timestamp('ended_at', { withTimezone: true }),
    status:    text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('aisha_conv_user_idx').on(t.userId),
    index('aisha_conv_status_idx').on(t.status),
    index('aisha_conv_tenant_idx').on(t.tenantId),
  ],
);

export const aishaToolCalls = pgTable(
  'aisha_tool_calls',
  {
    id:             uuid('id').primaryKey().defaultRandom(),
    tenantId:       integer('tenant_id').notNull().default(1),
    conversationId: uuid('conversation_id').notNull().references(() => aishaConversations.id, { onDelete: 'cascade' }),
    toolName:       text('tool_name').notNull(),
    input:          jsonb('input').notNull(),
    output:         jsonb('output'),
    source:         text('source'),
    latencyMs:      integer('latency_ms'),
    createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('aisha_tool_conv_idx').on(t.conversationId),
    index('aisha_tool_name_idx').on(t.toolName),
    index('aisha_tool_tenant_idx').on(t.tenantId),
  ],
);

export const aishaVoiceAudit = pgTable(
  'aisha_voice_audit',
  {
    id:             uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id').notNull().references(() => aishaConversations.id, { onDelete: 'cascade' }),
    transcript:     text('transcript').notNull(),
    audioDeletedAt: timestamp('audio_deleted_at', { withTimezone: true }),
    createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('aisha_audit_conv_idx').on(t.conversationId)],
);

export const aishaPendingApprovals = pgTable(
  'aisha_pending_approvals',
  {
    id:             uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id').notNull().references(() => aishaConversations.id, { onDelete: 'cascade' }),
    toolCallId:     uuid('tool_call_id').notNull().references(() => aishaToolCalls.id, { onDelete: 'cascade' }),
    status:         text('status').notNull().default('pending'),
    approvedAt:     timestamp('approved_at', { withTimezone: true }),
    createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('aisha_approval_conv_idx').on(t.conversationId),
    index('aisha_approval_status_idx').on(t.status),
  ],
);

export const insertAishaConversationSchema = createInsertSchema(aishaConversations).omit({ id: true, createdAt: true } as never);
export const insertAishaToolCallSchema    = createInsertSchema(aishaToolCalls).omit({ id: true, createdAt: true } as never);
export const insertAishaVoiceAuditSchema  = createInsertSchema(aishaVoiceAudit).omit({ id: true, createdAt: true } as never);
export const insertAishaPendingApprovalSchema = createInsertSchema(aishaPendingApprovals).omit({ id: true, createdAt: true } as never);

export type AishaConversation       = typeof aishaConversations.$inferSelect;
export type InsertAishaConversation = z.infer<typeof insertAishaConversationSchema>;
export type AishaToolCall           = typeof aishaToolCalls.$inferSelect;
export type InsertAishaToolCall     = z.infer<typeof insertAishaToolCallSchema>;
export type AishaVoiceAudit         = typeof aishaVoiceAudit.$inferSelect;
export type InsertAishaVoiceAudit   = z.infer<typeof insertAishaVoiceAuditSchema>;
export type AishaPendingApproval    = typeof aishaPendingApprovals.$inferSelect;
export type InsertAishaPendingApproval = z.infer<typeof insertAishaPendingApprovalSchema>;
