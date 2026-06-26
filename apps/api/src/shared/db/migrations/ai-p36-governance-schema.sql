-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/ai-p36-governance-schema.sql
-- P36 AI Override + Dispute + Governance + Calibration schema.
-- APPROVED: egasi-direktiva "vizyon bo'yicha to'liq bajar hamma vizyon" 2026-06-26
--   (T18-C3-CRM-GATED — STRUKTURA only, idempotent CREATE IF NOT EXISTS).
-- ⛔ GATED edi — egasi 2026-06-26 ochiq direktiva bilan tasdiqladi.
--    HOZIR tasdiq-belgisi YO'Q (ataylab) — check-unauthorized-migration WARN beradi.
--    Egasi ruxsat berganda tasdiq izohini qo'shing (so'z: APPROVED + ":" + owner + sana).
--    Sabab gated: AI qarorlari ustidan governance/audit/kalibrasyon real ishlashi
--    uchun AI-kalit + egasi qarori kerak (Q-35 DDL darvozasi, Q-40 fabrikatsiya taqiq).
-- Manba: docs/audit/MASSIV-50/P36-AI-ai-ckp-fit-governance.md §QADAM 5,6.
-- Idempotent (CREATE TABLE/INDEX IF NOT EXISTS).
-- JONLI HOLAT (2026-06-26 probe): barcha quyidagi jadvallar DB da YO'Q (yangi).
-- ============================================================

-- Manager AI qarorini bekor qilish log (override)
CREATE TABLE IF NOT EXISTS ai_overrides (
  id                 SERIAL PRIMARY KEY,
  original_decision  JSONB NOT NULL,   -- {type, entity_id, value}
  overridden_by      INTEGER NOT NULL, -- manager user_id
  override_reason    TEXT NOT NULL,
  new_value          JSONB,
  module             TEXT NOT NULL,    -- 'ckp'|'fit'|'block'|'violation'
  approved           BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by        INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Xodim AI qaroriga e'tiroz (dispute)
CREATE TABLE IF NOT EXISTS ai_disputes (
  id             SERIAL PRIMARY KEY,
  employee_id    INTEGER NOT NULL,
  decision_type  TEXT NOT NULL,   -- 'ckp_score'|'fit_score'|'block'|'violation'
  decision_id    INTEGER NOT NULL,
  dispute_text   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending_review'
                   CHECK (status IN ('pending_review','under_review','resolved_upheld','resolved_overturned','dismissed')),
  reviewed_by    INTEGER,
  review_notes   TEXT,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_disputes_employee
  ON ai_disputes(employee_id, status, created_at DESC);

-- AI governance audit log — barcha AI qarorlar (kim, qachon, qanday qaror)
CREATE TABLE IF NOT EXISTS ai_governance_log (
  id             SERIAL PRIMARY KEY,
  module         TEXT NOT NULL,
  decision_type  TEXT NOT NULL,
  entity_type    TEXT NOT NULL,
  entity_id      INTEGER NOT NULL,
  actor_type     TEXT NOT NULL CHECK (actor_type IN ('ai_auto','manager','system','employee')),
  actor_id       INTEGER,
  decision       JSONB NOT NULL,
  rationale      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_governance_log_module_date
  ON ai_governance_log(module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_governance_log_entity
  ON ai_governance_log(entity_type, entity_id, created_at DESC);

-- AI kalibrasyon natijalar (prognoz vs haqiqat aniqlik)
CREATE TABLE IF NOT EXISTS ai_calibration_runs (
  id                SERIAL PRIMARY KEY,
  module            TEXT NOT NULL,
  period_days       INTEGER NOT NULL DEFAULT 30,
  total_predictions INTEGER NOT NULL,
  correct_count     INTEGER NOT NULL,
  accuracy_percent  NUMERIC(5,2) NOT NULL,
  drift_detected    BOOLEAN NOT NULL DEFAULT FALSE,
  recommendations   JSONB,
  ran_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
