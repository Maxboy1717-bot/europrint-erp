/**
 * @module schema-ai-fit
 * @description Drizzle table defs for the AI-fit per-card scorer (P36) and the
 *   sibling CKP score/chat-log tables. Columns mirror the live PostgreSQL schema
 *   exactly (created by the coordinator migration — see information_schema). The
 *   CKP tables are defined here for completeness; only `aiFitScores` is wired by
 *   the AI-fit vertical slice (the CKP service is out of scope).
 * @layer Shared (DB schema)
 */

import { pgTable, serial, integer, text, boolean, jsonb, timestamp, numeric } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const aiFitScores = pgTable('ai_fit_scores', {
  id:                   serial('id').primaryKey(),
  employeeId:           integer('employee_id').notNull(),
  cardId:               integer('card_id').notNull(),
  fitScore:             numeric('fit_score', { precision: 5, scale: 2 }).notNull(),
  fitReport:            jsonb('fit_report'),
  bonusRecommendation:  numeric('bonus_recommendation', { precision: 10, scale: 2 }),
  successionCandidate:  boolean('succession_candidate').notNull().default(false),
  aiProvider:           text('ai_provider'),
  evaluatedAt:          timestamp('evaluated_at', { withTimezone: true }).notNull().default(sql`now()`),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const aiCkpScores = pgTable('ai_ckp_scores', {
  id:               serial('id').primaryKey(),
  employeeId:       integer('employee_id').notNull(),
  scoreDate:        timestamp('score_date', { withTimezone: true }).notNull().default(sql`now()`),
  ckpScore:         numeric('ckp_score').notNull().default('0'),
  attendanceScore:  numeric('attendance_score').default('0'),
  qualityScore:     numeric('quality_score').default('0'),
  planScore:        numeric('plan_score').default('0'),
  timeScore:        numeric('time_score').default('0'),
  aiExplanation:    text('ai_explanation'),
  salaryGatePass:   boolean('salary_gate_pass').notNull().default(false),
  rawMetrics:       jsonb('raw_metrics'),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export const aiCkpChatLogs = pgTable('ai_ckp_chat_logs', {
  id:          serial('id').primaryKey(),
  employeeId:  integer('employee_id').notNull(),
  role:        text('role').notNull(),
  content:     text('content').notNull(),
  sessionId:   text('session_id').notNull(),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
});

export type AiFitScoreRow    = typeof aiFitScores.$inferSelect;
export type AiFitScoreInsert = typeof aiFitScores.$inferInsert;
export type AiCkpScoreRow     = typeof aiCkpScores.$inferSelect;
export type AiCkpChatLogRow   = typeof aiCkpChatLogs.$inferSelect;
