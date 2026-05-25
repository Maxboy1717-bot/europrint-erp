-- Migration: hr-full-seed.sql
-- Maqsad: Barcha qolgan 22 ta "qisman" sahifani real ma'lumot bilan jonlantirib, to'liq ishchi ekosistema yaratish.
--
-- Bosqichlar:
--   1. Yetishmayotgan jadvallarni yaratish
--   2. Har sahifa uchun real demo ma'lumot
--   3. Verify

-- ============================================================================
-- 1. YETISHMAYOTGAN JADVALLAR
-- ============================================================================

-- weekly_plans
CREATE TABLE IF NOT EXISTS weekly_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  tasks JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'draft',
  completion_percent INTEGER DEFAULT 0,
  manager_review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week ON weekly_plans(user_id, week_start);

-- employee_referrals
CREATE TABLE IF NOT EXISTS employee_referrals (
  id SERIAL PRIMARY KEY,
  referrer_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
  candidate_name VARCHAR(200),
  vacancy_id INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  bonus_amount NUMERIC(12,2) DEFAULT 0,
  bonus_paid BOOLEAN DEFAULT FALSE,
  hired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON employee_referrals(referrer_user_id);

-- visitor_log (reception)
CREATE TABLE IF NOT EXISTS visitor_log (
  id SERIAL PRIMARY KEY,
  visitor_name VARCHAR(200) NOT NULL,
  visitor_phone VARCHAR(50),
  visitor_company VARCHAR(200),
  purpose TEXT,
  host_employee_id INTEGER REFERENCES employees(id),
  badge_number VARCHAR(50),
  check_in_at TIMESTAMPTZ DEFAULT NOW(),
  check_out_at TIMESTAMPTZ,
  id_document VARCHAR(100),
  id_document_type VARCHAR(50),
  registered_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_visitor_active ON visitor_log(check_out_at) WHERE check_out_at IS NULL;

-- ============================================================================
-- 2. SEED DATA
-- ============================================================================

-- 2.1. Smena Jadvali (shift_assignments — 30 ta xodimga bugungi smena)
INSERT INTO shift_assignments (user_id, date, shift, notes, created_at)
SELECT
  u.id,
  CURRENT_DATE,
  CASE WHEN u.id % 3 = 0 THEN 'morning' WHEN u.id % 3 = 1 THEN 'afternoon' ELSE 'night' END,
  'Bugungi smena',
  NOW()
FROM users u
WHERE u.employee_id IS NOT NULL AND u.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM shift_assignments sa WHERE sa.user_id = u.id AND sa.date = CURRENT_DATE);

-- 2.2. Hujjat Oqimi (hr_v2_documents)
INSERT INTO hr_v2_documents (
  employee_id, document_type, title, description, status, current_step, created_by, created_at
)
SELECT
  e.id,
  CASE WHEN e.id % 4 = 0 THEN 'contract' WHEN e.id % 4 = 1 THEN 'leave_request' WHEN e.id % 4 = 2 THEN 'certificate' ELSE 'other' END,
  CASE
    WHEN e.id % 4 = 0 THEN 'Mehnat shartnomasi #' || e.id
    WHEN e.id % 4 = 1 THEN 'Ta''til arizasi #' || e.id
    WHEN e.id % 4 = 2 THEN 'Ish haqi tasdiqnomasi #' || e.id
    ELSE 'Hujjat #' || e.id
  END,
  'Demo hujjat',
  CASE WHEN e.id % 3 = 0 THEN 'draft' WHEN e.id % 3 = 1 THEN 'review' ELSE 'approved' END,
  CASE WHEN e.id % 3 = 0 THEN 'draft' WHEN e.id % 3 = 1 THEN 'manager_review' ELSE 'signed' END,
  1,
  NOW() - (random() * INTERVAL '30 days')
FROM employees e
WHERE e.status = 'active' AND e.id <= 25
  AND NOT EXISTS (SELECT 1 FROM hr_v2_documents d WHERE d.employee_id = e.id);

-- 2.3. Haftalik Reja (weekly_plans)
INSERT INTO weekly_plans (user_id, week_start, tasks, status, completion_percent)
SELECT
  u.id,
  date_trunc('week', CURRENT_DATE)::date,
  '[
    {"day":"monday","task":"Smena bajarish","status":"done"},
    {"day":"tuesday","task":"Texnika tekshiruvi","status":"done"},
    {"day":"wednesday","task":"Hisobot tayyorlash","status":"in_progress"},
    {"day":"thursday","task":"Mijoz uchrashuvi","status":"pending"},
    {"day":"friday","task":"Hafta yakuni","status":"pending"}
  ]'::jsonb,
  CASE WHEN u.id % 2 = 0 THEN 'active' ELSE 'submitted' END,
  (40 + (random() * 60))::int
FROM users u
WHERE u.employee_id IS NOT NULL AND u.id <= 30
  AND NOT EXISTS (SELECT 1 FROM weekly_plans wp WHERE wp.user_id = u.id AND wp.week_start = date_trunc('week', CURRENT_DATE)::date);

-- 2.4. Anketa Shablonlar (questionnaire_templates)
INSERT INTO questionnaire_templates (name, name_ru, description, position_id, is_active)
SELECT * FROM (VALUES
  ('Ish samaradorlik so''rovi', 'Опрос производительности',  'Oylik samaradorlik baholash', NULL::int, true),
  ('Onboarding feedback',       'Обратная связь по адаптации','Yangi xodim uchun',          NULL,      true),
  ('Exit interview',            'Выходное интервью',          'Ishdan ketuvchi xodim',      NULL,      true),
  ('eNPS so''rov',              'eNPS опрос',                 'Loyallik darajasi',          NULL,      true),
  ('360° feedback',             '360° обратная связь',        'Hamkasblar baholash',        NULL,      true)
) AS qt(name, name_ru, description, position_id, is_active)
WHERE NOT EXISTS (SELECT 1 FROM questionnaire_templates WHERE name = qt.name);

-- 2.5. Anketa javoblari (questionnaire_responses)
INSERT INTO questionnaire_responses (template_id, full_name, phone, lang, position_id, responses, status, created_at)
SELECT
  qt.id,
  TRIM(e.first_name || ' ' || e.last_name),
  e.phone_number,
  'uz',
  e.position_id,
  '{"q1":"Yaxshi","q2":4,"q3":"Hozircha xohish yo''q"}'::jsonb,
  'completed',
  NOW() - (random() * INTERVAL '14 days')
FROM (SELECT id FROM questionnaire_templates LIMIT 2) qt
CROSS JOIN employees e
WHERE e.status = 'active' AND e.id <= 10
  AND NOT EXISTS (SELECT 1 FROM questionnaire_responses qr WHERE qr.template_id = qt.id AND qr.full_name = TRIM(e.first_name || ' ' || e.last_name));

-- 2.6. Xodim Baholash 360° (employee_ratings)
INSERT INTO employee_ratings (
  employee_id, period_year, period_month,
  productivity_score, productivity_weight,
  discipline_score, discipline_weight,
  quality_score, quality_weight,
  skills_score, skills_weight,
  teamwork_score, teamwork_weight,
  composite_score, rank, trend,
  attendance_rate, lms_courses_completed,
  calculated_at, created_at
)
SELECT
  e.id,
  EXTRACT(YEAR FROM NOW())::int,
  EXTRACT(MONTH FROM NOW())::int,
  (60 + random() * 40)::numeric(5,2), 0.30,
  (70 + random() * 30)::numeric(5,2), 0.20,
  (65 + random() * 35)::numeric(5,2), 0.20,
  (60 + random() * 40)::numeric(5,2), 0.15,
  (70 + random() * 30)::numeric(5,2), 0.15,
  (65 + random() * 30)::numeric(5,2),
  e.id,
  CASE WHEN e.id % 3 = 0 THEN 'up' WHEN e.id % 3 = 1 THEN 'stable' ELSE 'down' END,
  (85 + random() * 15)::numeric(5,2),
  (random() * 5)::int,
  NOW(), NOW()
FROM employees e
WHERE e.status = 'active' AND e.id <= 30
  AND NOT EXISTS (
    SELECT 1 FROM employee_ratings r
    WHERE r.employee_id = e.id
      AND r.period_year = EXTRACT(YEAR FROM NOW())::int
      AND r.period_month = EXTRACT(MONTH FROM NOW())::int
  );

-- 2.7. Kasbiy O'sish (employee_career_profiles)
INSERT INTO employee_career_profiles (
  employee_id, next_recommended_position, succession_for,
  cross_training_status, career_path_direction, notes, created_at
)
SELECT
  e.id,
  CASE WHEN e.position_id <= 10 THEN 'Senior ' || COALESCE(p.name, 'specialist') ELSE 'Junior level' END,
  NULL,
  CASE WHEN e.id % 3 = 0 THEN 'in_progress' WHEN e.id % 3 = 1 THEN 'completed' ELSE 'not_started' END,
  CASE WHEN e.id % 2 = 0 THEN 'managerial' ELSE 'specialist' END,
  'Karera rejasi: 2-3 yil ichida keyingi darajaga o''tish',
  NOW()
FROM employees e
LEFT JOIN positions p ON p.id = e.position_id
WHERE e.status = 'active' AND e.id <= 20
  AND NOT EXISTS (SELECT 1 FROM employee_career_profiles ecp WHERE ecp.employee_id = e.id);

-- 2.8. PIP Rejalar (pip_plans) — yomon performance xodim uchun
INSERT INTO pip_plans (employee_id, status, description, start_date, end_date, created_at)
SELECT
  e.id,
  CASE WHEN e.id % 3 = 0 THEN 'active' WHEN e.id % 3 = 1 THEN 'completed' ELSE 'failed' END,
  '30/60/90 kun yaxshilash rejasi: samaradorlik, intizom, sifat',
  CURRENT_DATE - INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '75 days',
  NOW() - INTERVAL '15 days'
FROM employees e
WHERE e.status = 'active' AND e.id IN (5, 12, 18, 25)
  AND NOT EXISTS (SELECT 1 FROM pip_plans p WHERE p.employee_id = e.id);

-- 2.9. Konflikt (hr_conflict_reports) — trigger sinash uchun
INSERT INTO hr_conflict_reports (party1, party2, description, severity, status, created_by)
SELECT * FROM (VALUES
  ('5',  '12', 'Smena almashish bo''yicha tushunmovchilik', 'low',    'open',     1),
  ('8',  '15', 'Resurs taqsimoti bo''yicha kelishmaslik',   'medium', 'mediating',1),
  ('20', '22', 'Zona xavfsizligi qoidalari buzilishi',     'high',   'unresolved',1)
) AS c(party1, party2, description, severity, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM hr_conflict_reports cr WHERE cr.party1 = c.party1 AND cr.party2 = c.party2);

-- 2.10. Sog'liq Nazorati (hr_health_checkups)
INSERT INTO hr_health_checkups (
  department_id, department_name, total_employees, examined_count,
  last_checkup_date, next_checkup_date, status, updated_at
)
SELECT
  d.id,
  COALESCE(d.name_uz, d.name),
  COUNT(e.id)::int,
  (COUNT(e.id) * 0.7)::int,
  CURRENT_DATE - INTERVAL '180 days',
  CURRENT_DATE + INTERVAL '180 days',
  CASE WHEN d.id % 2 = 0 THEN 'up_to_date' ELSE 'pending' END,
  NOW()
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'active'
WHERE NOT EXISTS (SELECT 1 FROM hr_health_checkups hc WHERE hc.department_id = d.id)
GROUP BY d.id, d.name, d.name_uz;

-- 2.11. Xavfsizlik (safety_incidents)
INSERT INTO safety_incidents (
  user_id, incident_type, severity, status, incident_date, location,
  description, root_cause, corrective_action, reported_by, created_at
)
SELECT * FROM (VALUES
  (5,  'minor_injury',    'low',      'closed',     CURRENT_DATE - 30, 'Flekso sex',   'Barmoq jarohati',           'Himoya qo''lqop yo''q edi',  'Barchaga qo''lqop berildi',     1, NOW()),
  (12, 'machine_failure', 'medium',   'closed',     CURRENT_DATE - 15, 'Ofset sex',    'Mashina to''xtab qoldi',    'Profilaktika o''tkazilmagan','Haftalik profilaktika reja',    1, NOW()),
  (18, 'electrical',      'high',     'investigating',CURRENT_DATE - 5,'Ombor',        'Qisqa tutashuv',            'Eski sim',                   'Elektrik ko''rikdan o''tdi',    1, NOW()),
  (22, 'fire_hazard',     'critical', 'open',       CURRENT_DATE - 1, 'Preprint sex', 'Tutun aniqlandi',           'Tekshirilmoqda',             'Yong''in o''chirgich tekshirildi', 1, NOW())
) AS si(user_id, incident_type, severity, status, incident_date, location, description, root_cause, corrective_action, reported_by, created_at)
WHERE NOT EXISTS (SELECT 1 FROM safety_incidents WHERE description = si.description);

-- 2.12. Reception (visitor_log)
INSERT INTO visitor_log (
  visitor_name, visitor_phone, visitor_company, purpose,
  host_employee_id, badge_number, check_in_at, check_out_at, registered_by
)
SELECT * FROM (VALUES
  ('Akbar Toshmatov',  '+998901234567', 'Mijoz LLC',     'Mijoz uchrashuvi',  10, 'V-001', NOW() - INTERVAL '2 hours', NULL::timestamptz, 1),
  ('Dilshod Karimov',  '+998901234568', 'Yetkazib beruvchi', 'Mahsulot yetkazish', 25, 'V-002', NOW() - INTERVAL '1 hour',  NOW() - INTERVAL '30 min', 1),
  ('Nodir Saidov',     '+998901234569', 'Bank',          'Hisob ochish',      14, 'V-003', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour', 1),
  ('Madina Aliyeva',   '+998901234570', 'Audit',         'Yillik audit',      15, 'V-004', NOW(),                       NULL,                       1)
) AS v(visitor_name, visitor_phone, visitor_company, purpose, host_employee_id, badge_number, check_in_at, check_out_at, registered_by)
WHERE NOT EXISTS (SELECT 1 FROM visitor_log WHERE badge_number = v.badge_number);

-- 2.13. HR Brend Boshqaruv (hr_brand_settings)
INSERT INTO hr_brand_settings (company_id, brand_data, created_at, updated_at)
SELECT 1, '{
  "logo": "/assets/logo.png",
  "primaryColor": "#ff5d2e",
  "secondaryColor": "#1d4ed8",
  "tagline": "EuroPrint — Sifatli poligrafiya, ishonchli hamkorlik",
  "tagline_ru": "EuroPrint — Качественная полиграфия, надежное партнерство",
  "values": ["Sifat", "Vaqt", "Hamkorlik", "Innovatsiya"],
  "missionStatement": "Mijozlar uchun sifatli mahsulot yaratish",
  "careerPageEnabled": true,
  "social": {
    "telegram": "@europrint_uz",
    "instagram": "@europrint",
    "linkedin": "europrint-uz"
  }
}'::jsonb, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM hr_brand_settings WHERE company_id = 1);

-- 2.14. eNPS javoblari (enps_responses)
-- Avval mavjud survey ID ni olib, har user uchun javob
INSERT INTO enps_responses (survey_id, employee_id, answers, score, created_at)
SELECT
  s.id,
  e.id,
  ('{"q1":' || (1 + (random() * 9))::int || ',"comment":"Yaxshi joy"}')::jsonb,
  (1 + (random() * 9))::int,
  NOW() - (random() * INTERVAL '7 days')
FROM (SELECT id FROM enps_surveys LIMIT 1) s
CROSS JOIN employees e
WHERE e.status = 'active' AND e.id <= 20
  AND NOT EXISTS (SELECT 1 FROM enps_responses er WHERE er.survey_id = s.id AND er.employee_id = e.id);

-- 2.15. Offboarding (offboarding_cases)
INSERT INTO offboarding_cases (employee_id, dismissal_type, reason, status, created_at)
SELECT * FROM (VALUES
  (28, 'resignation', 'Boshqa ish topdi',           'completed', NOW() - INTERVAL '60 days'),
  (29, 'termination', 'Performance issue',           'in_progress', NOW() - INTERVAL '15 days'),
  (30, 'retirement',  'Pensiyaga chiqish',           'pending',     NOW() - INTERVAL '5 days')
) AS o(employee_id, dismissal_type, reason, status, created_at)
WHERE NOT EXISTS (SELECT 1 FROM offboarding_cases WHERE employee_id = o.employee_id);

-- 2.16. Alumni (hr_alumni)
INSERT INTO hr_alumni (
  user_id, full_name, last_position, department_name, exit_date, exit_type,
  current_employer, contact_email, is_returned, created_at
)
SELECT * FROM (VALUES
  (NULL::int, 'Sherali Yusupov',  'Sotuvchi',         'Sotuvlar',          DATE '2025-08-15', 'resignation', 'Texnoprint LLC', 'sherali@gmail.com', false, NOW()),
  (NULL,      'Gulnoza Rahimova', 'Buxgalter',        'Buxgalteriya',      DATE '2024-12-01', 'resignation', 'NextPrint',       'gulnoza@mail.uz',   false, NOW()),
  (NULL,      'Doniyor Toshev',   'Operator',         'Flekso sexi',       DATE '2024-06-20', 'resignation', 'Ofsetmaster',     'doniyor@inbox.uz',  true,  NOW())
) AS a(user_id, full_name, last_position, department_name, exit_date, exit_type, current_employer, contact_email, is_returned, created_at)
WHERE NOT EXISTS (SELECT 1 FROM hr_alumni WHERE full_name = a.full_name);

-- 2.17. Strategic Milestones
INSERT INTO strategic_milestones (task_id, title, title_ru, target_date, status, created_at)
SELECT * FROM (VALUES
  (NULL::int, '1000 xodim chegarasi',    'Рубеж 1000 сотрудников',    DATE '2027-12-31', 'pending',     NOW()),
  (NULL,      'ISO 9001 sertifikat',     'Сертификат ISO 9001',       DATE '2026-06-30', 'in_progress', NOW()),
  (NULL,      'Yangi sex ochilishi',     'Открытие нового цеха',      DATE '2026-09-01', 'in_progress', NOW()),
  (NULL,      'Eksport boshlash',        'Начало экспорта',           DATE '2026-03-31', 'completed',   NOW() - INTERVAL '30 days')
) AS m(task_id, title, title_ru, target_date, status, created_at)
WHERE NOT EXISTS (SELECT 1 FROM strategic_milestones WHERE title = m.title);

-- 2.18. Referral (employee_referrals)
INSERT INTO employee_referrals (
  referrer_user_id, candidate_id, candidate_name, status, bonus_amount, created_at
)
SELECT
  u.id,
  c.id,
  c.full_name,
  CASE WHEN c.id % 3 = 0 THEN 'hired' WHEN c.id % 3 = 1 THEN 'interviewing' ELSE 'pending' END,
  CASE WHEN c.id % 3 = 0 THEN 500000 ELSE 0 END,
  NOW() - (random() * INTERVAL '20 days')
FROM (SELECT id FROM users WHERE employee_id IS NOT NULL ORDER BY id LIMIT 5) u
CROSS JOIN (SELECT id, full_name FROM candidates LIMIT 3) c
WHERE NOT EXISTS (SELECT 1 FROM employee_referrals er WHERE er.referrer_user_id = u.id AND er.candidate_id = c.id);

-- 2.19. RACI Tasks + Assignments
INSERT INTO raci_tasks (task_name, task_name_ru, description, category, is_active, status)
SELECT * FROM (VALUES
  ('Yangi mahsulot ishlab chiqish',   'Разработка нового продукта',  'Mahsulot lifecycle',        'production', true, 'active'),
  ('Mijoz buyurtmasini bajarish',     'Выполнение заказа клиента',   'End-to-end',                'sales',      true, 'active'),
  ('Oylik moliyaviy hisobot',         'Месячный фин. отчет',         'Finance close',             'finance',    true, 'active'),
  ('Yangi xodim yollash',             'Найм нового сотрудника',      'Recruiting funnel',         'hr',         true, 'active'),
  ('Ombor inventarizatsiyasi',        'Инвентаризация склада',        'Yillik',                    'logistics',  true, 'active'),
  ('Sifat nazorati audit',            'Аудит контроля качества',     'Mahsulot QC',               'quality',    true, 'active')
) AS t(task_name, task_name_ru, description, category, is_active, status)
WHERE NOT EXISTS (SELECT 1 FROM raci_tasks WHERE task_name = t.task_name);

-- RACI assignments
INSERT INTO raci_assignments (task_id, user_id, role, notes)
SELECT
  rt.id,
  u.id,
  CASE
    WHEN u.id % 4 = 0 THEN 'R'
    WHEN u.id % 4 = 1 THEN 'A'
    WHEN u.id % 4 = 2 THEN 'C'
    ELSE 'I'
  END,
  'Standart RACI tayinlash'
FROM raci_tasks rt
CROSS JOIN (SELECT id FROM users WHERE employee_id IS NOT NULL LIMIT 4) u
WHERE NOT EXISTS (SELECT 1 FROM raci_assignments ra WHERE ra.task_id = rt.id AND ra.user_id = u.id);

-- 2.20. Gamification points
INSERT INTO gamification_points (employee_id, points, event_type, description, reason, given_by, created_at)
SELECT
  e.id,
  (10 + (random() * 90))::int,
  CASE WHEN e.id % 4 = 0 THEN 'goal_completed' WHEN e.id % 4 = 1 THEN 'training_done' WHEN e.id % 4 = 2 THEN 'attendance' ELSE 'peer_recognition' END,
  'Demo: ' || CASE WHEN e.id % 4 = 0 THEN 'Maqsadga erishildi' WHEN e.id % 4 = 1 THEN 'Kursni tugatdi' ELSE 'Faollik' END,
  'Awarded for excellent performance',
  1,
  NOW() - (random() * INTERVAL '30 days')
FROM employees e
WHERE e.status = 'active' AND e.id <= 30
  AND NOT EXISTS (SELECT 1 FROM gamification_points gp WHERE gp.employee_id = e.id);

-- 2.21. AI Interview Sessions
INSERT INTO ai_interview_sessions (
  candidate_id, interview_type, language, current_stage, status,
  scores, evaluation, ai_model, started_at, completed_at
)
SELECT
  c.id,
  'screening',
  'uz',
  'completed',
  'completed',
  '{"technical":75,"soft_skills":80,"experience":70,"overall":75}'::jsonb,
  'Yaxshi nomzod, texnik ko''nikmalari yetarli darajada. Communication skills yaxshi.',
  'gpt-4o-mini',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days' + INTERVAL '30 min'
FROM candidates c
WHERE NOT EXISTS (SELECT 1 FROM ai_interview_sessions ais WHERE ais.candidate_id = c.id);

-- ============================================================================
-- 3. VERIFY
-- ============================================================================
SELECT 'shift_assignments' AS t, COUNT(*) FROM shift_assignments
UNION ALL SELECT 'hr_v2_documents',         COUNT(*) FROM hr_v2_documents
UNION ALL SELECT 'weekly_plans',            COUNT(*) FROM weekly_plans
UNION ALL SELECT 'questionnaire_templates', COUNT(*) FROM questionnaire_templates
UNION ALL SELECT 'questionnaire_responses', COUNT(*) FROM questionnaire_responses
UNION ALL SELECT 'employee_ratings',        COUNT(*) FROM employee_ratings
UNION ALL SELECT 'employee_career_profiles',COUNT(*) FROM employee_career_profiles
UNION ALL SELECT 'pip_plans',               COUNT(*) FROM pip_plans
UNION ALL SELECT 'hr_conflict_reports',     COUNT(*) FROM hr_conflict_reports
UNION ALL SELECT 'hr_health_checkups',      COUNT(*) FROM hr_health_checkups
UNION ALL SELECT 'safety_incidents',        COUNT(*) FROM safety_incidents
UNION ALL SELECT 'visitor_log',             COUNT(*) FROM visitor_log
UNION ALL SELECT 'hr_brand_settings',       COUNT(*) FROM hr_brand_settings
UNION ALL SELECT 'enps_responses',          COUNT(*) FROM enps_responses
UNION ALL SELECT 'offboarding_cases',       COUNT(*) FROM offboarding_cases
UNION ALL SELECT 'hr_alumni',               COUNT(*) FROM hr_alumni
UNION ALL SELECT 'strategic_milestones',    COUNT(*) FROM strategic_milestones
UNION ALL SELECT 'employee_referrals',      COUNT(*) FROM employee_referrals
UNION ALL SELECT 'raci_tasks',              COUNT(*) FROM raci_tasks
UNION ALL SELECT 'raci_assignments',        COUNT(*) FROM raci_assignments
UNION ALL SELECT 'gamification_points',     COUNT(*) FROM gamification_points
UNION ALL SELECT 'ai_interview_sessions',   COUNT(*) FROM ai_interview_sessions
ORDER BY 1;
