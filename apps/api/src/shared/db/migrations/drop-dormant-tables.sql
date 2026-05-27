-- ============================================================================
-- drop-dormant-tables.sql  (2026-05-27)
-- Drops dormant duplicate tables that have ZERO references in apps/api/src/modules.
-- Verified dead 2026-05-27 (see docs/schema-canon-map.md "Dormant tables to DROP").
--
-- ⚠ IRREVERSIBLE DATA LOSS. DO NOT RUN until you have taken a backup:
--      bash scripts/backup-db.sh tables payroll_calculations pos_transactions pos_products
--   (or a full backup). Confirm backups/tables-*.sql exists, then run this file.
--
-- These tables are NOT the live ones — the live equivalents are:
--   payroll_calculations -> live payroll uses `salary_history`
--   pos_transactions     -> live POS uses `retail_pos_transactions`
--   pos_products         -> live POS uses `retail_pos_products`
--
-- NOTE: `pos_products` is still re-exported (aliased) by
-- apps/api/src/shared/db/schema-ext-b-2.ts; remove that re-export and the
-- lib/db `posProducts` def in the same change BEFORE applying its DROP.
-- ============================================================================

BEGIN;

-- guard: refuse to run if a backup marker is absent is left to the operator
-- (this file is intentionally not auto-applied by any boot path).

DROP TABLE IF EXISTS payroll_calculations CASCADE;
DROP TABLE IF EXISTS pos_transactions CASCADE;
-- DROP TABLE IF EXISTS pos_products CASCADE;   -- enable only after removing schema-ext-b-2.ts re-export

COMMIT;
