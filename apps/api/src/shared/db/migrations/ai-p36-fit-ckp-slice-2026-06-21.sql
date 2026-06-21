-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/ai-p36-fit-ckp-slice-2026-06-21.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-21
-- P36 AI-fit vertical slice: ai_fit_scores + ai_ckp_scores + ai_ckp_chat_logs.
--   Org-card-AI vision: per-card AI evaluates employee<->card fit (0-100 +
--   JSONB report + bonus/succession) and persists. (Directive
--   docs/audit/MASSIV-50/P36-AI-ai-ckp-fit-governance.md — smallest coherent slice.)
-- No FK to employees/org_functions (cross-module integrity in logic per ADR;
--   targets live-verified: org_functions.id INTEGER 97, employees.id INTEGER 30).
-- Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_fit_scores (
  id                    SERIAL PRIMARY KEY,
  employee_id           INTEGER NOT NULL,   -- logical ref employees.id
  card_id               INTEGER NOT NULL,   -- logical ref org_functions.id
  fit_score             NUMERIC(5,2) NOT NULL,
  fit_report            JSONB,
  bonus_recommendation  NUMERIC(10,2),
  succession_candidate  BOOLEAN NOT NULL DEFAULT FALSE,
  ai_provider           TEXT,
  evaluated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_fit_scores_employee ON ai_fit_scores(employee_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_fit_scores_card     ON ai_fit_scores(card_id, fit_score DESC);

CREATE TABLE IF NOT EXISTS ai_ckp_scores (
  id               SERIAL PRIMARY KEY,
  employee_id      INTEGER NOT NULL,   -- HR salary gate reads this
  score_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ckp_score        NUMERIC(5,2) NOT NULL DEFAULT 0,
  attendance_score NUMERIC(5,2) DEFAULT 0,
  quality_score    NUMERIC(5,2) DEFAULT 0,
  plan_score       NUMERIC(5,2) DEFAULT 0,
  time_score       NUMERIC(5,2) DEFAULT 0,
  ai_explanation   TEXT,
  salary_gate_pass BOOLEAN NOT NULL DEFAULT FALSE,
  raw_metrics      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_ckp_scores_employee_date ON ai_ckp_scores(employee_id, score_date DESC);

CREATE TABLE IF NOT EXISTS ai_ckp_chat_logs (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  session_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_ckp_chat_session ON ai_ckp_chat_logs(session_id, created_at);
