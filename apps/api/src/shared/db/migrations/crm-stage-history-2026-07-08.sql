-- crm-stage-history-2026-07-08.sql
-- VISION-3340 #34 — CRM stage-transition handlers (update-deal-stage.handler.ts /
-- update-lead-stage.handler.ts) overwrote stage_id IN PLACE with no audit trail, so
-- there was no way to answer "when did this deal/lead move stage, from what, to what,
-- and by whom". Introduces a single append-only history table (crm_stage_history) that
-- receives one row per successful transition.
--
-- APPROVED: egasi (owner) 2026-07-08 VISION-3340 #34
--
-- Seeds NOTHING (Q-40: history rows are produced only by real transitions, never fabricated).
-- Additive + idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
--
-- entity_id is VARCHAR (NOT integer) DELIBERATELY: a deal's id is a UUID (crm_deals.id ::uuid
-- — see drizzle-crm-deals.repo.ts) while a lead's id is an integer, and one column must hold
-- both. from_stage / to_stage are VARCHAR because the two worlds carry different stage tokens
-- (deal stage_id is a free-form code e.g. 'qualification'; lead stage is the numeric
-- crm_lead_stages.id, stored here as its text form). changed_by is a plain nullable INTEGER
-- (no FK): neither UpdateDealStageCommand nor UpdateLeadStageCommand currently carries an
-- acting user, so it is written as NULL today and left open for when the commands do.
--
-- Write path (best-effort, never rolls back the transition):
--   deal → UpdateDealStageHandler → DrizzleCrmDealsRepository.recordStageHistory
--   lead → UpdateLeadStageHandler → CrmLeadsOpsRepository.recordStageHistory
--
-- Applied at boot via ensureSchemaAdditions() — this .sql is the human-readable mirror of
-- the matching {name,sql} entries appended to
-- apps/api/src/shared/db/invariants/migrations-schema.ts.

CREATE TABLE IF NOT EXISTS crm_stage_history (
  id          SERIAL       PRIMARY KEY,
  entity_type VARCHAR(10)  NOT NULL,   -- 'deal' | 'lead'
  entity_id   VARCHAR(64)  NOT NULL,   -- deal UUID or lead id (as text)
  from_stage  VARCHAR(100),            -- NULL when the prior stage is unknown
  to_stage    VARCHAR(100) NOT NULL,
  changed_by  INTEGER,                 -- acting user id, NULL when unavailable
  changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_stage_history_entity
  ON crm_stage_history (entity_type, entity_id, changed_at);

-- DB-proof:
-- SELECT to_regclass('public.crm_stage_history');  -- expected: crm_stage_history
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name = 'crm_stage_history' ORDER BY ordinal_position;
--  -- expected: id, entity_type, entity_id, from_stage, to_stage, changed_by, changed_at
