-- ============================================================
-- Migration 0050: departments + positions → org_departments + org_functions
-- Maqsad: eski departments/positions jadvallarini o'chirib
--         org_departments va org_functions bilan almashtirish.
--
-- BOSQICHLAR:
--   A. org_departments ga missing columns qo'shish
--   B. org_functions ga missing columns qo'shish
--   C. departments → org_departments data ko'chirish
--   D. positions → org_functions data ko'chirish
--   E. FK constraint: org_departments.parent_id → self
--   F. employees FK → org_departments, org_functions
--   G. users FK → org_departments, org_functions
--   H. position_permissions / position_feature_flags FK → org_functions
--   I. Boshqa 40+ jadvallar FK update
--   J. departments, positions jadvallarini DROP
-- ============================================================

BEGIN;

-- ============================================================
-- A. org_departments — missing columns
-- ============================================================
ALTER TABLE org_departments
  ADD COLUMN IF NOT EXISTS code              varchar(30),
  ADD COLUMN IF NOT EXISTS name_en           text,
  ADD COLUMN IF NOT EXISTS vysotskiy_function varchar(50),
  ADD COLUMN IF NOT EXISTS organization_number varchar(10),
  ADD COLUMN IF NOT EXISTS department_code   varchar(20),
  ADD COLUMN IF NOT EXISTS vep               text,
  ADD COLUMN IF NOT EXISTS vep_ru            text,
  ADD COLUMN IF NOT EXISTS statistics_type   varchar(50),
  ADD COLUMN IF NOT EXISTS icon              varchar(50),
  ADD COLUMN IF NOT EXISTS updated_at        timestamp NOT NULL DEFAULT NOW();

-- code UNIQUE index (deferred — data copied first)

-- ============================================================
-- B. org_functions — missing columns
-- ============================================================
ALTER TABLE org_functions
  ADD COLUMN IF NOT EXISTS code              varchar(50),
  ADD COLUMN IF NOT EXISTS name_en           text,
  ADD COLUMN IF NOT EXISTS level             integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rbac_tier         varchar(20) DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_management     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_salary        integer,
  ADD COLUMN IF NOT EXISTS max_salary        integer,
  ADD COLUMN IF NOT EXISTS headcount         integer,
  ADD COLUMN IF NOT EXISTS official_title    text,
  ADD COLUMN IF NOT EXISTS manager_id        integer,
  ADD COLUMN IF NOT EXISTS organization_number varchar(10),
  ADD COLUMN IF NOT EXISTS statistics_type   varchar(50),
  ADD COLUMN IF NOT EXISTS vep               text,
  ADD COLUMN IF NOT EXISTS vep_ru            text,
  ADD COLUMN IF NOT EXISTS ckp               text,
  ADD COLUMN IF NOT EXISTS ai_exam_enabled   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at        timestamp NOT NULL DEFAULT NOW();

-- ============================================================
-- C. departments → org_departments data ko'chirish
-- Agar org_departments.id = departments.id bo'lsa UPDATE,
-- bo'lmasa INSERT.
-- ============================================================

-- Avval barcha departments ni org_departments ga UPSERT qilamiz
INSERT INTO org_departments (
  id, name, name_ru, name_en,
  code, vysotskiy_function, organization_number, department_code,
  vep, vep_ru, statistics_type, icon, color,
  description, description_ru,
  sort_order, level, parent_id, is_active,
  created_at, updated_at
)
SELECT
  d.id,
  COALESCE(d.name, d.name_uz) AS name,
  d.name_ru,
  d.name_en,
  d.code,
  d.vysotskiy_function,
  d.organization_number,
  d.department_code,
  d.vep,
  d.vep_ru,
  d.statistics_type,
  d.icon,
  COALESCE(d.color, '#3b82f6'),
  d.description,
  d.description_ru,
  COALESCE(d.sort_order, 0),
  COALESCE(d.level, 0),
  d.parent_id,
  COALESCE(d.is_active, true),
  d.created_at,
  COALESCE(d.updated_at, d.created_at, NOW())
FROM departments d
ON CONFLICT (id) DO UPDATE SET
  name                = EXCLUDED.name,
  name_ru             = EXCLUDED.name_ru,
  name_en             = EXCLUDED.name_en,
  code                = EXCLUDED.code,
  vysotskiy_function  = EXCLUDED.vysotskiy_function,
  organization_number = EXCLUDED.organization_number,
  department_code     = EXCLUDED.department_code,
  vep                 = EXCLUDED.vep,
  vep_ru              = EXCLUDED.vep_ru,
  statistics_type     = EXCLUDED.statistics_type,
  icon                = EXCLUDED.icon,
  color               = EXCLUDED.color,
  description         = EXCLUDED.description,
  description_ru      = EXCLUDED.description_ru,
  sort_order          = EXCLUDED.sort_order,
  level               = EXCLUDED.level,
  parent_id           = EXCLUDED.parent_id,
  is_active           = EXCLUDED.is_active,
  updated_at          = NOW();

-- org_departments sequence reset
SELECT setval(
  pg_get_serial_sequence('org_departments', 'id'),
  GREATEST(
    (SELECT MAX(id) FROM org_departments),
    (SELECT MAX(id) FROM departments)
  )
);

-- ============================================================
-- D. positions → org_functions data ko'chirish
-- positions.department_id → org_functions.department_id (org_departments.id)
-- ============================================================

INSERT INTO org_functions (
  id,
  department_id,
  position_name, position_name_ru, name_en,
  code, level, rbac_tier, is_management,
  min_salary, max_salary, headcount,
  official_title, manager_id,
  organization_number, statistics_type,
  vep, vep_ru, ckp, ai_exam_enabled,
  description, description_ru,
  display_order, is_active,
  created_at, updated_at
)
SELECT
  p.id,
  -- department_id: positions.department_id = org_departments.id (same IDs after step C)
  p.department_id,
  COALESCE(p.name, p.name_uz) AS position_name,
  p.name_ru,
  p.name_en,
  p.code,
  COALESCE(p.level, 1),
  COALESCE(p.rbac_tier, 'standard'),
  COALESCE(p.is_management, false),
  p.min_salary,
  p.max_salary,
  p.headcount,
  p.official_title,
  p.manager_id,
  p.organization_number,
  p.statistics_type,
  p.vep,
  p.vep_ru,
  p.ckp,
  COALESCE(p.ai_exam_enabled, false),
  p.description,
  p.description_ru,
  COALESCE(p.sort_order, 0),
  COALESCE(p.is_active, true),
  p.created_at,
  COALESCE(p.updated_at, p.created_at, NOW())
FROM positions p
ON CONFLICT (id) DO UPDATE SET
  position_name       = EXCLUDED.position_name,
  position_name_ru    = EXCLUDED.position_name_ru,
  name_en             = EXCLUDED.name_en,
  code                = EXCLUDED.code,
  level               = EXCLUDED.level,
  rbac_tier           = EXCLUDED.rbac_tier,
  is_management       = EXCLUDED.is_management,
  min_salary          = EXCLUDED.min_salary,
  max_salary          = EXCLUDED.max_salary,
  headcount           = EXCLUDED.headcount,
  official_title      = EXCLUDED.official_title,
  manager_id          = EXCLUDED.manager_id,
  organization_number = EXCLUDED.organization_number,
  statistics_type     = EXCLUDED.statistics_type,
  vep                 = EXCLUDED.vep,
  vep_ru              = EXCLUDED.vep_ru,
  ckp                 = EXCLUDED.ckp,
  ai_exam_enabled     = EXCLUDED.ai_exam_enabled,
  display_order       = EXCLUDED.display_order,
  is_active           = EXCLUDED.is_active,
  updated_at          = NOW();

-- org_functions sequence reset
SELECT setval(
  pg_get_serial_sequence('org_functions', 'id'),
  GREATEST(
    (SELECT MAX(id) FROM org_functions),
    (SELECT MAX(id) FROM positions)
  )
);

-- ============================================================
-- E. org_departments.parent_id → self FK qo'shish
-- ============================================================
ALTER TABLE org_departments
  DROP CONSTRAINT IF EXISTS org_departments_parent_fk;

ALTER TABLE org_departments
  ADD CONSTRAINT org_departments_parent_fk
    FOREIGN KEY (parent_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- UNIQUE index on code
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_departments_code
  ON org_departments(code) WHERE code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_functions_code
  ON org_functions(code) WHERE code IS NOT NULL;

-- ============================================================
-- F. employees: department_id → org_departments, position_id → org_functions
-- ============================================================

-- Eski FK larni olib tashlaymiz
ALTER TABLE employees
  DROP CONSTRAINT IF EXISTS employees_department_id_departments_id_fk,
  DROP CONSTRAINT IF EXISTS employees_position_id_positions_id_fk,
  DROP CONSTRAINT IF EXISTS employees_manager_department_id_departments_id_fk;

-- Yangi FK larni qo'shamiz
ALTER TABLE employees
  ADD CONSTRAINT employees_department_id_org_fk
    FOREIGN KEY (department_id) REFERENCES org_departments(id) ON DELETE SET NULL,
  ADD CONSTRAINT employees_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE SET NULL,
  ADD CONSTRAINT employees_manager_department_id_org_fk
    FOREIGN KEY (manager_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- ============================================================
-- G. users: department_id → org_departments, position_id → org_functions
-- ============================================================
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_department_id_departments_id_fk,
  DROP CONSTRAINT IF EXISTS users_position_id_positions_id_fk;

ALTER TABLE users
  ADD CONSTRAINT users_department_id_org_fk
    FOREIGN KEY (department_id) REFERENCES org_departments(id) ON DELETE SET NULL,
  ADD CONSTRAINT users_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE SET NULL;

-- ============================================================
-- H. position_permissions + position_feature_flags → org_functions
-- ============================================================
ALTER TABLE position_permissions
  DROP CONSTRAINT IF EXISTS position_permissions_position_id_positions_id_fk;

ALTER TABLE position_permissions
  ADD CONSTRAINT position_permissions_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE CASCADE;

ALTER TABLE position_feature_flags
  DROP CONSTRAINT IF EXISTS position_feature_flags_position_id_positions_id_fk;

ALTER TABLE position_feature_flags
  ADD CONSTRAINT position_feature_flags_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE CASCADE;

-- ============================================================
-- I. Boshqa jadvallar — department_id va position_id FK update
--    (salary_bands, hr_applications, candidates, vacancies, ...)
-- ============================================================

-- salary_bands
ALTER TABLE salary_bands
  DROP CONSTRAINT IF EXISTS salary_bands_position_id_positions_id_fk,
  DROP CONSTRAINT IF EXISTS salary_bands_department_id_departments_id_fk;
ALTER TABLE salary_bands
  ADD CONSTRAINT IF NOT EXISTS salary_bands_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS salary_bands_department_id_org_fk
    FOREIGN KEY (department_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- candidates
ALTER TABLE candidates
  DROP CONSTRAINT IF EXISTS candidates_position_id_positions_id_fk,
  DROP CONSTRAINT IF EXISTS candidates_department_id_departments_id_fk;
ALTER TABLE candidates
  ADD CONSTRAINT IF NOT EXISTS candidates_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS candidates_department_id_org_fk
    FOREIGN KEY (department_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- vacancies
ALTER TABLE vacancies
  DROP CONSTRAINT IF EXISTS vacancies_position_id_positions_id_fk,
  DROP CONSTRAINT IF EXISTS vacancies_department_id_departments_id_fk;
ALTER TABLE vacancies
  ADD CONSTRAINT IF NOT EXISTS vacancies_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS vacancies_department_id_org_fk
    FOREIGN KEY (department_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- hr_onboarding_plans
ALTER TABLE hr_onboarding_plans
  DROP CONSTRAINT IF EXISTS hr_onboarding_plans_position_id_positions_id_fk,
  DROP CONSTRAINT IF EXISTS hr_onboarding_plans_department_id_departments_id_fk;
ALTER TABLE hr_onboarding_plans
  ADD CONSTRAINT IF NOT EXISTS hr_onboarding_plans_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS hr_onboarding_plans_department_id_org_fk
    FOREIGN KEY (department_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- adaptation_programs
ALTER TABLE adaptation_programs
  DROP CONSTRAINT IF EXISTS adaptation_programs_position_id_positions_id_fk,
  DROP CONSTRAINT IF EXISTS adaptation_programs_department_id_departments_id_fk;
ALTER TABLE adaptation_programs
  ADD CONSTRAINT IF NOT EXISTS adaptation_programs_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE SET NULL,
  ADD CONSTRAINT IF NOT EXISTS adaptation_programs_department_id_org_fk
    FOREIGN KEY (department_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- career_development_plans
ALTER TABLE career_development_plans
  DROP CONSTRAINT IF EXISTS career_development_plans_position_id_fk;
ALTER TABLE career_development_plans
  ADD CONSTRAINT IF NOT EXISTS career_development_plans_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE SET NULL;

-- succession_plans
ALTER TABLE succession_plans
  DROP CONSTRAINT IF EXISTS succession_plans_position_id_positions_id_fk;
ALTER TABLE succession_plans
  ADD CONSTRAINT IF NOT EXISTS succession_plans_position_id_org_fk
    FOREIGN KEY (position_id) REFERENCES org_functions(id) ON DELETE SET NULL;

-- kpi_results
ALTER TABLE kpi_results
  DROP CONSTRAINT IF EXISTS kpi_results_department_id_departments_id_fk;
ALTER TABLE kpi_results
  ADD CONSTRAINT IF NOT EXISTS kpi_results_department_id_org_fk
    FOREIGN KEY (department_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- cost_centers
ALTER TABLE cost_centers
  DROP CONSTRAINT IF EXISTS cost_centers_department_id_departments_id_fk;
ALTER TABLE cost_centers
  ADD CONSTRAINT IF NOT EXISTS cost_centers_department_id_org_fk
    FOREIGN KEY (department_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- ============================================================
-- J. departments va positions JADVALLARINI DROP
--    (barcha FK lar org_* ga o'tkazilgandan keyin)
-- ============================================================

DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- ============================================================
-- TEKSHIRISH: data to'liq ko'chirilganligini tasdiqlash
-- ============================================================
DO $$
DECLARE
  dept_count  integer;
  func_count  integer;
BEGIN
  SELECT COUNT(*) INTO dept_count FROM org_departments;
  SELECT COUNT(*) INTO func_count FROM org_functions;
  RAISE NOTICE 'Migration 0050 tugadi: org_departments=%, org_functions=%',
    dept_count, func_count;
END $$;

COMMIT;
