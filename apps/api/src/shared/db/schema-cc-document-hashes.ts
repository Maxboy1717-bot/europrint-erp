/**
 * @module schema-cc-document-hashes
 * @description CC document integrity hash (Q-35 schema-approval wave, owner 2026-07-11 —
 * CC-COMPLETE-FRESH-ANALYSIS-2026-07-11.md item #12/#45/#50, `document_hashes` half only).
 *
 * One row per hash computed over a CC document's final signed PDF export
 * (see `CcPdfService.generate()`, apps/api/src/modules/communication-center/application/
 * cc-pdf.service.ts) so Finance can verify byte-for-byte integrity before acting on a
 * reversal. Not unique per document_id — a document may be re-hashed (e.g. re-verified) and
 * each computation is kept as its own audit row, mirroring the `cc_print_log` /
 * `cc_audit_trail` one-row-per-event convention rather than a single mutable per-document
 * column.
 *
 * SCHEMA ONLY (Q-31 draft role): no writer/dispatcher wired yet. A follow-up item should
 * call `CcPdfService.generate()` then insert here (hash = sha256 hex of the returned
 * Uint8Array) at the point a document reaches `workflow_state = 'approved'`
 * (CcWorkflowService.approve, mirroring where CcDocumentFullyApprovedEvent already
 * publishes today, cc-workflow.service.ts:279). Not built here — flagged as a separate,
 * larger item per the draft scope, not implemented in this change.
 *
 * NOTE: CC's own tables (cc_documents, cc_approvals, cc_attachments, ...) have no Drizzle
 * `pgTable` declarations anywhere in this repo — the module is 100% raw-SQL by documented
 * convention (see cc-documents-write.repo.ts header: "Raw SQL retained intentionally").
 * This file is an intentional, additive exception, added only because it was explicitly
 * requested: it exists so a future dispatcher/repository can use typed Drizzle access if it
 * chooses to. Nothing in CC currently imports it, and adding it does not migrate any
 * existing CC repository off raw SQL.
 */

import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';

export const document_hashes = pgTable('document_hashes', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK -> cc_documents(id) ON DELETE CASCADE is enforced at the DB level by the migration
  // (apps/api/src/shared/db/migrations/cc-document-hashes-2026-07-13.sql); cc_documents
  // itself has no Drizzle pgTable to reference here (see module note above).
  document_id: uuid('document_id').notNull(),
  hash: varchar('hash', { length: 128 }).notNull(),
  algorithm: varchar('algorithm', { length: 20 }).notNull().default('sha256'),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (t) => [index('idx_document_hashes_document_id').on(t.document_id)]);
