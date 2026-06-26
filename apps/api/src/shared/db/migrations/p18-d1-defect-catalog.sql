-- GATED: egasi tasdiqlamaguncha ISHGA TUSHIRILMAYDI (Q-35).
-- Ishga tushirish uchun egasi quyidagi qatorni qo'shsin:
--   -- APPROVED: <egasi> <sana>
-- P18-D1: defect_catalog CREATE TABLE — QC nuqson turi katalogi (gofra/offset/silkscreen/flexi/universal).
-- Drizzle ta'rif: apps/api/src/shared/db/schema-misc-qc.ts (export const defect_catalog).
-- Seed: docs/migration/seed/seed-05-defects.sql (APPROVED owner 2026-06-18) — shu migration seed'ni ham qo'shadi.
-- Idempotent: CREATE TABLE IF NOT EXISTS + ON CONFLICT (code) DO NOTHING.
-- Ishlatish (egasi APPROVED qo'ygach):
--   psql $DATABASE_URL -f apps/api/src/shared/db/migrations/p18-d1-defect-catalog.sql

BEGIN;

CREATE TABLE IF NOT EXISTS defect_catalog (
  id                   SERIAL PRIMARY KEY,
  code                 TEXT NOT NULL UNIQUE,
  name_uz              TEXT NOT NULL,
  name_ru              TEXT,
  direction            TEXT NOT NULL
    CHECK (direction IN ('universal','gofra','offset','silkscreen','flexi')),
  severity             TEXT NOT NULL DEFAULT 'MINOR'
    CHECK (severity IN ('CRITICAL','MAJOR','MINOR')),
  auto_reject          BOOLEAN NOT NULL DEFAULT FALSE,
  description_uz       TEXT,
  corrective_action_uz TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defect_catalog_direction ON defect_catalog(direction);
CREATE INDEX IF NOT EXISTS idx_defect_catalog_severity  ON defect_catalog(severity);

COMMENT ON TABLE defect_catalog IS
  'P18: QC nuqson turi katalogi — gofra/offset/silkscreen/flexi/universal. Seed: seed-05-defects.sql (APPROVED 2026-06-18).';

COMMIT;

-- Jadval yaratilgach, tasdiqlangan seed'ni qo'llang (alohida tranzaksiya):
--   psql $DATABASE_URL -f docs/migration/seed/seed-05-defects.sql
-- Tekshirish:
--   SELECT direction, COUNT(*) FROM defect_catalog GROUP BY direction;  -- gofra=6 offset=7 silkscreen=3 flexi=3 universal=4
