-- ============================================================================
-- A54 — Parallel session-table convergence: mes_sessions → production_sessions
-- ============================================================================
-- STATUS: ⛔ PENDING OWNER APPROVAL — DO NOT AUTO-APPLY.
--   This file is NOT wired into the migration runner. It is a reviewed, idempotent
--   convergence script the owner applies manually after verifying it against the
--   LIVE OEE readers (director dashboard, finance variance, get-oee.handler).
--   Add "-- APPROVED: <owner/date>" above and remove this banner once approved (Q-35).
--
-- WHY (proven live, europrint @127.0.0.1:5432, A54 read-only probe):
--   • CANONICAL session table = production_sessions (8 rows). Golden-thread writes it,
--     mes_sos_events / mes_material_consumption FK to it, and mes_production_sessions
--     is ALREADY a VIEW over it.
--   • mes_sessions (6 rows) is a SECOND, thinner parallel session table. It is still
--     live-read (so it cannot be dropped, Q-46), and its rows do NOT overlap
--     production_sessions (id+operator overlap = 0), so a straight view-swap would
--     LOSE the 6 rows. Therefore: backfill first, THEN replace with a view.
--
-- READER COLUMN CONTRACT (must keep working after the swap):
--   id · status · defect_qty · quality_passed · started_at · completed_at ·
--   machine_id · operator_id · production_order_id · work_center_id · created_at · notes
--   production_sessions already has: id/status/defect_qty/machine_id/operator_id/
--   production_order_id/work_center_id/created_at. The view MAPS the rest:
--     completed_at   ← ended_at
--     quality_passed ← (quality >= 100)  -- ps.quality is the QC pass ratio 0..100
--     notes          ← worker_notes
--
-- IDEMPOTENT: re-runnable. Backfill is keyed by a synthetic session_number so the
--   same mes_sessions row is never inserted twice.
-- ============================================================================

BEGIN;

-- 1) Backfill the 6 mes_sessions rows into the canonical table (only if mes_sessions
--    is still a base table — skip when this migration has already converted it).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'mes_sessions' AND n.nspname = 'public' AND c.relkind = 'r'
  ) THEN
    INSERT INTO production_sessions
      (session_number, production_order_id, equipment_id, worker_id, machine_id,
       operator_id, target_quantity, actual_quantity, defect_quantity, status,
       quality, worker_notes, started_at, ended_at, created_at, updated_at)
    SELECT
      'MES-LEGACY-' || ms.id::text,                       -- synthetic unique key (idempotent guard)
      0,                                                  -- production_order_id NOT NULL, mes_sessions had NULL → 0 (unassigned)
      COALESCE(ms.machine_id, 0),                         -- equipment_id NOT NULL
      COALESCE(ms.operator_id, 0),                        -- worker_id NOT NULL
      ms.machine_id,
      ms.operator_id,
      0,                                                  -- target_quantity NOT NULL (mes_sessions had none)
      0,                                                  -- actual_quantity
      COALESCE(ms.defect_qty, 0)::int,
      ms.status,
      CASE WHEN ms.quality_passed IS TRUE THEN 100 WHEN ms.quality_passed IS FALSE THEN 0 ELSE NULL END,
      ms.notes,
      ms.started_at,
      ms.completed_at,
      COALESCE(ms.created_at, NOW()),
      COALESCE(ms.updated_at, NOW())
    FROM mes_sessions ms
    WHERE NOT EXISTS (
      SELECT 1 FROM production_sessions ps
      WHERE ps.session_number = 'MES-LEGACY-' || ms.id::text
    );
  END IF;
END $$;

-- 2) Replace the mes_sessions base table with a VIEW over the canonical table.
--    The view exposes exactly the columns the live readers consume.
DROP TABLE IF EXISTS mes_sessions CASCADE;

CREATE VIEW mes_sessions AS
SELECT
  ps.id,
  ps.status,
  COALESCE(ps.defect_qty, ps.defect_quantity::numeric)              AS defect_qty,
  CASE WHEN ps.quality IS NULL THEN NULL ELSE (ps.quality >= 100) END AS quality_passed,
  ps.started_at,
  ps.ended_at                                                       AS completed_at,
  ps.machine_id,
  ps.operator_id,
  ps.production_order_id,
  ps.work_center_id,
  ps.created_at,
  ps.worker_notes                                                   AS notes
FROM production_sessions ps
WHERE ps.deleted_at IS NULL;

COMMIT;

-- VERIFY (run after apply):
--   SELECT relkind FROM pg_class WHERE relname='mes_sessions';          -- expect 'v'
--   SELECT count(*) FROM mes_sessions;                                  -- ≥ 8 (canonical) + backfilled legacy
--   SELECT id,status,quality_passed,completed_at,notes FROM mes_sessions LIMIT 5;
--   -- then re-hit: GET /api/mes/oee, director dashboard OEE, finance variance — must not regress.
