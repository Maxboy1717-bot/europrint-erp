-- org-card-required-equipment-2026-07-13.sql
-- "Kerakli jihozlar" (required equipment per position/karta) — genuinely missing data model,
-- confirmed by multiple prior audits (no columns/tables at all). This is a minimal additive field
-- on the canonical card table (org_departments, PHASE-00 MASSIV-100 "node=karta"), NOT a new
-- subsystem: a single jsonb array of equipment-name strings, CRUD'd via
-- CardController (:id/equipment GET/POST/DELETE) + CardRepository (atomic single-UPDATE
-- add/remove, no read-then-write race).
--
-- APPROVED: owner schema-approval 2026-07-13 (Muslimbek, chat) -- HR-modul to'liq qurish direktivasi
--
-- ADD-ONLY / idempotent: ALTER TABLE ... ADD COLUMN IF NOT EXISTS. Mirrored into the startup
-- bootstrap (apps/api/src/shared/db/invariants/migrations-drift.ts) so fresh DBs get this
-- shape directly on boot — this standalone file exists for manual/CI application parity
-- (docs/GIT_QOIDALARI.md migration-commit convention), same pattern as
-- org-card-portret-2026-06-19.sql / org-node-portret-card-key-2026-06-20.sql.
--
-- Qo'llash: psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/org-card-required-equipment-2026-07-13.sql

ALTER TABLE org_departments
  ADD COLUMN IF NOT EXISTS required_equipment JSONB NOT NULL DEFAULT '[]'::jsonb;

-- DB-proof: after running
-- SELECT column_name, data_type, column_default FROM information_schema.columns
-- WHERE table_name = 'org_departments' AND column_name = 'required_equipment';
-- Expected: 1 row (required_equipment, jsonb, '[]'::jsonb).
