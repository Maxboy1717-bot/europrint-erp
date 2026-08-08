-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Vision 06-sd#18: Shared forma (klishe/shtamp) auto-detect + warning.
-- Adds a physical die identity (die_code) to ow_molds, decoupled from the 1:1 order_id, so the
-- same physical forma/klishe reused across multiple orders can be detected and a non-blocking
-- warning surfaced to the manager. die_code defaults NULL (no regression) until a die is tagged;
-- a partial index keeps the shared-die detector fast. No owner data required.

ALTER TABLE ow_molds ADD COLUMN IF NOT EXISTS die_code text;

COMMENT ON COLUMN ow_molds.die_code IS
  'Physical die/forma identity (vision 06-sd#18): decoupled from 1:1 order_id; NULL until tagged. Same die_code across >1 order = shared-forma warning.';

CREATE INDEX IF NOT EXISTS idx_ow_molds_die_code ON ow_molds (die_code) WHERE die_code IS NOT NULL;
