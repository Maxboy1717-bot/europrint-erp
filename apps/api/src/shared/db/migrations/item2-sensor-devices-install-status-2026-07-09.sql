-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — Batch 5 Item 2 (IoT CAPEX).
--   Owner-resolved: mavjud `sensor_devices` jadvalini kengaytirish (YANGI JADVAL EMAS), faqat ADD COLUMN.
--   install_status = CAPEX (kapital xarajat) o'qi: qurilma kerak / rejalashtirilgan / o'rnatilgan
--     (needed / planned / installed) — qaysi sensor apparati sotib olinishi/o'rnatilishi kerakligini kuzatish.
--   Mavjud `status` ustuni ONLINE/OFFLINE (heartbeat) o'qi uchun O'Z VAZIFASIDA qoladi — bu ALOHIDA o'q,
--     ikkisi aralashtirilmaydi.
--
-- FAQAT ADD COLUMN: destructive amal yo'q; jadvalda 0 qator (yangi CRUD to'ldiradi).
-- Default 'installed' — agar MES telemetriya qurilmani avto-registratsiya qilsa, u fizik mavjud = o'rnatilgan.
--   Yangi CAPEX yozuvlari CRUD orqali install_status ni ochiq-oydin ('needed'/'planned') o'rnatadi.
-- IF NOT EXISTS bilan idempotent.

ALTER TABLE sensor_devices ADD COLUMN IF NOT EXISTS install_status varchar(20) NOT NULL DEFAULT 'installed';

-- CAPEX o'qi enum cheklovi (idempotent DO block — ADD CONSTRAINT'da IF NOT EXISTS yo'q).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'sensor_devices'::regclass
      AND conname = 'chk_sensor_devices_install_status'
  ) THEN
    ALTER TABLE sensor_devices ADD CONSTRAINT chk_sensor_devices_install_status
      CHECK (install_status IN ('needed','planned','installed'));
  END IF;
END $$;
