-- crm-loss-reasons-2026-07-08.sql
-- VISION-3340 #31 — crm_deals.lost_reason was FREE-TEXT only, so no rollup / analytics
-- over WHY deals are lost was possible (every loss reason a unique string). Introduces a
-- structured, reusable loss-reason taxonomy (crm_loss_reasons) plus an OPTIONAL nullable
-- FK tag on crm_deals so a lost deal can reference a reason CODE — while still keeping its
-- existing free-text lost_reason column as a supplementary note.
--
-- APPROVED: egasi (owner) 2026-07-08 VISION-3340 #31
--
-- Seeds NOTHING — the reason rows are owner master-data (Q-40: no fabricated loss reasons).
-- Additive + idempotent: CREATE TABLE IF NOT EXISTS + ALTER ... IF EXISTS ADD COLUMN IF NOT
-- EXISTS + CREATE INDEX IF NOT EXISTS. The FK is ON DELETE SET NULL so deleting a reason
-- keeps historical deals intact (Q-39/Q-46); the free-text lost_reason column is preserved.
--
-- Write path: MarkDealLostHandler (optional lostReasonId) → DrizzleDealRepository
--   .updateLostReasonId → crm_deals.lost_reason_id.
-- Read path : GET /api/crm/analytics/loss-reasons → DrizzleCrmAnalyticsRepository
--   .getLossReasonRollup (COUNT of lost deals grouped by lost_reason_id + joined labels).
--
-- Applied at boot via ensureSchemaAdditions() — this .sql is the human-readable mirror of
-- the matching {name,sql} entries appended to
-- apps/api/src/shared/db/invariants/migrations-schema.ts.

CREATE TABLE IF NOT EXISTS crm_loss_reasons (
  id          SERIAL       PRIMARY KEY,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  label_uz    TEXT,
  label_ru    TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_loss_reasons_active
  ON crm_loss_reasons (is_active, sort_order);

ALTER TABLE IF EXISTS crm_deals
  ADD COLUMN IF NOT EXISTS lost_reason_id INTEGER
  REFERENCES crm_loss_reasons(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_deals_lost_reason_id
  ON crm_deals (lost_reason_id);

-- DB-proof:
-- SELECT to_regclass('public.crm_loss_reasons');  -- expected: crm_loss_reasons
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name = 'crm_deals' AND column_name = 'lost_reason_id';  -- expected: 1 row
