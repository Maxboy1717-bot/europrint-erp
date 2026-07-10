-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/mes-norma-version-snapshot-2026-07-11.sql
-- Vision: vision-1000-answers/08-mes.md #4 — "Sessiya BOSHLANGANDAGI norma
--   versiyasi qo'llanadi (retro-buzilmaslik)".
--
-- material_norms = kanonik ishlab-chiqarish-norma jadvali (docs/DB_ERD.md; jonli
--   0 qator; drizzle: lib/db/src/schema/pp/pp-enhanced.ts materialNorms).
--     version        = norma avlodi (default 1).
--     effective_date = o'sha avlod amalga kirgan sana. YANGI qatorlar uchun default
--       CURRENT_DATE; MAVJUD qatorlar created_at'dan backfill qilinadi (ADD COLUMN
--       avval NULL bilan qo'shiladi → backfill → SET DEFAULT).
--
-- production_sessions = kanonik MES sessiya jadvali (mes_production_sessions = uning
--   ustidagi VIEW). norma_version = sessiya BOSHLANGANDA (started_at) amalda bo'lgan
--   (effective_date <= started_at) eng yuqori AKTIV norma versiyasining SNAPSHOTI.
--   NULL = hali snapshot qilinmagan / amaldagi norma yo'q. start-session.handler.ts
--   yozadi (first-write-wins → retro-buzilmaslik: keyingi norma o'zgarishi allaqachon
--   boshlangan sessiyaning versiyasini o'zgartirmaydi).
--
-- Idempotent (ADD COLUMN IF NOT EXISTS / SET DEFAULT / CREATE INDEX IF NOT EXISTS).
--   Default/NULL bilan mavjud qatorlar regressiyasiz (8 mavjud sessiya norma_version
--   = NULL bo'lib qoladi).
-- ============================================================

ALTER TABLE material_norms      ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE material_norms      ADD COLUMN IF NOT EXISTS effective_date date;
UPDATE material_norms SET effective_date = created_at::date WHERE effective_date IS NULL;
ALTER TABLE material_norms      ALTER COLUMN effective_date SET DEFAULT CURRENT_DATE;

ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS norma_version integer;

CREATE INDEX IF NOT EXISTS idx_material_norms_version_effective
  ON material_norms (version, effective_date);
