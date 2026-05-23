-- =============================================================================
-- drift-fix-04a-missing-cols.sql
-- Add missing columns to existing tables (Part A)
-- All statements use ADD COLUMN IF NOT EXISTS
-- Skipped tables that are VIEWs in DB:
--   shift_schedules, asset_items, lms_assignments, lms_tests,
--   mm_deliveries, mm_goods_receipts, mro_pm_schedules,
--   crm_deals, crm_invoices, mes_papka_orders,
--   mes_shift_evaluations, mes_shift_handovers
-- =============================================================================

-- abc_analysis
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS analysis_period_start DATE;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS analysis_period_end DATE;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS attendance_score NUMERIC;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS quality_score NUMERIC;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS task_completion_score NUMERIC;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS lms_training_score NUMERIC;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS safety_compliance_score NUMERIC;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS teamwork_collaboration_score NUMERIC;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS total_score NUMERIC;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS previous_category TEXT;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS category_change TEXT;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS bonus_percentage NUMERIC;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ai_cv_screenings
ALTER TABLE ai_cv_screenings ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE ai_cv_screenings ADD COLUMN IF NOT EXISTS ai_score NUMERIC;
ALTER TABLE ai_cv_screenings ADD COLUMN IF NOT EXISTS match_percentage NUMERIC;
ALTER TABLE ai_cv_screenings ADD COLUMN IF NOT EXISTS skills_match NUMERIC;
ALTER TABLE ai_cv_screenings ADD COLUMN IF NOT EXISTS experience_match NUMERIC;
ALTER TABLE ai_cv_screenings ADD COLUMN IF NOT EXISTS education_match NUMERIC;
ALTER TABLE ai_cv_screenings ADD COLUMN IF NOT EXISTS ai_notes TEXT;
ALTER TABLE ai_cv_screenings ADD COLUMN IF NOT EXISTS model_version TEXT;
ALTER TABLE ai_cv_screenings ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- ai_insights
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS module TEXT;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- ai_interview_messages
ALTER TABLE ai_interview_messages ADD COLUMN IF NOT EXISTS question_number INTEGER;
ALTER TABLE ai_interview_messages ADD COLUMN IF NOT EXISTS score_for_answer NUMERIC;
ALTER TABLE ai_interview_messages ADD COLUMN IF NOT EXISTS feedback_for_answer TEXT;
ALTER TABLE ai_interview_messages ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ;

-- ai_planning_config
ALTER TABLE ai_planning_config ADD COLUMN IF NOT EXISTS auto_approval_threshold INTEGER;
ALTER TABLE ai_planning_config ADD COLUMN IF NOT EXISTS max_shift_hours INTEGER;
ALTER TABLE ai_planning_config ADD COLUMN IF NOT EXISTS batch_grouping_enabled BOOLEAN;
ALTER TABLE ai_planning_config ADD COLUMN IF NOT EXISTS energy_optimization_weight INTEGER;
ALTER TABLE ai_planning_config ADD COLUMN IF NOT EXISTS changeover_minutes INTEGER;

-- ai_reservation_requests
ALTER TABLE ai_reservation_requests ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE ai_reservation_requests ADD COLUMN IF NOT EXISTS needed_by TEXT;
ALTER TABLE ai_reservation_requests ADD COLUMN IF NOT EXISTS optimization JSONB;

-- ai_usage_logs
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS module TEXT;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS cost NUMERIC;

-- aisha_conversations
ALTER TABLE aisha_conversations ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- aisha_tool_calls
ALTER TABLE aisha_tool_calls ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- ar_aging_buckets
ALTER TABLE ar_aging_buckets ADD COLUMN IF NOT EXISTS customer_type TEXT;
ALTER TABLE ar_aging_buckets ADD COLUMN IF NOT EXISTS current NUMERIC;
ALTER TABLE ar_aging_buckets ADD COLUMN IF NOT EXISTS days_31_to_60 NUMERIC;

-- asset_disposals
ALTER TABLE asset_disposals ADD COLUMN IF NOT EXISTS disposal_type TEXT;
ALTER TABLE asset_disposals ADD COLUMN IF NOT EXISTS sale_value TEXT;

-- asset_transfers
ALTER TABLE asset_transfers ADD COLUMN IF NOT EXISTS from_dept_id INTEGER;
ALTER TABLE asset_transfers ADD COLUMN IF NOT EXISTS to_dept_id INTEGER;
ALTER TABLE asset_transfers ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- attendance (real table, not view)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- bom_headers
ALTER TABLE bom_headers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- bom_items
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS material_id TEXT;
ALTER TABLE bom_items ADD COLUMN IF NOT EXISTS scrap_percent DECIMAL(5,2) DEFAULT 0;

-- bonus_payments
ALTER TABLE bonus_payments ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE bonus_payments ADD COLUMN IF NOT EXISTS bonus_period_start DATE;
ALTER TABLE bonus_payments ADD COLUMN IF NOT EXISTS bonus_period_end DATE;
ALTER TABLE bonus_payments ADD COLUMN IF NOT EXISTS base_salary NUMERIC;
ALTER TABLE bonus_payments ADD COLUMN IF NOT EXISTS bonus_percentage NUMERIC;
ALTER TABLE bonus_payments ADD COLUMN IF NOT EXISTS bonus_amount NUMERIC;
ALTER TABLE bonus_payments ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE bonus_payments ADD COLUMN IF NOT EXISTS approval_date DATE;
ALTER TABLE bonus_payments ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE bonus_payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- broadcasts
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS recipients_count INTEGER;
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- business_trips
ALTER TABLE business_trips ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE business_trips ADD COLUMN IF NOT EXISTS trip_purpose TEXT;
ALTER TABLE business_trips ADD COLUMN IF NOT EXISTS destination_city TEXT;
ALTER TABLE business_trips ADD COLUMN IF NOT EXISTS destination_country TEXT;
ALTER TABLE business_trips ADD COLUMN IF NOT EXISTS approval_date DATE;
ALTER TABLE business_trips ADD COLUMN IF NOT EXISTS report_url TEXT;

-- calendar_events
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS all_day BOOLEAN;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS attendees JSONB;

-- candidates
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- cash_advances
ALTER TABLE cash_advances ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE cash_advances ADD COLUMN IF NOT EXISTS advance_amount NUMERIC;
ALTER TABLE cash_advances ADD COLUMN IF NOT EXISTS advance_date DATE;
ALTER TABLE cash_advances ADD COLUMN IF NOT EXISTS requested_date DATE;
ALTER TABLE cash_advances ADD COLUMN IF NOT EXISTS approval_date DATE;
ALTER TABLE cash_advances ADD COLUMN IF NOT EXISTS repayment_start_date DATE;
ALTER TABLE cash_advances ADD COLUMN IF NOT EXISTS repayment_months INTEGER;
ALTER TABLE cash_advances ADD COLUMN IF NOT EXISTS monthly_repayment NUMERIC;
ALTER TABLE cash_advances ADD COLUMN IF NOT EXISTS document_url TEXT;

-- certificates
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS document_url TEXT;

-- contact_settings
ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS telegram TEXT;

-- courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- crm_companies
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS customer_code VARCHAR(20);
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'legal';
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS customer_category VARCHAR(1) DEFAULT 'C';
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS abc_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'other';
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 30;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS company_type VARCHAR(50);
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]';
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS banking_details TEXT;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS assigned_by_id INTEGER;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS parent_company_id INTEGER;
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS segment VARCHAR(20) DEFAULT 'new';
ALTER TABLE crm_companies ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- crm_contacts
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]';
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS post VARCHAR(255);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS assigned_by_id INTEGER;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS date_create TIMESTAMP DEFAULT NOW();
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS source_id VARCHAR(50);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(50);
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP;

-- crm_lead_stages
ALTER TABLE crm_lead_stages ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE crm_lead_stages ADD COLUMN IF NOT EXISTS is_default BOOLEAN;

-- crm_leads
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS source_id VARCHAR(50);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS source_description TEXT;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS phones JSONB DEFAULT '[]';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS assigned_by_id INTEGER;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS date_create TIMESTAMP DEFAULT NOW();
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS budget NUMERIC;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS opportunity_amount NUMERIC;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS source_score INTEGER;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS call_status VARCHAR(50);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;

-- crm_pipelines
ALTER TABLE crm_pipelines ADD COLUMN IF NOT EXISTS is_active BOOLEAN;

-- crm_stages
ALTER TABLE crm_stages ADD COLUMN IF NOT EXISTS probability INTEGER;

-- current_stock (skip — it's a VIEW)

-- customer_accounts
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(18,2);

-- customer_orders
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(18,2);
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS currency TEXT;

-- daily_attendance_summary
ALTER TABLE daily_attendance_summary ADD COLUMN IF NOT EXISTS attendance_date DATE;
ALTER TABLE daily_attendance_summary ADD COLUMN IF NOT EXISTS total_employees INTEGER;
ALTER TABLE daily_attendance_summary ADD COLUMN IF NOT EXISTS present_count INTEGER;
ALTER TABLE daily_attendance_summary ADD COLUMN IF NOT EXISTS absent_count INTEGER;
ALTER TABLE daily_attendance_summary ADD COLUMN IF NOT EXISTS late_count INTEGER;
ALTER TABLE daily_attendance_summary ADD COLUMN IF NOT EXISTS on_leave_count INTEGER;
ALTER TABLE daily_attendance_summary ADD COLUMN IF NOT EXISTS sick_leave_count INTEGER;
ALTER TABLE daily_attendance_summary ADD COLUMN IF NOT EXISTS business_trip_count INTEGER;
ALTER TABLE daily_attendance_summary ADD COLUMN IF NOT EXISTS department_id INTEGER;

-- departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- design_orders
ALTER TABLE design_orders ADD COLUMN IF NOT EXISTS sales_order_id TEXT;
ALTER TABLE design_orders ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE design_orders ADD COLUMN IF NOT EXISTS files JSONB;

-- discipline_appeals
ALTER TABLE discipline_appeals ADD COLUMN IF NOT EXISTS appeal_date DATE;
ALTER TABLE discipline_appeals ADD COLUMN IF NOT EXISTS supporting_document_url TEXT;
ALTER TABLE discipline_appeals ADD COLUMN IF NOT EXISTS reviewed_by INTEGER;
ALTER TABLE discipline_appeals ADD COLUMN IF NOT EXISTS review_date DATE;
ALTER TABLE discipline_appeals ADD COLUMN IF NOT EXISTS decision TEXT;
ALTER TABLE discipline_appeals ADD COLUMN IF NOT EXISTS decision_notes TEXT;

-- discipline_records
ALTER TABLE discipline_records ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;

-- document_sequences
ALTER TABLE document_sequences ADD COLUMN IF NOT EXISTS document_type TEXT;

-- document_signatures
ALTER TABLE document_signatures ADD COLUMN IF NOT EXISTS signature_hash TEXT;
ALTER TABLE document_signatures ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- downtime_events (check if real table or view)
ALTER TABLE downtime_events ADD COLUMN IF NOT EXISTS reason_code_id INTEGER;
ALTER TABLE downtime_events ADD COLUMN IF NOT EXISTS duration_min INTEGER;

-- employee_360_responses
ALTER TABLE employee_360_responses ADD COLUMN IF NOT EXISTS rater_id INTEGER;
ALTER TABLE employee_360_responses ADD COLUMN IF NOT EXISTS scores JSONB;

-- employee_fines
ALTER TABLE employee_fines ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE employee_fines ADD COLUMN IF NOT EXISTS fine_amount NUMERIC;
ALTER TABLE employee_fines ADD COLUMN IF NOT EXISTS fine_reason TEXT;
ALTER TABLE employee_fines ADD COLUMN IF NOT EXISTS related_discipline_id INTEGER;
ALTER TABLE employee_fines ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE employee_fines ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE employee_fines ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE employee_fines ADD COLUMN IF NOT EXISTS notes TEXT;

-- employee_passports
ALTER TABLE employee_passports ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE employee_passports ADD COLUMN IF NOT EXISTS passport_issue_date DATE;
ALTER TABLE employee_passports ADD COLUMN IF NOT EXISTS passport_expiry_date DATE;
ALTER TABLE employee_passports ADD COLUMN IF NOT EXISTS issue_location TEXT;
ALTER TABLE employee_passports ADD COLUMN IF NOT EXISTS is_expired BOOLEAN;
ALTER TABLE employee_passports ADD COLUMN IF NOT EXISTS scanned_document_url TEXT;
ALTER TABLE employee_passports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- employee_productivity
ALTER TABLE employee_productivity ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE employee_productivity ADD COLUMN IF NOT EXISTS productivity_date DATE;
ALTER TABLE employee_productivity ADD COLUMN IF NOT EXISTS tasks_assigned INTEGER;
ALTER TABLE employee_productivity ADD COLUMN IF NOT EXISTS tasks_completed INTEGER;
ALTER TABLE employee_productivity ADD COLUMN IF NOT EXISTS quality_defects INTEGER;
ALTER TABLE employee_productivity ADD COLUMN IF NOT EXISTS output_units NUMERIC;
ALTER TABLE employee_productivity ADD COLUMN IF NOT EXISTS target_units NUMERIC;
ALTER TABLE employee_productivity ADD COLUMN IF NOT EXISTS efficiency_percent NUMERIC;
ALTER TABLE employee_productivity ADD COLUMN IF NOT EXISTS shift_id INTEGER;
ALTER TABLE employee_productivity ADD COLUMN IF NOT EXISTS notes TEXT;

-- employee_strengths_weaknesses
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS evidence_description TEXT;
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS identified_by INTEGER;
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS identified_date DATE;
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS action_plan TEXT;
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE employee_strengths_weaknesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- employee_transfer_history
ALTER TABLE employee_transfer_history ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE employee_transfer_history ADD COLUMN IF NOT EXISTS approved_by INTEGER;
ALTER TABLE employee_transfer_history ADD COLUMN IF NOT EXISTS salary_before NUMERIC;
ALTER TABLE employee_transfer_history ADD COLUMN IF NOT EXISTS salary_after NUMERIC;
ALTER TABLE employee_transfer_history ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE employee_transfer_history ADD COLUMN IF NOT EXISTS document_url TEXT;

-- employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tenant_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS total_points INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS face_embedding_updated_at TIMESTAMPTZ;

-- employment_contracts
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS employee_id INTEGER;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS position_title TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS department_name TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS salary_amount NUMERIC;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS probation_period_days INTEGER;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS signature_employee TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS signature_manager TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS signature_hr TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS termination_reason TEXT;
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- equipment_maintenance
ALTER TABLE equipment_maintenance ADD COLUMN IF NOT EXISTS work_center_id INTEGER;
ALTER TABLE equipment_maintenance ADD COLUMN IF NOT EXISTS type TEXT;

-- exception_logs
ALTER TABLE exception_logs ADD COLUMN IF NOT EXISTS error_code TEXT;
ALTER TABLE exception_logs ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE exception_logs ADD COLUMN IF NOT EXISTS stack_trace TEXT;
ALTER TABLE exception_logs ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE exception_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE exception_logs ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE exception_logs ADD COLUMN IF NOT EXISTS severity TEXT;
ALTER TABLE exception_logs ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- exit_interviews
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS interview_date DATE;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS interviewed_by INTEGER;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS reason_for_leaving TEXT;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS would_recommend BOOLEAN;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS would_return BOOLEAN;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS feedback_management TEXT;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS feedback_work_environment TEXT;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS feedback_compensation TEXT;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS feedback_growth TEXT;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS suggestions TEXT;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS overall_comments TEXT;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS offboarding_case_id INTEGER;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE exit_interviews ADD COLUMN IF NOT EXISTS blocks_settlement BOOLEAN;

-- forecast_series
ALTER TABLE forecast_series ADD COLUMN IF NOT EXISTS alpha NUMERIC;

-- gl_documents
ALTER TABLE gl_documents ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE gl_documents ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE gl_documents ADD COLUMN IF NOT EXISTS created_by INTEGER;

-- guidelines
ALTER TABLE guidelines ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE guidelines ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE guidelines ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE guidelines ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE guidelines ADD COLUMN IF NOT EXISTS created_by TEXT;
