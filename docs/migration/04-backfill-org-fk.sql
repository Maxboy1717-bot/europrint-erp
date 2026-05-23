-- Migration 04: Backfill org_department_id from department_id (via code='ORG-{id}')
-- and org_function_id from position_id (via display_order match).
-- Idempotent: only UPDATE rows where new column is NULL.

BEGIN;

-- ─── department_id → org_department_id (24 tables) ────────────────────────
UPDATE adaptation_programs SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE adaptation_programs.department_id = d.id AND adaptation_programs.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE applications SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE applications.department_id = d.id AND applications.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE approval_matrix_config SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE approval_matrix_config.department_id = d.id AND approval_matrix_config.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE asset_inventory SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE asset_inventory.department_id = d.id AND asset_inventory.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE candidates SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE candidates.department_id = d.id AND candidates.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE chat_rooms SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE chat_rooms.department_id = d.id AND chat_rooms.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE company_goals SET responsible_org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE company_goals.responsible_department_id = d.id AND company_goals.responsible_org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE company_plan_items SET responsible_org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE company_plan_items.responsible_department_id = d.id AND company_plan_items.responsible_org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE cost_centers SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE cost_centers.department_id = d.id AND cost_centers.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE courses SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE courses.department_id = d.id AND courses.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE employee_daily_kpi SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE employee_daily_kpi.department_id = d.id AND employee_daily_kpi.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE employees SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE employees.department_id = d.id AND employees.org_department_id IS NULL AND d.code LIKE 'ORG-%';
-- SKIP: employees.manager_department_id column doesn't exist in DB (schema-only)
-- UPDATE employees SET manager_org_department_id = ... (postponed)
UPDATE hr_health_checkups SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE hr_health_checkups.department_id = d.id AND hr_health_checkups.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE hr_onboarding_plans SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE hr_onboarding_plans.department_id = d.id AND hr_onboarding_plans.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE hr_tz2_contract_versions SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE hr_tz2_contract_versions.department_id = d.id AND hr_tz2_contract_versions.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE hr_tz2_internal_job_postings SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE hr_tz2_internal_job_postings.department_id = d.id AND hr_tz2_internal_job_postings.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE internal_requests SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE internal_requests.department_id = d.id AND internal_requests.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE kpi_results SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE kpi_results.department_id = d.id AND kpi_results.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE tests SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE tests.department_id = d.id AND tests.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE users SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE users.department_id = d.id AND users.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE vacancies SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE vacancies.department_id = d.id AND vacancies.org_department_id IS NULL AND d.code LIKE 'ORG-%';
UPDATE work_centers SET org_department_id = SUBSTRING(d.code FROM 5)::int FROM departments d WHERE work_centers.department_id = d.id AND work_centers.org_department_id IS NULL AND d.code LIKE 'ORG-%';

-- ─── position_id → org_function_id (via display_order mapping) ────────────
-- Note: org_functions.display_order was set to original position.id during seed.
UPDATE adaptation_programs SET org_function_id = ofn.id FROM org_functions ofn WHERE adaptation_programs.position_id = ofn.display_order AND adaptation_programs.org_function_id IS NULL;
UPDATE ai_exam_attempts SET org_function_id = ofn.id FROM org_functions ofn WHERE ai_exam_attempts.position_id = ofn.display_order AND ai_exam_attempts.org_function_id IS NULL;
UPDATE applications SET org_function_id = ofn.id FROM org_functions ofn WHERE applications.position_id = ofn.display_order AND applications.org_function_id IS NULL;
UPDATE candidates SET org_function_id = ofn.id FROM org_functions ofn WHERE candidates.position_id = ofn.display_order AND candidates.org_function_id IS NULL;
UPDATE career_development_plans SET target_org_function_id = ofn.id FROM org_functions ofn WHERE career_development_plans.target_position_id = ofn.display_order AND career_development_plans.target_org_function_id IS NULL;
UPDATE employees SET org_function_id = ofn.id FROM org_functions ofn WHERE employees.position_id = ofn.display_order AND employees.org_function_id IS NULL;
UPDATE guidelines SET org_function_id = ofn.id FROM org_functions ofn WHERE guidelines.position_id = ofn.display_order AND guidelines.org_function_id IS NULL;
UPDATE hr_applications SET org_function_id = ofn.id FROM org_functions ofn WHERE hr_applications.position_id = ofn.display_order AND hr_applications.org_function_id IS NULL;
UPDATE hr_job_descriptions SET org_function_id = ofn.id FROM org_functions ofn WHERE hr_job_descriptions.position_id = ofn.display_order AND hr_job_descriptions.org_function_id IS NULL;
UPDATE hr_onboarding_plans SET org_function_id = ofn.id FROM org_functions ofn WHERE hr_onboarding_plans.position_id = ofn.display_order AND hr_onboarding_plans.org_function_id IS NULL;
UPDATE hr_tz2_ai_question_banks SET org_function_id = ofn.id FROM org_functions ofn WHERE hr_tz2_ai_question_banks.position_id = ofn.display_order AND hr_tz2_ai_question_banks.org_function_id IS NULL;
UPDATE hr_tz2_contract_versions SET org_function_id = ofn.id FROM org_functions ofn WHERE hr_tz2_contract_versions.position_id = ofn.display_order AND hr_tz2_contract_versions.org_function_id IS NULL;
UPDATE job_templates SET org_function_id = ofn.id FROM org_functions ofn WHERE job_templates.position_id = ofn.display_order AND job_templates.org_function_id IS NULL;
UPDATE onboarding_tasks SET org_function_id = ofn.id FROM org_functions ofn WHERE onboarding_tasks.position_id = ofn.display_order AND onboarding_tasks.org_function_id IS NULL;
UPDATE position_feature_flags SET org_function_id = ofn.id FROM org_functions ofn WHERE position_feature_flags.position_id = ofn.display_order AND position_feature_flags.org_function_id IS NULL;
UPDATE position_permissions SET org_function_id = ofn.id FROM org_functions ofn WHERE position_permissions.position_id = ofn.display_order AND position_permissions.org_function_id IS NULL;
UPDATE position_required_courses SET org_function_id = ofn.id FROM org_functions ofn WHERE position_required_courses.position_id = ofn.display_order AND position_required_courses.org_function_id IS NULL;
UPDATE position_skill_requirements SET org_function_id = ofn.id FROM org_functions ofn WHERE position_skill_requirements.position_id = ofn.display_order AND position_skill_requirements.org_function_id IS NULL;
UPDATE questionnaire_responses SET org_function_id = ofn.id FROM org_functions ofn WHERE questionnaire_responses.position_id = ofn.display_order AND questionnaire_responses.org_function_id IS NULL;
UPDATE questionnaire_templates SET org_function_id = ofn.id FROM org_functions ofn WHERE questionnaire_templates.position_id = ofn.display_order AND questionnaire_templates.org_function_id IS NULL;
UPDATE salary_bands SET org_function_id = ofn.id FROM org_functions ofn WHERE salary_bands.position_id = ofn.display_order AND salary_bands.org_function_id IS NULL;
UPDATE succession_plans SET org_function_id = ofn.id FROM org_functions ofn WHERE succession_plans.position_id = ofn.display_order AND succession_plans.org_function_id IS NULL;
UPDATE tests SET org_function_id = ofn.id FROM org_functions ofn WHERE tests.position_id = ofn.display_order AND tests.org_function_id IS NULL;
UPDATE users SET org_function_id = ofn.id FROM org_functions ofn WHERE users.position_id = ofn.display_order AND users.org_function_id IS NULL;
UPDATE vacancies SET org_function_id = ofn.id FROM org_functions ofn WHERE vacancies.position_id = ofn.display_order AND vacancies.org_function_id IS NULL;

COMMIT;
