-- ============================================================
-- FINAL3: HR/Adaptation/Recruitment/Offboarding to'liq tuzatish
-- Backend log'dagi har bir SQL'ni tahlil qilib
-- ============================================================

-- ─── EMPLOYEES — yetishmagan ustunlar ───────────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email_work VARCHAR(200);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email_personal VARCHAR(200);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS base_salary NUMERIC(15, 2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS vysotskiy_category VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- ─── POSITIONS — name_uz ustun ──────────────────────────────
ALTER TABLE positions ADD COLUMN IF NOT EXISTS name_uz TEXT;

-- ─── DISCIPLINE / OFFBOARDING ───────────────────────────────
CREATE TABLE IF NOT EXISTS discipline_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  type TEXT,
  description TEXT,
  severity VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS offboarding_cases (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  dismissal_type TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── PIP / ENPS / CONTRACTS / BLOCKS ────────────────────────
CREATE TABLE IF NOT EXISTS pip_plans (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  status TEXT DEFAULT 'active',
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS enps_surveys (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  questions JSONB,
  period TEXT,
  status TEXT DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  created_by INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS enps_responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER,
  employee_id INTEGER,
  answers JSONB,
  score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_contracts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  contract_number TEXT,
  contract_type TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_blocks (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_by INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  unblocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── RACI / CRISIS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raci_tasks (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  responsible_id INTEGER,
  accountable_id INTEGER,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS raci_stages (
  id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS crisis_records (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  reported_by INTEGER,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── AI INTERVIEW ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_interview_sessions (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER,
  vacancy_id INTEGER,
  questions JSONB,
  answers JSONB,
  score NUMERIC(5, 2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── ADAPTATION (4 ta jadval) ───────────────────────────────
CREATE TABLE IF NOT EXISTS adaptation_programs (
  id SERIAL PRIMARY KEY,
  program_name TEXT,
  position_id INTEGER,
  department_id INTEGER,
  duration_days INTEGER DEFAULT 90,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS adaptation_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  program_id INTEGER,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'in_progress',
  progress_percent INTEGER DEFAULT 0,
  current_milestone INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS adaptation_milestones (
  id SERIAL PRIMARY KEY,
  record_id INTEGER,
  milestone_number INTEGER,
  milestone_title TEXT,
  description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS adaptation_feedback (
  id SERIAL PRIMARY KEY,
  new_employee_id INTEGER,
  feedback_type TEXT,
  scheduled_date DATE,
  completed_date DATE,
  rating NUMERIC(3, 1),
  status TEXT DEFAULT 'pending',
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── EMPLOYEE TRANSFERS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_transfers (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  from_department_id INTEGER,
  to_department_id INTEGER,
  from_position_id INTEGER,
  to_position_id INTEGER,
  transfer_date DATE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── HR BRAND SETTINGS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS hr_brand_settings (
  id SERIAL PRIMARY KEY,
  company_id TEXT DEFAULT 'default',
  brand_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Default qator
INSERT INTO hr_brand_settings (company_id, brand_data)
VALUES ('default', '{}'::jsonb)
ON CONFLICT DO NOTHING;

-- ─── ORG_DEPARTMENTS — yetishmagan ustunlar ─────────────────
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS node_type TEXT DEFAULT 'department';
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS tskp_ru TEXT;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS tskp TEXT;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 0;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS head_user_id INTEGER;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS color VARCHAR(20);
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS description_ru TEXT;
ALTER TABLE org_departments ADD COLUMN IF NOT EXISTS name_ru TEXT;

CREATE TABLE IF NOT EXISTS employee_org_departments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  org_department_id INTEGER,
  role TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── INDEX'lar ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position_id);
CREATE INDEX IF NOT EXISTS idx_discipline_employee ON discipline_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employee ON employee_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON employee_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_adaptation_records_employee ON adaptation_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_org_dept_active ON org_departments(is_active);

DO $$
BEGIN
  RAISE NOTICE '✓ FINAL3 schema tuzatish yakunlandi (HR/Adaptation/Recruitment + 17 jadval)';
END $$;
