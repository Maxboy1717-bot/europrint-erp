-- APPROVED: owner 2026-06-08
-- D2: mes_maintenance_requests needs `assigned_to` (who the maintenance task is assigned to;
--     distinct from `resolved_by` = who closed it). Idempotent.
ALTER TABLE mes_maintenance_requests
  ADD COLUMN IF NOT EXISTS assigned_to integer REFERENCES employees(id);
