-- hr-vysotskiy-grade-salaries-2026-07-13.sql
-- INSERT-only (no CREATE TABLE / no ALTER TABLE) -- Q-35 schema-approval NOT required
-- (business_settings already exists). Owner asked where the "Vysotskiy darajasi (preset)"
-- salary midpoints shown in the Add-Employee form are configured from -- they were hardcoded
-- in BaseSalaryInput.tsx (GRADE_PRESETS), not adjustable anywhere. Moved to business_settings
-- so HR/owner can tune them via the existing /admin/business-settings CRUD screen without a
-- code change (per the "threshold values always CRUD" convention already used for
-- hr.referral_bonus_amount, ai.hr_dashboard_budget_* etc. today).
--
-- Idempotent: WHERE NOT EXISTS guard, safe to re-run.

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, description, is_active)
SELECT 'hr', 'hr.grade_a_salary',
       'Vysotskiy darajasi A - asosiy maosh (o''rtacha)',
       'amount', 12000000, 'som',
       'Xodim qo''shish formasidagi "Vysotskiy darajasi" tanlagichida A darajani tanlaganda asosiy maoshga taklif qilinadigan o''rtacha qiymat. HR keyin qo''lda o''zgartirishi mumkin.',
       true
WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE setting_key = 'hr.grade_a_salary');

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, description, is_active)
SELECT 'hr', 'hr.grade_b_salary',
       'Vysotskiy darajasi B - asosiy maosh (o''rtacha)',
       'amount', 8000000, 'som',
       'Xodim qo''shish formasidagi "Vysotskiy darajasi" tanlagichida B darajani tanlaganda asosiy maoshga taklif qilinadigan o''rtacha qiymat.',
       true
WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE setting_key = 'hr.grade_b_salary');

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, description, is_active)
SELECT 'hr', 'hr.grade_c_salary',
       'Vysotskiy darajasi C - asosiy maosh (o''rtacha)',
       'amount', 5000000, 'som',
       'Xodim qo''shish formasidagi "Vysotskiy darajasi" tanlagichida C darajani tanlaganda asosiy maoshga taklif qilinadigan o''rtacha qiymat.',
       true
WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE setting_key = 'hr.grade_c_salary');

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, description, is_active)
SELECT 'hr', 'hr.grade_d_salary',
       'Vysotskiy darajasi D - asosiy maosh (o''rtacha)',
       'amount', 3000000, 'som',
       'Xodim qo''shish formasidagi "Vysotskiy darajasi" tanlagichida D darajani tanlaganda asosiy maoshga taklif qilinadigan o''rtacha qiymat.',
       true
WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE setting_key = 'hr.grade_d_salary');

-- Tekshirish:
-- SELECT setting_key, value_num FROM business_settings WHERE module='hr' AND setting_key LIKE 'hr.grade_%_salary' ORDER BY setting_key;
