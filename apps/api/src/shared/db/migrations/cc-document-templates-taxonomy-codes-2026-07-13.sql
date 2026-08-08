-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- CC gap fix (docs/audit/CC-COMPLETE-FRESH-ANALYSIS-2026-07-11.md, item #25, P1):
-- taxonomy_entries already seeds two vocabularies that no cc_* table references:
--   contact_type  (5 rows: buyruq / malumot_talabi / bildirishnoma / sorov / hisobot)
--   document_type (6 rows: tex_karta / ish_rejasi / sifat_hisoboti / smena_topshirigi /
--                  xavfsizlik_brifingi / nazorat_varaqasi)
-- Confirmed live (europrint, 2026-07-13): both categories are seeded in taxonomy_entries
-- (SELECT category, code FROM taxonomy_entries WHERE category IN ('contact_type',
-- 'document_type') -> 11 rows), and neither cc_documents nor cc_document_templates has a
-- column referencing them (\d on both tables; information_schema.columns LIKE
-- '%type_code%' on both -> 0 rows).
--
-- Target table: cc_document_templates, not cc_documents. A document's type/contact-nature
-- is a property of its template (cc_documents.template_id already fixes which template —
-- and therefore which classification — a document instance has), matching how
-- cc_document_templates.category (ariza/buyruq/hisobot/xabar, 21 live rows, a distinct and
-- disjoint vocabulary from contact_type/document_type) already classifies templates, not
-- individual documents. Only cc_document_templates has an admin CRUD surface today
-- (POST /cc/templates, PATCH /cc/templates/:id — cc-documents.controller.ts
-- createTemplate/updateTemplate, added 2026-07-13, super_admin-only) for an owner to
-- actually set these codes on; cc_documents only exposes narrow workflow-action endpoints
-- (send/approve/reject/cancel/print/etc.), no generic metadata PATCH.
--
-- Soft-reference, no FK — project convention (schema-kanban.ts kanban_cards.task_type
-- comment: "taxonomy_entries(category=..., code) ga soft-reference ... FK'siz"; matched by
-- category+code at query time, not by a foreign key). VARCHAR(60) matches
-- taxonomy_entries.code's live width (character varying(60), verified via \d
-- taxonomy_entries). Nullable, no default: NULL = "not yet classified" — every existing
-- cc_document_templates row (21 rows, verified live) and every existing
-- createTemplate/updateTemplate caller keeps working unchanged (Q-46 additive-only). No
-- business number/threshold is fabricated (Q-40) — pure classification soft-reference, no
-- numeric default involved.
--
-- Wired through the existing template CRUD (super_admin-only):
--   CreateCcTemplateSchema/UpdateCcTemplateSchema (cc-documents.controller.ts) accept
--   optional documentTypeCode/contactTypeCode (nullable, max 60 chars).
--   CreateTemplateInput/UpdateTemplateInput/CcTemplateAdminRow (cc-documents/types.ts)
--   carry the two fields through the repository facade.
--   CcDocumentsWriteRepo.createTemplate/updateTemplate (cc-documents-write.repo.ts)
--   persist them; CcDocumentsReadRepo.getTemplateAdmin (cc-documents-read.repo.ts)
--   returns them (backs the create/update response and GET-after-write round trip).
--
-- Applied at boot via ensureSchemaAdditions() — this .sql is the human-readable mirror of
-- the entries actually executed from
-- apps/api/src/shared/db/invariants/migrations-schema.ts (SCHEMA_MIGRATIONS array,
-- 'cc_document_templates.document_type_code column (CC taxonomy soft-ref, owner 2026-07-11
-- schema-approval)' and 'cc_document_templates.contact_type_code column (CC taxonomy
-- soft-ref, owner 2026-07-11 schema-approval)').
-- Idempotent: ADD COLUMN IF NOT EXISTS — safe to re-run.

ALTER TABLE IF EXISTS cc_document_templates
  ADD COLUMN IF NOT EXISTS document_type_code VARCHAR(60);

ALTER TABLE IF EXISTS cc_document_templates
  ADD COLUMN IF NOT EXISTS contact_type_code VARCHAR(60);
