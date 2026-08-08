-- Migration: cashier_movements — currency + exchange_rate (KAS-1 vizyon 2.14-kassir-valyuta)
-- APPROVED: egasi 2026-07-02 vizyonni toliq qilish
-- Idempotent: ADD COLUMN IF NOT EXISTS — safe to re-run.
-- ADDITIVE ONLY — no DROP, no destructive constraint change (Q-46 / Q-39).
--
-- WHY:
--   Vizyon 2.14 — kassir so'm (UZS) va dollar (USD) valyutada ishlaydi; USD harakat
--   yozilganda ishlatilgan kurs (exchange_rate) saqlanishi kerak, shunda keyinchalik
--   UZS-ekvivalentni tekshirish/audit qilish mumkin. `amount` ustuni har doim harakat
--   VALYUTASIDAGI summa (masalan USD bo'lsa — USD summa); GL-posting kurs bilan
--   UZS-ekvivalentga aylantirib canonical `entries`ga yozadi (kod-tomon, shu paketda).
--
--   Mavjud `exchange_rates` jadvalidan foydalanilyapti (yangi jadval YARATILMAYDI — Q-35).

ALTER TABLE cashier_movements
  ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'UZS';

-- numeric(18,4) matches exchange_rates.rate scale + the Drizzle numericMoney() column type.
ALTER TABLE cashier_movements
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(18,4);

COMMENT ON COLUMN cashier_movements.currency IS
  'Harakat valyutasi (ISO 3-harf, masalan UZS/USD). amount shu valyutada. Standart UZS.';
COMMENT ON COLUMN cashier_movements.exchange_rate IS
  'currency->UZS kurs harakat yozilgan paytda (exchange_rates jadvalidan yoki egasi kiritgan qiymat). '
  'currency=UZS bo''lsa odatda NULL (kerak emas). GL-posting shu kurs bilan UZS-ekvivalent yozadi.';
