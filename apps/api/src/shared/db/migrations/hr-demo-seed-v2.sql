-- Migration: hr-demo-seed-v2.sql (v1 dan tuzatilgan, real schema bilan)

-- ─── 1. Company Functions (7 Funksiya) ─────────────────────────────────────
INSERT INTO company_functions (name, name_ru, description, icon, color, order_index, is_active)
SELECT * FROM (VALUES
  ('Ishlab chiqarish', 'Производство',     'Mahsulot/xizmat yaratish',         'Factory',     'hsl(0 75% 55%)',  1, true),
  ('Sotuvlar',         'Продажи',          'Mijozlarga mahsulot sotish',       'TrendingUp',  'hsl(140 70% 45%)',2, true),
  ('Marketing',        'Маркетинг',        'Brand va talabni shakllantirish',  'Megaphone',   'hsl(20 80% 55%)', 3, true),
  ('Moliya',           'Финансы',          'Pul oqimini boshqarish',           'DollarSign',  'hsl(200 80% 50%)',4, true),
  ('Kadrlar',          'Кадры',            'Xodimlar va jamoa rivojlanishi',   'Users',       'hsl(330 70% 55%)',5, true),
  ('Koordinatsiya',    'Координация',      'Bo''limlar muvofiqligi',           'Network',     'hsl(280 70% 55%)',6, true),
  ('Strategiya',       'Стратегия',        'Uzoq muddatli reja',               'Crown',       'hsl(220 70% 50%)',7, true)
) AS f(name, name_ru, description, icon, color, order_index, is_active)
WHERE NOT EXISTS (SELECT 1 FROM company_functions WHERE name = f.name);

-- ─── 2. Leave Types ─────────────────────────────────────────────────────────
INSERT INTO leave_types (code, name_uz, name_ru, max_days_per_year, is_paid, requires_medical_cert, requires_director_approval, is_active, sort_order)
SELECT * FROM (VALUES
  ('annual',     'Yillik ta''til',      'Ежегодный отпуск',     21,  true,  false, false, true, 1),
  ('sick',       'Kasallik',            'Больничный',           14,  true,  true,  false, true, 2),
  ('unpaid',     'Haqsiz ta''til',      'Отпуск без содерж.',  365,  false, false, true,  true, 3),
  ('maternity',  'Tug''ish ta''tili',   'Декретный отпуск',    126,  true,  true,  true,  true, 4),
  ('compassion', 'Hamdardlik ta''tili', 'Похоронный',            3,  true,  false, false, true, 5)
) AS lt(code, name_uz, name_ru, max_days_per_year, is_paid, requires_medical_cert, requires_director_approval, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = lt.code);

-- ─── 3. Goals ──────────────────────────────────────────────────────────────
INSERT INTO goals (title, description, category, target_type, target_id, metric, current_value, target_value, start_date, end_date, status, priority, created_by)
SELECT * FROM (VALUES
  ('2026-Q2 Sotuv 1.5 mlrd UZS', '2-chorak sotuv targeti', 'sales',      'company', NULL::int, 'UZS',     '0',    '1500000000', DATE '2026-04-01', DATE '2026-06-30', 'active', 'high',     1),
  ('Yangi 5 strategik mijoz',     'Strategik mijozlar',     'sales',      'company', NULL,      'count',   '0',    '5',          DATE '2026-04-01', DATE '2026-06-30', 'active', 'high',     1),
  ('Engagement >75%',             'eNPS asosida',           'hr',         'company', NULL,      'percent', '0',    '75',         DATE '2026-01-01', DATE '2026-12-31', 'active', 'medium',   1),
  ('OEE 85%+',                    'Ishlab chiqarish',       'production', 'company', NULL,      'percent', '0',    '85',         DATE '2026-01-01', DATE '2026-12-31', 'active', 'high',     1),
  ('Time-to-hire <30 kun',        'Recruiting tezlik',      'hr',         'company', NULL,      'days',    '0',    '30',         DATE '2026-04-01', DATE '2026-09-30', 'active', 'medium',   1)
) AS g(title, description, category, target_type, target_id, metric, current_value, target_value, start_date, end_date, status, priority, created_by)
WHERE NOT EXISTS (SELECT 1 FROM goals WHERE title = g.title);

-- ─── 4. Leave Balances ─────────────────────────────────────────────────────
INSERT INTO hr_leave_balances (employee_id, leave_type, year, total_days, used_days, remaining_days)
SELECT
  e.id,
  'annual',
  EXTRACT(YEAR FROM NOW())::int,
  21,
  0,
  21
FROM employees e
WHERE e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM hr_leave_balances b
    WHERE b.employee_id = e.id AND b.year = EXTRACT(YEAR FROM NOW())::int
  );

-- ─── 5. Discipline Records ──────────────────────────────────────────────────
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
  'Demo intizom yozuvi',
  'Test data — kechikish/qoidabuzarlik holati',
  NOW() - (random() * INTERVAL '60 days')
FROM employees e
WHERE e.status = 'active'
  AND e.id <= 35
  AND NOT EXISTS (SELECT 1 FROM discipline_records d WHERE d.employee_id = e.id);

-- ─── 6. Daily Reports ───────────────────────────────────────────────────────
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

-- ─── 7. Job Descriptions (title NOT NULL bilan) ─────────────────────────────
INSERT INTO hr_job_descriptions (position_id, title, content, is_active, is_current_version, version)
SELECT
  p.id,
  'Lavozim: ' || COALESCE(p.name, p.code, ('Position #' || p.id)),
  '## Lavozim ' || COALESCE(p.name, p.code) || E'\n\n### Asosiy vazifalar\n- ...\n\n### Talablar\n- ...\n\n### KPI\n- ...',
  true,
  true,
  1
FROM positions p
WHERE p.id <= 20
  AND (p.name IS NOT NULL OR p.code IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM hr_job_descriptions jd WHERE jd.position_id = p.id);

-- ─── 8. Adaptation Programs (real columns: duration, duration_type) ─────────
INSERT INTO adaptation_programs (
  title, title_ru, description, position_id, department_id,
  duration, duration_type, tasks, checkpoints, mentor_required, status, created_by
)
SELECT * FROM (VALUES
  ('Yangi xodim 30/60/90', 'Программа адаптации 30/60/90', '3 oylik qadamli adaptatsiya rejasi',  NULL::int, NULL::int, 90, 'days', '[]'::jsonb, '[]'::jsonb, true,  'active', 1),
  ('Texnik xodim',         'Технический работник',         'Operator/texnik uchun',                NULL,      28,        45, 'days', '[]'::jsonb, '[]'::jsonb, true,  'active', 1),
  ('Menejer',              'Менеджер',                     'Boshqaruv lavozimi uchun',             NULL,      NULL,      90, 'days', '[]'::jsonb, '[]'::jsonb, true,  'active', 1)
) AS ap(title, title_ru, description, position_id, department_id, duration, duration_type, tasks, checkpoints, mentor_required, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM adaptation_programs WHERE title = ap.title);

-- ─── 9. Verify ──────────────────────────────────────────────────────────────
SELECT 'company_functions'      AS t, COUNT(*) FROM company_functions
UNION ALL SELECT 'leave_types',          COUNT(*) FROM leave_types
UNION ALL SELECT 'goals',                COUNT(*) FROM goals
UNION ALL SELECT 'hr_leave_balances',    COUNT(*) FROM hr_leave_balances
UNION ALL SELECT 'discipline_records',   COUNT(*) FROM discipline_records
UNION ALL SELECT 'notifications',        COUNT(*) FROM notifications
UNION ALL SELECT 'hr_v2_daily_reports',  COUNT(*) FROM hr_v2_daily_reports
UNION ALL SELECT 'hr_onboarding_plans',  COUNT(*) FROM hr_onboarding_plans
UNION ALL SELECT 'hr_job_descriptions',  COUNT(*) FROM hr_job_descriptions
UNION ALL SELECT 'adaptation_programs',  COUNT(*) FROM adaptation_programs;
