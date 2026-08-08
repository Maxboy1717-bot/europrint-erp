-- APPROVED: owner 2026-07-13 — Phase B (spreadsheet authoring, "Jadval"). Owner approved
-- the schema DDL + a custom lightweight grid (no new grid dependency). Q-28 dry-run
-- (BEGIN/CREATE/ROLLBACK) proven before apply (insert + CHECK-rejects-bad-tier verified).
--
-- Same shape/conventions as erp_documents: a NEW document type that CONSUMES the existing
-- document-control layer (3.1-3.6). id UUID → document_access_log.document_id (TEXT); same
-- 3-tier CHECK; view/copy/print logging, download-block, watermark, CC-surfacing all REUSED.
-- cells = JSONB map (e.g. {"A1":{"v":"1","f":"=SUM(...)"}}) written by the FE grid; formulas
-- are evaluated client-side (SUM/AVERAGE/COUNT/IF) — no backend formula engine. deleted_at =
-- soft-delete (audited docs never hard-deleted). Idempotent.
CREATE TABLE IF NOT EXISTS erp_spreadsheets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  cells            JSONB NOT NULL,
  owner_id         INTEGER NOT NULL REFERENCES users(id),
  sensitivity_tier TEXT NOT NULL DEFAULT 'oddiy' CHECK (sensitivity_tier IN ('oddiy','maxfiy','juda-maxfiy')),
  version          INTEGER NOT NULL DEFAULT 1,
  deleted_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_erp_spreadsheets_owner ON erp_spreadsheets(owner_id) WHERE deleted_at IS NULL;
