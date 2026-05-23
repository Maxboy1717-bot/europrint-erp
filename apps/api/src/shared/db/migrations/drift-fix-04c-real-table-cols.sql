-- =============================================================================
-- drift-fix-04c-real-table-cols.sql
-- Add missing columns to real tables that were previously classified as views
-- =============================================================================

-- mes_tasks (BASE TABLE)
ALTER TABLE mes_tasks ADD COLUMN IF NOT EXISTS work_center_id INTEGER;
ALTER TABLE mes_tasks ADD COLUMN IF NOT EXISTS due_date DATE;

-- security_access (BASE TABLE)
ALTER TABLE security_access ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE security_access ADD COLUMN IF NOT EXISTS module TEXT;
ALTER TABLE security_access ADD COLUMN IF NOT EXISTS can_access BOOLEAN;
ALTER TABLE security_access ADD COLUMN IF NOT EXISTS granted_by INTEGER;

-- security_attendance (BASE TABLE)
ALTER TABLE security_attendance ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE security_attendance ADD COLUMN IF NOT EXISTS gate_id INTEGER;
ALTER TABLE security_attendance ADD COLUMN IF NOT EXISTS method TEXT;
