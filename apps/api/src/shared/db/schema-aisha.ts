/**
 * @module schema-aisha
 * @description Drizzle schema for AIsha (Director voice assistant).
 *
 * Four tables:
 *  - aisha_conversations   — one row per voice session (start/end/status)
 *  - aisha_tool_calls      — every tool the LLM invoked + provenance metadata
 *  - aisha_voice_audit     — transcript + timestamp the raw audio was purged
 *  - aisha_pending_approvals — high-stake action awaiting voice "yes" or PIN
 */

import { pgTable, uuid, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const aishaConversations = pgTable(
  'aisha_conversations',
  {
    id:        uuid('id').primaryKey().defaultRandom(),
    userId:    integer('user_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt:   timestamp('ended_at', { withTimezone: true }),
    status:    text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('aisha_conv_user_idx').on(t.userId),
    index('aisha_conv_status_idx').on(t.status),
  ],
);

export const aishaToolCalls = pgTable(
  'aisha_tool_calls',
  {
    id:             uuid('id').primaryKey().defaultRandom(),
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
