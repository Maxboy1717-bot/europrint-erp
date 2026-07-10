-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Vision 10-warehouse #4 — "Ochiq PR miqdori ogohlantirish bayrog'i" (open-PR-quantity warning flag).
-- ALTER the canonical, single-line purchase_requests table (material_id + qty live on the header).
-- Do NOT fork a purchase_request_lines duplicate: purchase_requests is already one-material-per-request
-- and empty with zero live writers (STANDARTLAR §15 — never re-create an existing-shape table; ALTER the canonical one).
--   qty_fulfilled       = how much of the requested qty has been received/fulfilled against this PR
--   open_qty_warning    = derived flag: TRUE when (qty - qty_fulfilled) > 0 on a still-open PR
--   open_qty_warning_at = when the flag last turned TRUE (Director/warehouse triage ordering)
-- All default harmlessly (0 / false / NULL) so existing rows are non-regressed.
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS qty_fulfilled numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS open_qty_warning boolean NOT NULL DEFAULT false;
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS open_qty_warning_at timestamp;
CREATE INDEX IF NOT EXISTS idx_purchase_requests_open_qty_warning ON purchase_requests (open_qty_warning) WHERE open_qty_warning = true;
