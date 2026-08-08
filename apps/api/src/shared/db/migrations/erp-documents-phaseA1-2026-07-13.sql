-- APPROVED: owner 2026-07-13 — "erkin hujjatlar" (free-form documents), Phase A1 schema.
-- Owner approved after Step-0 findings + Phase-A design: (1) start Phase A now, (2) add
-- deleted_at, (3) TipTap editor. Q-28 dry-run (BEGIN/CREATE/ROLLBACK) proven before apply.
--
-- erp_documents is a NEW document type that plugs into the EXISTING document-control layer
-- (STEP 3.1-3.5): sensitivity_tier follows the same 3-tier CHECK; id is UUID and slots into
-- document_access_log.document_id (TEXT); view/copy/print logging, download-block hook,
-- watermark and chat-delivery are all REUSED (no parallel system). content = TipTap/
-- ProseMirror JSON (source of truth); content_html = rendered HTML for preview + Phase-A2 PDF.
-- Idempotent (IF NOT EXISTS). deleted_at = soft-delete (an audited document is never hard-deleted).
CREATE TABLE IF NOT EXISTS erp_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  content          JSONB NOT NULL,
  content_html     TEXT,
  owner_id         INTEGER NOT NULL REFERENCES users(id),
  sensitivity_tier TEXT NOT NULL DEFAULT 'oddiy' CHECK (sensitivity_tier IN ('oddiy','maxfiy','juda-maxfiy')),
  version          INTEGER NOT NULL DEFAULT 1,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_erp_documents_owner ON erp_documents(owner_id) WHERE deleted_at IS NULL;
