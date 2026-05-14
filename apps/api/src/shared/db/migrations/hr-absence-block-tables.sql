-- ============================================================================
-- HR Absence & Blocking — Yetishmayotgan jadval va ustunlarni qo'shish
-- ============================================================================
-- Muammo: AbsenceBlockCron har safar "Failed query" bilan muvaffaqiyatsiz
-- tugar edi, chunki quyidagilar bazada yo'q edi:
--   1. employees.is_blocked, employees.blocked_reason, employees.status,
--      employees.deleted_at  — AbsenceBlockCron WHERE shartlari uchun
--   2. absence_tracking jadvali
--   3. employee_blocks jadvali
--
-- Barcha operatsiyalar idempotent (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================================

-- ─── 1. employees jadvali — yetishmayotgan ustunlar ──────────────────────────

ALTER TABLE employees ADD COLUMN IF NOT EXISTS status          varchar(30) DEFAULT 'active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_blocked      boolean     DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS blocked_reason  text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS deleted_at      timestamp;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active       boolean     DEFAULT true;

-- Indekslar (agar yo'q bo'lsa)
CREATE INDEX IF NOT EXISTS idx_employees_status
  ON employees (status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_employees_is_blocked
  ON employees (is_blocked)
  WHERE deleted_at IS NULL;

-- ─── 2. absence_tracking jadvali ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS absence_tracking (
  id                    serial       PRIMARY KEY,
  employee_id           integer      NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  absence_date          date         NOT NULL,
  consecutive_day_count integer      NOT NULL DEFAULT 1,
  auto_blocked          boolean      NOT NULL DEFAULT false,
  is_excused            boolean      NOT NULL DEFAULT false,
  excuse_reason         text,
  excuse_document_url   text,
  excused_by            integer      REFERENCES employees(id) ON DELETE SET NULL,
  excused_at            timestamp,
  created_at            timestamp    NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, absence_date)
);

CREATE INDEX IF NOT EXISTS idx_absence_tracking_employee_date
  ON absence_tracking (employee_id, absence_date DESC);

CREATE INDEX IF NOT EXISTS idx_absence_tracking_auto_blocked
  ON absence_tracking (auto_blocked, consecutive_day_count)
  WHERE auto_blocked = false;

-- ─── 3. employee_blocks jadvali ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employee_blocks (
  id                     serial    PRIMARY KEY,
  employee_id            integer   NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reason                 text,
  blocked_by             integer   REFERENCES employees(id) ON DELETE SET NULL,
  unblocked_by           integer   REFERENCES employees(id) ON DELETE SET NULL,
  is_active              boolean   NOT NULL DEFAULT true,
  block_erp_access       boolean   NOT NULL DEFAULT true,
  block_payroll          boolean   NOT NULL DEFAULT false,
  block_physical_access  boolean   NOT NULL DEFAULT false,
  unblocked_at           timestamp,
  created_at             timestamp NOT NULL DEFAULT NOW(),
  updated_at             timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_blocks_employee
  ON employee_blocks (employee_id, is_active);

-- ─── Natija tekshiruvi ────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ hr-absence-block-tables migration muvaffaqiyatli bajarildi';
  RAISE NOTICE '   employees: is_blocked, status, deleted_at ustunlari tayyor';
  RAISE NOTICE '   absence_tracking jadvali tayyor';
  RAISE NOTICE '   employee_blocks jadvali tayyor';
END $$;
