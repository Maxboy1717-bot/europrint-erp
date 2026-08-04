-- org-card-merge-split-2026-08-04.sql
-- EP-ORG-064 (merge) / EP-ORG-065 (split) card endpoints — HR-ORG discovery sweep (2026-08-04),
-- item "Karta Merge/Split endpointlari umuman yo'q". Tavsiya A recorded in
-- docs/audit/decisions/01-org-kartalar.md:460-472 (status still OCHIQ — final owner sign-off
-- pending; implemented per the recorded recommendation so the endpoints exist meanwhile).
--
-- Two nullable self-referencing FK columns on the canonical card table (org_departments,
-- PHASE-00 "node=karta"), NOT a new subsystem — mirrors the SB0233
-- production_orders.org_department_id FK pattern already in migrations-drift.ts.
--
--   merged_into_id — stamped on the SECONDARY card when CardService.mergeCards() archives it;
--                    points at the surviving primary card.
--   split_from_id  — stamped on each of the two brand-new cards CardService.splitCard() creates;
--                    points back at the now-archived source card ("havola bilan bog'lanadi").
--
-- Mirrored into the startup bootstrap (apps/api/src/shared/db/invariants/migrations-drift.ts)
-- so fresh DBs get this shape directly on boot — this standalone file exists for manual/CI
-- application parity (docs/GIT_QOIDALARI.md migration-commit convention), same pattern as
-- org-card-required-equipment-2026-07-13.sql.
--
-- Qo'llash: psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/org-card-merge-split-2026-08-04.sql

ALTER TABLE org_departments
  ADD COLUMN IF NOT EXISTS merged_into_id INTEGER,
  ADD COLUMN IF NOT EXISTS split_from_id  INTEGER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_org_departments_merged_into') THEN
    ALTER TABLE org_departments
      ADD CONSTRAINT fk_org_departments_merged_into
      FOREIGN KEY (merged_into_id) REFERENCES org_departments(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_org_departments_split_from') THEN
    ALTER TABLE org_departments
      ADD CONSTRAINT fk_org_departments_split_from
      FOREIGN KEY (split_from_id) REFERENCES org_departments(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_org_departments_merged_into_id
  ON org_departments (merged_into_id) WHERE merged_into_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_departments_split_from_id
  ON org_departments (split_from_id) WHERE split_from_id IS NOT NULL;

-- DB-proof: after running
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'org_departments' AND column_name IN ('merged_into_id', 'split_from_id');
-- Expected: 2 rows, both integer.
