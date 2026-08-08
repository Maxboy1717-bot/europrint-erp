-- APPROVED: owner 2026-06-08
-- ORG Phase 3 — card_folders: the card's 6-section folder (EP-ORG-007), 1:1 with the canonical
--   card (org_functions). UNIQUE(card_id) enforces one folder per card (enables upsert ON CONFLICT).
--   completeness% is COMPUTED in the service from the 6 sections (NOT stored — avoids staleness).
--   ЦКП reuses org_functions.tskp / tskp_target / tskp_measurement_unit (NO dup DDL).
--   Soft-delete via is_active (same as razryad_levels; no deleted_at). Idempotent.
CREATE TABLE IF NOT EXISTS card_folders (
  id          SERIAL PRIMARY KEY,
  card_id     INTEGER NOT NULL REFERENCES org_functions(id) ON DELETE CASCADE,
  vazifa      TEXT,   -- 1. vazifa (task)
  javobgarlik TEXT,   -- 2. javobgarlik (responsibility)
  gsd         TEXT,   -- 3. GSD
  reglament   TEXT,   -- 4. reglament (regulation)
  jarayon     TEXT,   -- 5. jarayon (process)
  talim       TEXT,   -- 6. ta'lim (education)
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (card_id)   -- also serves as the card_id index (no separate index needed)
);
