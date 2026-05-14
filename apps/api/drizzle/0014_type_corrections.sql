-- ============================================================================
-- Migration: 0014_type_corrections
-- Maqsad: Noto'g'ri matn tiplarini to'g'ri turga o'tkazish
--
-- H-41: invoices.amount TEXT → NUMERIC(18,2)
-- H-42: attendance.check_in_time TEXT → TIME
--       attendance.check_out_time TEXT → TIME
--
-- XAVFSIZLIK: CASE WHEN validatsiya — noto'g'ri formatdagi qatorlar 0 / NULL ga o'tadi.
-- ============================================================================

-- ── invoices.amount: TEXT → NUMERIC(18,2) ────────────────────────────────────
-- Mavjud matnni raqamga aylantirish; noto'g'ri format → 0.00
ALTER TABLE "invoices"
  ALTER COLUMN "amount" TYPE NUMERIC(18, 2)
  USING CASE
    WHEN "amount" ~ '^[0-9]+(\.[0-9]+)?$' THEN "amount"::NUMERIC(18, 2)
    ELSE 0
  END;

-- ── attendance.check_in_time: TEXT → TIME ────────────────────────────────────
-- HH:MM yoki HH:MM:SS formatdagi matnni TIME ga aylantirish; noto'g'ri → NULL
ALTER TABLE "attendance"
  ALTER COLUMN "check_in_time" TYPE TIME
  USING CASE
    WHEN "check_in_time" ~ '^\d{1,2}:\d{2}(:\d{2})?$' THEN "check_in_time"::TIME
    ELSE NULL
  END;

-- ── attendance.check_out_time: TEXT → TIME ───────────────────────────────────
ALTER TABLE "attendance"
  ALTER COLUMN "check_out_time" TYPE TIME
  USING CASE
    WHEN "check_out_time" ~ '^\d{1,2}:\d{2}(:\d{2})?$' THEN "check_out_time"::TIME
    ELSE NULL
  END;
