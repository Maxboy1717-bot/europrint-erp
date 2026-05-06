-- Migration: fix-onboarding-tables.sql
-- Maqsad: Backend `hr_onboarding_plans` va `hr_job_descriptions` jadvallarini so'raydi,
-- lekin DB'da bu jadvallar yo'q.
-- Yechim: jadvallarni yaratish.

-- 1. hr_onboarding_plans (qabul qilish reja shabloni)
CREATE TABLE IF NOT EXISTS hr_onboarding_plans (
  id            SERIAL PRIMARY KEY,
  title         varchar(255) NOT NULL,
  tasks         jsonb DEFAULT '[]'::jsonb,
  duration_days integer DEFAULT 30,
  is_active     boolean DEFAULT true,
  department_id integer REFERENCES departments(id) ON DELETE SET NULL,
  position_id   integer REFERENCES positions(id) ON DELETE SET NULL,
  created_by_id integer REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamp with time zone DEFAULT NOW(),
  updated_at    timestamp with time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_plans_active
  ON hr_onboarding_plans(is_active, created_at DESC)
  WHERE is_active = true;

-- 2. hr_job_descriptions (lavozim tariflari)
CREATE TABLE IF NOT EXISTS hr_job_descriptions (
  id                 SERIAL PRIMARY KEY,
  position_id        integer REFERENCES positions(id) ON DELETE CASCADE,
  version            integer DEFAULT 1,
  title              varchar(255) NOT NULL,
  content            text,
  is_active          boolean DEFAULT true,
  is_current_version boolean DEFAULT true,
  created_by_id      integer REFERENCES users(id) ON DELETE SET NULL,
  created_at         timestamp with time zone DEFAULT NOW(),
  updated_at         timestamp with time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_current
  ON hr_job_descriptions(is_current_version, updated_at DESC)
  WHERE is_current_version = true;

CREATE INDEX IF NOT EXISTS idx_job_descriptions_position
  ON hr_job_descriptions(position_id);

-- 3. Verify
SELECT 'hr_onboarding_plans' AS t, COUNT(*) FROM hr_onboarding_plans
UNION ALL
SELECT 'hr_job_descriptions', COUNT(*) FROM hr_job_descriptions;
