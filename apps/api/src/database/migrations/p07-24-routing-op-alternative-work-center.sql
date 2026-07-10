-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ===========================================================================
-- Migration: p07-24-routing-op-alternative-work-center.sql   (2026-07-11, 07-pp#24)
-- Vision 07-pp#24 — Asosiy stanok buzilsa muqobil stanokka o'tish (IoT/MRO downtime)
--   + CRP qayta hisob. Adds a per-operation alternative (backup) work-center so a
--   fail-over listener can re-route ops off a downed machine, then recompute CRP.
--
-- CANONICAL TARGET = routing_operations (BASE TABLE, relkind 'r').
--   pp_routing_operations is a VIEW over routing_operations (verified live 2026-07-11
--   via pg_class.relkind='v'); NEVER ALTER the view. The view is recreated
--   (append-only) so the CRP read path — PpCrpService.loadRoutingOps() selects
--   FROM pp_routing_operations — surfaces the new column.
--
-- Default NULL -> no alternative -> fail-over never triggers -> current behavior
--   preserved for every existing row (non-regressing).
-- Idempotent: ADD COLUMN IF NOT EXISTS + pg_constraint guard + CREATE OR REPLACE VIEW.
-- ===========================================================================

ALTER TABLE routing_operations
  ADD COLUMN IF NOT EXISTS alternative_work_center_id integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'routing_operations_alt_wc_fkey') THEN
    ALTER TABLE routing_operations
      ADD CONSTRAINT routing_operations_alt_wc_fkey
      FOREIGN KEY (alternative_work_center_id) REFERENCES work_centers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Recreate the read view (append-only) so pp_routing_operations exposes the column.
CREATE OR REPLACE VIEW pp_routing_operations AS
  SELECT id, routing_id, operation_number, operation_description, work_center_id,
         setup_time, machine_time, labor_time, base_quantity, sequence, is_parallel,
         notes, created_at, deleted_at, name, product_id, setup_time_min,
         run_time_per_unit_min, is_active, alternative_work_center_id
  FROM routing_operations;
