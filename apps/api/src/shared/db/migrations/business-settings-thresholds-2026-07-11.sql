-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Egasi qoidasi (2026-07-11): raqamli threshold/foiz/kun/summa qiymatlar HECH QACHON
-- chatda so'ralmaydi/hardcode qilinmaydi — business_settings CRUD orqali sozlanadi.
-- 06-sd#8/#157 bekor-jarima, 06-sd#67 margin floor, 07-pp#18/#102 kichik-tiraj chegarasi.
INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('sd', 'cancellation_penalty_early_pct', 'Bekor qilish jarimasi — erta bosqich (%)', 'number', 30, '%', 0, 100, 'Material olinmagan bosqichda buyurtma bekor qilinsa jarima foizi (06-sd#8/#157)', true),
  ('sd', 'cancellation_penalty_mid_pct', 'Bekor qilish jarimasi — o''rta bosqich (%)', 'number', 70, '%', 0, 100, 'Material olingan, ishlab chiqarish boshlanmagan bosqichda jarima foizi (06-sd#8/#157)', true),
  ('sd', 'cancellation_penalty_production_pct', 'Bekor qilish jarimasi — ishlab chiqarish boshlangan (%)', 'number', 100, '%', 0, 100, 'Ishlab chiqarish boshlangandan keyin bekor qilinsa jarima foizi (06-sd#8/#157)', true),
  ('sd', 'margin_floor_pct', 'Minimal marja chegarasi (%)', 'number', 15, '%', 0, 100, 'Undan past narx direktor tasdig''isiz o''tkazilmaydi (06-sd#67)', true),
  ('pp', 'small_order_threshold_units', 'Kichik-tiraj chegarasi (dona)', 'number', 100, 'dona', 0, NULL, 'Undan kam buyurtam alohida tasdiq/ogohlantirish talab qiladi (07-pp#18/#102)', true)
ON CONFLICT (setting_key) DO NOTHING;
