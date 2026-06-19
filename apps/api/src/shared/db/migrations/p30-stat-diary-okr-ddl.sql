-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/p30-stat-diary-okr-ddl.sql
-- APPROVED: Claude(egasi vakolati) 2026-06-19
-- P30 Wave 3: stat_regulations + diary_entries + monthly_plans
-- Ishga tushirish: egasi APPROVED: stampini qo'ygandan KEYIN.
--   psql $DATABASE_URL -f p30-stat-diary-okr-ddl.sql
-- Idempotent: IF NOT EXISTS guards — qayta ishlatilsa xato bermaydi.
-- ============================================================

CREATE TABLE IF NOT EXISTS stat_regulations (
  id            SERIAL PRIMARY KEY,
  name_uz       TEXT NOT NULL,
  name_ru       TEXT,
  definition    TEXT,
  formula       TEXT,
  unit          VARCHAR(50),
  frequency     VARCHAR(20) NOT NULL DEFAULT 'daily'
                  CHECK (frequency IN ('daily','weekly','monthly')),
  source_module VARCHAR(50),
  owner_card_id INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  target_value  NUMERIC(14,2),
  version       INTEGER NOT NULL DEFAULT 1,
  valid_from    DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stat_reg_active
  ON stat_regulations(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_stat_reg_owner
  ON stat_regulations(owner_card_id);

-- ============================================================

CREATE TABLE IF NOT EXISTS diary_entries (
  id                  SERIAL PRIMARY KEY,
  author_card_id      INTEGER REFERENCES org_functions(id) ON DELETE SET NULL,
  date                DATE NOT NULL,
  daily_state         VARCHAR(20),
  main_kpi_value      NUMERIC(10,2),
  main_issue          TEXT,
  solution            TEXT,
  tomorrow_plan       TEXT,
  carry_over_issues   JSONB NOT NULL DEFAULT '[]',
  status              VARCHAR(10) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','submitted')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (author_card_id, date)
);
CREATE INDEX IF NOT EXISTS idx_diary_date
  ON diary_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_diary_author_date
  ON diary_entries(author_card_id, date);

-- ============================================================

CREATE TABLE IF NOT EXISTS monthly_plans (
  id                SERIAL PRIMARY KEY,
  strategic_goal_id INTEGER REFERENCES okr_objectives(id) ON DELETE SET NULL,
  month             VARCHAR(7) NOT NULL,   -- YYYY-MM
  objectives        JSONB NOT NULL DEFAULT '[]',
  weekly_tasks      JSONB NOT NULL DEFAULT '[]',
  completion_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_goal
  ON monthly_plans(strategic_goal_id);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_month
  ON monthly_plans(month);
