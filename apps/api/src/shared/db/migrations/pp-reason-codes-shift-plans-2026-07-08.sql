-- pp-reason-codes-shift-plans-2026-07-08.sql
-- VISION-3340 #23 — two related PP gaps:
--   (A) Order-level PP reasons (the /pp/orders/:id/flags urgent/frozen path) were
--       captured as free-text `reason` only — there was no structured, reusable
--       lookup a flagged order could reference. `pp_reason_codes` is that lookup,
--       mirroring the proven `downtime_reason_codes` shape (code/name/name_ru/
--       category/color/is_active/sort_order). It seeds NOTHING — the reason
--       vocabulary is owner master-data (Q-40, no fabricated rows).
--   (B) The AI 7-step planner's step 6 (shift-assign) was a hardcoded string with
--       no DB read/write. `pp_shift_plans` is the real persistence target so the
--       step can record a genuine planned assignment (work centre + shift + target
--       + assigned crew) instead of a static stub.
--
-- APPROVED: egasi (owner) 2026-07-08 VISION-3340 #23
--
-- Q-35: two NEW tables (pp_reason_codes, pp_shift_plans) — owner-approved above.
-- Additive only: the production_orders.reason_code_id column is NULLABLE with an
-- ON DELETE SET NULL FK, so every existing order row stays valid (Q-39/Q-46) and
-- deleting a reason code only unsets the tag, never a production order.
-- work_centers.id is SERIAL (integer — lib/db pp-production.ts / schema-pp.ts) so
-- the INTEGER FK on pp_shift_plans.work_center_id is type-correct.
--
-- Idempotent: CREATE TABLE / ADD COLUMN / CREATE INDEX all IF NOT EXISTS.
--
-- Qo'llash: psql postgresql://postgres:postgres@localhost:5432/europrint -f pp-reason-codes-shift-plans-2026-07-08.sql

-- ── Part A: pp_reason_codes lookup (mirror of downtime_reason_codes) ──────────
CREATE TABLE IF NOT EXISTS pp_reason_codes (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(30)  NOT NULL UNIQUE,
  name        TEXT         NOT NULL,
  name_ru     TEXT,
  category    VARCHAR(30)  NOT NULL,
  color       VARCHAR(10)  DEFAULT '#808080',
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pp_reason_codes_active ON pp_reason_codes (is_active, sort_order);

-- Structured reason tag on the order-flags path (created by pp-orders.controller.ts
-- setFlags → ProductionOrdersService.updateFlags → DrizzlePpProductionOrdersRepository.updateFlags).
-- Nullable + ON DELETE SET NULL: existing rows keep NULL, no fabrication (Q-40).
ALTER TABLE IF EXISTS production_orders
  ADD COLUMN IF NOT EXISTS reason_code_id INTEGER REFERENCES pp_reason_codes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_production_orders_reason_code_id ON production_orders (reason_code_id);

-- ── Part B: pp_shift_plans real shift-plan persistence (AI step 6) ────────────
CREATE TABLE IF NOT EXISTS pp_shift_plans (
  id                 SERIAL PRIMARY KEY,
  work_center_id     INTEGER REFERENCES work_centers(id) ON DELETE SET NULL,
  shift_date         DATE,
  shift_type         VARCHAR(20),
  target_quantity    NUMERIC(18,4),
  assigned_employees JSONB,
  created_by         INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One plan per (work centre, date, shift) — lets the AI step upsert idempotently
-- instead of proliferating a new row on every re-run.
CREATE UNIQUE INDEX IF NOT EXISTS uq_pp_shift_plans_wc_date_type
  ON pp_shift_plans (work_center_id, shift_date, shift_type);

CREATE INDEX IF NOT EXISTS idx_pp_shift_plans_shift_date ON pp_shift_plans (shift_date);

-- DB-proof: after running
-- SELECT to_regclass('public.pp_reason_codes'), to_regclass('public.pp_shift_plans');  -- expected: both non-null
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'production_orders' AND column_name = 'reason_code_id';          -- expected: 1 row
