-- APPROVED: egasi-direktiva "vizyon bo'yicha to'liq bajar" 2026-06-26 (T23-B1 ijro)
-- T23-B1 — config-jadval AUDIT ustunlari (created_by / updated_by).
-- Maqsad: konfiguratsiya o'zgarishini KIM kiritdi/o'zgartirdi auditi
--   (income_split_config = tushum-fond foizlari; okr_objectives + okr_key_results = OKR).
-- FAQAT ADDITIV: ADD COLUMN IF NOT EXISTS. DESTRUCTIVE amal YO'Q (DROP/TYPE-change/VIEW yo'q).
-- Idempotent — qayta qo'llasa xavfsiz. NULLABLE (mavjud satrlar buzilmaydi, FK qo'yilmaydi —
--   users(id) ga soft-link, eski/seed satrlar uchun NULL = "tizim/egasi seed").

-- ---------------------------------------------------------------------------
-- income_split_config — tushum 4-fond foiz konfiguratsiyasi (kim o'zgartirdi)
-- ---------------------------------------------------------------------------
ALTER TABLE income_split_config ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE income_split_config ADD COLUMN IF NOT EXISTS updated_by INTEGER;

-- ---------------------------------------------------------------------------
-- okr_objectives — OKR maqsadlari (kim yaratdi / oxirgi o'zgartirgan)
-- ---------------------------------------------------------------------------
ALTER TABLE okr_objectives ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE okr_objectives ADD COLUMN IF NOT EXISTS updated_by INTEGER;

-- ---------------------------------------------------------------------------
-- okr_key_results — OKR kalit natijalari (kim yaratdi / oxirgi o'zgartirgan)
-- ---------------------------------------------------------------------------
ALTER TABLE okr_key_results ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE okr_key_results ADD COLUMN IF NOT EXISTS updated_by INTEGER;
