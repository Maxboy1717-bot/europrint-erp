-- ============================================================================
-- T23-A1 — mes_production_sessions VIEW: expose GSD (setup/main/teardown) columns
-- ============================================================================
-- APPROVED: muslimbek/2026-06-27 (additive, non-destructive — Q-46 compliant)
--
-- WHAT: mes_production_sessions is ALREADY a VIEW over the canonical base table
--   production_sessions (verified live: pg_class.relkind='v'). The base table already
--   carries the GSD timing + staging columns:
--     setup_seconds · main_seconds · teardown_seconds · current_stage · stage_started_at
--   but the VIEW's explicit column list did NOT project them, so MES/OEE readers querying
--   mes_production_sessions could not see the GSD breakdown. This is a pure ADDITIVE column
--   exposure: CREATE OR REPLACE VIEW appends the missing columns to the END of the existing
--   projection (no existing column is dropped, renamed, or re-ordered — the only form
--   CREATE OR REPLACE VIEW permits, and the only form allowed here).
--
-- WHY ADDITIVE-SAFE (Q-46 / DESTRUCTIVE-TABLE-DROP guard):
--   • No DROP VIEW (which would break dependent objects). CREATE OR REPLACE keeps the view OID.
--   • The first N output columns are byte-for-byte identical to the current definition
--     (same names, same order) — required by CREATE OR REPLACE and verified against
--     pg_get_viewdef. Only setup_seconds/main_seconds/teardown_seconds/current_stage/
--     stage_started_at are appended.
--   • Base table production_sessions is untouched.
--
-- IDEMPOTENT: re-runnable. CREATE OR REPLACE VIEW is itself idempotent for a fixed definition.
-- ============================================================================

CREATE OR REPLACE VIEW mes_production_sessions AS
SELECT
  id,
  session_number,
  production_order_id,
  equipment_id,
  device_id,
  worker_id,
  status,
  target_quantity,
  actual_quantity,
  defect_quantity,
  started_at,
  ended_at,
  last_signal_at,
  running_time_seconds,
  stopped_time_seconds,
  worker_notes,
  availability,
  performance,
  quality,
  oee,
  created_at,
  updated_at,
  deleted_at,
  order_id,
  operator_id,
  machine_id,
  shift_id,
  session_date,
  produced_qty,
  defect_qty,
  start_time,
  end_time,
  -- T23-A1 additive GSD (Gross-Setup-Down) columns from the canonical base table:
  setup_seconds,
  main_seconds,
  teardown_seconds,
  current_stage,
  stage_started_at
FROM production_sessions;

-- VERIFY (run after apply):
--   SELECT relkind FROM pg_class WHERE relname='mes_production_sessions';   -- expect 'v'
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='mes_production_sessions'
--       AND column_name IN ('setup_seconds','main_seconds','teardown_seconds','current_stage','stage_started_at');
--   -- expect all 5 rows present.
