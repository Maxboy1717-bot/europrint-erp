-- Migration 03: Add org-tree FK columns alongside existing department_id/position_id
-- Excludes: VIEW (asset_items), already-org tables (org_functions, positions, departments)
-- 40 base tables affected.

BEGIN;

-- ─── department_id → org_department_id ──────────────────────────────────────
ALTER TABLE adaptation_programs          ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE applications                 ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE approval_matrix_config       ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE asset_inventory              ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE candidates                   ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE chat_rooms                   ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE company_goals                ADD COLUMN IF NOT EXISTS responsible_org_department_id INTEGER;
ALTER TABLE company_plan_items           ADD COLUMN IF NOT EXISTS responsible_org_department_id INTEGER;
ALTER TABLE cost_centers                 ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE courses                      ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE employee_daily_kpi           ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE employees                    ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE employees                    ADD COLUMN IF NOT EXISTS manager_org_department_id INTEGER;
ALTER TABLE hr_health_checkups           ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE hr_onboarding_plans          ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE hr_tz2_contract_versions     ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE hr_tz2_internal_job_postings ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE internal_requests            ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE kpi_results                  ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE tests                        ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE users                        ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE vacancies                    ADD COLUMN IF NOT EXISTS org_department_id INTEGER;
ALTER TABLE work_centers                 ADD COLUMN IF NOT EXISTS org_department_id INTEGER;

-- ─── position_id → org_function_id ────────────────────────────────────────
ALTER TABLE adaptation_programs          ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE ai_exam_attempts             ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE applications                 ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE candidates                   ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE career_development_plans     ADD COLUMN IF NOT EXISTS target_org_function_id INTEGER;
ALTER TABLE employees                    ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE guidelines                   ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE hr_applications              ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE hr_job_descriptions          ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE hr_onboarding_plans          ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE hr_tz2_ai_question_banks     ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE hr_tz2_contract_versions     ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE job_templates                ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE onboarding_tasks             ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE position_feature_flags       ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE position_permissions         ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE position_required_courses    ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE position_skill_requirements  ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE questionnaire_responses      ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE questionnaire_templates      ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE salary_bands                 ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE succession_plans             ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE tests                        ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE users                        ADD COLUMN IF NOT EXISTS org_function_id INTEGER;
ALTER TABLE vacancies                    ADD COLUMN IF NOT EXISTS org_function_id INTEGER;

COMMIT;
