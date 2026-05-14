-- Migration: hr-demo-seed.sql
-- Maqsad: Bo'sh HR jadvallarni demo ma'lumot bilan to'ldirib, sidebar sahifalarini "ishlaydi" holatga keltirish.
--
-- Idempotent: WHERE NOT EXISTS bilan, qayta ishga tushirilsa duplicate yaratmaydi.

-- ─── 1. Company Functions (7 Funksiya — Adizes) ────────────────────────────
INSERT INTO company_functions (name, name_ru, code, description, sort_order, is_active)
SELECT * FROM (VALUES
  ('Ishlab chiqarish',  'Производство',         'PRODUCTION',  'Mahsulot/xizmat yaratish',         1, true),
  ('Sotuvlar',          'Продажи',              'SALES',       'Mijozlarga mahsulot sotish',       2, true),
  ('Marketing',         'Маркетинг',            'MARKETING',   'Brand va talabni shakllantirish',  3, true),
  ('Moliya',            'Финансы',              'FINANCE',     'Pul oqimini boshqarish',           4, true),
  ('Kadrlar',           'Кадры',                'PERSONNEL',   'Xodimlar va jamoa rivojlanishi',   5, true),
  ('Koordinatsiya',     'Координация',          'COORDINATION','Bo''limlar o''rtasidagi muvofiqlik',6, true),
  ('Strategiya',        'Стратегия',            'STRATEGY',    'Uzoq muddatli reja va vision',     7, true)
) AS f(name, name_ru, code, description, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM company_functions WHERE code = f.code);

-- ─── 2. Leave Types ─────────────────────────────────────────────────────────
INSERT INTO leave_types (code, name, name_ru, default_days, is_paid, requires_approval)
SELECT * FROM (VALUES
  ('annual',     'Yillik ta''til',     'Ежегодный отпуск',  21, true,  true),
  ('sick',       'Kasallik',           'Больничный',        14, true,  false),
  ('unpaid',     'Haqsiz ta''til',     'Отпуск без содерж.', 0, false, true),
  ('maternity',  'Tug''ish ta''tili',  'Декретный отпуск',  126, true,  true),
  ('compassion', 'Hamdardlik ta''tili','Похоронный',         3, true,  true)
) AS lt(code, name, name_ru, default_days, is_paid, requires_approval)
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = lt.code);

-- ─── 3. Goals (kompaniya darajasi) ──────────────────────────────────────────
INSERT INTO goals (
  title, description, goal_type, owner_user_id,
  target_value, current_value, unit, status, due_date, created_at
)
SELECT * FROM (VALUES
  ('2026-Q2 Sotuv 1.5 mlrd UZS',   '2-chorak sotuv targeti', 'company', 1, 1500000000, 0,    'UZS',     'active', DATE '2026-06-30', NOW()),
  ('Yangi 5 mijoz kelishuvi',       'Strategik mijozlar',     'company', 1, 5,          0,    'count',   'active', DATE '2026-06-30', NOW()),
  ('Xodim engagement >75%',         'eNPS asosida',           'hr',      1, 75,         0,    'percent', 'active', DATE '2026-12-31', NOW()),
  ('Ishlab chiqarish samaradorligi','OEE 85%+',               'product', 1, 85,         0,    'percent', 'active', DATE '2026-12-31', NOW()),
  ('Recruiting time <30 kun',       'Time-to-hire qisqartirish','hr',    1, 30,         0,    'days',    'active', DATE '2026-09-30', NOW())
) AS g(title, description, goal_type, owner_user_id, target_value, current_value, unit, status, due_date, created_at)
WHERE NOT EXISTS (SELECT 1 FROM goals WHERE title = g.title);

-- ─── 4. Leave Balances (xodimlar uchun) ─────────────────────────────────────
INSERT INTO hr_leave_balances (user_id, leave_type, year, allocated_days, used_days, remaining_days)
SELECT
  u.id,
  'annual',
  EXTRACT(YEAR FROM NOW())::int,
  21,
  0,
  21
FROM users u
WHERE u.employee_id IS NOT NULL AND u.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM hr_leave_balances b WHERE b.user_id = u.id AND b.year = EXTRACT(YEAR FROM NOW())::int);

-- ─── 5. Test Leave Requests ─────────────────────────────────────────────────
INSERT INTO hr_leave_requests (
  user_id, leave_type, start_date, end_date, days_requested,
  reason, status, created_at
)
SELECT
  u.id, 'annual',
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '14 days',
  7,
  'Yozgi ta''til',
  CASE WHEN u.id % 3 = 0 THEN 'pending' WHEN u.id % 3 = 1 THEN 'approved' ELSE 'rejected' END,
  NOW()
FROM users u
WHERE u.employee_id IS NOT NULL AND u.deleted_at IS NULL
  AND u.id <= 40
  AND NOT EXISTS (SELECT 1 FROM hr_leave_requests r WHERE r.user_id = u.id);

-- ─── 6. Discipline records (test) ───────────────────────────────────────────
INSERT INTO discipline_records (
  employee_id, violation_type, severity, status,
  violation_date, fine_amount, reason, description, created_at
)
SELECT
  e.id,
  CASE WHEN e.id % 3 = 0 THEN 'late_arrival' WHEN e.id % 3 = 1 THEN 'absence' ELSE 'misconduct' END,
  CASE WHEN e.id % 4 = 0 THEN 'minor' WHEN e.id % 4 = 1 THEN 'major' WHEN e.id % 4 = 2 THEN 'serious' ELSE 'minor' END,
  CASE WHEN e.id % 2 = 0 THEN 'open' ELSE 'closed' END,
  CURRENT_DATE - (random() * 30)::int,
  CASE WHEN e.id % 5 = 0 THEN 100000 ELSE 0 END,
  'Test intizom yozuvi #' || e.id,
  'Demo data — kechikish/qoidabuzarlik holati',
  NOW() - (random() * INTERVAL '60 days')
FROM employees e
WHERE e.id <= 35
  AND NOT EXISTS (SELECT 1 FROM discipline_records d WHERE d.employee_id = e.id);

-- ─── 7. Notifications (test) ────────────────────────────────────────────────
INSERT INTO notifications (user_id, type, title, body, is_read, created_at)
SELECT
  u.id,
  'info',
  'Xush kelibsiz!',
  'EuroPrint ERP tizimiga muvaffaqiyatli kirdingiz. Tashkiliy tuzilmangizni ko''ring.',
  false,
  NOW()
FROM users u
WHERE u.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'info');

-- ─── 8. Daily Reports (kunlik hisobot) ──────────────────────────────────────
INSERT INTO hr_v2_daily_reports (
  user_id, report_date, what_done_yesterday, what_planned_today, blockers,
  productivity_score, created_at
)
SELECT
  u.id,
  CURRENT_DATE,
  'Quyidagi vazifalar bajarildi: kunlik smena, hujjat tayyorlash',
  'Bugun: yangi mijoz uchrashuvi, hisobot tayyorlash',
  CASE WHEN u.id % 5 = 0 THEN 'Hech qanday muammo yo''q' ELSE NULL END,
  (60 + (random() * 40))::int,
  NOW()
FROM users u
WHERE u.employee_id IS NOT NULL AND u.deleted_at IS NULL
  AND u.id <= 25
  AND NOT EXISTS (SELECT 1 FROM hr_v2_daily_reports r WHERE r.user_id = u.id AND r.report_date = CURRENT_DATE);

-- ─── 9. Onboarding Plans ────────────────────────────────────────────────────
INSERT INTO hr_onboarding_plans (title, tasks, duration_days, is_active, department_id)
SELECT * FROM (VALUES
  ('Yangi xodim uchun standart reja', '["Hujjatlar topshirish", "Texnika olish", "Mentor bilan tanishish", "Kompaniyaning tarixi", "Korporativ qoidalar", "Birinchi vazifalar"]'::jsonb, 30, true, NULL::integer),
  ('Texnik xodim uchun qisqartirilgan', '["Hujjatlar", "Asbob-uskuna", "Mentor", "Texnik xavfsizlik"]'::jsonb, 14, true, 28),
  ('Menejer uchun chuqur reja',         '["Strategik bag''lanish", "Jamoa bilan tanishish", "KPI o''rganish", "Birinchi maqsadlar", "30/60/90 reja"]'::jsonb, 90, true, NULL::integer)
) AS p(title, tasks, duration_days, is_active, department_id)
WHERE NOT EXISTS (SELECT 1 FROM hr_onboarding_plans WHERE title = p.title);

-- ─── 10. Job Descriptions (lavozim tariflari) ───────────────────────────────
INSERT INTO hr_job_descriptions (position_id, title, content, is_active, is_current_version, version)
SELECT
  p.id,
  'Lavozim tarifi: ' || p.name,
  '## Lavozim ' || p.name || E'\n\n### Asosiy vazifalar\n- ...\n\n### Talablar\n- ...\n\n### KPI\n- ...',
  true,
  true,
  1
FROM positions p
WHERE p.id <= 20
  AND NOT EXISTS (SELECT 1 FROM hr_job_descriptions jd WHERE jd.position_id = p.id);

-- ─── 11. Adaptation Programs ────────────────────────────────────────────────
INSERT INTO adaptation_programs (
  title, description, duration_days, type, target_role, is_active, created_at
)
SELECT * FROM (VALUES
  ('Yangi xodim 30/60/90', '3 oylik qadamli adaptatsiya rejasi', 90, 'standard', 'employee',  true, NOW()),
  ('Texnik xodim',         'Operator/texnik uchun',             45, 'technical','technician', true, NOW()),
  ('Menejer',              'Boshqaruv lavozimi uchun',          90, 'manager',  'manager',    true, NOW())
) AS ap(title, description, duration_days, type, target_role, is_active, created_at)
WHERE NOT EXISTS (SELECT 1 FROM adaptation_programs WHERE title = ap.title);

-- ─── 12. Verify ─────────────────────────────────────────────────────────────
SELECT 'company_functions'      AS t, COUNT(*) FROM company_functions
UNION ALL SELECT 'leave_types',          COUNT(*) FROM leave_types
UNION ALL SELECT 'goals',                COUNT(*) FROM goals
UNION ALL SELECT 'hr_leave_balances',    COUNT(*) FROM hr_leave_balances
UNION ALL SELECT 'hr_leave_requests',    COUNT(*) FROM hr_leave_requests
UNION ALL SELECT 'discipline_records',   COUNT(*) FROM discipline_records
UNION ALL SELECT 'notifications',        COUNT(*) FROM notifications
UNION ALL SELECT 'hr_v2_daily_reports',  COUNT(*) FROM hr_v2_daily_reports
UNION ALL SELECT 'hr_onboarding_plans',  COUNT(*) FROM hr_onboarding_plans
UNION ALL SELECT 'hr_job_descriptions',  COUNT(*) FROM hr_job_descriptions
UNION ALL SELECT 'adaptation_programs',  COUNT(*) FROM adaptation_programs;
