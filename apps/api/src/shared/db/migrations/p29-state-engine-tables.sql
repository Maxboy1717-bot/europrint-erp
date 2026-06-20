-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/p29-state-engine-tables.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-20
-- P29 DIR state-engine master-data: company_state_levels + state_thresholds
--   + company_state_log. (ideal_rasm_targets allaqachon mavjud — bu yerda yo'q.)
-- Sabab: P30 diary auto-fill (diary.repository.ts:41) company_state_log dan
--   oxirgi holatni o'qiydi; jadval yo'qligi GET /api/director/diary → 503.
--   Bu migration P29 holat-dvigateli ma'lumot qatlamini yaratadi.
-- Idempotent: CREATE TABLE IF NOT EXISTS + ON CONFLICT DO NOTHING.
--   psql $DATABASE_URL -f p29-state-engine-tables.sql
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. company_state_levels (5 standart daraja)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS company_state_levels (
  id        SERIAL PRIMARY KEY,
  code      VARCHAR(20) UNIQUE NOT NULL,
  label_uz  TEXT NOT NULL,
  label_ru  TEXT NOT NULL,
  color_hex VARCHAR(7) NOT NULL,
  rank      INTEGER NOT NULL
);

INSERT INTO company_state_levels (code, label_uz, label_ru, color_hex, rank)
VALUES
  ('OSISH',   'O''SISH',  'РОСТ',       '#10B981', 5),
  ('NORMAL',  'NORMAL',   'НОРМА',      '#3B82F6', 4),
  ('EHTIYOT', 'EHTIYOT',  'ОСТОРОЖНО',  '#F59E0B', 3),
  ('XAVF',    'XAVF',     'РИСК',       '#F97316', 2),
  ('INQIROZ', 'INQIROZ',  'КРИЗИС',     '#EF4444', 1)
ON CONFLICT (code) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 2. state_thresholds (5 metrika x 5 daraja = 25 qator seed)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS state_thresholds (
  id         SERIAL PRIMARY KEY,
  metric_key VARCHAR(50) NOT NULL,
  level_code VARCHAR(20) NOT NULL REFERENCES company_state_levels(code) ON DELETE CASCADE,
  min_value  NUMERIC(14,4),
  max_value  NUMERIC(14,4),
  weight     NUMERIC(4,3) NOT NULL DEFAULT 0.2,
  CONSTRAINT state_thresholds_metric_chk
    CHECK (metric_key IN ('cash_flow','production_plan','orders','hr','quality')),
  CONSTRAINT state_thresholds_metric_level_uq UNIQUE (metric_key, level_code)
);

INSERT INTO state_thresholds (metric_key, level_code, min_value, max_value, weight)
VALUES
  -- cash_flow (haftalik sof oqim, so'm)
  ('cash_flow','OSISH',   180000000, NULL,      0.25),
  ('cash_flow','NORMAL',  130000000, 179999999, 0.25),
  ('cash_flow','EHTIYOT',  80000000, 129999999, 0.25),
  ('cash_flow','XAVF',     30000000,  79999999, 0.25),
  ('cash_flow','INQIROZ',       NULL,  29999999, 0.25),
  -- production_plan (%)
  ('production_plan','OSISH',   90, 100, 0.25),
  ('production_plan','NORMAL',  75,  89, 0.25),
  ('production_plan','EHTIYOT', 55,  74, 0.25),
  ('production_plan','XAVF',    35,  54, 0.25),
  ('production_plan','INQIROZ', NULL, 34, 0.25),
  -- orders (score 0-100)
  ('orders','OSISH',   90, 100, 0.20),
  ('orders','NORMAL',  75,  89, 0.20),
  ('orders','EHTIYOT', 55,  74, 0.20),
  ('orders','XAVF',    35,  54, 0.20),
  ('orders','INQIROZ', NULL, 34, 0.20),
  -- hr (davomat %)
  ('hr','OSISH',   95, 100, 0.15),
  ('hr','NORMAL',  87,  94, 0.15),
  ('hr','EHTIYOT', 75,  86, 0.15),
  ('hr','XAVF',    60,  74, 0.15),
  ('hr','INQIROZ', NULL, 59, 0.15),
  -- quality (sifat o'tish %)
  ('quality','OSISH',   95, 100, 0.15),
  ('quality','NORMAL',  87,  94, 0.15),
  ('quality','EHTIYOT', 75,  86, 0.15),
  ('quality','XAVF',    60,  74, 0.15),
  ('quality','INQIROZ', NULL, 59, 0.15)
ON CONFLICT (metric_key, level_code) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 3. company_state_log (holat tarixi — P29 cron yozadi, diary o'qiydi)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS company_state_log (
  id          SERIAL PRIMARY KEY,
  state_code  VARCHAR(20) NOT NULL,
  kpis        JSONB NOT NULL,
  score_total NUMERIC(5,2),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS company_state_log_detected_at_idx
  ON company_state_log (detected_at DESC);
