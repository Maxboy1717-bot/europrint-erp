-- APPROVED: owner (2026-06-18)
-- seed-01-roles.sql: Tizim rollari (RBAC)
-- Idempotent: ON CONFLICT DO NOTHING
-- Ishlatish: psql $DATABASE_URL -f docs/migration/seed/seed-01-roles.sql

BEGIN;

-- ============================================================
-- 1. Rollar jadvali mavjud bo'lsa qo'shamiz (bo'lmasa o'tkazamiz)
-- ============================================================

INSERT INTO roles (name, description, created_at, updated_at)
VALUES
  -- Tizim rollari
  ('super_admin',  'Barcha huquqlar — tizim sozlamalari', NOW(), NOW()),
  ('director',     'CEO/Direktor — barcha modullar read/approve', NOW(), NOW()),
  ('admin',        'Admin — foydalanuvchilar, rollar, konfiguratsiya', NOW(), NOW()),

  -- Modul rollari
  ('hr_manager',   'HR boshqaruvchi — xodimlar, maosh, ta''til', NOW(), NOW()),
  ('accountant',   'Buxgalter — GL, kassa, byudjet, to''lovlar', NOW(), NOW()),
  ('sales_manager','Savdo boshqaruvchi — buyurtmalar, mijozlar, narx', NOW(), NOW()),
  ('pp_manager',   'Ishlab chiqarish rejachisi — rejalar, texkartalar, CRP', NOW(), NOW()),
  ('mes_operator', 'MES operator — smena, ish buyurtmasi ijrosi', NOW(), NOW()),
  ('qc_inspector', 'Sifat nazorati — tekshiruvlar, brak, qayta ishlov', NOW(), NOW()),
  ('wms_operator', 'Ombor operatori — kirim, chiqim, inventarizatsiya', NOW(), NOW()),
  ('crm_manager',  'CRM boshqaruvchi — leadlar, takliflar, shartnomalar', NOW(), NOW()),
  ('iot_operator', 'IoT/MES tablet — sensorlar, anomaliya bildirish', NOW(), NOW()),
  ('manager',      'Bo''lim boshlig''i — o''z bo''limi ma''lumotlari', NOW(), NOW()),
  ('employee',     'Oddiy xodim — o''z ma''lumotlari va vazifalari', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Tekshirish:
-- SELECT name, description FROM roles ORDER BY name;
