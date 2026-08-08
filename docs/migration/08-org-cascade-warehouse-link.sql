-- APPROVED: Claude(egasi vakolati) 2026-06-19
-- Migration 08: EP-ORG-041 (ORG-CASCADE, owner decision #13) — optional explicit
-- link from an auto-created warehouse back to its org_departments node.
--
-- WHY OPTIONAL / NOT-RUN:
--   The cascade code (apps/api/src/modules/org-structure/cascade/*) is already
--   idempotent WITHOUT this column — it keys on the existing UNIQUE
--   `warehouses.code` via warehouseCodeForNode() = 'ORG-WH-<nodeId>'. This
--   migration adds an EXPLICIT, queryable FK link for reporting/joins. It is the
--   PREFERRED long-term link, but is NOT required for the feature to work, so it
--   is staged (not executed) and the runtime code does not depend on it.
--
--   Reuses the EXISTING `warehouses` table (lib/db wms-schema.ts) — NO parallel
--   master table (Q-46). `warehouses.id` is varchar(uuid); org_departments.id is
--   serial int — the link column is INTEGER referencing org_departments(id).
--
-- TO RUN (owner decision):
--   psql "$DATABASE_URL" -f docs/migration/08-org-cascade-warehouse-link.sql
-- After running, optionally surface the column in lib/db wms-schema.ts and
-- rebuild lib/db (pnpm --filter @workspace/db build).

BEGIN;

ALTER TABLE warehouses
  ADD COLUMN IF NOT EXISTS org_department_id INTEGER;

-- FK to the canonical org tree; SET NULL on node delete so the warehouse row
-- survives an org reorg (it can be re-linked).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'warehouses_org_department_id_fkey'
      AND table_name = 'warehouses'
  ) THEN
    ALTER TABLE warehouses
      ADD CONSTRAINT warehouses_org_department_id_fkey
      FOREIGN KEY (org_department_id)
      REFERENCES org_departments(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- One warehouse per node for cascade-created rows (NULLs allowed = manual WHs).
CREATE UNIQUE INDEX IF NOT EXISTS uq_warehouses_org_department_id
  ON warehouses (org_department_id)
  WHERE org_department_id IS NOT NULL;

-- Backfill existing cascade-created warehouses from their deterministic code.
UPDATE warehouses
SET    org_department_id = CAST(SUBSTRING(code FROM 'ORG-WH-([0-9]+)') AS INTEGER)
WHERE  code ~ '^ORG-WH-[0-9]+$'
  AND  org_department_id IS NULL;

COMMIT;

-- Verify:
-- SELECT code, org_department_id FROM warehouses WHERE code LIKE 'ORG-WH-%';
