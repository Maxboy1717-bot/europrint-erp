-- Migration: fix-discipline-schema.sql
-- Maqsad: Backend code DB mismatch (catastrophic).
--
-- DB:    id, user_id, type, amount, reason, given_by, created_at, deleted_at, is_soft_deleted
-- Code:  id, employee_id, violation_type, severity, status, violation_date, fine_amount, created_at

-- 1. Rename column'lar (faqat hali rename qilinmagan bo'lsa)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='discipline_records' AND column_name='user_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='discipline_records' AND column_name='employee_id') THEN
    ALTER TABLE discipline_records RENAME COLUMN user_id TO employee_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='discipline_records' AND column_name='type')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='discipline_records' AND column_name='violation_type') THEN
    ALTER TABLE discipline_records RENAME COLUMN type TO violation_type;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='discipline_records' AND column_name='amount')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='discipline_records' AND column_name='fine_amount') THEN
    ALTER TABLE discipline_records RENAME COLUMN amount TO fine_amount;
  END IF;
END$$;

-- 2. Etishmayotgan ustunlar
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS severity varchar(20) DEFAULT 'minor';
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS violation_date date DEFAULT CURRENT_DATE;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS resolved_by integer;

-- 3. Soft-delete columns (allaqachon bor, lekin idempotent)
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS is_soft_deleted boolean DEFAULT false;

-- 4. Status default
ALTER TABLE discipline_records ALTER COLUMN status SET DEFAULT 'open';

-- 5. Index'lar
CREATE INDEX IF NOT EXISTS idx_discipline_employee ON discipline_records(employee_id) WHERE is_soft_deleted = false;
CREATE INDEX IF NOT EXISTS idx_discipline_violation_date ON discipline_records(violation_date DESC);
CREATE INDEX IF NOT EXISTS idx_discipline_status ON discipline_records(status) WHERE is_soft_deleted = false;

-- 6. Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'discipline_records' ORDER BY ordinal_position;
