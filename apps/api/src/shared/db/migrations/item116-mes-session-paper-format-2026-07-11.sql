-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 08-mes #116 (EP-MES-066) — Qog'oz formati (list A×B) + gramm + kg sessiyaga yoziladi (aniq material sarfi).
--   Заявка бумаги "Формат/Грам/Кг/Лист размер А/В" bergan qiymatlar operator tomonidan production_sessions ga
--   per-sessiya kiritiladi. production_sessions da bu ustunlar YO'Q edi (mes_papka_orders — boshqa, 0-qatorli
--   PP jadvali, tegilmaydi). Sof qo'shimcha (IF NOT EXISTS); barcha ustun nullable/default-siz → mavjud
--   sessiyalar regress emas (NULL qoladi). getSession `SELECT ps.*` orqali avtomatik qaytadi.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_sessions' AND column_name='format_a') THEN
    ALTER TABLE production_sessions ADD COLUMN format_a numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_sessions' AND column_name='format_b') THEN
    ALTER TABLE production_sessions ADD COLUMN format_b numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_sessions' AND column_name='gramm') THEN
    ALTER TABLE production_sessions ADD COLUMN gramm numeric(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_sessions' AND column_name='kg') THEN
    ALTER TABLE production_sessions ADD COLUMN kg numeric(14,3);
  END IF;
END $$;
