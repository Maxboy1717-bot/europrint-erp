-- Migration: employees-add-telegram-address.sql
-- Sabab: `EmployeeDialog.tsx` (frontend) `telegramChatId` va `address` maydonlarini yuboradi,
-- lekin `employees` jadvalida bu ustunlar yo'q edi. Natija: 500 "Failed query" — column does not exist.
--
-- Qo'shilayotgan ustunlar:
--   - telegram_chat_id  varchar(64)  — xodim Telegram chat id (notification yuborish uchun)
--   - address_actual    text         — xodimning haqiqiy yashash manzili
--
-- Idempotent: `IF NOT EXISTS` — qayta ishga tushirilsa xato bermaydi.

ALTER TABLE employees ADD COLUMN IF NOT EXISTS telegram_chat_id varchar(64);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_actual text;

-- Optional: search/filter uchun index (telegram_chat_id ko'pincha bot search'da)
CREATE INDEX IF NOT EXISTS idx_employees_telegram_chat_id
  ON employees (telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;
