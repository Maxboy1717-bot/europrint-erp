/**
 * @module agent-schema
 * @description Drizzle ORM schema for Agent/AI monitoring tables.
 * Promoted from schema-db-only-generated.ts — tables exist in DB, now have proper Drizzle definitions.
 */

import {
  pgTable, uuid, varchar, text, integer, boolean, timestamp, numeric, jsonb,
} from 'drizzle-orm/pg-core';

// ── Agent Alerts ──────────────────────────────────────────────────────────────
export const agentAlerts = pgTable('agent_alerts', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  agentName:          varchar('agent_name', { length: 60 }).notNull(),
  severity:           varchar('severity', { length: 20 }).notNull(),
  title:              varchar('title', { length: 300 }).notNull(),
  message:            text('message').notNull(),
  targetUserId:       integer('target_user_id'),
  targetRole:         varchar('target_role', { length: 40 }),
  module:             varchar('module', { length: 60 }),
  relatedId:          varchar('related_id', { length: 80 }),
  isRead:             boolean('is_read').notNull().default(false),
  readAt:             timestamp('read_at'),
  telegramSent:       boolean('telegram_sent').notNull().default(false),
  telegramMessageId:  varchar('telegram_message_id', { length: 50 }),
  actionRequired:     boolean('action_required').notNull().default(false),
  actions:            jsonb('actions'),
  createdAt:          timestamp('created_at').notNull().defaultNow(),
});

// ── Agent Cron State ──────────────────────────────────────────────────────────
export const agentCronState = pgTable('agent_cron_state', {
  agentName:   varchar('agent_name', { length: 60 }).notNull(),
  lastRunAt:   timestamp('last_run_at'),
  nextRunAt:   timestamp('next_run_at'),
  lastSuccess: boolean('last_success'),
  lastError:   text('last_error'),
  runCount:    integer('run_count').notNull().default(0),
  updatedAt:   timestamp('updated_at').notNull().defaultNow(),
});

// ── Agent Module Health ───────────────────────────────────────────────────────
export const agentModuleHealth = pgTable('agent_module_health', {
  moduleName:    varchar('module_name', { length: 60 }).notNull(),
  healthScore:   integer('health_score').notNull(),
  errors_24h:    integer('errors_24h').notNull().default(0),
  avgResponseMs: integer('avg_response_ms'),
  lastError:     text('last_error'),
  lastCheckAt:   timestamp('last_check_at').notNull().defaultNow(),
  issuesSummary: jsonb('issues_summary'),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
});

// ── Agent Modules Registry ────────────────────────────────────────────────────
export const agentModulesRegistry = pgTable('agent_modules_registry', {
  code:       varchar('code', { length: 40 }).notNull(),
  nameUz:     varchar('name_uz', { length: 120 }).notNull(),
  nameRu:     varchar('name_ru', { length: 120 }),
  icon:       varchar('icon', { length: 20 }),
  category:   varchar('category', { length: 40 }),
  ownerRole:  varchar('owner_role', { length: 40 }),
  isCritical: boolean('is_critical').notNull().default(false),
  sortOrder:  integer('sort_order').notNull().default(0),
});

// ── Agents Audit Log ─────────────────────────────────────────────────────────
export const agentsAuditLog = pgTable('agents_audit_log', {
  id:            uuid('id').primaryKey().defaultRandom(),
  agentName:     varchar('agent_name', { length: 60 }).notNull(),
  action:        varchar('action', { length: 80 }).notNull(),
  userId:        integer('user_id'),
  targetType:    varchar('target_type', { length: 60 }),
  targetId:      varchar('target_id', { length: 80 }),
  inputSummary:  jsonb('input_summary'),
  outputSummary: jsonb('output_summary'),
  durationMs:    integer('duration_ms'),
  aiUsed:        boolean('ai_used').notNull().default(false),
  aiTokens:      integer('ai_tokens'),
  aiCostUsd:     numeric('ai_cost_usd', { precision: 10, scale: 6 }),
  success:       boolean('success').notNull().default(true),
  errorMessage:  text('error_message'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
});
