-- ARCHITECTURE.md §41.2 — HR yetishmagan 11 ta jadval
-- Idempotent: IF NOT EXISTS
-- 2026-04-29

-- 1. leave_balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id                 SERIAL PRIMARY KEY,
  employee_id        INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year               INTEGER NOT NULL,
  total_days         NUMERIC(18,4) NOT NULL DEFAULT 24,
  used_days          NUMERIC(18,4) NOT NULL DEFAULT 0,
  carried_over_days  NUMERIC(18,4) NOT NULL DEFAULT 0,
  expires_at         DATE,
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_leave_balances_emp_year UNIQUE (employee_id, year),
  CONSTRAINT ck_leave_balances_used_le_total CHECK (used_days <= total_days + carried_over_days),
  CONSTRAINT ck_leave_balances_nonneg CHECK (total_days >= 0 AND used_days >= 0 AND carried_over_days >= 0)
);

-- 2. salary_bands
CREATE TABLE IF NOT EXISTS salary_bands (
  id              SERIAL PRIMARY KEY,
  position_id     INTEGER NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  currency        VARCHAR(3) NOT NULL DEFAULT 'UZS',
  min_salary      NUMERIC(18,4) NOT NULL,
  max_salary      NUMERIC(18,4) NOT NULL,
  mid_salary      NUMERIC(18,4),
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_salary_bands_min_le_max CHECK (min_salary <= max_salary),
  CONSTRAINT ck_salary_bands_currency_3 CHECK (length(currency) = 3)
);
CREATE INDEX IF NOT EXISTS idx_salary_bands_position ON salary_bands(position_id);

-- 3. payroll_journal_entries
CREATE TABLE IF NOT EXISTS payroll_journal_entries (
  id                  SERIAL PRIMARY KEY,
  payroll_period_id   INTEGER,
  employee_id         INTEGER REFERENCES employees(id),
  gl_document_id      VARCHAR(255),
  entry_type          VARCHAR(20) NOT NULL,
  debit_account_code  VARCHAR(10),
  credit_account_code VARCHAR(10),
  amount              NUMERIC(18,4) NOT NULL,
  currency            VARCHAR(3) NOT NULL DEFAULT 'UZS',
  description         TEXT,
  posted_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  posted_by           INTEGER,
  CONSTRAINT ck_payroll_je_amount_pos CHECK (amount >= 0),
  CONSTRAINT ck_payroll_je_type CHECK (entry_type IN ('accrual','deduction','payment'))
);
CREATE INDEX IF NOT EXISTS idx_payroll_je_period ON payroll_journal_entries(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_je_employee ON payroll_journal_entries(employee_id);

-- 4. discipline_appeals
CREATE TABLE IF NOT EXISTS discipline_appeals (
  id                    SERIAL PRIMARY KEY,
  discipline_record_id  INTEGER NOT NULL,
  employee_id           INTEGER NOT NULL REFERENCES employees(id),
  appeal_reason         TEXT NOT NULL,
  appeal_evidence       JSONB,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewer_id           INTEGER,
  reviewer_notes        TEXT,
  reviewed_at           TIMESTAMP,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_discipline_appeals_status CHECK (status IN ('pending','under_review','approved','rejected','withdrawn'))
);
CREATE INDEX IF NOT EXISTS idx_discipline_appeals_record ON discipline_appeals(discipline_record_id);
CREATE INDEX IF NOT EXISTS idx_discipline_appeals_employee ON discipline_appeals(employee_id);

-- 5. career_development_plans
CREATE TABLE IF NOT EXISTS career_development_plans (
  id                     SERIAL PRIMARY KEY,
  employee_id            INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  mentor_id              INTEGER REFERENCES employees(id),
  target_position_id     INTEGER REFERENCES positions(id),
  goals                  JSONB,
  start_date             DATE NOT NULL,
  end_date               DATE,
  review_frequency_days  INTEGER DEFAULT 90,
  last_reviewed_at       TIMESTAMP,
  status                 VARCHAR(20) NOT NULL DEFAULT 'active',
  progress_percent       NUMERIC(18,4) DEFAULT 0,
  notes                  TEXT,
  created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_career_dev_status CHECK (status IN ('active','completed','paused','cancelled')),
  CONSTRAINT ck_career_dev_progress CHECK (progress_percent >= 0 AND progress_percent <= 100)
);
CREATE INDEX IF NOT EXISTS idx_career_dev_employee ON career_development_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_career_dev_mentor ON career_development_plans(mentor_id);

-- 6. job_templates
CREATE TABLE IF NOT EXISTS job_templates (
  id                     SERIAL PRIMARY KEY,
  position_id            INTEGER REFERENCES positions(id),
  code                   VARCHAR(50) NOT NULL UNIQUE,
  title_uz               VARCHAR(200) NOT NULL,
  title_ru               VARCHAR(200),
  responsibilities_uz    JSONB,
  responsibilities_ru    JSONB,
  requirements_uz        JSONB,
  requirements_ru        JSONB,
  benefits_uz            JSONB,
  benefits_ru            JSONB,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_templates_position ON job_templates(position_id);

-- 7. questionnaire_templates
CREATE TABLE IF NOT EXISTS questionnaire_templates (
  id                  SERIAL PRIMARY KEY,
  code                VARCHAR(50) NOT NULL UNIQUE,
  name                VARCHAR(200) NOT NULL,
  type                VARCHAR(30) NOT NULL,
  description         TEXT,
  estimated_minutes   INTEGER DEFAULT 15,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_questionnaire_type CHECK (type IN ('interview','360_review','exit','nps','pulse'))
);

-- 8. questionnaire_questions
CREATE TABLE IF NOT EXISTS questionnaire_questions (
  id              SERIAL PRIMARY KEY,
  template_id     INTEGER NOT NULL REFERENCES questionnaire_templates(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  question_type   VARCHAR(30) NOT NULL,
  options         JSONB,
  is_required     BOOLEAN NOT NULL DEFAULT TRUE,
  weight          NUMERIC(18,4) DEFAULT 1,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_questionnaire_q_type CHECK (question_type IN ('text','scale_1_5','scale_1_10','yes_no','multiple_choice','single_choice'))
);
CREATE INDEX IF NOT EXISTS idx_questionnaire_q_template ON questionnaire_questions(template_id);

-- 9. ai_cv_screenings
CREATE TABLE IF NOT EXISTS ai_cv_screenings (
  id                SERIAL PRIMARY KEY,
  candidate_id      INTEGER NOT NULL,
  vacancy_id        INTEGER NOT NULL,
  cv_file_url       TEXT,
  model_name        VARCHAR(50) NOT NULL,
  total_score       INTEGER NOT NULL,
  experience_score  INTEGER,
  skills_score      INTEGER,
  education_score   INTEGER,
  culture_fit_score INTEGER,
  raw_analysis      JSONB,
  recommendation    VARCHAR(30),
  is_shortlisted    BOOLEAN DEFAULT FALSE,
  tokens_used       INTEGER,
  cost_usd          NUMERIC(18,4),
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_ai_cv_score CHECK (total_score >= 0 AND total_score <= 100),
  CONSTRAINT ck_ai_cv_recommendation CHECK (recommendation IN ('strong','good','weak','not_suitable') OR recommendation IS NULL)
);
CREATE INDEX IF NOT EXISTS idx_ai_cv_candidate ON ai_cv_screenings(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ai_cv_vacancy ON ai_cv_screenings(vacancy_id);

-- 10. ai_interview_sessions_ext
CREATE TABLE IF NOT EXISTS ai_interview_sessions_ext (
  id                    SERIAL PRIMARY KEY,
  candidate_id          INTEGER NOT NULL,
  vacancy_id            INTEGER NOT NULL,
  session_token         VARCHAR(100) NOT NULL UNIQUE,
  video_url             TEXT,
  transcript_url        TEXT,
  duration_seconds      INTEGER,
  total_score           INTEGER,
  logic_score           INTEGER,
  ethics_score          INTEGER,
  experience_score      INTEGER,
  final_recommendation  VARCHAR(30),
  started_at            TIMESTAMP,
  ended_at              TIMESTAMP,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_ai_interview_recommendation CHECK (final_recommendation IN ('offer','second_round','reject') OR final_recommendation IS NULL)
);
CREATE INDEX IF NOT EXISTS idx_ai_interview_candidate ON ai_interview_sessions_ext(candidate_id);

-- 11. exit_interviews
CREATE TABLE IF NOT EXISTS exit_interviews (
  id                       SERIAL PRIMARY KEY,
  employee_id              INTEGER NOT NULL REFERENCES employees(id),
  interviewer_id           INTEGER REFERENCES employees(id),
  exit_date                DATE NOT NULL,
  reason_category          VARCHAR(50) NOT NULL,
  reason_details           TEXT,
  recommend_company        INTEGER,
  improvement_suggestions  TEXT,
  rehire_eligible          BOOLEAN,
  feedback_json            JSONB,
  created_at               TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_exit_recommend_score CHECK (recommend_company >= 0 AND recommend_company <= 10)
);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_employee ON exit_interviews(employee_id);
