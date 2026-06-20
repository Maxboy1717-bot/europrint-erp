-- =============================================================================
-- SEED-06: HR DEMO DATA (attendance, kpi, payroll, discipline)
-- Maqsad: Dashboard vizyon ko'rsatish uchun NAMUNA/DEMO ma'lumotlar
-- Employees: id 2..11 (ep-001..010), user_id 34..43
-- Sana konteksti: 2026-06-20 (joriy hafta: 2026-06-14 Dushanba .. 2026-06-20 Shanba)
-- Idempotent: INSERT ... ON CONFLICT DO NOTHING yoki WHERE NOT EXISTS
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. RAZRYAD KOEFFITSIYENTLARI (org_functions razryad bog'lanishi)
--    Namuna: rahbarlar razryad 5-6, oddiy xodimlar 2-4
-- =============================================================================
-- Rahbarlar (id 6..8) => razryad 6 (id=10)
UPDATE org_functions SET razryad_level_id = 10 WHERE id IN (6, 7, 8) AND razryad_level_id IS NULL;
-- Bo'lim boshliqlari (id 11..25) => razryad 5 (id=9)
UPDATE org_functions SET razryad_level_id = 9  WHERE id IN (11,12,13,14,15,16,17,18,19,20,22,23,24,25) AND razryad_level_id IS NULL;

-- Base salary set for demo (employees 2..11)
-- Razryad koeffitsiyentlari: R1=1.0, R2=1.2, R3=1.5, R4=1.8, R5=2.2, R6=2.8
-- Bazaviy minimal: 1_500_000 UZS
-- id 2 = Egasi => R6 koeff=2.8 => 4_200_000
-- id 3 = Bosh Direktor => R6 => 4_200_000
-- id 4 = Ma'muriy Direktor => R6 => 4_200_000
-- id 5,6,7 = HR Boshlig'i => R5 => 3_300_000
-- id 8,9 = O'qitish Boshlig'i => R4 => 2_700_000
-- id 10,11 = Marketing Boshlig'i => R4 => 2_700_000

UPDATE employees SET base_salary = 4200000 WHERE id IN (2, 3, 4) AND base_salary IS NULL;
UPDATE employees SET base_salary = 3300000 WHERE id IN (5, 6, 7) AND base_salary IS NULL;
UPDATE employees SET base_salary = 2700000 WHERE id IN (8, 9, 10, 11) AND base_salary IS NULL;

-- =============================================================================
-- 2. ATTENDANCE_RECORDS — oxirgi 7 kun (2026-06-14 .. 2026-06-20)
--    event_type: 'check_in' | 'check_out'
--    Har xodim uchun 7 kun × 2 event = 140 yozuv (10 emp × 14)
--    source: 'demo', location: 'Main Gate'
-- =============================================================================

-- EMPLOYEE 2 (user_id=34): Bobur Karimov — devom etuvchi
INSERT INTO attendance_records (employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
SELECT * FROM (VALUES
  (2, 34, 'check_in',  '2026-06-14 08:02:00'::timestamp, '2026-06-14 08:02:00'::timestamp, NULL,                      '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_out', '2026-06-14 17:58:00'::timestamp, '2026-06-14 08:02:00'::timestamp, '2026-06-14 17:58:00'::timestamp, '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_in',  '2026-06-15 07:55:00'::timestamp, '2026-06-15 07:55:00'::timestamp, NULL,                      '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_out', '2026-06-15 18:05:00'::timestamp, '2026-06-15 07:55:00'::timestamp, '2026-06-15 18:05:00'::timestamp, '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_in',  '2026-06-16 08:10:00'::timestamp, '2026-06-16 08:10:00'::timestamp, NULL,                      '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_out', '2026-06-16 17:50:00'::timestamp, '2026-06-16 08:10:00'::timestamp, '2026-06-16 17:50:00'::timestamp, '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_in',  '2026-06-17 08:00:00'::timestamp, '2026-06-17 08:00:00'::timestamp, NULL,                      '2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_out', '2026-06-17 18:00:00'::timestamp, '2026-06-17 08:00:00'::timestamp, '2026-06-17 18:00:00'::timestamp, '2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_in',  '2026-06-18 08:05:00'::timestamp, '2026-06-18 08:05:00'::timestamp, NULL,                      '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_out', '2026-06-18 17:55:00'::timestamp, '2026-06-18 08:05:00'::timestamp, '2026-06-18 17:55:00'::timestamp, '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_in',  '2026-06-19 08:15:00'::timestamp, '2026-06-19 08:15:00'::timestamp, NULL,                      '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_out', '2026-06-19 17:45:00'::timestamp, '2026-06-19 08:15:00'::timestamp, '2026-06-19 17:45:00'::timestamp, '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (2, 34, 'check_in',  '2026-06-20 08:00:00'::timestamp, '2026-06-20 08:00:00'::timestamp, NULL,                      '2026-06-20'::date, 'present', 'demo', 'Main Gate', NOW())
) AS v(employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_records ar WHERE ar.employee_id = 2 AND ar.date = '2026-06-14'::date AND ar.source = 'demo'
);

-- EMPLOYEE 3 (user_id=35): Sherzod Aliyev — bir kun kechikkan
INSERT INTO attendance_records (employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
SELECT * FROM (VALUES
  (3, 35, 'check_in',  '2026-06-14 08:30:00'::timestamp, '2026-06-14 08:30:00'::timestamp, NULL,                            '2026-06-14'::date, 'late',    'demo', 'Main Gate', NOW()),
  (3, 35, 'check_out', '2026-06-14 18:00:00'::timestamp, '2026-06-14 08:30:00'::timestamp, '2026-06-14 18:00:00'::timestamp,'2026-06-14'::date, 'late',    'demo', 'Main Gate', NOW()),
  (3, 35, 'check_in',  '2026-06-15 08:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, NULL,                            '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (3, 35, 'check_out', '2026-06-15 17:58:00'::timestamp, '2026-06-15 08:00:00'::timestamp, '2026-06-15 17:58:00'::timestamp,'2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (3, 35, 'check_in',  '2026-06-16 08:05:00'::timestamp, '2026-06-16 08:05:00'::timestamp, NULL,                            '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (3, 35, 'check_out', '2026-06-16 18:02:00'::timestamp, '2026-06-16 08:05:00'::timestamp, '2026-06-16 18:02:00'::timestamp,'2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (3, 35, 'check_in',  '2026-06-17 09:15:00'::timestamp, '2026-06-17 09:15:00'::timestamp, NULL,                            '2026-06-17'::date, 'late',    'demo', 'Main Gate', NOW()),
  (3, 35, 'check_out', '2026-06-17 18:00:00'::timestamp, '2026-06-17 09:15:00'::timestamp, '2026-06-17 18:00:00'::timestamp,'2026-06-17'::date, 'late',    'demo', 'Main Gate', NOW()),
  (3, 35, 'check_in',  '2026-06-18 08:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, NULL,                            '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (3, 35, 'check_out', '2026-06-18 17:55:00'::timestamp, '2026-06-18 08:00:00'::timestamp, '2026-06-18 17:55:00'::timestamp,'2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (3, 35, 'check_in',  '2026-06-19 08:10:00'::timestamp, '2026-06-19 08:10:00'::timestamp, NULL,                            '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (3, 35, 'check_out', '2026-06-19 18:00:00'::timestamp, '2026-06-19 08:10:00'::timestamp, '2026-06-19 18:00:00'::timestamp,'2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (3, 35, 'check_in',  '2026-06-20 08:03:00'::timestamp, '2026-06-20 08:03:00'::timestamp, NULL,                            '2026-06-20'::date, 'present', 'demo', 'Main Gate', NOW())
) AS v(employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_records ar WHERE ar.employee_id = 3 AND ar.date = '2026-06-14'::date AND ar.source = 'demo'
);

-- EMPLOYEE 4 (user_id=36): Dilshod Toshev — bir kun yo'q (ta'til)
INSERT INTO attendance_records (employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
SELECT * FROM (VALUES
  (4, 36, 'check_in',  '2026-06-14 07:58:00'::timestamp, '2026-06-14 07:58:00'::timestamp, NULL,                            '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (4, 36, 'check_out', '2026-06-14 18:00:00'::timestamp, '2026-06-14 07:58:00'::timestamp, '2026-06-14 18:00:00'::timestamp,'2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (4, 36, 'check_in',  '2026-06-15 08:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, NULL,                            '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (4, 36, 'check_out', '2026-06-15 17:50:00'::timestamp, '2026-06-15 08:00:00'::timestamp, '2026-06-15 17:50:00'::timestamp,'2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  -- 2026-06-16 yo'q (ta'til)
  (4, 36, 'check_in',  '2026-06-17 08:05:00'::timestamp, '2026-06-17 08:05:00'::timestamp, NULL,                            '2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (4, 36, 'check_out', '2026-06-17 18:00:00'::timestamp, '2026-06-17 08:05:00'::timestamp, '2026-06-17 18:00:00'::timestamp,'2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (4, 36, 'check_in',  '2026-06-18 08:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, NULL,                            '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (4, 36, 'check_out', '2026-06-18 17:55:00'::timestamp, '2026-06-18 08:00:00'::timestamp, '2026-06-18 17:55:00'::timestamp,'2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (4, 36, 'check_in',  '2026-06-19 08:10:00'::timestamp, '2026-06-19 08:10:00'::timestamp, NULL,                            '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (4, 36, 'check_out', '2026-06-19 18:05:00'::timestamp, '2026-06-19 08:10:00'::timestamp, '2026-06-19 18:05:00'::timestamp,'2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (4, 36, 'check_in',  '2026-06-20 08:02:00'::timestamp, '2026-06-20 08:02:00'::timestamp, NULL,                            '2026-06-20'::date, 'present', 'demo', 'Main Gate', NOW())
) AS v(employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_records ar WHERE ar.employee_id = 4 AND ar.date = '2026-06-14'::date AND ar.source = 'demo'
);

-- EMPLOYEE 5 (user_id=37): Madina Yusupova
INSERT INTO attendance_records (employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
SELECT * FROM (VALUES
  (5, 37, 'check_in',  '2026-06-14 08:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, NULL,                            '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_out', '2026-06-14 17:52:00'::timestamp, '2026-06-14 08:00:00'::timestamp, '2026-06-14 17:52:00'::timestamp,'2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_in',  '2026-06-15 08:05:00'::timestamp, '2026-06-15 08:05:00'::timestamp, NULL,                            '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_out', '2026-06-15 18:00:00'::timestamp, '2026-06-15 08:05:00'::timestamp, '2026-06-15 18:00:00'::timestamp,'2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_in',  '2026-06-16 08:00:00'::timestamp, '2026-06-16 08:00:00'::timestamp, NULL,                            '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_out', '2026-06-16 17:58:00'::timestamp, '2026-06-16 08:00:00'::timestamp, '2026-06-16 17:58:00'::timestamp,'2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_in',  '2026-06-17 08:10:00'::timestamp, '2026-06-17 08:10:00'::timestamp, NULL,                            '2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_out', '2026-06-17 18:00:00'::timestamp, '2026-06-17 08:10:00'::timestamp, '2026-06-17 18:00:00'::timestamp,'2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_in',  '2026-06-18 08:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, NULL,                            '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_out', '2026-06-18 17:50:00'::timestamp, '2026-06-18 08:00:00'::timestamp, '2026-06-18 17:50:00'::timestamp,'2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_in',  '2026-06-19 08:05:00'::timestamp, '2026-06-19 08:05:00'::timestamp, NULL,                            '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_out', '2026-06-19 18:00:00'::timestamp, '2026-06-19 08:05:00'::timestamp, '2026-06-19 18:00:00'::timestamp,'2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (5, 37, 'check_in',  '2026-06-20 08:00:00'::timestamp, '2026-06-20 08:00:00'::timestamp, NULL,                            '2026-06-20'::date, 'present', 'demo', 'Main Gate', NOW())
) AS v(employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_records ar WHERE ar.employee_id = 5 AND ar.date = '2026-06-14'::date AND ar.source = 'demo'
);

-- EMPLOYEE 6 (user_id=38): Nilufar Ergasheva — bir kun kechikkan
INSERT INTO attendance_records (employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
SELECT * FROM (VALUES
  (6, 38, 'check_in',  '2026-06-14 08:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, NULL,                            '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (6, 38, 'check_out', '2026-06-14 18:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, '2026-06-14 18:00:00'::timestamp,'2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (6, 38, 'check_in',  '2026-06-15 08:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, NULL,                            '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (6, 38, 'check_out', '2026-06-15 18:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, '2026-06-15 18:00:00'::timestamp,'2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (6, 38, 'check_in',  '2026-06-16 08:45:00'::timestamp, '2026-06-16 08:45:00'::timestamp, NULL,                            '2026-06-16'::date, 'late',    'demo', 'Main Gate', NOW()),
  (6, 38, 'check_out', '2026-06-16 18:00:00'::timestamp, '2026-06-16 08:45:00'::timestamp, '2026-06-16 18:00:00'::timestamp,'2026-06-16'::date, 'late',    'demo', 'Main Gate', NOW()),
  (6, 38, 'check_in',  '2026-06-17 08:05:00'::timestamp, '2026-06-17 08:05:00'::timestamp, NULL,                            '2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (6, 38, 'check_out', '2026-06-17 18:00:00'::timestamp, '2026-06-17 08:05:00'::timestamp, '2026-06-17 18:00:00'::timestamp,'2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (6, 38, 'check_in',  '2026-06-18 08:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, NULL,                            '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (6, 38, 'check_out', '2026-06-18 18:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, '2026-06-18 18:00:00'::timestamp,'2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (6, 38, 'check_in',  '2026-06-19 08:05:00'::timestamp, '2026-06-19 08:05:00'::timestamp, NULL,                            '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (6, 38, 'check_out', '2026-06-19 17:55:00'::timestamp, '2026-06-19 08:05:00'::timestamp, '2026-06-19 17:55:00'::timestamp,'2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (6, 38, 'check_in',  '2026-06-20 08:00:00'::timestamp, '2026-06-20 08:00:00'::timestamp, NULL,                            '2026-06-20'::date, 'present', 'demo', 'Main Gate', NOW())
) AS v(employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_records ar WHERE ar.employee_id = 6 AND ar.date = '2026-06-14'::date AND ar.source = 'demo'
);

-- EMPLOYEE 7 (user_id=39): Aziza Rahimova
INSERT INTO attendance_records (employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
SELECT * FROM (VALUES
  (7, 39, 'check_in',  '2026-06-14 08:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, NULL,                            '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_out', '2026-06-14 18:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, '2026-06-14 18:00:00'::timestamp,'2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_in',  '2026-06-15 08:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, NULL,                            '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_out', '2026-06-15 18:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, '2026-06-15 18:00:00'::timestamp,'2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_in',  '2026-06-16 08:00:00'::timestamp, '2026-06-16 08:00:00'::timestamp, NULL,                            '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_out', '2026-06-16 17:45:00'::timestamp, '2026-06-16 08:00:00'::timestamp, '2026-06-16 17:45:00'::timestamp,'2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_in',  '2026-06-17 08:00:00'::timestamp, '2026-06-17 08:00:00'::timestamp, NULL,                            '2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_out', '2026-06-17 18:00:00'::timestamp, '2026-06-17 08:00:00'::timestamp, '2026-06-17 18:00:00'::timestamp,'2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_in',  '2026-06-18 08:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, NULL,                            '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_out', '2026-06-18 18:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, '2026-06-18 18:00:00'::timestamp,'2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_in',  '2026-06-19 08:10:00'::timestamp, '2026-06-19 08:10:00'::timestamp, NULL,                            '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_out', '2026-06-19 18:00:00'::timestamp, '2026-06-19 08:10:00'::timestamp, '2026-06-19 18:00:00'::timestamp,'2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (7, 39, 'check_in',  '2026-06-20 08:00:00'::timestamp, '2026-06-20 08:00:00'::timestamp, NULL,                            '2026-06-20'::date, 'present', 'demo', 'Main Gate', NOW())
) AS v(employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_records ar WHERE ar.employee_id = 7 AND ar.date = '2026-06-14'::date AND ar.source = 'demo'
);

-- EMPLOYEE 8 (user_id=40): Otabek Sodiqov — bir kun yo'q
INSERT INTO attendance_records (employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
SELECT * FROM (VALUES
  (8, 40, 'check_in',  '2026-06-14 08:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, NULL,                            '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (8, 40, 'check_out', '2026-06-14 18:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, '2026-06-14 18:00:00'::timestamp,'2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (8, 40, 'check_in',  '2026-06-15 08:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, NULL,                            '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (8, 40, 'check_out', '2026-06-15 18:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, '2026-06-15 18:00:00'::timestamp,'2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (8, 40, 'check_in',  '2026-06-16 08:00:00'::timestamp, '2026-06-16 08:00:00'::timestamp, NULL,                            '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (8, 40, 'check_out', '2026-06-16 18:00:00'::timestamp, '2026-06-16 08:00:00'::timestamp, '2026-06-16 18:00:00'::timestamp,'2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  -- 2026-06-17 yo'q (kasal)
  (8, 40, 'check_in',  '2026-06-18 08:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, NULL,                            '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (8, 40, 'check_out', '2026-06-18 18:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, '2026-06-18 18:00:00'::timestamp,'2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (8, 40, 'check_in',  '2026-06-19 08:00:00'::timestamp, '2026-06-19 08:00:00'::timestamp, NULL,                            '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (8, 40, 'check_out', '2026-06-19 18:00:00'::timestamp, '2026-06-19 08:00:00'::timestamp, '2026-06-19 18:00:00'::timestamp,'2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (8, 40, 'check_in',  '2026-06-20 08:00:00'::timestamp, '2026-06-20 08:00:00'::timestamp, NULL,                            '2026-06-20'::date, 'present', 'demo', 'Main Gate', NOW())
) AS v(employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_records ar WHERE ar.employee_id = 8 AND ar.date = '2026-06-14'::date AND ar.source = 'demo'
);

-- EMPLOYEE 9 (user_id=41): Munisa Saidova
INSERT INTO attendance_records (employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
SELECT * FROM (VALUES
  (9, 41, 'check_in',  '2026-06-14 08:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, NULL,                            '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (9, 41, 'check_out', '2026-06-14 18:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, '2026-06-14 18:00:00'::timestamp,'2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (9, 41, 'check_in',  '2026-06-15 08:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, NULL,                            '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (9, 41, 'check_out', '2026-06-15 18:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, '2026-06-15 18:00:00'::timestamp,'2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (9, 41, 'check_in',  '2026-06-16 08:00:00'::timestamp, '2026-06-16 08:00:00'::timestamp, NULL,                            '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (9, 41, 'check_out', '2026-06-16 18:00:00'::timestamp, '2026-06-16 08:00:00'::timestamp, '2026-06-16 18:00:00'::timestamp,'2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (9, 41, 'check_in',  '2026-06-17 08:20:00'::timestamp, '2026-06-17 08:20:00'::timestamp, NULL,                            '2026-06-17'::date, 'late',    'demo', 'Main Gate', NOW()),
  (9, 41, 'check_out', '2026-06-17 18:00:00'::timestamp, '2026-06-17 08:20:00'::timestamp, '2026-06-17 18:00:00'::timestamp,'2026-06-17'::date, 'late',    'demo', 'Main Gate', NOW()),
  (9, 41, 'check_in',  '2026-06-18 08:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, NULL,                            '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (9, 41, 'check_out', '2026-06-18 18:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, '2026-06-18 18:00:00'::timestamp,'2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (9, 41, 'check_in',  '2026-06-19 08:00:00'::timestamp, '2026-06-19 08:00:00'::timestamp, NULL,                            '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (9, 41, 'check_out', '2026-06-19 18:00:00'::timestamp, '2026-06-19 08:00:00'::timestamp, '2026-06-19 18:00:00'::timestamp,'2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (9, 41, 'check_in',  '2026-06-20 08:00:00'::timestamp, '2026-06-20 08:00:00'::timestamp, NULL,                            '2026-06-20'::date, 'present', 'demo', 'Main Gate', NOW())
) AS v(employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_records ar WHERE ar.employee_id = 9 AND ar.date = '2026-06-14'::date AND ar.source = 'demo'
);

-- EMPLOYEE 10 (user_id=42): Jasur Nomonov
INSERT INTO attendance_records (employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
SELECT * FROM (VALUES
  (10, 42, 'check_in',  '2026-06-14 08:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, NULL,                             '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_out', '2026-06-14 18:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, '2026-06-14 18:00:00'::timestamp, '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_in',  '2026-06-15 08:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, NULL,                             '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_out', '2026-06-15 18:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, '2026-06-15 18:00:00'::timestamp, '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_in',  '2026-06-16 08:00:00'::timestamp, '2026-06-16 08:00:00'::timestamp, NULL,                             '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_out', '2026-06-16 18:00:00'::timestamp, '2026-06-16 08:00:00'::timestamp, '2026-06-16 18:00:00'::timestamp, '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_in',  '2026-06-17 08:00:00'::timestamp, '2026-06-17 08:00:00'::timestamp, NULL,                             '2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_out', '2026-06-17 18:00:00'::timestamp, '2026-06-17 08:00:00'::timestamp, '2026-06-17 18:00:00'::timestamp, '2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_in',  '2026-06-18 08:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, NULL,                             '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_out', '2026-06-18 18:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, '2026-06-18 18:00:00'::timestamp, '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_in',  '2026-06-19 08:00:00'::timestamp, '2026-06-19 08:00:00'::timestamp, NULL,                             '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_out', '2026-06-19 18:00:00'::timestamp, '2026-06-19 08:00:00'::timestamp, '2026-06-19 18:00:00'::timestamp, '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (10, 42, 'check_in',  '2026-06-20 08:00:00'::timestamp, '2026-06-20 08:00:00'::timestamp, NULL,                             '2026-06-20'::date, 'present', 'demo', 'Main Gate', NOW())
) AS v(employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_records ar WHERE ar.employee_id = 10 AND ar.date = '2026-06-14'::date AND ar.source = 'demo'
);

-- EMPLOYEE 11 (user_id=43): Kamola Ismoilova
INSERT INTO attendance_records (employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
SELECT * FROM (VALUES
  (11, 43, 'check_in',  '2026-06-14 08:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, NULL,                             '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_out', '2026-06-14 18:00:00'::timestamp, '2026-06-14 08:00:00'::timestamp, '2026-06-14 18:00:00'::timestamp, '2026-06-14'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_in',  '2026-06-15 08:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, NULL,                             '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_out', '2026-06-15 18:00:00'::timestamp, '2026-06-15 08:00:00'::timestamp, '2026-06-15 18:00:00'::timestamp, '2026-06-15'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_in',  '2026-06-16 08:00:00'::timestamp, '2026-06-16 08:00:00'::timestamp, NULL,                             '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_out', '2026-06-16 18:00:00'::timestamp, '2026-06-16 08:00:00'::timestamp, '2026-06-16 18:00:00'::timestamp, '2026-06-16'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_in',  '2026-06-17 08:05:00'::timestamp, '2026-06-17 08:05:00'::timestamp, NULL,                             '2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_out', '2026-06-17 18:00:00'::timestamp, '2026-06-17 08:05:00'::timestamp, '2026-06-17 18:00:00'::timestamp, '2026-06-17'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_in',  '2026-06-18 08:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, NULL,                             '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_out', '2026-06-18 18:00:00'::timestamp, '2026-06-18 08:00:00'::timestamp, '2026-06-18 18:00:00'::timestamp, '2026-06-18'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_in',  '2026-06-19 08:00:00'::timestamp, '2026-06-19 08:00:00'::timestamp, NULL,                             '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_out', '2026-06-19 18:00:00'::timestamp, '2026-06-19 08:00:00'::timestamp, '2026-06-19 18:00:00'::timestamp, '2026-06-19'::date, 'present', 'demo', 'Main Gate', NOW()),
  (11, 43, 'check_in',  '2026-06-20 08:00:00'::timestamp, '2026-06-20 08:00:00'::timestamp, NULL,                             '2026-06-20'::date, 'present', 'demo', 'Main Gate', NOW())
) AS v(employee_id, user_id, event_type, event_at, check_in, check_out, date, status, source, location, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_records ar WHERE ar.employee_id = 11 AND ar.date = '2026-06-14'::date AND ar.source = 'demo'
);

-- =============================================================================
-- 3. KPI_DEFINITIONS — asosiy HR KPI ta'riflari
-- =============================================================================
INSERT INTO kpi_definitions (kpi_code, kpi_name, kpi_name_ru, category, calculation_method, target_value, warning_threshold, critical_threshold, threshold_direction, unit, frequency, block_on_violation, alert_on_warning, alert_on_critical, notify_roles, notify_user_ids, is_active, created_at)
SELECT kpi_code, kpi_name, kpi_name_ru, category, calculation_method, target_value, warning_threshold, critical_threshold, threshold_direction, unit, frequency, block_on_violation, alert_on_warning, alert_on_critical, notify_roles, notify_user_ids, is_active, created_at
FROM (VALUES
  ('HR_ATT_RATE',    'Davomat foizi',          'Процент явки',                'attendance',   'manual', 95.0, 90.0, 80.0, 'asc',  '%',       'daily',   false, true,  true,  '["hr"]'::jsonb, '[]'::jsonb, true, NOW()),
  ('HR_LATE_COUNT',  'Kechikishlar soni',       'Количество опозданий',        'attendance',   'manual',  2.0,  3.0,  5.0, 'desc', 'ta',      'monthly', false, true,  true,  '["hr"]'::jsonb, '[]'::jsonb, true, NOW()),
  ('HR_TASK_DONE',   'Vazifa bajarilishi',      'Выполнение задач',            'performance',  'manual', 85.0, 75.0, 60.0, 'asc',  '%',       'weekly',  false, true,  true,  '["hr","manager"]'::jsonb, '[]'::jsonb, true, NOW()),
  ('HR_QUALITY_SCR', 'Sifat ball',              'Оценка качества',             'quality',      'manual', 80.0, 70.0, 60.0, 'asc',  'ball',    'weekly',  false, true,  false, '["hr"]'::jsonb, '[]'::jsonb, true, NOW()),
  ('HR_DISC_SCR',    'Intizom ball',            'Дисциплинарный балл',         'discipline',   'manual', 90.0, 80.0, 70.0, 'asc',  'ball',    'monthly', false, true,  true,  '["hr","manager"]'::jsonb, '[]'::jsonb, true, NOW()),
  ('HR_OVR_SCORE',   'Umumiy KPI bali',        'Общий KPI балл',              'overall',      'manual', 82.0, 72.0, 60.0, 'asc',  'ball',    'weekly',  false, true,  true,  '["hr","director"]'::jsonb, '[]'::jsonb, true, NOW())
) AS v(kpi_code, kpi_name, kpi_name_ru, category, calculation_method, target_value, warning_threshold, critical_threshold, threshold_direction, unit, frequency, block_on_violation, alert_on_warning, alert_on_critical, notify_roles, notify_user_ids, is_active, created_at)
WHERE NOT EXISTS (SELECT 1 FROM kpi_definitions kd WHERE kd.kpi_code = v.kpi_code);

-- =============================================================================
-- 4. EMPLOYEE_DAILY_KPI — haftalik KPI (2026-06-14 .. 2026-06-20)
--    10 xodim × 7 kun = 70 yozuv
--    Namuna ballari: yuqori (85-95), o'rta (70-85), pastroq (60-75)
-- =============================================================================

-- Demo: employee 2 (Bobur) — yuqori performer
INSERT INTO employee_daily_kpi (employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
SELECT v.* FROM (VALUES
  (2, 34, '2026-06-14', 19, 100.0, 92.0, 88.0, 90.0, 85.0, 95.0, 91.7, 5.0, 91.7, false, 'DEMO - namuna data', '2026-06-14'::date, NOW()),
  (2, 34, '2026-06-15', 19, 100.0, 90.0, 90.0, 88.0, 87.0, 95.0, 91.7, 5.0, 91.7, false, 'DEMO - namuna data', '2026-06-15'::date, NOW()),
  (2, 34, '2026-06-16', 19, 100.0, 88.0, 92.0, 91.0, 86.0, 95.0, 92.0, 5.0, 92.0, false, 'DEMO - namuna data', '2026-06-16'::date, NOW()),
  (2, 34, '2026-06-17', 19, 100.0, 93.0, 89.0, 92.0, 88.0, 95.0, 92.8, 5.0, 92.8, false, 'DEMO - namuna data', '2026-06-17'::date, NOW()),
  (2, 34, '2026-06-18', 19, 100.0, 91.0, 90.0, 90.0, 87.0, 95.0, 92.2, 5.0, 92.2, false, 'DEMO - namuna data', '2026-06-18'::date, NOW()),
  (2, 34, '2026-06-19', 19, 100.0, 90.0, 88.0, 89.0, 86.0, 95.0, 91.3, 5.0, 91.3, false, 'DEMO - namuna data', '2026-06-19'::date, NOW()),
  (2, 34, '2026-06-20', 19, 100.0, 89.0, 91.0, 90.0, 87.0, 95.0, 92.0, 5.0, 92.0, false, 'DEMO - namuna data', '2026-06-20'::date, NOW())
) AS v(employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM employee_daily_kpi k WHERE k.employee_id = 2 AND k.kpi_date = v.kpi_date);

-- employee 3 (Sherzod) — o'rtacha (2 kun kechikkan)
INSERT INTO employee_daily_kpi (employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
SELECT v.* FROM (VALUES
  (3, 35, '2026-06-14', 20, 70.0, 80.0, 78.0, 82.0, 80.0, 75.0, 77.5, 0.0, 77.5, false, 'DEMO - namuna data (kechikkan)', '2026-06-14'::date, NOW()),
  (3, 35, '2026-06-15', 20, 100.0, 83.0, 80.0, 81.0, 79.0, 90.0, 85.5, 3.0, 85.5, false, 'DEMO - namuna data', '2026-06-15'::date, NOW()),
  (3, 35, '2026-06-16', 20, 100.0, 82.0, 81.0, 80.0, 80.0, 90.0, 85.5, 3.0, 85.5, false, 'DEMO - namuna data', '2026-06-16'::date, NOW()),
  (3, 35, '2026-06-17', 20, 70.0, 79.0, 80.0, 79.0, 78.0, 75.0, 76.8, 0.0, 76.8, false, 'DEMO - namuna data (kechikkan)', '2026-06-17'::date, NOW()),
  (3, 35, '2026-06-18', 20, 100.0, 84.0, 82.0, 82.0, 81.0, 90.0, 86.5, 3.0, 86.5, false, 'DEMO - namuna data', '2026-06-18'::date, NOW()),
  (3, 35, '2026-06-19', 20, 100.0, 83.0, 80.0, 83.0, 80.0, 90.0, 86.0, 3.0, 86.0, false, 'DEMO - namuna data', '2026-06-19'::date, NOW()),
  (3, 35, '2026-06-20', 20, 100.0, 82.0, 81.0, 81.0, 80.0, 90.0, 85.7, 3.0, 85.7, false, 'DEMO - namuna data', '2026-06-20'::date, NOW())
) AS v(employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM employee_daily_kpi k WHERE k.employee_id = 3 AND k.kpi_date = v.kpi_date);

-- employee 4 (Dilshod) — yaxshi, bir kun yo'q
INSERT INTO employee_daily_kpi (employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
SELECT v.* FROM (VALUES
  (4, 36, '2026-06-14', 20, 100.0, 87.0, 85.0, 86.0, 84.0, 92.0, 89.0, 4.0, 89.0, false, 'DEMO - namuna data', '2026-06-14'::date, NOW()),
  (4, 36, '2026-06-15', 20, 100.0, 86.0, 86.0, 85.0, 85.0, 92.0, 89.0, 4.0, 89.0, false, 'DEMO - namuna data', '2026-06-15'::date, NOW()),
  (4, 36, '2026-06-16', 20,   0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, 0.0,  0.0, false, 'DEMO - yo''q (ta''til)',        '2026-06-16'::date, NOW()),
  (4, 36, '2026-06-17', 20, 100.0, 88.0, 87.0, 87.0, 86.0, 92.0, 90.0, 4.0, 90.0, false, 'DEMO - namuna data', '2026-06-17'::date, NOW()),
  (4, 36, '2026-06-18', 20, 100.0, 87.0, 85.0, 86.0, 85.0, 92.0, 89.2, 4.0, 89.2, false, 'DEMO - namuna data', '2026-06-18'::date, NOW()),
  (4, 36, '2026-06-19', 20, 100.0, 87.0, 86.0, 87.0, 85.0, 92.0, 89.5, 4.0, 89.5, false, 'DEMO - namuna data', '2026-06-19'::date, NOW()),
  (4, 36, '2026-06-20', 20, 100.0, 86.0, 86.0, 86.0, 85.0, 92.0, 89.2, 4.0, 89.2, false, 'DEMO - namuna data', '2026-06-20'::date, NOW())
) AS v(employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM employee_daily_kpi k WHERE k.employee_id = 4 AND k.kpi_date = v.kpi_date);

-- employee 5 (Madina) — a'lo
INSERT INTO employee_daily_kpi (employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
SELECT v.* FROM (VALUES
  (5, 37, '2026-06-14', 21, 100.0, 94.0, 92.0, 93.0, 90.0, 98.0, 94.5, 6.0, 94.5, false, 'DEMO - namuna data', '2026-06-14'::date, NOW()),
  (5, 37, '2026-06-15', 21, 100.0, 93.0, 93.0, 92.0, 91.0, 98.0, 94.5, 6.0, 94.5, false, 'DEMO - namuna data', '2026-06-15'::date, NOW()),
  (5, 37, '2026-06-16', 21, 100.0, 94.0, 94.0, 93.0, 92.0, 98.0, 95.2, 6.0, 95.2, false, 'DEMO - namuna data', '2026-06-16'::date, NOW()),
  (5, 37, '2026-06-17', 21, 100.0, 95.0, 93.0, 94.0, 91.0, 98.0, 95.2, 6.0, 95.2, false, 'DEMO - namuna data', '2026-06-17'::date, NOW()),
  (5, 37, '2026-06-18', 21, 100.0, 93.0, 92.0, 93.0, 90.0, 98.0, 94.3, 6.0, 94.3, false, 'DEMO - namuna data', '2026-06-18'::date, NOW()),
  (5, 37, '2026-06-19', 21, 100.0, 94.0, 93.0, 93.0, 91.0, 98.0, 94.8, 6.0, 94.8, false, 'DEMO - namuna data', '2026-06-19'::date, NOW()),
  (5, 37, '2026-06-20', 21, 100.0, 93.0, 93.0, 92.0, 91.0, 98.0, 94.5, 6.0, 94.5, false, 'DEMO - namuna data', '2026-06-20'::date, NOW())
) AS v(employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM employee_daily_kpi k WHERE k.employee_id = 5 AND k.kpi_date = v.kpi_date);

-- employee 6 (Nilufar) — kechikkan kun bor
INSERT INTO employee_daily_kpi (employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
SELECT v.* FROM (VALUES
  (6, 38, '2026-06-14', 21, 100.0, 83.0, 81.0, 82.0, 80.0, 88.0, 85.7, 3.0, 85.7, false, 'DEMO - namuna data', '2026-06-14'::date, NOW()),
  (6, 38, '2026-06-15', 21, 100.0, 82.0, 82.0, 83.0, 81.0, 88.0, 86.0, 3.0, 86.0, false, 'DEMO - namuna data', '2026-06-15'::date, NOW()),
  (6, 38, '2026-06-16', 21,  70.0, 80.0, 80.0, 79.0, 79.0, 72.0, 76.7, 0.0, 76.7, false, 'DEMO - kechikkan (45 daq)', '2026-06-16'::date, NOW()),
  (6, 38, '2026-06-17', 21, 100.0, 83.0, 81.0, 82.0, 80.0, 88.0, 85.7, 3.0, 85.7, false, 'DEMO - namuna data', '2026-06-17'::date, NOW()),
  (6, 38, '2026-06-18', 21, 100.0, 82.0, 82.0, 82.0, 80.0, 88.0, 85.7, 3.0, 85.7, false, 'DEMO - namuna data', '2026-06-18'::date, NOW()),
  (6, 38, '2026-06-19', 21, 100.0, 83.0, 81.0, 83.0, 81.0, 88.0, 86.0, 3.0, 86.0, false, 'DEMO - namuna data', '2026-06-19'::date, NOW()),
  (6, 38, '2026-06-20', 21, 100.0, 82.0, 82.0, 82.0, 80.0, 88.0, 85.7, 3.0, 85.7, false, 'DEMO - namuna data', '2026-06-20'::date, NOW())
) AS v(employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM employee_daily_kpi k WHERE k.employee_id = 6 AND k.kpi_date = v.kpi_date);

-- employee 7 (Aziza) — barqaror
INSERT INTO employee_daily_kpi (employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
SELECT v.* FROM (VALUES
  (7, 39, '2026-06-14', 22, 100.0, 86.0, 84.0, 85.0, 83.0, 90.0, 88.0, 4.0, 88.0, false, 'DEMO - namuna data', '2026-06-14'::date, NOW()),
  (7, 39, '2026-06-15', 22, 100.0, 85.0, 85.0, 84.0, 84.0, 90.0, 88.0, 4.0, 88.0, false, 'DEMO - namuna data', '2026-06-15'::date, NOW()),
  (7, 39, '2026-06-16', 22, 100.0, 86.0, 85.0, 85.0, 83.0, 90.0, 88.2, 4.0, 88.2, false, 'DEMO - namuna data', '2026-06-16'::date, NOW()),
  (7, 39, '2026-06-17', 22, 100.0, 87.0, 86.0, 86.0, 85.0, 90.0, 89.0, 4.0, 89.0, false, 'DEMO - namuna data', '2026-06-17'::date, NOW()),
  (7, 39, '2026-06-18', 22, 100.0, 86.0, 84.0, 85.0, 84.0, 90.0, 88.2, 4.0, 88.2, false, 'DEMO - namuna data', '2026-06-18'::date, NOW()),
  (7, 39, '2026-06-19', 22, 100.0, 85.0, 85.0, 85.0, 83.0, 90.0, 88.0, 4.0, 88.0, false, 'DEMO - namuna data', '2026-06-19'::date, NOW()),
  (7, 39, '2026-06-20', 22, 100.0, 86.0, 85.0, 85.0, 84.0, 90.0, 88.3, 4.0, 88.3, false, 'DEMO - namuna data', '2026-06-20'::date, NOW())
) AS v(employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM employee_daily_kpi k WHERE k.employee_id = 7 AND k.kpi_date = v.kpi_date);

-- employee 8 (Otabek) — bir kun yo'q
INSERT INTO employee_daily_kpi (employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
SELECT v.* FROM (VALUES
  (8, 40, '2026-06-14', 23, 100.0, 78.0, 76.0, 77.0, 75.0, 82.0, 81.3, 0.0, 81.3, false, 'DEMO - namuna data', '2026-06-14'::date, NOW()),
  (8, 40, '2026-06-15', 23, 100.0, 79.0, 77.0, 78.0, 76.0, 82.0, 82.0, 0.0, 82.0, false, 'DEMO - namuna data', '2026-06-15'::date, NOW()),
  (8, 40, '2026-06-16', 23, 100.0, 78.0, 78.0, 78.0, 76.0, 82.0, 82.0, 0.0, 82.0, false, 'DEMO - namuna data', '2026-06-16'::date, NOW()),
  (8, 40, '2026-06-17', 23,   0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, 0.0,  0.0, false, 'DEMO - yo''q (kasal)',          '2026-06-17'::date, NOW()),
  (8, 40, '2026-06-18', 23, 100.0, 79.0, 77.0, 78.0, 76.0, 82.0, 82.0, 0.0, 82.0, false, 'DEMO - namuna data', '2026-06-18'::date, NOW()),
  (8, 40, '2026-06-19', 23, 100.0, 78.0, 78.0, 77.0, 76.0, 82.0, 81.8, 0.0, 81.8, false, 'DEMO - namuna data', '2026-06-19'::date, NOW()),
  (8, 40, '2026-06-20', 23, 100.0, 79.0, 77.0, 78.0, 76.0, 82.0, 82.0, 0.0, 82.0, false, 'DEMO - namuna data', '2026-06-20'::date, NOW())
) AS v(employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM employee_daily_kpi k WHERE k.employee_id = 8 AND k.kpi_date = v.kpi_date);

-- employee 9 (Munisa) — yaxshi
INSERT INTO employee_daily_kpi (employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
SELECT v.* FROM (VALUES
  (9, 41, '2026-06-14', 23, 100.0, 84.0, 82.0, 83.0, 81.0, 88.0, 86.3, 3.0, 86.3, false, 'DEMO - namuna data', '2026-06-14'::date, NOW()),
  (9, 41, '2026-06-15', 23, 100.0, 83.0, 83.0, 83.0, 82.0, 88.0, 86.5, 3.0, 86.5, false, 'DEMO - namuna data', '2026-06-15'::date, NOW()),
  (9, 41, '2026-06-16', 23, 100.0, 84.0, 82.0, 83.0, 81.0, 88.0, 86.3, 3.0, 86.3, false, 'DEMO - namuna data', '2026-06-16'::date, NOW()),
  (9, 41, '2026-06-17', 23,  75.0, 81.0, 81.0, 80.0, 80.0, 80.0, 79.5, 0.0, 79.5, false, 'DEMO - kechikkan (20 daq)', '2026-06-17'::date, NOW()),
  (9, 41, '2026-06-18', 23, 100.0, 84.0, 83.0, 83.0, 82.0, 88.0, 86.7, 3.0, 86.7, false, 'DEMO - namuna data', '2026-06-18'::date, NOW()),
  (9, 41, '2026-06-19', 23, 100.0, 83.0, 82.0, 83.0, 81.0, 88.0, 86.2, 3.0, 86.2, false, 'DEMO - namuna data', '2026-06-19'::date, NOW()),
  (9, 41, '2026-06-20', 23, 100.0, 84.0, 83.0, 83.0, 82.0, 88.0, 86.7, 3.0, 86.7, false, 'DEMO - namuna data', '2026-06-20'::date, NOW())
) AS v(employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM employee_daily_kpi k WHERE k.employee_id = 9 AND k.kpi_date = v.kpi_date);

-- employee 10 (Jasur) — o'rtacha
INSERT INTO employee_daily_kpi (employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
SELECT v.* FROM (VALUES
  (10, 42, '2026-06-14', 24, 100.0, 75.0, 73.0, 74.0, 72.0, 80.0, 79.0, 0.0, 79.0, false, 'DEMO - namuna data', '2026-06-14'::date, NOW()),
  (10, 42, '2026-06-15', 24, 100.0, 76.0, 74.0, 75.0, 73.0, 80.0, 79.7, 0.0, 79.7, false, 'DEMO - namuna data', '2026-06-15'::date, NOW()),
  (10, 42, '2026-06-16', 24, 100.0, 75.0, 75.0, 74.0, 73.0, 80.0, 79.5, 0.0, 79.5, false, 'DEMO - namuna data', '2026-06-16'::date, NOW()),
  (10, 42, '2026-06-17', 24, 100.0, 76.0, 74.0, 75.0, 72.0, 80.0, 79.5, 0.0, 79.5, false, 'DEMO - namuna data', '2026-06-17'::date, NOW()),
  (10, 42, '2026-06-18', 24, 100.0, 75.0, 73.0, 74.0, 72.0, 80.0, 79.0, 0.0, 79.0, false, 'DEMO - namuna data', '2026-06-18'::date, NOW()),
  (10, 42, '2026-06-19', 24, 100.0, 76.0, 74.0, 75.0, 73.0, 80.0, 79.7, 0.0, 79.7, false, 'DEMO - namuna data', '2026-06-19'::date, NOW()),
  (10, 42, '2026-06-20', 24, 100.0, 75.0, 75.0, 74.0, 73.0, 80.0, 79.5, 0.0, 79.5, false, 'DEMO - namuna data', '2026-06-20'::date, NOW())
) AS v(employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM employee_daily_kpi k WHERE k.employee_id = 10 AND k.kpi_date = v.kpi_date);

-- employee 11 (Kamola) — yaxshi
INSERT INTO employee_daily_kpi (employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
SELECT v.* FROM (VALUES
  (11, 43, '2026-06-14', 24, 100.0, 85.0, 83.0, 84.0, 82.0, 89.0, 87.2, 4.0, 87.2, false, 'DEMO - namuna data', '2026-06-14'::date, NOW()),
  (11, 43, '2026-06-15', 24, 100.0, 84.0, 84.0, 83.0, 83.0, 89.0, 87.2, 4.0, 87.2, false, 'DEMO - namuna data', '2026-06-15'::date, NOW()),
  (11, 43, '2026-06-16', 24, 100.0, 85.0, 83.0, 84.0, 82.0, 89.0, 87.2, 4.0, 87.2, false, 'DEMO - namuna data', '2026-06-16'::date, NOW()),
  (11, 43, '2026-06-17', 24, 100.0, 86.0, 84.0, 85.0, 83.0, 89.0, 87.8, 4.0, 87.8, false, 'DEMO - namuna data', '2026-06-17'::date, NOW()),
  (11, 43, '2026-06-18', 24, 100.0, 85.0, 83.0, 84.0, 82.0, 89.0, 87.2, 4.0, 87.2, false, 'DEMO - namuna data', '2026-06-18'::date, NOW()),
  (11, 43, '2026-06-19', 24, 100.0, 84.0, 84.0, 83.0, 83.0, 89.0, 87.2, 4.0, 87.2, false, 'DEMO - namuna data', '2026-06-19'::date, NOW()),
  (11, 43, '2026-06-20', 24, 100.0, 85.0, 83.0, 84.0, 82.0, 89.0, 87.2, 4.0, 87.2, false, 'DEMO - namuna data', '2026-06-20'::date, NOW())
) AS v(employee_id, user_id, evaluation_date, department_id, attendance_score, task_completion_score, quality_score, productivity_score, teamwork_score, discipline_score, overall_score, bonus_percent, net_score, ai_generated, notes, kpi_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM employee_daily_kpi k WHERE k.employee_id = 11 AND k.kpi_date = v.kpi_date);

-- =============================================================================
-- 5. KPI_VALUES — oylik KPI ko'rsatkichlari (2026-06 oyi)
--    kpi_definitions dan yaratilgan ID larga bog'lanadi
-- =============================================================================
INSERT INTO kpi_values (kpi_id, kpi_code, period_date, period_type, value, target_value, achievement_percent, status, calculated_at, employee_id, actual_value)
SELECT
  kd.id,
  v.kpi_code,
  v.period_date,
  v.period_type,
  v.value,
  kd.target_value,
  ROUND((v.value / NULLIF(kd.target_value, 0)) * 100, 1),
  CASE
    WHEN v.value >= kd.target_value THEN 'on_target'
    WHEN v.value >= kd.warning_threshold THEN 'warning'
    ELSE 'critical'
  END,
  NOW(),
  v.employee_id,
  v.value
FROM (VALUES
  -- Employee 2 (Bobur)
  (2, 'HR_ATT_RATE',    '2026-06-01', 'monthly',  100.0),
  (2, 'HR_LATE_COUNT',  '2026-06-01', 'monthly',    0.0),
  (2, 'HR_TASK_DONE',   '2026-06-14', 'weekly',    91.7),
  (2, 'HR_QUALITY_SCR', '2026-06-14', 'weekly',    89.7),
  (2, 'HR_DISC_SCR',    '2026-06-01', 'monthly',   95.0),
  (2, 'HR_OVR_SCORE',   '2026-06-14', 'weekly',    92.0),
  -- Employee 3 (Sherzod)
  (3, 'HR_ATT_RATE',    '2026-06-01', 'monthly',   85.7),
  (3, 'HR_LATE_COUNT',  '2026-06-01', 'monthly',    2.0),
  (3, 'HR_TASK_DONE',   '2026-06-14', 'weekly',    81.9),
  (3, 'HR_QUALITY_SCR', '2026-06-14', 'weekly',    80.6),
  (3, 'HR_DISC_SCR',    '2026-06-01', 'monthly',   83.0),
  (3, 'HR_OVR_SCORE',   '2026-06-14', 'weekly',    83.9),
  -- Employee 4 (Dilshod)
  (4, 'HR_ATT_RATE',    '2026-06-01', 'monthly',   85.7),
  (4, 'HR_LATE_COUNT',  '2026-06-01', 'monthly',    0.0),
  (4, 'HR_TASK_DONE',   '2026-06-14', 'weekly',    74.4),
  (4, 'HR_QUALITY_SCR', '2026-06-14', 'weekly',    72.7),
  (4, 'HR_DISC_SCR',    '2026-06-01', 'monthly',   92.0),
  (4, 'HR_OVR_SCORE',   '2026-06-14', 'weekly',    76.8),
  -- Employee 5 (Madina)
  (5, 'HR_ATT_RATE',    '2026-06-01', 'monthly',  100.0),
  (5, 'HR_LATE_COUNT',  '2026-06-01', 'monthly',    0.0),
  (5, 'HR_TASK_DONE',   '2026-06-14', 'weekly',    93.7),
  (5, 'HR_QUALITY_SCR', '2026-06-14', 'weekly',    92.9),
  (5, 'HR_DISC_SCR',    '2026-06-01', 'monthly',   98.0),
  (5, 'HR_OVR_SCORE',   '2026-06-14', 'weekly',    94.8),
  -- Employee 6 (Nilufar)
  (6, 'HR_ATT_RATE',    '2026-06-01', 'monthly',   85.7),
  (6, 'HR_LATE_COUNT',  '2026-06-01', 'monthly',    1.0),
  (6, 'HR_TASK_DONE',   '2026-06-14', 'weekly',    82.1),
  (6, 'HR_QUALITY_SCR', '2026-06-14', 'weekly',    81.3),
  (6, 'HR_DISC_SCR',    '2026-06-01', 'monthly',   84.0),
  (6, 'HR_OVR_SCORE',   '2026-06-14', 'weekly',    84.0),
  -- Employee 7 (Aziza)
  (7, 'HR_ATT_RATE',    '2026-06-01', 'monthly',  100.0),
  (7, 'HR_LATE_COUNT',  '2026-06-01', 'monthly',    0.0),
  (7, 'HR_TASK_DONE',   '2026-06-14', 'weekly',    85.9),
  (7, 'HR_QUALITY_SCR', '2026-06-14', 'weekly',    84.9),
  (7, 'HR_DISC_SCR',    '2026-06-01', 'monthly',   90.0),
  (7, 'HR_OVR_SCORE',   '2026-06-14', 'weekly',    88.2),
  -- Employee 8 (Otabek)
  (8, 'HR_ATT_RATE',    '2026-06-01', 'monthly',   85.7),
  (8, 'HR_LATE_COUNT',  '2026-06-01', 'monthly',    0.0),
  (8, 'HR_TASK_DONE',   '2026-06-14', 'weekly',    67.0),
  (8, 'HR_QUALITY_SCR', '2026-06-14', 'weekly',    65.6),
  (8, 'HR_DISC_SCR',    '2026-06-01', 'monthly',   82.0),
  (8, 'HR_OVR_SCORE',   '2026-06-14', 'weekly',    70.2),
  -- Employee 9 (Munisa)
  (9, 'HR_ATT_RATE',    '2026-06-01', 'monthly',   85.7),
  (9, 'HR_LATE_COUNT',  '2026-06-01', 'monthly',    1.0),
  (9, 'HR_TASK_DONE',   '2026-06-14', 'weekly',    83.3),
  (9, 'HR_QUALITY_SCR', '2026-06-14', 'weekly',    82.3),
  (9, 'HR_DISC_SCR',    '2026-06-01', 'monthly',   86.0),
  (9, 'HR_OVR_SCORE',   '2026-06-14', 'weekly',    84.6),
  -- Employee 10 (Jasur)
  (10, 'HR_ATT_RATE',    '2026-06-01', 'monthly', 100.0),
  (10, 'HR_LATE_COUNT',  '2026-06-01', 'monthly',   0.0),
  (10, 'HR_TASK_DONE',   '2026-06-14', 'weekly',   75.6),
  (10, 'HR_QUALITY_SCR', '2026-06-14', 'weekly',   74.0),
  (10, 'HR_DISC_SCR',    '2026-06-01', 'monthly',  80.0),
  (10, 'HR_OVR_SCORE',   '2026-06-14', 'weekly',   79.5),
  -- Employee 11 (Kamola)
  (11, 'HR_ATT_RATE',    '2026-06-01', 'monthly', 100.0),
  (11, 'HR_LATE_COUNT',  '2026-06-01', 'monthly',   0.0),
  (11, 'HR_TASK_DONE',   '2026-06-14', 'weekly',   84.9),
  (11, 'HR_QUALITY_SCR', '2026-06-14', 'weekly',   83.4),
  (11, 'HR_DISC_SCR',    '2026-06-01', 'monthly',  89.0),
  (11, 'HR_OVR_SCORE',   '2026-06-14', 'weekly',   87.3)
) AS v(employee_id, kpi_code, period_date, period_type, value)
JOIN kpi_definitions kd ON kd.kpi_code = v.kpi_code
WHERE NOT EXISTS (
  SELECT 1 FROM kpi_values kv
  WHERE kv.kpi_code = v.kpi_code
    AND kv.employee_id = v.employee_id
    AND kv.period_date = v.period_date
);

-- =============================================================================
-- 6. PAYROLL_CALCULATIONS — 2026-06 oyi uchun oylik hisob
--    Razryad koeffitsiyentlari:
--      R6 (emp 2,3,4) => base 4_200_000, koeff 2.8, work_days 19 (bir oy ~22-3 ta bayram)
--      R5 (emp 5,6,7) => base 3_300_000, koeff 2.2
--      R4 (emp 8,9,10,11) => base 2_700_000, koeff 1.8
--    INPS=12% gross, JSHD=0.1% gross
--    bonus_percent: emp2,5=6%, emp3,4,7,9,11=4%, emp6,8,10=3%, emp8=3%(bir kun yo'q)
-- =============================================================================

-- Employee 2: Bobur Karimov, R6, 4_200_000 + 6% bonus
INSERT INTO payroll_calculations (employee_id, pay_type, work_days, work_hours, base_pay, gross_pay, bonuses, tax_inps, tax_jshd, total_taxes, total_deductions, net_pay, status, created_at, notes)
SELECT 2, 'salary', 22, 176, 4200000, 4452000, 252000, 534240, 4452, 538692, 538692, 3913308, 'approved', NOW(), 'DEMO - 2026-06 oylik (R6 koeff×2.8 + 6% bonus)'
WHERE NOT EXISTS (SELECT 1 FROM payroll_calculations pc WHERE pc.employee_id = 2 AND DATE_TRUNC('month', pc.created_at) = '2026-06-01');

-- Employee 3: Sherzod Aliyev, R6, 4_200_000 + 4% bonus (2 kun kechikkan -penalty)
INSERT INTO payroll_calculations (employee_id, pay_type, work_days, work_hours, base_pay, gross_pay, bonuses, tax_inps, tax_jshd, total_taxes, total_deductions, net_pay, status, created_at, notes)
SELECT 3, 'salary', 22, 176, 4200000, 4242000, 42000, 509040, 4242, 513282, 513282, 3728718, 'approved', NOW(), 'DEMO - 2026-06 oylik (R6 koeff×2.8 + 1% bonus - kechikkan jarima)'
WHERE NOT EXISTS (SELECT 1 FROM payroll_calculations pc WHERE pc.employee_id = 3 AND DATE_TRUNC('month', pc.created_at) = '2026-06-01');

-- Employee 4: Dilshod Toshev, R6, 4_200_000 + 4% bonus (1 kun yo'q)
INSERT INTO payroll_calculations (employee_id, pay_type, work_days, work_hours, base_pay, gross_pay, bonuses, tax_inps, tax_jshd, total_taxes, total_deductions, net_pay, status, created_at, notes)
SELECT 4, 'salary', 21, 168, 4009091, 4169455, 160364, 500335, 4169, 504504, 504504, 3664951, 'approved', NOW(), 'DEMO - 2026-06 oylik (R6 koeff×2.8 + 4% bonus, 1 kun yo''q)'
WHERE NOT EXISTS (SELECT 1 FROM payroll_calculations pc WHERE pc.employee_id = 4 AND DATE_TRUNC('month', pc.created_at) = '2026-06-01');

-- Employee 5: Madina Yusupova, R5, 3_300_000 + 6% bonus (a'lo KPI)
INSERT INTO payroll_calculations (employee_id, pay_type, work_days, work_hours, base_pay, gross_pay, bonuses, tax_inps, tax_jshd, total_taxes, total_deductions, net_pay, status, created_at, notes)
SELECT 5, 'salary', 22, 176, 3300000, 3498000, 198000, 419760, 3498, 423258, 423258, 3074742, 'approved', NOW(), 'DEMO - 2026-06 oylik (R5 koeff×2.2 + 6% bonus)'
WHERE NOT EXISTS (SELECT 1 FROM payroll_calculations pc WHERE pc.employee_id = 5 AND DATE_TRUNC('month', pc.created_at) = '2026-06-01');

-- Employee 6: Nilufar Ergasheva, R5, 3_300_000 + 3% bonus (kechikkan)
INSERT INTO payroll_calculations (employee_id, pay_type, work_days, work_hours, base_pay, gross_pay, bonuses, tax_inps, tax_jshd, total_taxes, total_deductions, net_pay, status, created_at, notes)
SELECT 6, 'salary', 22, 176, 3300000, 3399000, 99000, 407880, 3399, 411279, 411279, 2987721, 'approved', NOW(), 'DEMO - 2026-06 oylik (R5 koeff×2.2 + 3% bonus - kechikkan)'
WHERE NOT EXISTS (SELECT 1 FROM payroll_calculations pc WHERE pc.employee_id = 6 AND DATE_TRUNC('month', pc.created_at) = '2026-06-01');

-- Employee 7: Aziza Rahimova, R5, 3_300_000 + 4% bonus
INSERT INTO payroll_calculations (employee_id, pay_type, work_days, work_hours, base_pay, gross_pay, bonuses, tax_inps, tax_jshd, total_taxes, total_deductions, net_pay, status, created_at, notes)
SELECT 7, 'salary', 22, 176, 3300000, 3432000, 132000, 411840, 3432, 415272, 415272, 3016728, 'approved', NOW(), 'DEMO - 2026-06 oylik (R5 koeff×2.2 + 4% bonus)'
WHERE NOT EXISTS (SELECT 1 FROM payroll_calculations pc WHERE pc.employee_id = 7 AND DATE_TRUNC('month', pc.created_at) = '2026-06-01');

-- Employee 8: Otabek Sodiqov, R4, 2_700_000 + 3% bonus (1 kun yo'q)
INSERT INTO payroll_calculations (employee_id, pay_type, work_days, work_hours, base_pay, gross_pay, bonuses, tax_inps, tax_jshd, total_taxes, total_deductions, net_pay, status, created_at, notes)
SELECT 8, 'salary', 21, 168, 2577273, 2654591, 77318, 318551, 2655, 321206, 321206, 2333385, 'approved', NOW(), 'DEMO - 2026-06 oylik (R4 koeff×1.8 + 3% bonus, 1 kun yo''q)'
WHERE NOT EXISTS (SELECT 1 FROM payroll_calculations pc WHERE pc.employee_id = 8 AND DATE_TRUNC('month', pc.created_at) = '2026-06-01');

-- Employee 9: Munisa Saidova, R4, 2_700_000 + 4% bonus
INSERT INTO payroll_calculations (employee_id, pay_type, work_days, work_hours, base_pay, gross_pay, bonuses, tax_inps, tax_jshd, total_taxes, total_deductions, net_pay, status, created_at, notes)
SELECT 9, 'salary', 22, 176, 2700000, 2808000, 108000, 336960, 2808, 339768, 339768, 2468232, 'approved', NOW(), 'DEMO - 2026-06 oylik (R4 koeff×1.8 + 4% bonus)'
WHERE NOT EXISTS (SELECT 1 FROM payroll_calculations pc WHERE pc.employee_id = 9 AND DATE_TRUNC('month', pc.created_at) = '2026-06-01');

-- Employee 10: Jasur Nomonov, R4, 2_700_000 + 0% bonus (past KPI)
INSERT INTO payroll_calculations (employee_id, pay_type, work_days, work_hours, base_pay, gross_pay, bonuses, tax_inps, tax_jshd, total_taxes, total_deductions, net_pay, status, created_at, notes)
SELECT 10, 'salary', 22, 176, 2700000, 2700000, 0, 324000, 2700, 326700, 326700, 2373300, 'approved', NOW(), 'DEMO - 2026-06 oylik (R4 koeff×1.8, bonus yo''q - KPI 79.5%)'
WHERE NOT EXISTS (SELECT 1 FROM payroll_calculations pc WHERE pc.employee_id = 10 AND DATE_TRUNC('month', pc.created_at) = '2026-06-01');

-- Employee 11: Kamola Ismoilova, R4, 2_700_000 + 4% bonus
INSERT INTO payroll_calculations (employee_id, pay_type, work_days, work_hours, base_pay, gross_pay, bonuses, tax_inps, tax_jshd, total_taxes, total_deductions, net_pay, status, created_at, notes)
SELECT 11, 'salary', 22, 176, 2700000, 2808000, 108000, 336960, 2808, 339768, 339768, 2468232, 'approved', NOW(), 'DEMO - 2026-06 oylik (R4 koeff×1.8 + 4% bonus)'
WHERE NOT EXISTS (SELECT 1 FROM payroll_calculations pc WHERE pc.employee_id = 11 AND DATE_TRUNC('month', pc.created_at) = '2026-06-01');

-- =============================================================================
-- 7. DISCIPLINE_RECORDS — 2 ta yangi namuna yozuv (mavjud 30 ta bor, yangi 2 ta)
--    given_by=1 (admin), tenant_id=1 (default)
-- =============================================================================
INSERT INTO discipline_records (employee_id, violation_type, fine_amount, reason, given_by, created_at, status, severity, violation_date, description, discipline_type, tenant_id)
SELECT v.employee_id, v.violation_type, v.fine_amount, v.reason, v.given_by, v.created_at, v.status, v.severity, v.violation_date, v.description, v.discipline_type, v.tenant_id
FROM (VALUES
  -- Employee 6 (Nilufar) — kechikkan uchun ogohlantirish
  (6, 'tardiness', 0, 'Ish joyiga 45 daqiqa kechikish (2026-06-16). DEMO namuna.', 1, '2026-06-16 10:00:00'::timestamp, 'active', 'low', '2026-06-16'::date, 'Xodim sababsiz 45 daqiqa kechikdi. Bu birinchi ogohlantirish.', 'warning', 1),
  -- Employee 3 (Sherzod) — qayta kechikish uchun jarima
  (3, 'tardiness', 50000, 'Oyda 2 marta kechikish (2026-06-14 va 2026-06-17). DEMO namuna.', 1, '2026-06-18 09:00:00'::timestamp, 'active', 'medium', '2026-06-18'::date, 'Xodim joriy oyda 2 marta kechikdi. Qoidaga ko''ra 50,000 so''m jarima.', 'fine', 1)
) AS v(employee_id, violation_type, fine_amount, reason, given_by, created_at, status, severity, violation_date, description, discipline_type, tenant_id)
WHERE NOT EXISTS (
  SELECT 1 FROM discipline_records dr
  WHERE dr.employee_id = v.employee_id
    AND dr.violation_date = v.violation_date
    AND dr.discipline_type = v.discipline_type
    AND (dr.description LIKE '%DEMO%' OR dr.reason LIKE '%DEMO%')
);

-- =============================================================================
-- 8. ATTENDANCE jadvaliga bugungi yozuvlar (API /api/hr/attendance "today" chaqiruvi
--    attendance jadvali + attendance_date = bugun. user_id NOT NULL, tenant_id NOT NULL)
--    NOT: attendance_records = rfid/face log; attendance = shift jadval (HR API uchun)
-- =============================================================================
INSERT INTO attendance (employee_id, user_id, status, check_in, check_out, attendance_date, check_in_time, check_out_time, date, source, hours_worked, created_at, updated_at, tenant_id)
SELECT v.employee_id, v.user_id, v.status, v.check_in, NULL::timestamptz, v.attendance_date, v.check_in_time, NULL::timestamp, v.date_str, 'demo', 9.97, NOW(), NOW(), 1
FROM (VALUES
  (2,  34, 'present', '2026-06-20 08:00:00+05'::timestamptz, '2026-06-20'::date, '2026-06-20 08:00:00'::timestamp, '2026-06-20'),
  (3,  35, 'present', '2026-06-20 08:03:00+05'::timestamptz, '2026-06-20'::date, '2026-06-20 08:03:00'::timestamp, '2026-06-20'),
  (4,  36, 'present', '2026-06-20 08:02:00+05'::timestamptz, '2026-06-20'::date, '2026-06-20 08:02:00'::timestamp, '2026-06-20'),
  (5,  37, 'present', '2026-06-20 08:00:00+05'::timestamptz, '2026-06-20'::date, '2026-06-20 08:00:00'::timestamp, '2026-06-20'),
  (6,  38, 'present', '2026-06-20 08:00:00+05'::timestamptz, '2026-06-20'::date, '2026-06-20 08:00:00'::timestamp, '2026-06-20'),
  (7,  39, 'present', '2026-06-20 08:00:00+05'::timestamptz, '2026-06-20'::date, '2026-06-20 08:00:00'::timestamp, '2026-06-20'),
  (8,  40, 'present', '2026-06-20 08:00:00+05'::timestamptz, '2026-06-20'::date, '2026-06-20 08:00:00'::timestamp, '2026-06-20'),
  (9,  41, 'present', '2026-06-20 08:00:00+05'::timestamptz, '2026-06-20'::date, '2026-06-20 08:00:00'::timestamp, '2026-06-20'),
  (10, 42, 'present', '2026-06-20 08:00:00+05'::timestamptz, '2026-06-20'::date, '2026-06-20 08:00:00'::timestamp, '2026-06-20'),
  (11, 43, 'present', '2026-06-20 08:00:00+05'::timestamptz, '2026-06-20'::date, '2026-06-20 08:00:00'::timestamp, '2026-06-20')
) AS v(employee_id, user_id, status, check_in, attendance_date, check_in_time, date_str)
WHERE NOT EXISTS (
  SELECT 1 FROM attendance a
  WHERE a.employee_id = v.employee_id AND a.attendance_date = '2026-06-20'::date AND a.source = 'demo'
);

-- =============================================================================
-- 9. SALARY_HISTORY — /api/hr/payroll endpoint salary_history jadvalidan o'qiydi
--    user_id NOT NULL, tenant_id NOT NULL
-- =============================================================================
INSERT INTO salary_history (
  user_id, employee_id, effective_date, previous_salary, new_salary, change_type,
  salary_period_start, salary_period_end,
  base_salary, salary_earned, total_bonuses,
  performance_bonus, attendance_bonus,
  inps_12_percent, jshd_12_percent, total_deductions, net_salary,
  days_worked, hours_worked,
  status, notes, created_at, updated_at, tenant_id
)
SELECT v.user_id, v.employee_id, '2026-06-30', v.prev_salary, v.new_salary, 'monthly_payroll',
  '2026-06-01'::date, '2026-06-30'::date,
  v.base_pay, v.gross, v.bonuses,
  v.perf_bonus, 0,
  v.inps, v.jshd, v.deductions, v.net,
  v.days_worked, v.hours,
  'approved', v.notes, NOW(), NOW(), 1
FROM (VALUES
  (34,  2, 4200000::numeric, 4452000::numeric, 4200000::numeric, 4452000::numeric, 252000::numeric, 252000::numeric, 534240::numeric, 4452::numeric, 538692::numeric, 3913308::numeric, 22, 176::numeric, 'DEMO - 2026-06 Bobur Karimov R6 +6%'),
  (35,  3, 4200000::numeric, 4242000::numeric, 4200000::numeric, 4242000::numeric,  42000::numeric,  42000::numeric, 509040::numeric, 4242::numeric, 513282::numeric, 3728718::numeric, 22, 176::numeric, 'DEMO - 2026-06 Sherzod Aliyev R6 +1%'),
  (36,  4, 4200000::numeric, 4169455::numeric, 4009091::numeric, 4169455::numeric, 160364::numeric, 160364::numeric, 500335::numeric, 4169::numeric, 504504::numeric, 3664951::numeric, 21, 168::numeric, 'DEMO - 2026-06 Dilshod Toshev R6 +4%'),
  (37,  5, 3300000::numeric, 3498000::numeric, 3300000::numeric, 3498000::numeric, 198000::numeric, 198000::numeric, 419760::numeric, 3498::numeric, 423258::numeric, 3074742::numeric, 22, 176::numeric, 'DEMO - 2026-06 Madina Yusupova R5 +6%'),
  (38,  6, 3300000::numeric, 3399000::numeric, 3300000::numeric, 3399000::numeric,  99000::numeric,  99000::numeric, 407880::numeric, 3399::numeric, 411279::numeric, 2987721::numeric, 22, 176::numeric, 'DEMO - 2026-06 Nilufar Ergasheva R5 +3%'),
  (39,  7, 3300000::numeric, 3432000::numeric, 3300000::numeric, 3432000::numeric, 132000::numeric, 132000::numeric, 411840::numeric, 3432::numeric, 415272::numeric, 3016728::numeric, 22, 176::numeric, 'DEMO - 2026-06 Aziza Rahimova R5 +4%'),
  (40,  8, 2700000::numeric, 2654591::numeric, 2577273::numeric, 2654591::numeric,  77318::numeric,  77318::numeric, 318551::numeric, 2655::numeric, 321206::numeric, 2333385::numeric, 21, 168::numeric, 'DEMO - 2026-06 Otabek Sodiqov R4 +3%'),
  (41,  9, 2700000::numeric, 2808000::numeric, 2700000::numeric, 2808000::numeric, 108000::numeric, 108000::numeric, 336960::numeric, 2808::numeric, 339768::numeric, 2468232::numeric, 22, 176::numeric, 'DEMO - 2026-06 Munisa Saidova R4 +4%'),
  (42, 10, 2700000::numeric, 2700000::numeric, 2700000::numeric, 2700000::numeric,      0::numeric,      0::numeric, 324000::numeric, 2700::numeric, 326700::numeric, 2373300::numeric, 22, 176::numeric, 'DEMO - 2026-06 Jasur Nomonov R4 0%'),
  (43, 11, 2700000::numeric, 2808000::numeric, 2700000::numeric, 2808000::numeric, 108000::numeric, 108000::numeric, 336960::numeric, 2808::numeric, 339768::numeric, 2468232::numeric, 22, 176::numeric, 'DEMO - 2026-06 Kamola Ismoilova R4 +4%')
) AS v(user_id, employee_id, prev_salary, new_salary, base_pay, gross, bonuses, perf_bonus, inps, jshd, deductions, net, days_worked, hours, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM salary_history sh
  WHERE sh.employee_id = v.employee_id
    AND sh.salary_period_start = '2026-06-01'::date
    AND sh.notes LIKE '%DEMO%'
);

COMMIT;

-- =============================================================================
-- TEKSHIRISH so'rovlari (qo'lda ishlating):
-- SELECT COUNT(*) FROM attendance_records WHERE source='demo';  -- 126
-- SELECT COUNT(*) FROM attendance WHERE source='demo';          -- 10 (bugungi, HR API)
-- SELECT COUNT(*) FROM employee_daily_kpi WHERE notes LIKE '%DEMO%';  -- 70
-- SELECT COUNT(*) FROM kpi_definitions;  -- 6
-- SELECT COUNT(*) FROM kpi_values WHERE employee_id IN (2,3,4,5,6,7,8,9,10,11);  -- 60
-- SELECT COUNT(*) FROM payroll_calculations WHERE notes LIKE '%DEMO%';  -- 10
-- SELECT COUNT(*) FROM salary_history WHERE notes LIKE '%DEMO%';  -- 10 (HR API payroll)
-- SELECT COUNT(*) FROM discipline_records WHERE (description LIKE '%DEMO%' OR reason LIKE '%DEMO%');  -- 2
-- =============================================================================
