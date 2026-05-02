-- ============================================================================
-- 3-bosqich: employees jadvali (KPI team uchun)
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  middle_name VARCHAR(100),
  position_id INTEGER,
  department_id INTEGER,
  manager_id INTEGER,
  email VARCHAR(200),
  phone VARCHAR(50),
  hire_date DATE,
  termination_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  salary NUMERIC(18, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tegishli ustunlar borligini tekshirish
ALTER TABLE employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
