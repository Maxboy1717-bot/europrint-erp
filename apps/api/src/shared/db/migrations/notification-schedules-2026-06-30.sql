-- APPROVED: egasi 2026-06-30 "kod-tomonni boshla" (notification_schedules jadval yaratish kiritilgan)
-- Modul 18 (Bildirishnoma) — markaziy bildirishnoma-jadval matritsasi.
-- Vizyon (NTF Q3/Q79): egasi-sozlanadigan, takrorlanuvchi bildirishnomalar markazdan boshqariladi.
-- Tekshiruv (2026-06-27): bu jadval UMUMAN yo'q edi — bildirishnomalar hardcoded cron'larda tarqoq edi.
-- Iste'mol qiluvchi: notification-schedule.cron.ts (har soat due jadvallarni o'qiydi va yuboradi).
CREATE TABLE IF NOT EXISTS notification_schedules (
  id                SERIAL PRIMARY KEY,
  name              TEXT        NOT NULL,                       -- inson o'qiy oladigan nom
  notification_type TEXT        NOT NULL,                       -- masalan 'company_digest', 'weekly_report'
  target_role       TEXT,                                       -- NULL bo'lsa target_user_id ishlatiladi
  target_user_id    INTEGER,                                    -- NULL bo'lsa role bo'yicha hammaga
  title_uz          TEXT        NOT NULL,
  title_ru          TEXT,
  body_uz           TEXT        NOT NULL,
  body_ru           TEXT,
  priority          VARCHAR(10) NOT NULL DEFAULT 'normal',      -- low|normal|high|urgent
  interval_hours    INTEGER     NOT NULL DEFAULT 24,            -- takrorlanish davri (soat)
  next_run_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),         -- keyingi yuborish vaqti
  last_run_at       TIMESTAMPTZ,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_schedules_due
  ON notification_schedules (next_run_at) WHERE is_active = TRUE;

-- Boshlang'ich (default) jadval: kunlik kompaniya-holati digesti — super_admin/director rollariga.
-- next_run_at = ertaga 09:00 (mahalliy) dan boshlab har 24 soatda.
INSERT INTO notification_schedules
  (name, notification_type, target_role, title_uz, title_ru, body_uz, body_ru, priority, interval_hours, next_run_at)
SELECT
  'Kunlik kompaniya digesti', 'company_digest', 'super_admin',
  'Kunlik hisobot', 'Ежедневный отчёт',
  'Bugungi kompaniya holati: buyurtmalar, ishlab chiqarish, moliya — panelda ko''ring.',
  'Состояние компании за сегодня: заказы, производство, финансы — смотрите на панели.',
  'normal', 24, date_trunc('day', NOW()) + INTERVAL '1 day 9 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM notification_schedules WHERE notification_type = 'company_digest' AND target_role = 'super_admin'
);
