-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 06-sd #12 (vision-1000-answers/06-sd.md #12, Q6) — "Chegirma faqat TO'LIQ 100% avans
--   faktida beriladi (95% = chegirmasiz); qisman to'lov holatida `100% avans` chegirmasi
--   qo'llanilmaydi; tekshiruv BE tomonida `quotation_service.ts`da:
--   `if (advancePercent < 100) discount5pct = false`."
--
-- New dedicated business_settings key (sd.margin_floor_pct does NOT fit — that key gates
-- the minimum allowed margin before a quote needs director sign-off, a different concept
-- from a 100%-advance payment discount). Foiz qiymati CRUD orqali sozlanadi (egasi
-- o'zgartira oladi), hech qachon hardcode qilinmaydi — apps/api/src/shared/config/
-- business-settings.reader.ts::getBusinessSettingNumber() bilan o'qiladi.
-- Default=5 vizyon matnidagi "discount5pct" o'zgaruvchi nomidan olingan (ixtiro qilinmagan).
-- Additive-only: existing business_settings rows/table untouched; ON CONFLICT DO NOTHING.

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('sd', 'full_advance_discount_pct', '100%-avans chegirmasi (%)', 'number', 5, '%', 0, 100, 'Faqat TO''LIQ 100% avans to''langanda beriladigan avtomatik chegirma; qisman (mas. 95%) avansda qo''llanilmaydi (06-sd#12)', true)
ON CONFLICT (setting_key) DO NOTHING;
