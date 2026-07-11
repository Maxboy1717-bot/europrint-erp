-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================================
-- 08-mes#33 — Akademiya/o'quv ishi LMS bilan sinxron; OEE'dan chiqariladi
-- ============================================================================
-- WHAT (additive, idempotent, Q-46 non-regressive):
--   1. production_sessions.is_training  boolean NOT NULL DEFAULT false
--        OEE-exclusion flag. Default false -> har bir mavjud sessiya (8 jonli qator)
--        OEE'da avvalgidek qoladi; faqat aniq "akademiya/o'quv" deb belgilangan
--        sessiyalar OEE shift-kaskadidan chiqib ketadi.
--   2. production_sessions.lms_enrollment_id  integer NULL
--        LMS-sync bog'lami — shu o'quv sessiyasi qaysi LMS ro'yxatga olishga
--        (lms_enrollments.id) mos kelishini saqlaydi. Nullable, runtime-DATA
--        (egasi master-data'si kerak emas).
--   3. CREATE OR REPLACE VIEW mes_production_sessions — ikkita yangi ustunni mavjud
--        37-ustunli proyeksiya OXIRIGA additiv qo'shadi (CREATE OR REPLACE VIEW
--        ruxsat beradigan yagona shakl: birinchi N ustun bayt-ba-bayt bir xil).
--        get-oee.handler shift-kaskadi shu VIEW'ni o'qiydi va endi
--        WHERE is_training = false bilan filtrlaydi. Naqsh = T23-A1.
--
-- KANONIK JADVAL: production_sessions (relkind='r'); mes_production_sessions =
--   uning ustidagi VIEW (relkind='v'). Dublikat jadval YARATILMAYDI — jonli
--   tekshirildi 2026-07-11: is_training / lms_enrollment_id production_sessions'da yo'q;
--   norma_version faqat BAZA jadvalda (VIEW'da emas), shuning uchun 37-ustunli
--   proyeksiya o'zgarmaydi.
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE VIEW qayta ishga tushsa bo'ladi.
-- ============================================================================

ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS is_training boolean NOT NULL DEFAULT false;
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS lms_enrollment_id integer;

CREATE OR REPLACE VIEW mes_production_sessions AS
SELECT
  id,
  session_number,
  production_order_id,
  equipment_id,
  device_id,
  worker_id,
  status,
  target_quantity,
  actual_quantity,
  defect_quantity,
  started_at,
  ended_at,
  last_signal_at,
  running_time_seconds,
  stopped_time_seconds,
  worker_notes,
  availability,
  performance,
  quality,
  oee,
  created_at,
  updated_at,
  deleted_at,
  order_id,
  operator_id,
  machine_id,
  shift_id,
  session_date,
  produced_qty,
  defect_qty,
  start_time,
  end_time,
  setup_seconds,
  main_seconds,
  teardown_seconds,
  current_stage,
  stage_started_at,
  -- 08-mes#33 additive columns:
  is_training,
  lms_enrollment_id
FROM production_sessions;

-- VERIFY (run after apply):
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='mes_production_sessions' AND column_name IN ('is_training','lms_enrollment_id');
--   -- expect 2 rows.
