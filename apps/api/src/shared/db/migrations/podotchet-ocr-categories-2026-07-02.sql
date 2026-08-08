-- APPROVED: egasi 2026-07-02 "hamma muammolarni to'g'irlash — vizyon bo'yicha"
-- G6 PODOTCHET — chek AI-OCR + xarajat kategoriyalari.
-- Vizyon: kassir sub-modulda "chek-AI" (OMBOR-KASSIR-INTERVYU-2026-06-08.md, Finance-KASSIR
-- qatori: "podotchet/har-som-hisobli/profil-qarz/chek-AI") — AI chekni o'qiydi + summani
-- solishtiradi, YAKUNIY tasdiq ODAMDA qoladi (approveAdvanceReport o'zgarishsiz).
--
-- 1) advance_reports — chek fayli (mavjud /api/storage kaliti) + AI-OCR natijasi (additive):
--    receipt_file_path = uploads/ ichidagi storage key (masalan podotchet/171..-chek.jpg)
--    ocr_extracted     = AI ajratgan JSON ({amount,currency,note,provider,model}); AI yo'q = NULL
--    ocr_match         = AI-summa == hisobot-summa; AI summa ajrata olmasa NULL (bloklamaydi)
ALTER TABLE advance_reports ADD COLUMN IF NOT EXISTS receipt_file_path text;
ALTER TABLE advance_reports ADD COLUMN IF NOT EXISTS ocr_extracted jsonb;
ALTER TABLE advance_reports ADD COLUMN IF NOT EXISTS ocr_match boolean;

-- 2) employee_debt — xarajat kategoriyasi (additive; NULL = kategoriya tanlanmagan):
ALTER TABLE employee_debt ADD COLUMN IF NOT EXISTS category_id integer REFERENCES finance_categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_employee_debt_category_id ON employee_debt (category_id) WHERE category_id IS NOT NULL;

-- 3) 4 ta xarajat kategoriyasi seed (idempotent — finance_categories_code_unique bo'yicha).
-- EGASI-DATA: account_id (kategoriya -> BHMS hisob raqami mapping) egasi belgilaydi — NULL
-- qoladi (sozlanadigan default). GL-post hozircha 9100 orqali (cashier-hub GL mapping ham
-- EGASI-DATA) — kategoriya faqat datada ajratiladi.
INSERT INTO finance_categories (code, name, name_ru, category_type, account_id, is_system, is_active, sort_order)
VALUES
  ('ODDIY_XARID',  'Oddiy xarid',  'Обычная покупка', 'expense', NULL, true, true, 10),
  ('OQISH',        'O''qish',      'Обучение',        'expense', NULL, true, true, 20),
  ('SAFAR',        'Safar',        'Командировка',    'expense', NULL, true, true, 30),
  ('ONLAYN_XARID', 'Onlayn xarid', 'Онлайн покупка',  'expense', NULL, true, true, 40)
ON CONFLICT (code) DO NOTHING;
