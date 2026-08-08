/**
 * @module schema-document-control
 * @description Cross-cutting Document Control / leak-prevention layer (owner 2026-07-13).
 *
 * `document_access_log` — the SINGLE canonical cross-module access register for every
 * document type (CC / HR / LMS / MES tech-cards / SD / Finance / …). Owner chose one new
 * table over extending cc_audit_trail, because the global `audit_logs` (schema-rbac.ts)
 * deliberately SKIPS GET (audit.interceptor.ts:16) so views are never captured, and its
 * record_id/table_name are heuristic strings — neither fits typed per-document
 * (document_type, document_id, action) access logging. cc_audit_trail stays for CC's
 * workflow/basket trail; new view/copy/print/export events (incl. CC) centralize here.
 *
 * Append-only, retained forever (no delete path). DDL + first-wave sensitivity_tier columns
 * live in migrations/document-control-3.1-access-log-tiers-2026-07-13.sql (Q-28 dry-run
 * proven, APPROVED). `document_id` is text because ids vary by module (uuid vs integer).
 */

import { pgTable, serial, integer, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';

export const document_access_log = pgTable('document_access_log', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id'),
  user_full_name: text('user_full_name'),
  user_role: varchar('user_role', { length: 50 }),
  document_type: varchar('document_type', { length: 60 }).notNull(),
  document_id: text('document_id').notNull(),
  action: varchar('action', { length: 20 }).notNull(), // view | print | copy | export | client_export
  reason: text('reason'), // app-level required for print/export
  sensitivity_tier: varchar('sensitivity_tier', { length: 20 }),
  ip_address: varchar('ip_address', { length: 64 }),
  user_agent: text('user_agent'),
  device: varchar('device', { length: 120 }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_doc_access_doc').on(t.document_type, t.document_id),
  index('idx_doc_access_user').on(t.user_id, t.created_at),
]);

export type DocumentAccessLogRow = typeof document_access_log.$inferSelect;
export type DocumentAccessLogInsert = typeof document_access_log.$inferInsert;

/** The five logged actions. print/export require a reason (enforced in app code). */
export const DOCUMENT_ACCESS_ACTIONS = ['view', 'print', 'copy', 'export', 'client_export'] as const;
export type DocumentAccessAction = (typeof DOCUMENT_ACCESS_ACTIONS)[number];

/** Sensitivity tiers (owner decision #12). */
export const SENSITIVITY_TIERS = ['oddiy', 'maxfiy', 'juda-maxfiy'] as const;
export type SensitivityTier = (typeof SENSITIVITY_TIERS)[number];
