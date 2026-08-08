-- APPROVED: owner 2026-07-13 — STEP 3.6 (CC-surfacing), unblocked now that erp_documents
-- (erkin hujjatlar) exists. Owner chose "both flows, (a) first". This is the shared link the
-- prompt asked for as "the smallest addition": a nullable FK from a CC document to the erkin
-- hujjat it represents/references. Q-28 dry-run (BEGIN/ALTER/ROLLBACK) proven before apply;
-- the dry-run confirmed the FK rejects a non-existent erp id. Idempotent.
--
-- Reuses existing CC primitives (CcWorkflowService.createDraft + transition) — no parallel
-- inbox. cc_documents.template_id is NOT NULL, so a reserved generic 'ERKIN-HUJJAT' template
-- is seeded (data, not DDL) for CC records that wrap an erkin hujjat.
ALTER TABLE cc_documents
  ADD COLUMN IF NOT EXISTS related_erp_document_id UUID REFERENCES erp_documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cc_documents_related_erp
  ON cc_documents(related_erp_document_id) WHERE related_erp_document_id IS NOT NULL;

-- Reserved generic template for erkin-hujjat -> CC (looked up by code, id varies per DB).
INSERT INTO cc_document_templates (id, code, name_uz, name_ru, category)
SELECT gen_random_uuid(), 'ERKIN-HUJJAT', 'Erkin hujjat', 'Svobodnyy dokument', 'erkin'
WHERE NOT EXISTS (SELECT 1 FROM cc_document_templates WHERE code = 'ERKIN-HUJJAT');
