-- HR-01: pgvector extension + 12 hr_tz2_* tables
-- Applied: 2026-04-25
-- All tables use UUID PKs; FK to existing tables use integer (employees/positions/departments/vacancies all have serial integer PKs)

-- ============================================================================
-- EXTENSION
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 1. hr_tz2_territory_logs — employee entry/exit events from camera AI
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_territory_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     INTEGER     NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  event_type      VARCHAR(30) NOT NULL,
  camera_id       UUID,
  ts              TIMESTAMP   NOT NULL,
  face_confidence NUMERIC(5,2),
  room_code       VARCHAR(50),
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hrtz2_territory_emp_ts_idx ON hr_tz2_territory_logs(employee_id, ts);
CREATE INDEX IF NOT EXISTS hrtz2_territory_event_idx  ON hr_tz2_territory_logs(event_type);

-- ============================================================================
-- 2. hr_tz2_attendance_photos — 2-hour interval AI camera photo records
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_attendance_photos (
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     INTEGER   NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  photo_url       TEXT      NOT NULL,
  taken_at        TIMESTAMP NOT NULL,
  room_code       VARCHAR(50),
  analysis_result JSONB,
  processed       BOOLEAN   NOT NULL DEFAULT false,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hrtz2_photos_emp_taken_idx ON hr_tz2_attendance_photos(employee_id, taken_at);
CREATE INDEX IF NOT EXISTS hrtz2_photos_processed_idx ON hr_tz2_attendance_photos(processed);

-- ============================================================================
-- 3. hr_tz2_ai_question_banks — AI interview question bank per position
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_ai_question_banks (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id        INTEGER     REFERENCES positions(id) ON DELETE SET NULL,
  position_code      VARCHAR(50),
  category           VARCHAR(30) NOT NULL,
  question_uz        TEXT        NOT NULL,
  question_ru        TEXT,
  question_en        TEXT,
  expected_keywords  JSONB,
  scoring_rubric     JSONB,
  follow_up_questions JSONB,
  difficulty         INTEGER     NOT NULL DEFAULT 3,
  is_active          BOOLEAN     NOT NULL DEFAULT true,
  created_by         UUID,
  created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hrtz2_qbank_position_idx ON hr_tz2_ai_question_banks(position_id);
CREATE INDEX IF NOT EXISTS hrtz2_qbank_category_idx ON hr_tz2_ai_question_banks(category);
CREATE INDEX IF NOT EXISTS hrtz2_qbank_active_idx   ON hr_tz2_ai_question_banks(is_active);

-- ============================================================================
-- 4. hr_tz2_room_reference_photos — ideal/reference room state photos
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_room_reference_photos (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code       VARCHAR(50)  NOT NULL UNIQUE,
  room_name       VARCHAR(200) NOT NULL,
  department_code VARCHAR(50),
  photo_url       TEXT         NOT NULL,
  description     TEXT,
  last_updated_at TIMESTAMP,
  updated_by      TEXT,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hrtz2_room_ref_code_idx ON hr_tz2_room_reference_photos(room_code);

-- ============================================================================
-- 5. hr_tz2_ai_room_analysis — AI room inspection diff results
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_ai_room_analysis (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code           VARCHAR(50) NOT NULL,
  reference_photo_id  UUID        REFERENCES hr_tz2_room_reference_photos(id) ON DELETE SET NULL,
  current_photo_url   TEXT        NOT NULL,
  analyzed_at         TIMESTAMP   NOT NULL,
  cleanliness_score   NUMERIC(5,2),
  order_score         NUMERIC(5,2),
  equipment_ok        BOOLEAN,
  issues              JSONB,
  anomalies           JSONB,
  pdf_url             TEXT,
  notified_hr         BOOLEAN     NOT NULL DEFAULT false,
  created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP   NOT NULL DEFAULT NOW()
);
-- Idempotent: add pdf_url on existing environments where the column may be absent
ALTER TABLE hr_tz2_ai_room_analysis ADD COLUMN IF NOT EXISTS pdf_url TEXT;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='hr_tz2_room_reference_photos' AND column_name='updated_by' AND data_type='uuid'
  ) THEN
    ALTER TABLE hr_tz2_room_reference_photos ALTER COLUMN updated_by TYPE TEXT USING updated_by::TEXT;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS hrtz2_room_analysis_code_idx ON hr_tz2_ai_room_analysis(room_code);
CREATE INDEX IF NOT EXISTS hrtz2_room_analysis_at_idx   ON hr_tz2_ai_room_analysis(analyzed_at);

-- ============================================================================
-- 6. hr_tz2_internal_job_postings — internal vacancy announcements
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_internal_job_postings (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id            INTEGER      REFERENCES vacancies(id) ON DELETE SET NULL,
  title                 VARCHAR(200) NOT NULL,
  department_id         INTEGER      REFERENCES departments(id) ON DELETE SET NULL,
  description           TEXT,
  min_experience_months INTEGER,
  required_skills       JSONB,
  salary_range          JSONB,
  deadline              DATE,
  status                VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
  applicants_count      INTEGER      NOT NULL DEFAULT 0,
  created_by            UUID,
  created_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP    NOT NULL DEFAULT NOW(),
  closed_at             TIMESTAMP
);
CREATE INDEX IF NOT EXISTS hrtz2_ijp_status_idx   ON hr_tz2_internal_job_postings(status);
CREATE INDEX IF NOT EXISTS hrtz2_ijp_dept_idx     ON hr_tz2_internal_job_postings(department_id);
CREATE INDEX IF NOT EXISTS hrtz2_ijp_deadline_idx ON hr_tz2_internal_job_postings(deadline);

-- ============================================================================
-- 7. hr_tz2_internal_applications — employee applications to internal postings
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_internal_applications (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id       UUID        NOT NULL REFERENCES hr_tz2_internal_job_postings(id) ON DELETE CASCADE,
  employee_id      INTEGER     NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  cover_letter     TEXT,
  current_position VARCHAR(200),
  status           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  created_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT hrtz2_iapp_posting_emp_uniq UNIQUE(posting_id, employee_id)
);
CREATE INDEX IF NOT EXISTS hrtz2_iapp_posting_idx  ON hr_tz2_internal_applications(posting_id);
CREATE INDEX IF NOT EXISTS hrtz2_iapp_employee_idx ON hr_tz2_internal_applications(employee_id);
CREATE INDEX IF NOT EXISTS hrtz2_iapp_status_idx   ON hr_tz2_internal_applications(status);

-- ============================================================================
-- 8. hr_tz2_talent_pool — succession planning / readiness tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_talent_pool (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id          INTEGER     NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  readiness_level      VARCHAR(20),
  target_position_ids  JSONB,
  development_plan     TEXT,
  strengths            JSONB,
  gaps                 JSONB,
  mentor_id            INTEGER     REFERENCES employees(id) ON DELETE SET NULL,
  reviewed_by          UUID,
  reviewed_at          TIMESTAMP,
  next_review_date     DATE,
  created_at           TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hrtz2_talent_readiness_idx ON hr_tz2_talent_pool(readiness_level);
CREATE INDEX IF NOT EXISTS hrtz2_talent_mentor_idx    ON hr_tz2_talent_pool(mentor_id);

-- ============================================================================
-- 9. hr_tz2_contract_versions — employment contract version history
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_contract_versions (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id          INTEGER      NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  version_number       INTEGER      NOT NULL,
  contract_type        VARCHAR(30),
  start_date           DATE,
  end_date             DATE,
  position_id          INTEGER      REFERENCES positions(id) ON DELETE SET NULL,
  department_id        INTEGER      REFERENCES departments(id) ON DELETE SET NULL,
  salary_amount        NUMERIC(15,2),
  salary_currency      VARCHAR(5)   NOT NULL DEFAULT 'UZS',
  changes_summary      TEXT,
  document_url         TEXT,
  signed_by_employee   BOOLEAN      NOT NULL DEFAULT false,
  signed_by_hr         BOOLEAN      NOT NULL DEFAULT false,
  created_by           UUID,
  created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT hrtz2_contract_emp_version_uniq UNIQUE(employee_id, version_number)
);
CREATE INDEX IF NOT EXISTS hrtz2_contract_emp_idx  ON hr_tz2_contract_versions(employee_id);
CREATE INDEX IF NOT EXISTS hrtz2_contract_type_idx ON hr_tz2_contract_versions(contract_type);

-- ============================================================================
-- 10. hr_tz2_signed_policies — employee policy/regulation signature records
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_signed_policies (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id            INTEGER      NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  policy_name            VARCHAR(200) NOT NULL,
  policy_version         VARCHAR(20),
  policy_url             TEXT,
  signed_at              TIMESTAMP,
  signature_method       VARCHAR(20),
  signature_evidence_url TEXT,
  created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT hrtz2_policy_emp_name_ver_uniq UNIQUE(employee_id, policy_name, policy_version)
);
CREATE INDEX IF NOT EXISTS hrtz2_policy_emp_idx  ON hr_tz2_signed_policies(employee_id);
CREATE INDEX IF NOT EXISTS hrtz2_policy_name_idx ON hr_tz2_signed_policies(policy_name);

-- ============================================================================
-- 11. hr_tz2_recruiter_kpi_daily — daily recruiter KPI metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_recruiter_kpi_daily (
  id                      UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id            INTEGER   NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date                    DATE      NOT NULL,
  vacancies_owned         INTEGER   NOT NULL DEFAULT 0,
  candidates_screened     INTEGER   NOT NULL DEFAULT 0,
  ai_interviews_sent      INTEGER   NOT NULL DEFAULT 0,
  live_interviews_scheduled INTEGER NOT NULL DEFAULT 0,
  offers_made             INTEGER   NOT NULL DEFAULT 0,
  hires_closed            INTEGER   NOT NULL DEFAULT 0,
  avg_time_to_hire_days   NUMERIC(5,1),
  sla_breaches            INTEGER   NOT NULL DEFAULT 0,
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT hrtz2_kpi_recruiter_date_uniq UNIQUE(recruiter_id, date)
);
CREATE INDEX IF NOT EXISTS hrtz2_kpi_recruiter_idx ON hr_tz2_recruiter_kpi_daily(recruiter_id);
CREATE INDEX IF NOT EXISTS hrtz2_kpi_date_idx      ON hr_tz2_recruiter_kpi_daily(date);

-- ============================================================================
-- 12. hr_tz2_monthly_employee_cards — monthly consolidated employee report cards
-- ============================================================================
CREATE TABLE IF NOT EXISTS hr_tz2_monthly_employee_cards (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id          INTEGER     NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year_month           VARCHAR(7)  NOT NULL,
  work_days_total      INTEGER,
  work_days_actual     INTEGER,
  late_count           INTEGER,
  absence_count        INTEGER,
  daily_reports_submitted INTEGER,
  daily_reports_missed INTEGER,
  avg_360_score        NUMERIC(4,2),
  avg_kpi_score        NUMERIC(4,2),
  rewards_count        INTEGER,
  penalties_total      NUMERIC(15,2),
  penalties_currency   VARCHAR(5)  NOT NULL DEFAULT 'UZS',
  salary_base          NUMERIC(15,2),
  salary_bonus         NUMERIC(15,2),
  salary_advance       NUMERIC(15,2),
  salary_deductions    NUMERIC(15,2),
  salary_net           NUMERIC(15,2),
  pdf_url              TEXT,
  generated_at         TIMESTAMP,
  created_at           TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT hrtz2_monthly_emp_month_uniq UNIQUE(employee_id, year_month)
);
CREATE INDEX IF NOT EXISTS hrtz2_monthly_emp_idx      ON hr_tz2_monthly_employee_cards(employee_id);
CREATE INDEX IF NOT EXISTS hrtz2_monthly_yearmonth_idx ON hr_tz2_monthly_employee_cards(year_month);

-- ============================================================================
-- Verification
-- ============================================================================
SELECT tablename FROM pg_tables
WHERE tablename LIKE 'hr_tz2_%'
ORDER BY tablename;
