-- APPROVED: owner 2026-06-17 (MUSLIMBEK-PROMT #13 COR — "ZVS/ZNO SHU YERDA quriladi", #12 draft DDL)
-- Coordination Center (Koordinatsiya markazi) approval documents:
--   zvs = Zayavka na Vydachu Sredstv (weekly fund-disbursement request)
--   zno = Zayavka na Oplatu (payment request)
-- The director-side zvs/zno repos (insert/select/update) already exist but their tables were missing,
-- so every submit crashed 42P01. Columns are derived exactly from those repos. No FKs (ADD-ONLY / no-FK
-- convention, avoids type-cast drift); created_at DEFAULT NOW() so the repos' ORDER BY created_at works.
CREATE TABLE IF NOT EXISTS zvs (
  id              SERIAL PRIMARY KEY,
  department_id   INTEGER,
  submitted_by    INTEGER,
  submitter_name  VARCHAR(200),
  amount          NUMERIC(15,2),
  purpose         TEXT,
  priority        VARCHAR(20),
  week_date       DATE,
  level           VARCHAR(20),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by     INTEGER,
  reviewed_at     TIMESTAMP,
  comment         TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zno (
  id              SERIAL PRIMARY KEY,
  department_id   INTEGER,
  submitted_by    INTEGER,
  submitter_name  VARCHAR(200),
  amount          NUMERIC(15,2),
  purpose         TEXT,
  payment_date    DATE,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by     INTEGER,
  reviewed_at     TIMESTAMP,
  comment         TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
