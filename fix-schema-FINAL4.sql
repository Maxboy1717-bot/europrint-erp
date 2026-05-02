-- ============================================================
-- FINAL4: Oxirgi log'dagi xatolarni tuzatish
-- ============================================================

-- ─── EMPLOYEES — full_name computed column ──────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS full_name TEXT;
UPDATE employees
   SET full_name = TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))
 WHERE full_name IS NULL OR full_name = '';

-- ─── DISCIPLINE_RECORDS — yetishmagan ustunlar ──────────────
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS severity VARCHAR(20);
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ─── ORG_DEPARTMENTS — yetishmagan ustunlar ─────────────────
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS parent_id INTEGER;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS description TEXT;

-- ─── SHIFT_SCHEDULES — yangi jadval ─────────────────────────
CREATE TABLE IF NOT EXISTS shift_schedules (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  shift_date DATE,
  shift_type TEXT,
  start_time TIME,
  end_time TIME,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── ATTENDANCE — agar yo'q bo'lsa ──────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  attendance_date DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  status TEXT DEFAULT 'present',
  late_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── USERS jadvali — deleted_at va full_name ────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id INTEGER;

DO $$
BEGIN
  RAISE NOTICE '✓ FINAL4 yakunlandi';
END $$;
