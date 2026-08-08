-- APPROVED: owner 2026-06-08
-- D4: erp_downtime_logs needs `resolved` + `reported_by` (create/updateDowntimeLog write them;
--     code S2 separately renames work_center_id→machine_id, duration_minutes→duration_min). Idempotent.
ALTER TABLE erp_downtime_logs
  ADD COLUMN IF NOT EXISTS resolved    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reported_by integer,
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz;
