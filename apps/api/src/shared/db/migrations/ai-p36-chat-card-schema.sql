-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/ai-p36-chat-card-schema.sql
-- P36 AI Card-chat + Forecast range + Bottleneck schema.
-- ⛔ GATED — egasi (owner) tasdiqlamaguncha ISHGA TUSHIRILMAYDI.
--    HOZIR tasdiq-belgisi YO'Q (ataylab) — check-unauthorized-migration WARN beradi.
--    Egasi ruxsat berganda tasdiq izohini qo'shing (so'z: APPROVED + ":" + owner + sana).
--    Sabab gated: per-karta AI chat + AI prognoz diapazoni real ishlashi uchun
--    AI-kalit + egasi qarori kerak (Q-35 DDL darvozasi, Q-40 fabrikatsiya taqiq).
-- Manba: docs/audit/MASSIV-50/P36-AI-ai-ckp-fit-governance.md §QADAM 4,6.
-- Idempotent (CREATE TABLE/INDEX IF NOT EXISTS).
-- JONLI HOLAT (2026-06-26 probe): barcha quyidagi jadvallar DB da YO'Q (yangi).
-- card_id → org_functions.id, material_id → material_cards.id (logical refs).
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_card_chat_logs (
  id          SERIAL PRIMARY KEY,
  card_id     INTEGER NOT NULL,   -- logical ref org_functions.id
  employee_id INTEGER,            -- null bo'lishi mumkin (anonim)
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_card_chat_session
  ON ai_card_chat_logs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_card_chat_card
  ON ai_card_chat_logs(card_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_forecast_ranges (
  id             SERIAL PRIMARY KEY,
  material_id    INTEGER,
  entity_type    TEXT NOT NULL,   -- 'material'|'production'|'demand'
  entity_id      INTEGER NOT NULL,
  horizon_days   INTEGER NOT NULL,
  forecast_low   NUMERIC(14,2) NOT NULL,
  forecast_mid   NUMERIC(14,2) NOT NULL,
  forecast_high  NUMERIC(14,2) NOT NULL,
  confidence     NUMERIC(5,2),
  methodology    TEXT,            -- 'holt-winters'|'croston'|'ensemble'
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_bottleneck_log (
  id                SERIAL PRIMARY KEY,
  process_name      TEXT NOT NULL,
  station_id        INTEGER,
  bottleneck_score  NUMERIC(5,2) NOT NULL,
  wait_time_minutes NUMERIC(8,2),
  recommendation    TEXT,
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
