-- ============================================================================
-- Communication Center — Workflow steps seed
-- 14 ta hujjat shabloni uchun standart tasdiqlash zanjirlari
--
-- Position kodlari:
--   MANAGER_OF_SENDER  = yuboruvchining bo'lim rahbari (employees.manager_id)
--   DEPT_HEAD          = yuboruvchining bo'lim boshlig'i (org_departments.head_user_id)
--   CEO                = bosh direktor (org_departments root head_user_id)
--   DIRECTOR           = Bosh Direktor (har zanjirning OXIRGI bosqichi — egasi qoidasi
--                        "HAMMASI OXIRI DIREKTORGA"). Aniqlash: position 'Bosh Direktor' →
--                        users.role='director' → org tree root head_user_id (cc-org-resolver.service.ts)
--   POSITION:CFO       = moliya direktori (positions.code = 'CFO')
--   POSITION:KASSIR    = kassir
--   POSITION:HR_HEAD   = HR rahbari
--
-- EGASI QOIDASI (HAMMASI OXIRI DIREKTORGA): har bir shablon zanjiri OXIRIDA majburiy
-- DIRECTOR tasdiqlash bosqichi turadi (oxirgi blok — pastdagi MAX(step_order)+1 INSERT).
-- ============================================================================

-- 1. AVANS uchun ariza: bo'lim rahbari → CEO → CFO → KASSIR
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 4,  true FROM cc_document_templates WHERE code = 'ADVANCE'
UNION ALL SELECT id, version, 2, 'sequential', 'CEO',                true, 8,  true FROM cc_document_templates WHERE code = 'ADVANCE'
UNION ALL SELECT id, version, 3, 'sequential', 'POSITION:CFO',       true, 8,  true FROM cc_document_templates WHERE code = 'ADVANCE'
UNION ALL SELECT id, version, 4, 'sequential', 'POSITION:KASSIR',    true, 8,  true FROM cc_document_templates WHERE code = 'ADVANCE'
ON CONFLICT DO NOTHING;

-- 2. VACATION (Tatil): bo'lim rahbari → HR rahbari
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 24, true FROM cc_document_templates WHERE code = 'VACATION'
UNION ALL SELECT id, version, 2, 'sequential', 'POSITION:HR_HEAD',   true, 24, true FROM cc_document_templates WHERE code = 'VACATION'
ON CONFLICT DO NOTHING;

-- 3. SALARY_RAISE (Ish haqi oshirish): bo'lim rahbari → HR → CEO → CFO
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 48, true FROM cc_document_templates WHERE code = 'SALARY_RAISE'
UNION ALL SELECT id, version, 2, 'sequential', 'POSITION:HR_HEAD',   true, 48, true FROM cc_document_templates WHERE code = 'SALARY_RAISE'
UNION ALL SELECT id, version, 3, 'sequential', 'CEO',                true, 72, true FROM cc_document_templates WHERE code = 'SALARY_RAISE'
UNION ALL SELECT id, version, 4, 'sequential', 'POSITION:CFO',       true, 24, true FROM cc_document_templates WHERE code = 'SALARY_RAISE'
ON CONFLICT DO NOTHING;

-- 4. IMPROVEMENT (Yaxshilash): bo'lim rahbari → CEO
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 48, true FROM cc_document_templates WHERE code = 'IMPROVEMENT'
UNION ALL SELECT id, version, 2, 'sequential', 'CEO',                true, 72, true FROM cc_document_templates WHERE code = 'IMPROVEMENT'
ON CONFLICT DO NOTHING;

-- 5. DOKLAD: bo'lim rahbari → CEO
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 24, true FROM cc_document_templates WHERE code = 'DOKLAD'
UNION ALL SELECT id, version, 2, 'sequential', 'CEO',                true, 48, true FROM cc_document_templates WHERE code = 'DOKLAD'
ON CONFLICT DO NOTHING;

-- 6. REPORT (Rаpорт): bo'lim rahbari
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 24, true FROM cc_document_templates WHERE code = 'REPORT'
ON CONFLICT DO NOTHING;

-- 7. TRAINING (Malaka oshirish): bo'lim rahbari → HR → CFO
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 48, true FROM cc_document_templates WHERE code = 'TRAINING'
UNION ALL SELECT id, version, 2, 'sequential', 'POSITION:HR_HEAD',   true, 48, true FROM cc_document_templates WHERE code = 'TRAINING'
UNION ALL SELECT id, version, 3, 'sequential', 'POSITION:CFO',       true, 24, true FROM cc_document_templates WHERE code = 'TRAINING'
ON CONFLICT DO NOTHING;

-- 8. FIX_ERRORS (Xatolarni tuzatish): bo'lim rahbari
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 24, true FROM cc_document_templates WHERE code = 'FIX_ERRORS'
ON CONFLICT DO NOTHING;

-- 9. FINANCIAL_AID (Moddiy yordam): bo'lim rahbari → HR → CEO → CFO → KASSIR
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 24, true FROM cc_document_templates WHERE code = 'FINANCIAL_AID'
UNION ALL SELECT id, version, 2, 'sequential', 'POSITION:HR_HEAD',   true, 24, true FROM cc_document_templates WHERE code = 'FINANCIAL_AID'
UNION ALL SELECT id, version, 3, 'sequential', 'CEO',                true, 24, true FROM cc_document_templates WHERE code = 'FINANCIAL_AID'
UNION ALL SELECT id, version, 4, 'sequential', 'POSITION:CFO',       true, 24, true FROM cc_document_templates WHERE code = 'FINANCIAL_AID'
UNION ALL SELECT id, version, 5, 'sequential', 'POSITION:KASSIR',    true, 8,  true FROM cc_document_templates WHERE code = 'FINANCIAL_AID'
ON CONFLICT DO NOTHING;

-- 10. CONTRACT_END (Mehnat shartnomasi bekor qilish) — PARALLEL: bo'lim rahbari + HR + CEO bir vaqtda
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'parallel', 'MANAGER_OF_SENDER', true,  48, true FROM cc_document_templates WHERE code = 'CONTRACT_END'
UNION ALL SELECT id, version, 1, 'parallel', 'POSITION:HR_HEAD',   true,  48, true FROM cc_document_templates WHERE code = 'CONTRACT_END'
UNION ALL SELECT id, version, 1, 'parallel', 'CEO',                false, 48, true FROM cc_document_templates WHERE code = 'CONTRACT_END'
ON CONFLICT DO NOTHING;

-- 11. TRANSFER (Boshqa lavozimga o'tish): eski bo'lim rahbari → HR → yangi bo'lim rahbari → CEO
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 48, true FROM cc_document_templates WHERE code = 'TRANSFER'
UNION ALL SELECT id, version, 2, 'sequential', 'POSITION:HR_HEAD',   true, 48, true FROM cc_document_templates WHERE code = 'TRANSFER'
UNION ALL SELECT id, version, 3, 'sequential', 'CEO',                true, 72, true FROM cc_document_templates WHERE code = 'TRANSFER'
ON CONFLICT DO NOTHING;

-- 12. SCHEDULE_CHANGE (Ish vaqti o'zgartirish): bo'lim rahbari → HR
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', true, 24, true FROM cc_document_templates WHERE code = 'SCHEDULE_CHANGE'
UNION ALL SELECT id, version, 2, 'sequential', 'POSITION:HR_HEAD',   true, 24, true FROM cc_document_templates WHERE code = 'SCHEDULE_CHANGE'
ON CONFLICT DO NOTHING;

-- 13. ORDER (Buyruq): faqat CEO chiqaradi → bo'lim rahbari ko'rib chiqadi (informational)
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', false, 24, true FROM cc_document_templates WHERE code = 'ORDER'
ON CONFLICT DO NOTHING;

-- 14. ZRS_ZVS (Sherlovchi xabar): bo'lim rahbari (ko'rib chiqish)
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT id, version, 1, 'sequential', 'MANAGER_OF_SENDER', false, 24, true FROM cc_document_templates WHERE code = 'ZRS_ZVS'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- OXIRGI BOSQICH — DIRECTOR (egasi qoidasi: "HAMMASI OXIRI DIREKTORGA")
-- Har bir shablon zanjiriga MAX(step_order)+1 da yagona DIRECTOR tasdiqlash
-- bosqichi qo'shiladi. Idempotent: (template_id, template_version, step_order,
-- approver_position_code) unique → ON CONFLICT DO NOTHING.
-- ============================================================================
INSERT INTO cc_workflow_steps (template_id, template_version, step_order, step_type, approver_position_code, rejection_stops, time_limit_hours, is_mandatory)
SELECT s.template_id, s.template_version, MAX(s.step_order) + 1, 'sequential', 'DIRECTOR', true, 72, true
FROM cc_workflow_steps s
WHERE NOT EXISTS (
  SELECT 1 FROM cc_workflow_steps d
  WHERE d.template_id = s.template_id
    AND d.template_version = s.template_version
    AND d.approver_position_code = 'DIRECTOR'
)
GROUP BY s.template_id, s.template_version
ON CONFLICT DO NOTHING;
