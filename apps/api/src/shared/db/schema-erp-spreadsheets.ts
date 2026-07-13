/**
 * @module schema-erp-spreadsheets
 * @description "Jadval" (spreadsheets) — Phase B (owner 2026-07-13). A NEW document type that
 * CONSUMES the document-control layer (3.1-3.6), mirroring erp_documents: same 3-tier
 * sensitivity, id (UUID) flows into document_access_log.document_id (TEXT), view/copy/print
 * logging + download-block + watermark + CC-surfacing all reused. cells = JSONB map written by
 * the FE grid (formulas evaluated client-side). deleted_at = soft-delete. DDL in
 * migrations/erp-spreadsheets-phaseB-2026-07-13.sql (Q-28 proven).
 */

import { pgTable, uuid, text, jsonb, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const erp_spreadsheets = pgTable('erp_spreadsheets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  cells: jsonb('cells').notNull(),
  owner_id: integer('owner_id').notNull(),
  sensitivity_tier: text('sensitivity_tier').notNull().default('oddiy'),
  version: integer('version').notNull().default(1),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_erp_spreadsheets_owner').on(t.owner_id)]);

export type ErpSpreadsheetRow = typeof erp_spreadsheets.$inferSelect;
export type ErpSpreadsheetInsert = typeof erp_spreadsheets.$inferInsert;
