-- ARCHITECTURE.md §39 — Master Data Qoida 1: code UNIQUE biznes kalit
-- Maqsad: positions.code va departments.code uchun UNIQUE constraint qo'shish.
--
-- Sabab: schema da `.unique()` deyilgan, lekin drizzle-kit migration generate
-- qilganda bu constraint chiqarilmagan. master-data.seed.ts da
-- `ON CONFLICT (code) DO UPDATE` ishlatiladi — UNIQUE constraint majburiy.
--
-- Idempotent: IF NOT EXISTS pattern. Mavjud duplicate'lar warning sifatida
-- xabar beriladi (xato emas) — admin qo'lda tozalashi kerak.
--
-- Bu migration BUZG'UNCHI EMAS:
--   - Mavjud yozuvlarga tegmaydi
--   - Faqat yangi qo'shilgan duplicate'larni bloklab boshlaydi
--   - Eski FK constraint'lar saqlanadi
--
-- 2026-04-29

BEGIN;

-- ─── 1. Pre-check: duplicate code'lar mavjudligini tekshirish ────────────────
DO $$
DECLARE
  dup_dept INT;
  dup_pos  INT;
  dup_rec  RECORD;
BEGIN
  -- Departments duplicate'lari
  SELECT COUNT(*) INTO dup_dept FROM (
    SELECT code FROM departments
    WHERE code IS NOT NULL
    GROUP BY code
    HAVING COUNT(*) > 1
  ) d;

  IF dup_dept > 0 THEN
    RAISE WARNING 'departments.code da % ta duplicate code topildi:', dup_dept;
    FOR dup_rec IN
      SELECT code, COUNT(*) AS cnt
      FROM departments
      WHERE code IS NOT NULL
      GROUP BY code
      HAVING COUNT(*) > 1
      ORDER BY code
    LOOP
      RAISE WARNING '  - departments.code = %: % ta yozuv', dup_rec.code, dup_rec.cnt;
    END LOOP;
    RAISE WARNING 'Duplicate''larni qo''lda tozalang yoki bu migrationni ROLLBACK qiling.';
  END IF;

  -- Positions duplicate'lari
  SELECT COUNT(*) INTO dup_pos FROM (
    SELECT code FROM positions
    WHERE code IS NOT NULL
    GROUP BY code
    HAVING COUNT(*) > 1
  ) p;

  IF dup_pos > 0 THEN
    RAISE WARNING 'positions.code da % ta duplicate code topildi:', dup_pos;
    FOR dup_rec IN
      SELECT code, COUNT(*) AS cnt
      FROM positions
      WHERE code IS NOT NULL
      GROUP BY code
      HAVING COUNT(*) > 1
      ORDER BY code
    LOOP
      RAISE WARNING '  - positions.code = %: % ta yozuv', dup_rec.code, dup_rec.cnt;
    END LOOP;
    RAISE WARNING 'Duplicate''larni qo''lda tozalang yoki bu migrationni ROLLBACK qiling.';
  END IF;

  IF dup_dept > 0 OR dup_pos > 0 THEN
    RAISE EXCEPTION 'Migration to''xtatildi: avval duplicate code''larni tozalang.';
  END IF;
END $$;

-- ─── 2. departments.code UNIQUE constraint ──────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'departments'
      AND constraint_name = 'departments_code_unique'
  ) THEN
    ALTER TABLE departments
      ADD CONSTRAINT departments_code_unique UNIQUE (code);
    RAISE NOTICE 'departments_code_unique constraint qo''shildi';
  ELSE
    RAISE NOTICE 'departments_code_unique allaqachon mavjud — o''tkazib yuborildi';
  END IF;
END $$;

-- ─── 3. positions.code UNIQUE constraint ────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'positions'
      AND constraint_name = 'positions_code_unique'
  ) THEN
    ALTER TABLE positions
      ADD CONSTRAINT positions_code_unique UNIQUE (code);
    RAISE NOTICE 'positions_code_unique constraint qo''shildi';
  ELSE
    RAISE NOTICE 'positions_code_unique allaqachon mavjud — o''tkazib yuborildi';
  END IF;
END $$;

COMMIT;

-- ─── Verification (manual run) ──────────────────────────────────────────────
-- SELECT constraint_name, table_name
--   FROM information_schema.table_constraints
--  WHERE table_schema = 'public'
--    AND table_name IN ('positions', 'departments')
--    AND constraint_type = 'UNIQUE';
--
-- Kutilgan natija:
--   departments | departments_code_unique
--   positions   | positions_code_unique
