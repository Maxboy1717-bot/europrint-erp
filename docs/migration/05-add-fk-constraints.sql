-- Migration 05: Add FK constraints to new org columns.
-- ON DELETE SET NULL (matches existing semantics)

BEGIN;

-- ─── org_department_id FKs ─────────────────────────────────────────────
ALTER TABLE adaptation_programs ADD CONSTRAINT fk_adaptation_programs_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE applications ADD CONSTRAINT fk_applications_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE approval_matrix_config ADD CONSTRAINT fk_approval_matrix_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE asset_inventory ADD CONSTRAINT fk_asset_inv_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE candidates ADD CONSTRAINT fk_candidates_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE chat_rooms ADD CONSTRAINT fk_chat_rooms_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE company_goals ADD CONSTRAINT fk_company_goals_org_dept FOREIGN KEY (responsible_org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE company_plan_items ADD CONSTRAINT fk_company_plan_org_dept FOREIGN KEY (responsible_org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE cost_centers ADD CONSTRAINT fk_cost_centers_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE courses ADD CONSTRAINT fk_courses_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE employee_daily_kpi ADD CONSTRAINT fk_emp_daily_kpi_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE employees ADD CONSTRAINT fk_employees_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE hr_health_checkups ADD CONSTRAINT fk_hr_health_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE hr_onboarding_plans ADD CONSTRAINT fk_hr_onboard_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE hr_tz2_contract_versions ADD CONSTRAINT fk_hr_tz2_contract_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE hr_tz2_internal_job_postings ADD CONSTRAINT fk_hr_tz2_jobs_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE internal_requests ADD CONSTRAINT fk_internal_req_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE kpi_results ADD CONSTRAINT fk_kpi_results_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE tests ADD CONSTRAINT fk_tests_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE vacancies ADD CONSTRAINT fk_vacancies_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;
ALTER TABLE work_centers ADD CONSTRAINT fk_work_centers_org_dept FOREIGN KEY (org_department_id) REFERENCES org_departments(id) ON DELETE SET NULL;

-- ─── org_function_id FKs ──────────────────────────────────────────────
ALTER TABLE adaptation_programs ADD CONSTRAINT fk_adaptation_programs_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE ai_exam_attempts ADD CONSTRAINT fk_ai_exam_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE applications ADD CONSTRAINT fk_applications_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE candidates ADD CONSTRAINT fk_candidates_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE career_development_plans ADD CONSTRAINT fk_career_target_org_fn FOREIGN KEY (target_org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE employees ADD CONSTRAINT fk_employees_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE guidelines ADD CONSTRAINT fk_guidelines_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE hr_applications ADD CONSTRAINT fk_hr_app_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE hr_job_descriptions ADD CONSTRAINT fk_hr_jd_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE hr_onboarding_plans ADD CONSTRAINT fk_hr_onboard_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE hr_tz2_ai_question_banks ADD CONSTRAINT fk_hr_tz2_qb_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE hr_tz2_contract_versions ADD CONSTRAINT fk_hr_tz2_contract_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE job_templates ADD CONSTRAINT fk_job_templates_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE onboarding_tasks ADD CONSTRAINT fk_onboarding_tasks_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE position_feature_flags ADD CONSTRAINT fk_pff_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE position_permissions ADD CONSTRAINT fk_pp_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE position_required_courses ADD CONSTRAINT fk_prc_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE position_skill_requirements ADD CONSTRAINT fk_psr_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE questionnaire_responses ADD CONSTRAINT fk_qr_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE questionnaire_templates ADD CONSTRAINT fk_qt_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE salary_bands ADD CONSTRAINT fk_salary_bands_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE succession_plans ADD CONSTRAINT fk_succession_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE tests ADD CONSTRAINT fk_tests_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;
ALTER TABLE vacancies ADD CONSTRAINT fk_vacancies_org_fn FOREIGN KEY (org_function_id) REFERENCES org_functions(id) ON DELETE SET NULL;

COMMIT;
