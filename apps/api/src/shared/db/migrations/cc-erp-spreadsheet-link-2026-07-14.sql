-- APPROVED: owner directive (P1-9, "davom eting ... bajaring", 2026-07-14). Q-28 dry-run proven
-- (BEGIN; ALTER …; ROLLBACK; succeeded, column absent after rollback). Mirrors the erp_document
-- link (cc-erp-document-link-step36a-2026-07-13.sql): lets a CC record surfaced FROM a spreadsheet
-- be joined back by spreadsheet id, instead of only via the body text + chat ping.
-- Idempotent (already applied live on 2026-07-14); safe to re-run.

ALTER TABLE cc_documents
  ADD COLUMN IF NOT EXISTS related_erp_spreadsheet_id UUID REFERENCES erp_spreadsheets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cc_documents_related_erp_spreadsheet
  ON cc_documents(related_erp_spreadsheet_id) WHERE related_erp_spreadsheet_id IS NOT NULL;
