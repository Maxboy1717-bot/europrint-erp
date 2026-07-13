/**
 * @module schema-erp-documents
 * @description "Erkin hujjatlar" (free-form documents) — Phase A1 (owner 2026-07-13).
 * A NEW document type that CONSUMES the existing document-control layer (STEP 3.1-3.5):
 * same 3-tier sensitivity, id (UUID) flows into document_access_log.document_id (TEXT),
 * view/copy/print logging + download-block + watermark + chat-delivery all reused.
 *
 * content = TipTap/ProseMirror JSON (source of truth). content_html = rendered HTML for
 * in-app preview + Phase-A2 PDF generation. deleted_at = soft-delete (audited docs are
 * never hard-deleted). DDL in migrations/erp-documents-phaseA1-2026-07-13.sql (Q-28 proven).
 */

import { pgTable, uuid, text, jsonb, integer, timestamp, index } from 'drizzle-orm/pg-core';

export const erp_documents = pgTable('erp_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: jsonb('content').notNull(),
  content_html: text('content_html'),
  owner_id: integer('owner_id').notNull(),
  sensitivity_tier: text('sensitivity_tier').notNull().default('oddiy'),
  version: integer('version').notNull().default(1),
  deleted_at: timestamp('deleted_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('idx_erp_documents_owner').on(t.owner_id)]);

export type ErpDocumentRow = typeof erp_documents.$inferSelect;
export type ErpDocumentInsert = typeof erp_documents.$inferInsert;
