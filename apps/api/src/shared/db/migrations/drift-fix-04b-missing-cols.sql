-- =============================================================================
-- drift-fix-04b-missing-cols.sql
-- Add missing columns to existing tables (Part B)
-- All statements use ADD COLUMN IF NOT EXISTS
-- =============================================================================

-- hr_candidate_funnels
ALTER TABLE hr_candidate_funnels ADD COLUMN IF NOT EXISTS funnel_id INTEGER;
ALTER TABLE hr_candidate_funnels ADD COLUMN IF NOT EXISTS metadata JSONB;

-- hr_documents
ALTER TABLE hr_documents ADD COLUMN IF NOT EXISTS current_step INTEGER;

-- hr_employee_onboardings
ALTER TABLE hr_employee_onboardings ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE hr_employee_onboardings ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE hr_employee_onboardings ADD COLUMN IF NOT EXISTS weekly_progress JSONB;
ALTER TABLE hr_employee_onboardings ADD COLUMN IF NOT EXISTS probation_score NUMERIC;
ALTER TABLE hr_employee_onboardings ADD COLUMN IF NOT EXISTS probation_notes TEXT;
ALTER TABLE hr_employee_onboardings ADD COLUMN IF NOT EXISTS progress JSONB;

-- hr_funnel_history
ALTER TABLE hr_funnel_history ADD COLUMN IF NOT EXISTS candidate_id INTEGER;

-- hr_job_descriptions
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS title_ru TEXT;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS reports_to TEXT;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS supervises TEXT;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS position_purpose TEXT;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS position_purpose_ru TEXT;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS key_responsibilities JSONB;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS kpi_metrics JSONB;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS requirements JSONB;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS ideal_tool_test_profile JSONB;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS compensation_structure TEXT;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS approved_by_id INTEGER;
ALTER TABLE hr_job_descriptions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- hr_motivation_plans
ALTER TABLE hr_motivation_plans ADD COLUMN IF NOT EXISTS tone_scale_level INTEGER;
ALTER TABLE hr_motivation_plans ADD COLUMN IF NOT EXISTS tone_scale_description TEXT;
ALTER TABLE hr_motivation_plans ADD COLUMN IF NOT EXISTS orientation_type TEXT;
ALTER TABLE hr_motivation_plans ADD COLUMN IF NOT EXISTS orientation_notes TEXT;
ALTER TABLE hr_motivation_plans ADD COLUMN IF NOT EXISTS motivation_factors JSONB;
ALTER TABLE hr_motivation_plans ADD COLUMN IF NOT EXISTS action_plan TEXT;
ALTER TABLE hr_motivation_plans ADD COLUMN IF NOT EXISTS next_review_date DATE;
ALTER TABLE hr_motivation_plans ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE hr_motivation_plans ADD COLUMN IF NOT EXISTS targets JSONB;
ALTER TABLE hr_motivation_plans ADD COLUMN IF NOT EXISTS status TEXT;

-- hr_onboarding_plans
ALTER TABLE hr_onboarding_plans ADD COLUMN IF NOT EXISTS weekly_plan JSONB;
ALTER TABLE hr_onboarding_plans ADD COLUMN IF NOT EXISTS probation_days INTEGER;
ALTER TABLE hr_onboarding_plans ADD COLUMN IF NOT EXISTS success_criteria JSONB;

-- hr_productivity_interviews
ALTER TABLE hr_productivity_interviews ADD COLUMN IF NOT EXISTS productivity_interview JSONB;
ALTER TABLE hr_productivity_interviews ADD COLUMN IF NOT EXISTS reference_check JSONB;
ALTER TABLE hr_productivity_interviews ADD COLUMN IF NOT EXISTS final_decision TEXT;
ALTER TABLE hr_productivity_interviews ADD COLUMN IF NOT EXISTS final_notes TEXT;

-- hr_tool_test_results
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS point_a INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS point_b INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS point_c INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS point_d INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS point_e INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS point_f INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS point_g INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS point_h INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS point_i INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS point_j INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS compulsive_points TEXT[];
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS total_score INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS position_match_score INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS position_match_notes TEXT;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS tested_by_id INTEGER;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS test_date TIMESTAMP;
ALTER TABLE hr_tool_test_results ADD COLUMN IF NOT EXISTS category_result TEXT;

-- hr_tz2_ai_room_analysis
ALTER TABLE hr_tz2_ai_room_analysis ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- inventory_barcode_assignments
ALTER TABLE inventory_barcode_assignments ADD COLUMN IF NOT EXISTS passport_id INTEGER;

-- invoice_payments
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS vendor_id INTEGER;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE invoice_payments ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;

-- iot_sensors
ALTER TABLE iot_sensors ADD COLUMN IF NOT EXISTS device_code TEXT;
ALTER TABLE iot_sensors ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE iot_sensors ADD COLUMN IF NOT EXISTS thresholds TEXT;

-- job_templates
ALTER TABLE job_templates ADD COLUMN IF NOT EXISTS requirements JSONB;
ALTER TABLE job_templates ADD COLUMN IF NOT EXISTS responsibilities JSONB;
ALTER TABLE job_templates ADD COLUMN IF NOT EXISTS skills JSONB;

-- kpi_definitions
ALTER TABLE kpi_definitions ADD COLUMN IF NOT EXISTS code TEXT;

-- kpi_values
ALTER TABLE kpi_values ADD COLUMN IF NOT EXISTS kpi_definition_id INTEGER;

-- leave_balances
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS leave_type TEXT;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS total_entitlement NUMERIC;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS pending_days NUMERIC;
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS remaining_days NUMERIC;

-- leave_requests
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- lms_exam_attempts
ALTER TABLE lms_exam_attempts ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE lms_exam_attempts ADD COLUMN IF NOT EXISTS questions JSONB;
ALTER TABLE lms_exam_attempts ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE lms_exam_attempts ADD COLUMN IF NOT EXISTS evaluation JSONB;
ALTER TABLE lms_exam_attempts ADD COLUMN IF NOT EXISTS gpt_analysis TEXT;
ALTER TABLE lms_exam_attempts ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

-- lms_questions (lms_questions is a VIEW — skip it)
-- lms_support_tickets
ALTER TABLE lms_support_tickets ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE lms_support_tickets ADD COLUMN IF NOT EXISTS created_by INTEGER;

-- machine_crews
ALTER TABLE machine_crews ADD COLUMN IF NOT EXISTS work_center_id TEXT;
ALTER TABLE machine_crews ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE machine_crews ADD COLUMN IF NOT EXISTS production_order_id INTEGER;
ALTER TABLE machine_crews ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE machine_crews ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE machine_crews ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE machine_crews ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- marketing_social_accounts
ALTER TABLE marketing_social_accounts ADD COLUMN IF NOT EXISTS account_id TEXT;
ALTER TABLE marketing_social_accounts ADD COLUMN IF NOT EXISTS access_token TEXT;

-- material_cards
ALTER TABLE material_cards ADD COLUMN IF NOT EXISTS barcode TEXT;

-- materials
ALTER TABLE materials ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS unit_price NUMERIC;

-- offboarding_cases
ALTER TABLE offboarding_cases ADD COLUMN IF NOT EXISTS exit_interview_done BOOLEAN;

-- operator_daily_stats
ALTER TABLE operator_daily_stats ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE operator_daily_stats ADD COLUMN IF NOT EXISTS stats_date DATE;
ALTER TABLE operator_daily_stats ADD COLUMN IF NOT EXISTS work_center_id INTEGER;
ALTER TABLE operator_daily_stats ADD COLUMN IF NOT EXISTS orders_processed INTEGER;
ALTER TABLE operator_daily_stats ADD COLUMN IF NOT EXISTS items_produced INTEGER;
ALTER TABLE operator_daily_stats ADD COLUMN IF NOT EXISTS defect_count INTEGER;
ALTER TABLE operator_daily_stats ADD COLUMN IF NOT EXISTS downtime_minutes INTEGER;
ALTER TABLE operator_daily_stats ADD COLUMN IF NOT EXISTS setup_time_minutes INTEGER;
ALTER TABLE operator_daily_stats ADD COLUMN IF NOT EXISTS machine_efficiency NUMERIC;
ALTER TABLE operator_daily_stats ADD COLUMN IF NOT EXISTS oee_score NUMERIC;

-- overtime_payments
ALTER TABLE overtime_payments ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE overtime_payments ADD COLUMN IF NOT EXISTS overtime_date DATE;
ALTER TABLE overtime_payments ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC;
ALTER TABLE overtime_payments ADD COLUMN IF NOT EXISTS overtime_type TEXT;
ALTER TABLE overtime_payments ADD COLUMN IF NOT EXISTS overtime_payment NUMERIC;
ALTER TABLE overtime_payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- payroll_periods
ALTER TABLE payroll_periods ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- payroll_rows
ALTER TABLE payroll_rows ADD COLUMN IF NOT EXISTS bonus NUMERIC;
ALTER TABLE payroll_rows ADD COLUMN IF NOT EXISTS net_pay NUMERIC;
ALTER TABLE payroll_rows ADD COLUMN IF NOT EXISTS status TEXT;

-- performance_goals
ALTER TABLE performance_goals ADD COLUMN IF NOT EXISTS goal_title TEXT;
ALTER TABLE performance_goals ADD COLUMN IF NOT EXISTS goal_description TEXT;
ALTER TABLE performance_goals ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE performance_goals ADD COLUMN IF NOT EXISTS completed_date DATE;
ALTER TABLE performance_goals ADD COLUMN IF NOT EXISTS progress_percent INTEGER;
ALTER TABLE performance_goals ADD COLUMN IF NOT EXISTS assigned_by INTEGER;
ALTER TABLE performance_goals ADD COLUMN IF NOT EXISTS reviewed_by INTEGER;
ALTER TABLE performance_goals ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE performance_goals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- portfolio_items
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS is_published BOOLEAN;

-- pos_pdf_templates
ALTER TABLE pos_pdf_templates ADD COLUMN IF NOT EXISTS paper_size TEXT;

-- pos_warehouse_access
ALTER TABLE pos_warehouse_access ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- position_required_courses
ALTER TABLE position_required_courses ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT TRUE;
ALTER TABLE position_required_courses ADD COLUMN IF NOT EXISTS deadline_days INTEGER;
ALTER TABLE position_required_courses ADD COLUMN IF NOT EXISTS blocks_mes_access BOOLEAN DEFAULT FALSE;

-- production_sessions
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS work_center_id TEXT;

-- public_products
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS price DECIMAL(18,2);
ALTER TABLE public_products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- purchase_order_items
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS description TEXT;

-- purchase_orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- qc_braks
ALTER TABLE qc_braks ADD COLUMN IF NOT EXISTS production_order_id INTEGER;
ALTER TABLE qc_braks ADD COLUMN IF NOT EXISTS material_id INTEGER;
ALTER TABLE qc_braks ADD COLUMN IF NOT EXISTS status TEXT;

-- qc_reclamations
ALTER TABLE qc_reclamations ADD COLUMN IF NOT EXISTS responsible_user_id INTEGER;
ALTER TABLE qc_reclamations ADD COLUMN IF NOT EXISTS production_order_id INTEGER;
ALTER TABLE qc_reclamations ADD COLUMN IF NOT EXISTS type TEXT;

-- quality_defects_camera
ALTER TABLE quality_defects_camera ADD COLUMN IF NOT EXISTS defect_location TEXT;
ALTER TABLE quality_defects_camera ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE quality_defects_camera ADD COLUMN IF NOT EXISTS reviewed_by_id INTEGER;

-- routing_operations
ALTER TABLE routing_operations ADD COLUMN IF NOT EXISTS run_time_min DECIMAL(8,2) DEFAULT 0;

-- saas_tenants
ALTER TABLE saas_tenants ADD COLUMN IF NOT EXISTS employee_limit INTEGER;

-- safety_trainings
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS training_title TEXT;
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN;
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS validity_period_days INTEGER;
ALTER TABLE safety_trainings ADD COLUMN IF NOT EXISTS max_participants INTEGER;

-- salary_bands
ALTER TABLE salary_bands ADD COLUMN IF NOT EXISTS department_id INTEGER;

-- salary_history
ALTER TABLE salary_history ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE salary_history ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE salary_history ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE salary_history ADD COLUMN IF NOT EXISTS created_by INTEGER;

-- sales_invoices
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS gl_document_id INTEGER;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC;

-- sales_orders
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS sales_org TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS order_date DATE;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS overall_status TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivery_status TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS billing_status TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS quotation_id INTEGER;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS module_status TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS master_status TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS pp_queued_at TIMESTAMPTZ;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS fg_warehouse_entry_at TIMESTAMPTZ;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS storage_days INTEGER;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS tech_bom_approved BOOLEAN;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS net_value NUMERIC;

-- sd_contracts
ALTER TABLE sd_contracts ADD COLUMN IF NOT EXISTS papka_no TEXT;

-- sd_customer_documents
ALTER TABLE sd_customer_documents ADD COLUMN IF NOT EXISTS document_name TEXT;
ALTER TABLE sd_customer_documents ADD COLUMN IF NOT EXISTS is_verified BOOLEAN;

-- sd_customer_interactions
ALTER TABLE sd_customer_interactions ADD COLUMN IF NOT EXISTS interaction_type TEXT;
ALTER TABLE sd_customer_interactions ADD COLUMN IF NOT EXISTS channel TEXT;

-- sd_customers
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN;
ALTER TABLE sd_customers ADD COLUMN IF NOT EXISTS crm_company_id INTEGER;

-- sd_orders
ALTER TABLE sd_orders ADD COLUMN IF NOT EXISTS created_by INTEGER;

-- sensor_devices
ALTER TABLE sensor_devices ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE sensor_devices ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE sensor_devices ADD COLUMN IF NOT EXISTS last_reading_at TIMESTAMPTZ;
ALTER TABLE sensor_devices ADD COLUMN IF NOT EXISTS thresholds JSONB;

-- sensor_readings
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN;
ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS anomaly_reason TEXT;

-- sick_leaves
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS sick_leave_date DATE;
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS duration_days INTEGER;
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS medical_certificate_number TEXT;
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS medical_certificate_url TEXT;
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS clinic_name TEXT;
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS diagnosis_code TEXT;
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS is_approved BOOLEAN;
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE sick_leaves ADD COLUMN IF NOT EXISTS notes TEXT;

-- stock_transfer_lines
ALTER TABLE stock_transfer_lines ADD COLUMN IF NOT EXISTS quantity NUMERIC;
ALTER TABLE stock_transfer_lines ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE stock_transfer_lines ADD COLUMN IF NOT EXISTS status TEXT;

-- succession_plans
ALTER TABLE succession_plans ADD COLUMN IF NOT EXISTS development_gaps JSONB;

-- survey_responses
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- system_settings
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS config JSONB;

-- user_panels
ALTER TABLE user_panels ADD COLUMN IF NOT EXISTS layout JSONB;

-- user_skills
ALTER TABLE user_skills ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE user_skills ADD COLUMN IF NOT EXISTS verified BOOLEAN;

-- vacancies
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

-- warehouse_bins
ALTER TABLE warehouse_bins ADD COLUMN IF NOT EXISTS name TEXT;

-- warehouse_stock
ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS unit TEXT;

-- warehouse_zones
ALTER TABLE warehouse_zones ADD COLUMN IF NOT EXISTS type TEXT;
