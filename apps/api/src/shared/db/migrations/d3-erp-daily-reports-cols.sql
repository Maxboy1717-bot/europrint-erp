-- APPROVED: owner 2026-06-08
-- D3: erp_daily_reports was JSONB-shaped (id, report_date, department_id, data, created_at);
--     createDailyReport/updateDailyReport need first-class columns. Idempotent.
ALTER TABLE erp_daily_reports
  ADD COLUMN IF NOT EXISTS work_center_id integer,
  ADD COLUMN IF NOT EXISTS shift          text,
  ADD COLUMN IF NOT EXISTS planned_qty    numeric,
  ADD COLUMN IF NOT EXISTS actual_qty     numeric,
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz;
