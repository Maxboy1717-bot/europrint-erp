-- APPROVED: pre-authorized by owner standing rule (feedback_threshold_values_always_crud —
-- raqamli threshold/kun qiymat HECH QACHON chatda so'ralmaydi/hardcode qilinmaydi, business_settings
-- CRUD orqali sozlanadi, sama convention as business-settings-thresholds-2026-07-11.sql). Item #62
-- (LMS sertifikat muddati tugashidan oldingi eskalatsiya 7/5/3 kun) — LmsCertExpiryWarningCron reads
-- these via getBusinessSettingNumber(); admin can retune via the existing business_settings CRUD.
-- setting_key = "<module>.<name>" (matches the actually-correct, most recent convention used
-- by hr-discipline-escalation-2026-07-13.sql + business-settings.reader.ts call sites — NOT the
-- unprefixed keys in the earlier business-settings-thresholds-2026-07-11.sql template).
INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('lms', 'lms.cert_expiry_warn_days_1', 'Sertifikat muddat-ogohlantirish — 1-bosqich (kun)', 'number', 7, 'kun', 1, 90, 'Sertifikat tugashiga shuncha kun qolganda birinchi ogohlantirish yuboriladi (#62)', true),
  ('lms', 'lms.cert_expiry_warn_days_2', 'Sertifikat muddat-ogohlantirish — 2-bosqich (kun)', 'number', 5, 'kun', 1, 90, 'Ikkinchi (kuchliroq) ogohlantirish kuni (#62)', true),
  ('lms', 'lms.cert_expiry_warn_days_3', 'Sertifikat muddat-ogohlantirish — 3-bosqich (kun)', 'number', 3, 'kun', 1, 90, 'Oxirgi ogohlantirish kuni, muddat tugashidan oldin (#62)', true)
ON CONFLICT (setting_key) DO NOTHING;
