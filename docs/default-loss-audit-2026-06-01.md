# Default-Loss Audit — Drizzle vs Live DB (europrint)

Date: 2026-06-01 · Read-only · DB: europrint@uzbek-language-module-postgres-1 (11,450 cols)

## Method
Parsed every `pgTable` column in `lib/db/src/schema` + `apps/api/src/shared/db` declaring a **DB-level** default — `.default(...)`, `.defaultNow()`, `.defaultRandom()`. `.$defaultFn(...)` EXCLUDED (JS-side, applied by Drizzle on insert, never depends on the DB default). Cross-referenced against `information_schema.columns`. DRIFT = Drizzle declares a DB-level default the live column lacks.

- **DRIFT-NN** (104): live column is NOT NULL with no default → on insert Drizzle omits the column expecting the DB default → null-violation = **hard insert blocker** (same class as sd_sales_orders.version).
- **DRIFT-NULL** (339): nullable, no default → insert silently stores NULL instead of the intended default = **silent data bug**.

Validation: sd_sales_orders.version → OK (DB default 0 restored); domain_events.id → DB default gen_random_uuid() present, def uses $defaultFn (excluded). Both confirmed fixes no longer drift.

## DRIFT-NN (104) — hard insert blockers

| table | column | drizzle_default | nullable | status |
|---|---|---|---|---|
| ai_insights | insight_type | default('ai_generated') | NOT NULL | DRIFT-NN |
| aisha_conversations | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| aisha_conversations | id | defaultRandom() | NOT NULL | DRIFT-NN (PK) |
| aisha_conversations | started_at | defaultNow() | NOT NULL | DRIFT-NN |
| aisha_conversations | status | default('active') | NOT NULL | DRIFT-NN |
| aisha_pending_approvals | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| aisha_pending_approvals | id | defaultRandom() | NOT NULL | DRIFT-NN (PK) |
| aisha_pending_approvals | status | default('pending') | NOT NULL | DRIFT-NN |
| aisha_tool_calls | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| aisha_tool_calls | id | defaultRandom() | NOT NULL | DRIFT-NN (PK) |
| aisha_voice_audit | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| aisha_voice_audit | id | defaultRandom() | NOT NULL | DRIFT-NN (PK) |
| approval_requests | amount | default('0') | NOT NULL | DRIFT-NN |
| camera_events | description | default('') | NOT NULL | DRIFT-NN |
| camera_quality_defects | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| camera_quality_defects | detected_at | defaultNow() | NOT NULL | DRIFT-NN |
| chat_starred_messages | id | default(sql`gen_random_uuid()`) | NOT NULL | DRIFT-NN (PK) |
| control_chart_point | id | default(sql`gen_random_uuid()::text`) | NOT NULL | DRIFT-NN (PK) |
| control_chart_point | timestamp | defaultNow() | NOT NULL | DRIFT-NN |
| crm_custom_fields | field_type | default('text') | NOT NULL | DRIFT-NN |
| customer_payments | amount | default('0') | NOT NULL | DRIFT-NN |
| customer_payments | payment_method | default('bank_transfer') | NOT NULL | DRIFT-NN |
| deals | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| deals | currency | default('UZS') | NOT NULL | DRIFT-NN |
| deals | status | default('new') | NOT NULL | DRIFT-NN |
| deals | updated_at | defaultNow() | NOT NULL | DRIFT-NN |
| employee_360_responses | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| employee_separation | id | default(sql`gen_random_uuid()`) | NOT NULL | DRIFT-NN (PK) |
| employee_separation | is_regretted | default(false) | NOT NULL | DRIFT-NN |
| enrollments | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| enrollments | updated_at | defaultNow() | NOT NULL | DRIFT-NN |
| gl_entries | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| hr_tz2_daily_attendance | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| hr_tz2_daily_attendance | updated_at | defaultNow() | NOT NULL | DRIFT-NN |
| invoices | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| invoices | items | default('[]') | NOT NULL | DRIFT-NN |
| invoices | status | default('draft') | NOT NULL | DRIFT-NN |
| invoices | updated_at | defaultNow() | NOT NULL | DRIFT-NN |
| knowledge_base | category | default('other') | NOT NULL | DRIFT-NN |
| knowledge_base | title_ru | default('') | NOT NULL | DRIFT-NN |
| leads | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| leads | status | default('new') | NOT NULL | DRIFT-NN |
| leads | updated_at | defaultNow() | NOT NULL | DRIFT-NN |
| lms_courses | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| lms_enrollments | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| maintenance_orders | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| maintenance_orders | priority | default('medium') | NOT NULL | DRIFT-NN |
| maintenance_orders | status | default('open') | NOT NULL | DRIFT-NN |
| maintenance_orders | updated_at | defaultNow() | NOT NULL | DRIFT-NN |
| materials | category | default('raw_material') | NOT NULL | DRIFT-NN |
| materials | max_stock | default('0') | NOT NULL | DRIFT-NN |
| materials | min_stock | default('0') | NOT NULL | DRIFT-NN |
| materials | unit_cost | default('0') | NOT NULL | DRIFT-NN |
| materials | unit_of_measure | default('kg') | NOT NULL | DRIFT-NN |
| mes_papka_orders | completed_qty | default(0) | NOT NULL | DRIFT-NN |
| mes_papka_orders | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| mes_papka_orders | priority | default('MEDIUM') | NOT NULL | DRIFT-NN |
| mes_papka_orders | quantity | default(0) | NOT NULL | DRIFT-NN |
| mes_papka_orders | status | default('PENDING') | NOT NULL | DRIFT-NN |
| mes_papka_orders | updated_at | defaultNow() | NOT NULL | DRIFT-NN |
| mes_shift_evaluations | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| mes_shift_evaluations | evaluated_at | defaultNow() | NOT NULL | DRIFT-NN |
| mes_shift_evaluations | quality_score | default('0') | NOT NULL | DRIFT-NN |
| mes_shift_evaluations | safety_score | default('0') | NOT NULL | DRIFT-NN |
| mes_shift_handovers | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| mes_shift_handovers | handover_time | defaultNow() | NOT NULL | DRIFT-NN |
| mes_shift_handovers | pending_tasks_count | default(0) | NOT NULL | DRIFT-NN |
| mes_tasks | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| mes_tasks | priority | default('MEDIUM') | NOT NULL | DRIFT-NN |
| mes_tasks | status | default('PENDING') | NOT NULL | DRIFT-NN |
| mes_tasks | updated_at | defaultNow() | NOT NULL | DRIFT-NN |
| mm_vendors | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| notifications | type | default('info') | NOT NULL | DRIFT-NN |
| overtime_policy | extended_multiplier | default('2.0') | NOT NULL | DRIFT-NN |
| overtime_policy | id | default(sql`gen_random_uuid()`) | NOT NULL | DRIFT-NN (PK) |
| overtime_policy | is_active | default(true) | NOT NULL | DRIFT-NN |
| overtime_policy | night_shift_bonus | default('0.5') | NOT NULL | DRIFT-NN |
| overtime_policy | night_shift_end_hour | default(6) | NOT NULL | DRIFT-NN |
| overtime_policy | night_shift_start_hour | default(22) | NOT NULL | DRIFT-NN |
| overtime_policy | regular_multiplier | default('1.5') | NOT NULL | DRIFT-NN |
| overtime_policy | regular_overtime_hours | default('2') | NOT NULL | DRIFT-NN |
| overtime_policy | weekend_multiplier | default('2.0') | NOT NULL | DRIFT-NN |
| payments | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| payments | currency | default('UZS') | NOT NULL | DRIFT-NN |
| payroll | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| payroll | status | default('pending') | NOT NULL | DRIFT-NN |
| qc_checkpoints | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| qc_checkpoints | is_active | default(true) | NOT NULL | DRIFT-NN |
| qc_checkpoints | stage | default('in_process') | NOT NULL | DRIFT-NN |
| qc_checkpoints | updated_at | defaultNow() | NOT NULL | DRIFT-NN |
| qc_spc_data | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| qc_spc_data | measured_at | defaultNow() | NOT NULL | DRIFT-NN |
| qc_standards | category | default('general') | NOT NULL | DRIFT-NN |
| refresh_tokens | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| refresh_tokens | is_revoked | default(false) | NOT NULL | DRIFT-NN |
| routing_operations | sequence | default(0) | NOT NULL | DRIFT-NN |
| safety_training_records | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| settings | updated_at | defaultNow() | NOT NULL | DRIFT-NN |
| stock_movements | created_at | defaultNow() | NOT NULL | DRIFT-NN |
| transfer_request_lines | unit | default('pcs') | NOT NULL | DRIFT-NN |
| transfer_requests | status | default('pending') | NOT NULL | DRIFT-NN |
| user_panels | name | default('My Dashboard') | NOT NULL | DRIFT-NN |
| warehouse_transactions | quantity | default('0') | NOT NULL | DRIFT-NN |
| work_centers | type | default('machine') | NOT NULL | DRIFT-NN |

## DRIFT-NULL (339) — silent NULL / lost default value

| table | column | drizzle_default | nullable | status |
|---|---|---|---|---|
| accounting_periods | is_closed | default(false) | NULL | DRIFT-NULL |
| adaptation_programs | duration_days | default(90) | NULL | DRIFT-NULL |
| adaptation_programs | is_active | default(true) | NULL | DRIFT-NULL |
| adaptation_records | current_milestone | default(1) | NULL | DRIFT-NULL |
| adaptation_records | is_extended | default(false) | NULL | DRIFT-NULL |
| adaptation_records | progress_percent | default(0) | NULL | DRIFT-NULL |
| adaptation_records | started_at | defaultNow() | NULL | DRIFT-NULL |
| advances | created_at | defaultNow() | NULL | DRIFT-NULL |
| advances | status | default('pending') | NULL | DRIFT-NULL |
| advances | updated_at | defaultNow() | NULL | DRIFT-NULL |
| ai_interview_sessions | created_at | defaultNow() | NULL | DRIFT-NULL |
| ai_planning_config | updated_at | defaultNow() | NULL | DRIFT-NULL |
| ai_report_categories | is_active | default(true) | NULL | DRIFT-NULL |
| ai_report_categories | order_index | default(0) | NULL | DRIFT-NULL |
| ai_report_runs | created_at | defaultNow() | NULL | DRIFT-NULL |
| ai_report_subscriptions | frequency | default('weekly') | NULL | DRIFT-NULL |
| ap_aging_buckets | updated_at | defaultNow() | NULL | DRIFT-NULL |
| approval_requests | created_at | defaultNow() | NULL | DRIFT-NULL |
| approval_requests | updated_at | defaultNow() | NULL | DRIFT-NULL |
| ar_aging_buckets | updated_at | defaultNow() | NULL | DRIFT-NULL |
| assessment_skips | created_at | defaultNow() | NULL | DRIFT-NULL |
| asset_items | is_active | default(true) | NULL | DRIFT-NULL |
| attendance | early_leave_minutes | default(0) | NULL | DRIFT-NULL |
| attendance | is_approved | default(false) | NULL | DRIFT-NULL |
| attendance | late_minutes | default(0) | NULL | DRIFT-NULL |
| attendance | overtime_minutes | default(0) | NULL | DRIFT-NULL |
| attendance_logs | created_at | defaultNow() | NULL | DRIFT-NULL |
| boms | created_at | defaultNow() | NULL | DRIFT-NULL |
| boms | is_active | default(true) | NULL | DRIFT-NULL |
| boms | items | default([]) | NULL | DRIFT-NULL |
| boms | version | default('1.0') | NULL | DRIFT-NULL |
| budgets | total_actual | default('0') | NULL | DRIFT-NULL |
| budgets | total_planned | default('0') | NULL | DRIFT-NULL |
| budgets | updated_at | defaultNow() | NULL | DRIFT-NULL |
| calendar_events | updated_at | defaultNow() | NULL | DRIFT-NULL |
| camera_employee_reports | created_at | defaultNow() | NULL | DRIFT-NULL |
| camera_logs | created_at | defaultNow() | NULL | DRIFT-NULL |
| camera_quality_defects | severity | default('medium') | NULL | DRIFT-NULL |
| camera_quality_defects | status | default('open') | NULL | DRIFT-NULL |
| certificates | created_at | defaultNow() | NULL | DRIFT-NULL |
| certificates | is_active | default(true) | NULL | DRIFT-NULL |
| certificates | updated_at | defaultNow() | NULL | DRIFT-NULL |
| chat_poll_votes | option_ids | default(sql`'[]'::jsonb`) | NULL | DRIFT-NULL |
| chat_poll_votes | voted_at | defaultNow() | NULL | DRIFT-NULL |
| chat_polls | is_closed | default(false) | NULL | DRIFT-NULL |
| chat_polls | total_votes | default(0) | NULL | DRIFT-NULL |
| chat_starred_messages | created_at | defaultNow() | NULL | DRIFT-NULL |
| chat_user_presence | status | default('OFFLINE') | NULL | DRIFT-NULL |
| chat_user_presence | updated_at | defaultNow() | NULL | DRIFT-NULL |
| clients | created_at | defaultNow() | NULL | DRIFT-NULL |
| cost_centers | updated_at | defaultNow() | NULL | DRIFT-NULL |
| courses | is_active | default(true) | NULL | DRIFT-NULL |
| courses | is_mandatory | default(false) | NULL | DRIFT-NULL |
| courses | updated_at | defaultNow() | NULL | DRIFT-NULL |
| crm_activities | status | default('scheduled') | NULL | DRIFT-NULL |
| crm_custom_fields | is_active | default(true) | NULL | DRIFT-NULL |
| crm_custom_fields | order_index | default(0) | NULL | DRIFT-NULL |
| crm_history | created_at | defaultNow() | NULL | DRIFT-NULL |
| crm_lead_stages | is_active | default(true) | NULL | DRIFT-NULL |
| crm_lead_stages | order_index | default(0) | NULL | DRIFT-NULL |
| customs_declarations | created_at | defaultNow() | NULL | DRIFT-NULL |
| customs_declarations | status | default('draft') | NULL | DRIFT-NULL |
| customs_declarations | updated_at | defaultNow() | NULL | DRIFT-NULL |
| daily_financial_metrics | gross_profit | default(0) | NULL | DRIFT-NULL |
| daily_financial_metrics | total_expenses | default(0) | NULL | DRIFT-NULL |
| deals | probability | default(0) | NULL | DRIFT-NULL |
| design_order_revisions | created_at | defaultNow() | NULL | DRIFT-NULL |
| design_order_revisions | version | default(1) | NULL | DRIFT-NULL |
| disciplinary_actions | created_at | defaultNow() | NULL | DRIFT-NULL |
| disciplinary_actions | severity | default('warning') | NULL | DRIFT-NULL |
| disciplinary_actions | updated_at | defaultNow() | NULL | DRIFT-NULL |
| discipline_records | is_final_warning | default(false) | NULL | DRIFT-NULL |
| discipline_records | is_first_warning | default(false) | NULL | DRIFT-NULL |
| discipline_records | is_second_warning | default(false) | NULL | DRIFT-NULL |
| discipline_records | updated_at | defaultNow() | NULL | DRIFT-NULL |
| discipline_records | violation_count_this_category | default(1) | NULL | DRIFT-NULL |
| document_templates | created_at | defaultNow() | NULL | DRIFT-NULL |
| document_templates | is_active | default(true) | NULL | DRIFT-NULL |
| employee_360_assessments | status | default("draft") | NULL | DRIFT-NULL |
| employee_360_assessments | updated_at | defaultNow() | NULL | DRIFT-NULL |
| employee_bank_accounts | currency | default("UZS") | NULL | DRIFT-NULL |
| employee_bank_accounts | is_active | default(true) | NULL | DRIFT-NULL |
| employee_bank_accounts | updated_at | defaultNow() | NULL | DRIFT-NULL |
| employee_benefits | created_at | defaultNow() | NULL | DRIFT-NULL |
| employee_benefits | status | default('active') | NULL | DRIFT-NULL |
| employee_daily_kpi | calculated_by | default("system") | NULL | DRIFT-NULL |
| employee_daily_reports | created_at | defaultNow() | NULL | DRIFT-NULL |
| employee_daily_reports | data | default({}) | NULL | DRIFT-NULL |
| employee_files | is_public | default(false) | NULL | DRIFT-NULL |
| employee_files | upload_date | defaultNow() | NULL | DRIFT-NULL |
| employee_rating_goals | created_at | defaultNow() | NULL | DRIFT-NULL |
| employee_ratings | status | default("draft") | NULL | DRIFT-NULL |
| employee_separation | created_at | defaultNow() | NULL | DRIFT-NULL |
| enps_survey_responses | submitted_at | defaultNow() | NULL | DRIFT-NULL |
| enrollments | enrolled_at | defaultNow() | NULL | DRIFT-NULL |
| enrollments | progress_percent | default(0) | NULL | DRIFT-NULL |
| enrollments | status | default("enrolled") | NULL | DRIFT-NULL |
| erp_daily_reports | created_at | defaultNow() | NULL | DRIFT-NULL |
| erp_daily_reports | data | default({}) | NULL | DRIFT-NULL |
| erp_downtime_logs | created_at | defaultNow() | NULL | DRIFT-NULL |
| erp_employee_work_centers | created_at | defaultNow() | NULL | DRIFT-NULL |
| erp_employees | created_at | defaultNow() | NULL | DRIFT-NULL |
| erp_employees | is_active | default(true) | NULL | DRIFT-NULL |
| erp_mrp_results | created_at | defaultNow() | NULL | DRIFT-NULL |
| erp_purchase_requisitions | created_at | defaultNow() | NULL | DRIFT-NULL |
| erp_purchase_requisitions | status | default('pending') | NULL | DRIFT-NULL |
| erp_purchase_requisitions | updated_at | defaultNow() | NULL | DRIFT-NULL |
| fi_invoices | created_at | defaultNow() | NULL | DRIFT-NULL |
| fi_invoices | currency | default('UZS') | NULL | DRIFT-NULL |
| fi_invoices | status | default('pending') | NULL | DRIFT-NULL |
| fi_invoices | type | default('payable') | NULL | DRIFT-NULL |
| fi_invoices | updated_at | defaultNow() | NULL | DRIFT-NULL |
| finance_invoice_lines | created_at | defaultNow() | NULL | DRIFT-NULL |
| finance_invoices | created_at | defaultNow() | NULL | DRIFT-NULL |
| finance_invoices | paid_amount | default('0') | NULL | DRIFT-NULL |
| finance_invoices | payment_status | default('unpaid') | NULL | DRIFT-NULL |
| finance_invoices | updated_at | defaultNow() | NULL | DRIFT-NULL |
| fp_cycles | created_at | defaultNow() | NULL | DRIFT-NULL |
| fp_cycles | status | default('open') | NULL | DRIFT-NULL |
| fp_cycles | total_amount | default('0') | NULL | DRIFT-NULL |
| fp_cycles | updated_at | defaultNow() | NULL | DRIFT-NULL |
| gl_account_mappings | created_at | defaultNow() | NULL | DRIFT-NULL |
| gl_account_mappings | updated_at | defaultNow() | NULL | DRIFT-NULL |
| gl_documents | updated_at | defaultNow() | NULL | DRIFT-NULL |
| gl_entries | posted_at | defaultNow() | NULL | DRIFT-NULL |
| gl_journal_entries | created_at | defaultNow() | NULL | DRIFT-NULL |
| gl_journal_entries | currency | default('UZS') | NULL | DRIFT-NULL |
| gl_journal_entries | posted_at | defaultNow() | NULL | DRIFT-NULL |
| guidelines | updated_at | defaultNow() | NULL | DRIFT-NULL |
| hazard_zones | hazard_level | default('low') | NULL | DRIFT-NULL |
| hr_360_feedback | recorded_at | defaultNow() | NULL | DRIFT-NULL |
| hr_adaptation_cases | created_at | defaultNow() | NULL | DRIFT-NULL |
| hr_adaptation_cases | updated_at | defaultNow() | NULL | DRIFT-NULL |
| hr_tz2_daily_attendance | status | default('present') | NULL | DRIFT-NULL |
| hr_tz2_security_alerts | created_at | defaultNow() | NULL | DRIFT-NULL |
| hr_tz2_security_alerts | resolved | default(false) | NULL | DRIFT-NULL |
| hrc_iq_questions | created_at | defaultNow() | NULL | DRIFT-NULL |
| inventory_count_lines | counted_quantity | default('0') | NULL | DRIFT-NULL |
| inventory_count_lines | system_quantity | default('0') | NULL | DRIFT-NULL |
| inventory_count_lines | unit | default('pcs') | NULL | DRIFT-NULL |
| inventory_count_lines | variance | default('0') | NULL | DRIFT-NULL |
| inventory_counts | updated_at | defaultNow() | NULL | DRIFT-NULL |
| invoices | paid_amount | default('0') | NULL | DRIFT-NULL |
| knowledge_base | content | default('') | NULL | DRIFT-NULL |
| knowledge_base | content_ru | default('') | NULL | DRIFT-NULL |
| knowledge_base | tags | default([]) | NULL | DRIFT-NULL |
| kpi_values | created_at | defaultNow() | NULL | DRIFT-NULL |
| kpi_values | recorded_at | defaultNow() | NULL | DRIFT-NULL |
| leave_requests | director_status | default("pending") | NULL | DRIFT-NULL |
| leave_requests | hr_status | default("pending") | NULL | DRIFT-NULL |
| leave_requests | manager_status | default("pending") | NULL | DRIFT-NULL |
| leave_requests | updated_at | defaultNow() | NULL | DRIFT-NULL |
| lms_courses | is_mandatory | default(false) | NULL | DRIFT-NULL |
| lms_courses | passing_score | default(80) | NULL | DRIFT-NULL |
| lms_knowledge | updated_at | defaultNow() | NULL | DRIFT-NULL |
| lms_support_tickets | created_at | defaultNow() | NULL | DRIFT-NULL |
| lms_support_tickets | priority | default('medium') | NULL | DRIFT-NULL |
| lms_support_tickets | updated_at | defaultNow() | NULL | DRIFT-NULL |
| lms_test_attempts | created_at | defaultNow() | NULL | DRIFT-NULL |
| lms_test_attempts | passed | default(false) | NULL | DRIFT-NULL |
| lms_tests | created_at | defaultNow() | NULL | DRIFT-NULL |
| lms_tests | is_active | default(true) | NULL | DRIFT-NULL |
| lms_tests | pass_score | default(70) | NULL | DRIFT-NULL |
| lms_tests_ext | created_at | defaultNow() | NULL | DRIFT-NULL |
| lms_tests_ext | is_active | default(true) | NULL | DRIFT-NULL |
| lms_tests_ext | pass_score | default(70) | NULL | DRIFT-NULL |
| materials | created_at | defaultNow() | NULL | DRIFT-NULL |
| materials | is_active | default(true) | NULL | DRIFT-NULL |
| materials | updated_at | defaultNow() | NULL | DRIFT-NULL |
| mes_shift_stats | created_at | defaultNow() | NULL | DRIFT-NULL |
| mes_shift_stats | defect_qty | default('0') | NULL | DRIFT-NULL |
| mes_shift_stats | downtime_min | default(0) | NULL | DRIFT-NULL |
| mes_shift_stats | produced_qty | default('0') | NULL | DRIFT-NULL |
| mm_goods_issue_items | created_at | defaultNow() | NULL | DRIFT-NULL |
| mm_goods_issue_items | quantity | default('0') | NULL | DRIFT-NULL |
| mm_goods_issues | created_at | defaultNow() | NULL | DRIFT-NULL |
| mm_goods_issues | status | default('pending') | NULL | DRIFT-NULL |
| mm_goods_receipt_items | created_at | defaultNow() | NULL | DRIFT-NULL |
| mm_goods_receipt_items | ordered_qty | default('0') | NULL | DRIFT-NULL |
| mm_goods_receipt_items | received_qty | default('0') | NULL | DRIFT-NULL |
| mm_goods_receipt_lines | created_at | defaultNow() | NULL | DRIFT-NULL |
| mm_goods_receipts | created_at | defaultNow() | NULL | DRIFT-NULL |
| mm_goods_receipts | status | default('pending') | NULL | DRIFT-NULL |
| mm_materials | created_at | defaultNow() | NULL | DRIFT-NULL |
| mm_materials | is_active | default(true) | NULL | DRIFT-NULL |
| mm_materials | updated_at | defaultNow() | NULL | DRIFT-NULL |
| mm_purchase_order_items | created_at | defaultNow() | NULL | DRIFT-NULL |
| mro_canteen_logs | cost_per_portion | default('0') | NULL | DRIFT-NULL |
| mro_canteen_logs | created_at | defaultNow() | NULL | DRIFT-NULL |
| mro_canteen_logs | employees_served | default(0) | NULL | DRIFT-NULL |
| mro_canteen_logs | portion_count | default(0) | NULL | DRIFT-NULL |
| mro_canteen_logs | total_cost | default('0') | NULL | DRIFT-NULL |
| mro_canteen_logs | updated_at | defaultNow() | NULL | DRIFT-NULL |
| mro_equipment | created_at | defaultNow() | NULL | DRIFT-NULL |
| mro_equipment | status | default('active') | NULL | DRIFT-NULL |
| mro_equipment | updated_at | defaultNow() | NULL | DRIFT-NULL |
| mro_pm_schedules | created_at | defaultNow() | NULL | DRIFT-NULL |
| mro_pm_schedules | interval_days | default(30) | NULL | DRIFT-NULL |
| mro_pm_schedules | schedule_type | default('monthly') | NULL | DRIFT-NULL |
| mro_pm_schedules | status | default('scheduled') | NULL | DRIFT-NULL |
| mro_pm_schedules | updated_at | defaultNow() | NULL | DRIFT-NULL |
| mro_work_orders | created_at | defaultNow() | NULL | DRIFT-NULL |
| mro_work_orders | priority | default('normal') | NULL | DRIFT-NULL |
| mro_work_orders | status | default('pending') | NULL | DRIFT-NULL |
| mro_work_orders | type | default('preventive') | NULL | DRIFT-NULL |
| mro_work_orders | updated_at | defaultNow() | NULL | DRIFT-NULL |
| notification_preferences | channel | default('all') | NULL | DRIFT-NULL |
| notification_preferences | enabled | default(true) | NULL | DRIFT-NULL |
| otp_sessions | is_used | default(false) | NULL | DRIFT-NULL |
| overtime_policy | created_at | defaultNow() | NULL | DRIFT-NULL |
| papka_orders | is_deleted | default(false) | NULL | DRIFT-NULL |
| papka_orders | updated_at | defaultNow() | NULL | DRIFT-NULL |
| payroll_advances | created_at | defaultNow() | NULL | DRIFT-NULL |
| payroll_advances | status | default('pending') | NULL | DRIFT-NULL |
| payroll_deductions | created_at | defaultNow() | NULL | DRIFT-NULL |
| payroll_deductions | status | default('pending') | NULL | DRIFT-NULL |
| payroll_entries | created_at | defaultNow() | NULL | DRIFT-NULL |
| payroll_entries | status | default('pending') | NULL | DRIFT-NULL |
| payroll_entries | updated_at | defaultNow() | NULL | DRIFT-NULL |
| payroll_periods | employee_count | default(0) | NULL | DRIFT-NULL |
| payroll_periods | updated_at | defaultNow() | NULL | DRIFT-NULL |
| pip_progress | created_at | defaultNow() | NULL | DRIFT-NULL |
| pos_categories | created_at | defaultNow() | NULL | DRIFT-NULL |
| pos_categories | is_active | default(true) | NULL | DRIFT-NULL |
| pos_order_items | created_at | defaultNow() | NULL | DRIFT-NULL |
| pos_orders | created_at | defaultNow() | NULL | DRIFT-NULL |
| pos_orders | status | default('open') | NULL | DRIFT-NULL |
| pos_orders | total_amount | default('0') | NULL | DRIFT-NULL |
| pos_orders | updated_at | defaultNow() | NULL | DRIFT-NULL |
| pos_printer_configs | created_at | defaultNow() | NULL | DRIFT-NULL |
| pos_printer_configs | is_active | default(true) | NULL | DRIFT-NULL |
| pos_printer_configs | is_default | default(false) | NULL | DRIFT-NULL |
| pos_printer_configs | settings | default({}) | NULL | DRIFT-NULL |
| pos_printer_configs | updated_at | defaultNow() | NULL | DRIFT-NULL |
| position_folders | created_at | defaultNow() | NULL | DRIFT-NULL |
| position_folders | updated_at | defaultNow() | NULL | DRIFT-NULL |
| positions | headcount | default(1) | NULL | DRIFT-NULL |
| ppe_compliance | is_compliant | default(true) | NULL | DRIFT-NULL |
| profit_centers | updated_at | defaultNow() | NULL | DRIFT-NULL |
| purchase_invoices | currency | default('UZS') | NULL | DRIFT-NULL |
| purchase_invoices | status | default('pending') | NULL | DRIFT-NULL |
| purchase_orders | invoice_matched | default(false) | NULL | DRIFT-NULL |
| purchase_orders | items | default('[]') | NULL | DRIFT-NULL |
| purchase_orders | three_way_matched | default(false) | NULL | DRIFT-NULL |
| purchase_orders | updated_at | defaultNow() | NULL | DRIFT-NULL |
| qc_in_process_inspections | created_at | defaultNow() | NULL | DRIFT-NULL |
| qc_in_process_inspections | defects_found | default(0) | NULL | DRIFT-NULL |
| qc_in_process_inspections | status | default('pending') | NULL | DRIFT-NULL |
| qc_in_process_inspections | updated_at | defaultNow() | NULL | DRIFT-NULL |
| qc_reclamations | reported_date | defaultNow() | NULL | DRIFT-NULL |
| qc_standards | updated_at | defaultNow() | NULL | DRIFT-NULL |
| qc_supplier_quality | defects_found | default(0) | NULL | DRIFT-NULL |
| qc_supplier_quality | sample_size | default(0) | NULL | DRIFT-NULL |
| qc_supplier_quality | status | default('pending') | NULL | DRIFT-NULL |
| questionnaire_questions | sort_order | default(0) | NULL | DRIFT-NULL |
| questionnaire_questions | weight | default("1.0") | NULL | DRIFT-NULL |
| raci_matrix | created_at | defaultNow() | NULL | DRIFT-NULL |
| risk_assessments | created_at | defaultNow() | NULL | DRIFT-NULL |
| risk_assessments | status | default('open') | NULL | DRIFT-NULL |
| risk_assessments | updated_at | defaultNow() | NULL | DRIFT-NULL |
| routings | is_active | default(true) | NULL | DRIFT-NULL |
| routings | steps | default('[]') | NULL | DRIFT-NULL |
| routings | work_centers | default('[]') | NULL | DRIFT-NULL |
| safety_incidents | days_lost | default(0) | NULL | DRIFT-NULL |
| safety_incidents | investigation_status | default("open") | NULL | DRIFT-NULL |
| safety_training_records | is_passed | default(false) | NULL | DRIFT-NULL |
| salary_history | other_bonuses | default('0') | NULL | DRIFT-NULL |
| salary_history | status | default("draft") | NULL | DRIFT-NULL |
| salary_history | total_bonuses | default('0') | NULL | DRIFT-NULL |
| salary_history | updated_at | defaultNow() | NULL | DRIFT-NULL |
| sales_invoices | currency | default("UZS") | NULL | DRIFT-NULL |
| sales_orders | bom_checked | default(false) | NULL | DRIFT-NULL |
| sales_orders | routing_checked | default(false) | NULL | DRIFT-NULL |
| sales_orders | tech_card_checked | default(false) | NULL | DRIFT-NULL |
| sd_rentals | created_at | defaultNow() | NULL | DRIFT-NULL |
| sd_rentals | status | default('active') | NULL | DRIFT-NULL |
| sd_rentals | updated_at | defaultNow() | NULL | DRIFT-NULL |
| sd_sales_orders | advance_paid | default('0') | NULL | DRIFT-NULL |
| sd_sales_orders | advance_required | default(70) | NULL | DRIFT-NULL |
| sd_sales_orders | advance_status | default('pending') | NULL | DRIFT-NULL |
| sd_sales_orders | created_at | defaultNow() | NULL | DRIFT-NULL |
| sd_sales_orders | design_flag | default(false) | NULL | DRIFT-NULL |
| sd_sales_orders | is_vip | default(false) | NULL | DRIFT-NULL |
| sd_sales_orders | sample_flag | default(false) | NULL | DRIFT-NULL |
| sd_sales_orders | status | default('pending') | NULL | DRIFT-NULL |
| sd_sales_orders | updated_at | defaultNow() | NULL | DRIFT-NULL |
| seven_function_kpis | created_at | defaultNow() | NULL | DRIFT-NULL |
| seven_function_kpis | frequency | default('monthly') | NULL | DRIFT-NULL |
| seven_function_kpis | updated_at | defaultNow() | NULL | DRIFT-NULL |
| seven_functions | created_at | defaultNow() | NULL | DRIFT-NULL |
| seven_functions | order_index | default(0) | NULL | DRIFT-NULL |
| seven_functions | updated_at | defaultNow() | NULL | DRIFT-NULL |
| shift_schedules | updated_at | defaultNow() | NULL | DRIFT-NULL |
| shifts | created_at | defaultNow() | NULL | DRIFT-NULL |
| shifts | is_active | default(true) | NULL | DRIFT-NULL |
| shifts | updated_at | defaultNow() | NULL | DRIFT-NULL |
| stock_gl_postings | created_at | defaultNow() | NULL | DRIFT-NULL |
| stock_gl_postings | status | default('pending') | NULL | DRIFT-NULL |
| stocks | created_at | defaultNow() | NULL | DRIFT-NULL |
| stocks | quantity | default('0') | NULL | DRIFT-NULL |
| stocks | reserved_quantity | default('0') | NULL | DRIFT-NULL |
| system_alerts | level | default('info') | NULL | DRIFT-NULL |
| three_way_match_results | status | default('pending') | NULL | DRIFT-NULL |
| transfer_requests | created_at | defaultNow() | NULL | DRIFT-NULL |
| transfer_requests | updated_at | defaultNow() | NULL | DRIFT-NULL |
| user_panels | created_at | defaultNow() | NULL | DRIFT-NULL |
| user_panels | is_default | default(false) | NULL | DRIFT-NULL |
| user_panels | updated_at | defaultNow() | NULL | DRIFT-NULL |
| vacancies | number_of_positions | default(1) | NULL | DRIFT-NULL |
| vacancies | priority | default("normal") | NULL | DRIFT-NULL |
| vacancies | updated_at | defaultNow() | NULL | DRIFT-NULL |
| vendor_performance | created_at | defaultNow() | NULL | DRIFT-NULL |
| vendors | payment_terms | default(30) | NULL | DRIFT-NULL |
| warehouse_access_grants | access_level | default('read') | NULL | DRIFT-NULL |
| warehouse_access_grants | created_at | defaultNow() | NULL | DRIFT-NULL |
| warehouse_batches | created_at | defaultNow() | NULL | DRIFT-NULL |
| warehouse_stock | updated_at | defaultNow() | NULL | DRIFT-NULL |
| warehouse_transactions | balance_after | default('0') | NULL | DRIFT-NULL |
| warehouse_transactions | balance_before | default('0') | NULL | DRIFT-NULL |
| warehouse_transfers | created_at | defaultNow() | NULL | DRIFT-NULL |
| warehouse_transfers | status | default('pending') | NULL | DRIFT-NULL |
| wms_alerts | created_at | defaultNow() | NULL | DRIFT-NULL |
| wms_alerts | is_resolved | default(false) | NULL | DRIFT-NULL |
| wms_alerts | severity | default('medium') | NULL | DRIFT-NULL |
| wms_exit_logs | created_at | defaultNow() | NULL | DRIFT-NULL |
| wms_internal_requests | created_at | defaultNow() | NULL | DRIFT-NULL |
| wms_internal_requests | status | default('pending') | NULL | DRIFT-NULL |
| wms_inventory_counts | created_at | defaultNow() | NULL | DRIFT-NULL |
| wms_production_supply | created_at | defaultNow() | NULL | DRIFT-NULL |
| wms_stock | created_at | defaultNow() | NULL | DRIFT-NULL |
| wms_stock_batches | received_at | defaultNow() | NULL | DRIFT-NULL |
| wms_stock_levels | updated_at | defaultNow() | NULL | DRIFT-NULL |
| wms_transactions | created_at | defaultNow() | NULL | DRIFT-NULL |
| wms_warehouses | created_at | defaultNow() | NULL | DRIFT-NULL |
| wms_warehouses | is_active | default(true) | NULL | DRIFT-NULL |
| work_centers | capacity | default('8') | NULL | DRIFT-NULL |
| work_centers | cost_per_hour | default('0') | NULL | DRIFT-NULL |
| work_centers | updated_at | defaultNow() | NULL | DRIFT-NULL |
| zone_tracking_logs | created_at | defaultNow() | NULL | DRIFT-NULL |
