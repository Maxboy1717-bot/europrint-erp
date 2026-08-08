-- APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02
-- OWNER QARORI: `salary_history` jadvalida aralashtirilgan 2 tushuncha ikkiga ajratiladi:
--   A) salary_change_log     — oylik-o'zgarish AUDIT-JURNALI (ko'tarilish/tekshiruv hodisasi).
--   B) payroll_period_record — payroll-DAVR hisob-kitobi (oylik ish-haqi hisoblash/tasdiqlash/GL).
-- FAQAT ADDITIV: CREATE TABLE IF NOT EXISTS + idempotent backfill. `salary_history` jadvali
--   DROP QILINMAYDI (Q-qoida: hech qachon DROP TABLE) — eski compat consumerlar (hr-gsd
--   yo'naltirilmagan qismlari, migrations-drift.ts DDL) hamon ishlayveradi, faqat endi yangi
--   yozuvlar 2 yangi jadvalga tushadi (hr-payroll.repo.ts -> A, hr.repo.ts/finance-actions -> B).
-- Idempotent — qayta qo'llasa xavfsiz (IF NOT EXISTS / NOT EXISTS-guard backfill).

-- ---------------------------------------------------------------------------
-- A) salary_change_log — oylik-o'zgarish audit-jurnali
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salary_change_log (
  id              SERIAL PRIMARY KEY,
  employee_id     INTEGER NOT NULL,
  user_id         INTEGER,
  effective_date  TIMESTAMP,
  change_type     VARCHAR,
  previous_salary NUMERIC(15,2),
  new_salary      NUMERIC(15,2),
  change_percent  NUMERIC(6,2),
  reason          TEXT,
  approved_by     INTEGER,
  created_by      INTEGER,
  created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salary_change_log_employee_id ON salary_change_log (employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_change_log_user_id     ON salary_change_log (user_id);

-- ---------------------------------------------------------------------------
-- B) payroll_period_record — payroll-davr hisob-kitobi
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll_period_record (
  id                   SERIAL PRIMARY KEY,
  employee_id          INTEGER NOT NULL,
  salary_period_start  DATE,
  salary_period_end    DATE,
  base_salary          NUMERIC(15,2),
  salary_earned        NUMERIC(15,2),
  total_bonuses        NUMERIC(15,2) DEFAULT 0,
  other_bonuses        NUMERIC(15,2) DEFAULT 0,
  status               VARCHAR DEFAULT 'draft',
  approved_by          INTEGER,
  paid_by              INTEGER,
  paid_date            DATE,
  created_at           TIMESTAMP NOT NULL DEFAULT now(),
  updated_at           TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_period_record_employee_id     ON payroll_period_record (employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period_record_period_start    ON payroll_period_record (salary_period_start);

-- ---------------------------------------------------------------------------
-- Backfill: `salary_history` dagi mavjud 10 qator (seed-06-hr-demo-data.sql, change_type=
-- 'monthly_payroll') mazmunan payroll-davr hisob-kitobi (B) — audit-jurnal (A) EMAS, chunki
-- ular haqiqiy oylik-o'zgarish hodisasi emas, davriy payroll-run yozuvlari (davr+bonus+status
-- to'liq to'ldirilgan). NOT EXISTS-guard bilan idempotent (qayta ishga tushirilsa dublikat
-- yaratmaydi).
-- ---------------------------------------------------------------------------
INSERT INTO payroll_period_record
  (employee_id, salary_period_start, salary_period_end, base_salary, salary_earned,
   total_bonuses, other_bonuses, status, approved_by, paid_by, paid_date, created_at, updated_at)
SELECT
  sh.employee_id, sh.salary_period_start, sh.salary_period_end, sh.base_salary, sh.salary_earned,
  sh.total_bonuses, sh.other_bonuses, sh.status, sh.approved_by, sh.paid_by, sh.paid_date,
  sh.created_at, sh.updated_at
FROM salary_history sh
WHERE sh.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM payroll_period_record ppr
    WHERE ppr.employee_id = sh.employee_id
      AND ppr.salary_period_start IS NOT DISTINCT FROM sh.salary_period_start
      AND ppr.salary_period_end   IS NOT DISTINCT FROM sh.salary_period_end
  );
