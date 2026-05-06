-- ============================================================================
-- Migration: onboarding-adaptation-merge.sql
--
-- PRD Q14-16: Onboarding va Adaptation birlashishi (yagona jarayon)
--
-- Yondashuv:
--   - Onboarding = umumiy 30/60/90 kun jarayoni (parent process)
--   - Adaptation = Onboarding ichidagi mentor bilan ishlash bosqichi (child)
--   - hr_onboarding_processes — har xodim uchun bitta jarayon
--   - Onboarding tasks (mavjud) + Adaptation milestones (mavjud) birlashtiriladi
-- ============================================================================

-- ─── 1. hr_onboarding_processes — har xodim uchun bitta jarayon ────────────
CREATE TABLE IF NOT EXISTS hr_onboarding_processes (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  plan_id         INTEGER REFERENCES hr_onboarding_plans(id) ON DELETE SET NULL,
  adaptation_program_id INTEGER REFERENCES adaptation_programs(id) ON DELETE SET NULL,
  mentor_id       INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  status          VARCHAR(30) DEFAULT 'in_progress',  -- in_progress, completed, failed, paused
  start_date      DATE NOT NULL,
  expected_end_date DATE,
  actual_end_date DATE,
  current_milestone VARCHAR(20) DEFAULT '30_day',  -- 30_day, 60_day, 90_day, completed
  progress_percent INTEGER DEFAULT 0,
  -- Q15: Haftalik baholash 1-5 (5 ko'rsatkich)
  weekly_evaluations JSONB DEFAULT '[]'::jsonb,
  -- Q16: Onboarding checklist (HR)
  checklist        JSONB DEFAULT '[]'::jsonb,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_proc_employee ON hr_onboarding_processes(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_proc_status ON hr_onboarding_processes(status) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_onboarding_proc_milestone ON hr_onboarding_processes(current_milestone) WHERE status = 'in_progress';

-- ─── 2. hr_onboarding_milestones — 30/60/90 kun checkpointlar ──────────────
CREATE TABLE IF NOT EXISTS hr_onboarding_milestones (
  id              SERIAL PRIMARY KEY,
  process_id      INTEGER REFERENCES hr_onboarding_processes(id) ON DELETE CASCADE,
  milestone_type  VARCHAR(20) NOT NULL,    -- 30_day, 60_day, 90_day
  target_date     DATE NOT NULL,
  actual_date     DATE,
  -- Baholash (Q15): 1-5 shkala, 5 ko'rsatkich
  evaluation_scores JSONB DEFAULT '{}'::jsonb,
  evaluation_average NUMERIC(3,2),
  evaluator_id    INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  status          VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  feedback        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestone_process ON hr_onboarding_milestones(process_id);

-- ─── 3. Mavjud xodimlar uchun onboarding processes ─────────────────────────
INSERT INTO hr_onboarding_processes (
  employee_id, plan_id, mentor_id, status, start_date, expected_end_date,
  current_milestone, progress_percent, checklist
)
SELECT
  e.id,
  (SELECT id FROM hr_onboarding_plans WHERE is_active = true ORDER BY id LIMIT 1) AS plan_id,
  -- Mentor: birinchi rahbar (department manager)
  d.manager_id AS mentor_id,
  CASE
    WHEN e.hire_date::text >= (CURRENT_DATE - INTERVAL '90 days')::text THEN 'in_progress'
    ELSE 'completed'
  END AS status,
  COALESCE(e.hire_date::date, CURRENT_DATE - INTERVAL '60 days')::date AS start_date,
  COALESCE(e.hire_date::date, CURRENT_DATE - INTERVAL '60 days')::date + INTERVAL '90 days',
  CASE
    WHEN COALESCE(e.hire_date::date, CURRENT_DATE) > CURRENT_DATE - INTERVAL '30 days' THEN '30_day'
    WHEN COALESCE(e.hire_date::date, CURRENT_DATE) > CURRENT_DATE - INTERVAL '60 days' THEN '60_day'
    WHEN COALESCE(e.hire_date::date, CURRENT_DATE) > CURRENT_DATE - INTERVAL '90 days' THEN '90_day'
    ELSE 'completed'
  END AS current_milestone,
  CASE
    WHEN e.hire_date::date >= CURRENT_DATE - INTERVAL '30 days' THEN 33
    WHEN e.hire_date::date >= CURRENT_DATE - INTERVAL '60 days' THEN 66
    WHEN e.hire_date::date >= CURRENT_DATE - INTERVAL '90 days' THEN 95
    ELSE 100
  END AS progress_percent,
  '[
    {"key":"passport","label":"Passport ko''chirmasi","status":"completed"},
    {"key":"inps","label":"INPS raqami","status":"completed"},
    {"key":"contract","label":"Mehnat shartnomasi","status":"completed"},
    {"key":"laptop","label":"Texnika berildi","status":"pending"},
    {"key":"badge","label":"Kirish badge","status":"pending"},
    {"key":"orientation","label":"Korporativ tanishish","status":"pending"}
  ]'::jsonb AS checklist
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
WHERE e.status = 'active'
  AND NOT EXISTS (SELECT 1 FROM hr_onboarding_processes p WHERE p.employee_id = e.id);

-- ─── 4. Milestones avto-yaratish (har process uchun 3 ta) ─────────────────
INSERT INTO hr_onboarding_milestones (process_id, milestone_type, target_date, status)
SELECT
  p.id,
  '30_day',
  p.start_date + INTERVAL '30 days',
  CASE WHEN p.start_date + INTERVAL '30 days' < CURRENT_DATE THEN 'completed' ELSE 'pending' END
FROM hr_onboarding_processes p
WHERE NOT EXISTS (SELECT 1 FROM hr_onboarding_milestones m WHERE m.process_id = p.id AND m.milestone_type = '30_day');

INSERT INTO hr_onboarding_milestones (process_id, milestone_type, target_date, status)
SELECT
  p.id,
  '60_day',
  p.start_date + INTERVAL '60 days',
  CASE WHEN p.start_date + INTERVAL '60 days' < CURRENT_DATE THEN 'completed' ELSE 'pending' END
FROM hr_onboarding_processes p
WHERE NOT EXISTS (SELECT 1 FROM hr_onboarding_milestones m WHERE m.process_id = p.id AND m.milestone_type = '60_day');

INSERT INTO hr_onboarding_milestones (process_id, milestone_type, target_date, status)
SELECT
  p.id,
  '90_day',
  p.start_date + INTERVAL '90 days',
  CASE WHEN p.start_date + INTERVAL '90 days' < CURRENT_DATE THEN 'completed' ELSE 'pending' END
FROM hr_onboarding_processes p
WHERE NOT EXISTS (SELECT 1 FROM hr_onboarding_milestones m WHERE m.process_id = p.id AND m.milestone_type = '90_day');

-- ─── 5. Verify ─────────────────────────────────────────────────────────────
SELECT 'hr_onboarding_processes' AS t, COUNT(*) FROM hr_onboarding_processes
UNION ALL SELECT 'hr_onboarding_milestones', COUNT(*) FROM hr_onboarding_milestones
UNION ALL SELECT '  in_progress', COUNT(*) FROM hr_onboarding_processes WHERE status = 'in_progress'
UNION ALL SELECT '  completed', COUNT(*) FROM hr_onboarding_processes WHERE status = 'completed';
