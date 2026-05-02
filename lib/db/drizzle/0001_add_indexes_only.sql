-- Index-only migration: 394 CREATE INDEX IF NOT EXISTS statements
-- Each wrapped in DO block to safely skip indexes on non-existent tables

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_companies_status" ON "crm_companies" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_companies_customer_type" ON "crm_companies" USING btree ("customer_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_companies_customer_category" ON "crm_companies" USING btree ("customer_category");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_companies_segment" ON "crm_companies" USING btree ("segment");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_companies_assigned_by_id" ON "crm_companies" USING btree ("assigned_by_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_companies_deleted_at" ON "crm_companies" USING btree ("deleted_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_companies_is_blocked" ON "crm_companies" USING btree ("is_blocked");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_contacts_company_id" ON "crm_contacts" USING btree ("company_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_contacts_assigned_by_id" ON "crm_contacts" USING btree ("assigned_by_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_contacts_deleted_at" ON "crm_contacts" USING btree ("deleted_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_leads_status_id" ON "crm_leads" USING btree ("status_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_leads_assigned_by_id" ON "crm_leads" USING btree ("assigned_by_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_leads_source_id" ON "crm_leads" USING btree ("source_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_leads_date_create" ON "crm_leads" USING btree ("date_create");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_crm_leads_deleted_at" ON "crm_leads" USING btree ("deleted_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_customer_contacts_customer_id" ON "customer_contacts" USING btree ("customer_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_advance_payments_vendor_id" ON "advance_payments" USING btree ("vendor_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_advance_payments_employee_id" ON "advance_payments" USING btree ("employee_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_advance_payments_status" ON "advance_payments" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_advance_payments_created_at" ON "advance_payments" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_finance_insights_insight_type" ON "ai_finance_insights" USING btree ("insight_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_finance_insights_segment" ON "ai_finance_insights" USING btree ("segment");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_finance_insights_priority" ON "ai_finance_insights" USING btree ("priority");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_finance_insights_created_at" ON "ai_finance_insights" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ap_aging_buckets_vendor_id" ON "ap_aging_buckets" USING btree ("vendor_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ar_aging_buckets_customer_id" ON "ar_aging_buckets" USING btree ("customer_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ar_aging_buckets_customer_type" ON "ar_aging_buckets" USING btree ("customer_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bank_accounts_currency" ON "bank_accounts" USING btree ("currency");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bank_accounts_account_type" ON "bank_accounts" USING btree ("account_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bank_statements_bank_account" ON "bank_statements" USING btree ("bank_account");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bank_statements_transaction_date" ON "bank_statements" USING btree ("transaction_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bank_statements_is_matched" ON "bank_statements" USING btree ("is_matched");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_budget_controls_budget_type" ON "budget_controls" USING btree ("budget_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_budget_controls_fiscal_year" ON "budget_controls" USING btree ("fiscal_year");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_budget_controls_status" ON "budget_controls" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_budget_lines_budget_id" ON "budget_lines" USING btree ("budget_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_budget_lines_account_id" ON "budget_lines" USING btree ("account_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_budget_lines_cost_center_id" ON "budget_lines" USING btree ("cost_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_budgets_fiscal_year" ON "budgets" USING btree ("fiscal_year");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_budgets_status" ON "budgets" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_budgets_period_type" ON "budgets" USING btree ("period_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_flow_transactions_bank_account_id" ON "cash_flow_transactions" USING btree ("bank_account_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_flow_transactions_transaction_type" ON "cash_flow_transactions" USING btree ("transaction_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_flow_transactions_category" ON "cash_flow_transactions" USING btree ("category");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_flow_transactions_created_at" ON "cash_flow_transactions" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_registers_custodian_id" ON "cash_registers" USING btree ("custodian_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_registers_currency" ON "cash_registers" USING btree ("currency");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_sessions_register_id" ON "cash_sessions" USING btree ("register_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_sessions_status" ON "cash_sessions" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_sessions_opened_at" ON "cash_sessions" USING btree ("opened_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_transactions_session_id" ON "cash_transactions" USING btree ("session_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_transactions_register_id" ON "cash_transactions" USING btree ("register_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_transactions_transaction_type" ON "cash_transactions" USING btree ("transaction_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_transactions_reference_type" ON "cash_transactions" USING btree ("reference_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_transactions_created_at" ON "cash_transactions" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_conversations_telegram_chat_id" ON "cfo_bot_conversations" USING btree ("telegram_chat_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_conversations_role" ON "cfo_bot_conversations" USING btree ("role");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_documents_telegram_chat_id" ON "cfo_bot_documents" USING btree ("telegram_chat_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_documents_status" ON "cfo_bot_documents" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_expenses_telegram_chat_id" ON "cfo_bot_expenses" USING btree ("telegram_chat_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_expenses_category" ON "cfo_bot_expenses" USING btree ("category");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_expenses_status" ON "cfo_bot_expenses" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_expenses_created_at" ON "cfo_bot_expenses" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_health_logs_telegram_chat_id" ON "cfo_bot_health_logs" USING btree ("telegram_chat_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_health_logs_log_type" ON "cfo_bot_health_logs" USING btree ("log_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_reminders_telegram_chat_id" ON "cfo_bot_reminders" USING btree ("telegram_chat_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_reminders_status" ON "cfo_bot_reminders" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_reminders_remind_at" ON "cfo_bot_reminders" USING btree ("remind_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cfo_bot_settings_language" ON "cfo_bot_settings" USING btree ("language");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_customer_payments_customer_id" ON "customer_payments" USING btree ("customer_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_customer_payments_status" ON "customer_payments" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_customer_payments_created_at" ON "customer_payments" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_daily_financial_metrics_metric_date" ON "daily_financial_metrics" USING btree ("metric_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_expense_attachments_expense_report_id" ON "expense_attachments" USING btree ("expense_report_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_expense_reports_expense_request_id" ON "expense_reports" USING btree ("expense_request_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_expense_reports_status" ON "expense_reports" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_expense_reports_submitted_by" ON "expense_reports" USING btree ("submitted_by");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_expense_requests_requested_by" ON "expense_requests" USING btree ("requested_by");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_expense_requests_status" ON "expense_requests" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_expense_requests_category" ON "expense_requests" USING btree ("category");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_expense_requests_created_at" ON "expense_requests" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_finance_categories_category_type" ON "finance_categories" USING btree ("category_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_finance_categories_is_active" ON "finance_categories" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_financial_kpis_kpi_date" ON "financial_kpis" USING btree ("kpi_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_financial_kpis_kpi_period" ON "financial_kpis" USING btree ("kpi_period");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_gl_documents_status" ON "gl_documents" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_gl_documents_document_type" ON "gl_documents" USING btree ("document_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_gl_documents_document_date" ON "gl_documents" USING btree ("document_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_gl_documents_reference_id" ON "gl_documents" USING btree ("reference_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_gl_documents_created_at" ON "gl_documents" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_income_expense_transactions_transaction_type" ON "income_expense_transactions" USING btree ("transaction_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_income_expense_transactions_status" ON "income_expense_transactions" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_income_expense_transactions_created_at" ON "income_expense_transactions" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_income_expense_transactions_reference_type" ON "income_expense_transactions" USING btree ("reference_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_invoice_payment_matching_invoice_id" ON "invoice_payment_matching" USING btree ("invoice_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_invoice_payment_matching_payment_id" ON "invoice_payment_matching" USING btree ("payment_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_invoice_payments_vendor_id" ON "invoice_payments" USING btree ("vendor_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_invoice_payments_status" ON "invoice_payments" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_invoice_payments_created_at" ON "invoice_payments" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_order_costing_lines_order_costing_id" ON "order_costing_lines" USING btree ("order_costing_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_order_costing_lines_cost_type" ON "order_costing_lines" USING btree ("cost_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_order_costings_sales_order_id" ON "order_costings" USING btree ("sales_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_order_costings_production_order_id" ON "order_costings" USING btree ("production_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_order_costings_status" ON "order_costings" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_ai_recommendations_employee_id" ON "payroll_ai_recommendations" USING btree ("employee_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_ai_recommendations_period_month" ON "payroll_ai_recommendations" USING btree ("period_month");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_ai_recommendations_status" ON "payroll_ai_recommendations" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_calculations_employee_id" ON "payroll_calculations" USING btree ("employee_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_calculations_period_id" ON "payroll_calculations" USING btree ("period_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_calculations_status" ON "payroll_calculations" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_calculations_created_at" ON "payroll_calculations" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_contracts_employee_id" ON "payroll_contracts" USING btree ("employee_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_contracts_status" ON "payroll_contracts" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_contracts_pay_type" ON "payroll_contracts" USING btree ("pay_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_tax_rules_tax_type" ON "payroll_tax_rules" USING btree ("tax_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_tax_rules_is_active" ON "payroll_tax_rules" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_work_evidence_employee_id" ON "payroll_work_evidence" USING btree ("employee_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_payroll_work_evidence_period_month" ON "payroll_work_evidence" USING btree ("period_month");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_pos_products_category" ON "pos_products" USING btree ("category");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_pos_products_is_active" ON "pos_products" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_pos_transactions_cashier_id" ON "pos_transactions" USING btree ("cashier_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_pos_transactions_payment_method" ON "pos_transactions" USING btree ("payment_method");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_pos_transactions_status" ON "pos_transactions" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_pos_transactions_created_at" ON "pos_transactions" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_ledger_product_master_id" ON "stock_ledger" USING btree ("product_master_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_ledger_warehouse_id" ON "stock_ledger" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bonus_payments_user_id" ON "bonus_payments" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_business_trips_user_id" ON "business_trips" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_business_trips_status" ON "business_trips" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_advances_user_id" ON "cash_advances" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_cash_advances_status" ON "cash_advances" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_employee_bank_accounts_user_id" ON "employee_bank_accounts" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_employee_emergency_contacts_user_id" ON "employee_emergency_contacts" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_employee_fines_user_id" ON "employee_fines" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_employee_passports_user_id" ON "employee_passports" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_employment_contracts_user_id" ON "employment_contracts" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_employment_contracts_is_active" ON "employment_contracts" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_leave_requests_user_id" ON "leave_requests" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_leave_requests_status" ON "leave_requests" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_leave_requests_created_at" ON "leave_requests" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_leave_requests_leave_type" ON "leave_requests" USING btree ("leave_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_overtime_payments_user_id" ON "overtime_payments" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_salary_history_user_id" ON "salary_history" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_sick_leaves_user_id" ON "sick_leaves" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_kanban_cards_board_id" ON "kanban_cards" USING btree ("board_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_kanban_cards_column_id" ON "kanban_cards" USING btree ("column_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_kanban_cards_owner_user_id" ON "kanban_cards" USING btree ("owner_user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_kanban_cards_priority" ON "kanban_cards" USING btree ("priority");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_kanban_cards_created_at" ON "kanban_cards" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_kanban_cards_deleted_at" ON "kanban_cards" USING btree ("deleted_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_assignments_user_id" ON "assignments" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_assignments_course_id" ON "assignments" USING btree ("course_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_attempts_user_id" ON "attempts" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_attempts_test_id" ON "attempts" USING btree ("test_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_courses_department_id" ON "courses" USING btree ("department_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_courses_is_required" ON "courses" USING btree ("is_required");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_courses_level" ON "courses" USING btree ("level");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_lessons_module_id" ON "lessons" USING btree ("module_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_modules_course_id" ON "modules" USING btree ("course_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_progress_user_id" ON "progress" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_progress_lesson_id" ON "progress" USING btree ("lesson_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_tests_course_id" ON "tests" USING btree ("course_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_tests_module_id" ON "tests" USING btree ("module_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_material_batches_material_id" ON "ai_material_batches" USING btree ("material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_material_batches_warehouse_id" ON "ai_material_batches" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_material_batches_status" ON "ai_material_batches" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_material_batches_created_at" ON "ai_material_batches" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_material_insights_material_id" ON "ai_material_insights" USING btree ("material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_material_insights_warehouse_id" ON "ai_material_insights" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_material_insights_priority" ON "ai_material_insights" USING btree ("priority");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_material_insights_created_at" ON "ai_material_insights" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_reservation_requests_status" ON "ai_reservation_requests" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_reservation_requests_priority" ON "ai_reservation_requests" USING btree ("priority");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_ai_reservation_requests_created_at" ON "ai_reservation_requests" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_batches_product_id" ON "batches" USING btree ("product_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_batches_production_order_id" ON "batches" USING btree ("production_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_batches_warehouse_id" ON "batches" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_batches_status" ON "batches" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_batches_created_at" ON "batches" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_consumption_suggestions_papka_order_id" ON "consumption_suggestions" USING btree ("papka_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_consumption_suggestions_material_card_id" ON "consumption_suggestions" USING btree ("material_card_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_consumption_suggestions_status" ON "consumption_suggestions" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_consumption_suggestions_created_at" ON "consumption_suggestions" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_issue_items_gi_id" ON "goods_issue_items" USING btree ("gi_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_issue_items_raw_material_id" ON "goods_issue_items" USING btree ("raw_material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_issues_warehouse_id" ON "goods_issues" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_issues_issue_type" ON "goods_issues" USING btree ("issue_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_issues_issue_date" ON "goods_issues" USING btree ("issue_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_issues_created_at" ON "goods_issues" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipt_items_gr_id" ON "goods_receipt_items" USING btree ("gr_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipt_items_raw_material_id" ON "goods_receipt_items" USING btree ("raw_material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipt_lines_receipt_id" ON "goods_receipt_lines" USING btree ("receipt_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipt_lines_material_card_id" ON "goods_receipt_lines" USING btree ("material_card_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipt_lines_qc_status" ON "goods_receipt_lines" USING btree ("qc_status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipt_lines_created_at" ON "goods_receipt_lines" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipts_supplier_id" ON "goods_receipts" USING btree ("supplier_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipts_warehouse_id" ON "goods_receipts" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipts_status" ON "goods_receipts" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipts_purchase_order_id" ON "goods_receipts" USING btree ("purchase_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_goods_receipts_created_at" ON "goods_receipts" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_inventory_count_lines_count_id" ON "inventory_count_lines" USING btree ("count_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_inventory_count_lines_material_id" ON "inventory_count_lines" USING btree ("material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_inventory_count_lines_product_id" ON "inventory_count_lines" USING btree ("product_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_inventory_count_lines_created_at" ON "inventory_count_lines" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_inventory_counts_warehouse_id" ON "inventory_counts" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_inventory_counts_status" ON "inventory_counts" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_inventory_counts_count_date" ON "inventory_counts" USING btree ("count_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_inventory_counts_created_at" ON "inventory_counts" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_barcodes_material_card_id" ON "material_barcodes" USING btree ("material_card_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_barcodes_warehouse_id" ON "material_barcodes" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_barcodes_status" ON "material_barcodes" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_barcodes_vendor_id" ON "material_barcodes" USING btree ("vendor_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_barcodes_qc_status" ON "material_barcodes" USING btree ("qc_status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_barcodes_created_at" ON "material_barcodes" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_batches_material_card_id" ON "material_batches" USING btree ("material_card_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_batches_warehouse_id" ON "material_batches" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_batches_status" ON "material_batches" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_batches_qc_status" ON "material_batches" USING btree ("qc_status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_batches_created_at" ON "material_batches" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_cards_warehouse_id" ON "material_cards" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_cards_category" ON "material_cards" USING btree ("category");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_cards_is_active" ON "material_cards" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_cards_vendor_id" ON "material_cards" USING btree ("vendor_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_cards_abc_segment" ON "material_cards" USING btree ("abc_segment");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_inventory_valuations_warehouse_id" ON "material_inventory_valuations" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_inventory_valuations_material_id" ON "material_inventory_valuations" USING btree ("material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_inventory_valuations_valuation_date" ON "material_inventory_valuations" USING btree ("valuation_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_inventory_valuations_created_at" ON "material_inventory_valuations" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_kit_items_kit_id" ON "material_kit_items" USING btree ("kit_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_kit_items_material_id" ON "material_kit_items" USING btree ("material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_kit_items_created_at" ON "material_kit_items" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_kits_order_id" ON "material_kits" USING btree ("order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_kits_status" ON "material_kits" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_kits_scheduled_date" ON "material_kits" USING btree ("scheduled_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_kits_created_at" ON "material_kits" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_movements_session_id" ON "material_movements" USING btree ("session_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_movements_order_id" ON "material_movements" USING btree ("order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_movements_kit_id" ON "material_movements" USING btree ("kit_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_movements_material_id" ON "material_movements" USING btree ("material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_movements_movement_type" ON "material_movements" USING btree ("movement_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_material_movements_created_at" ON "material_movements" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_min_stock_alerts_material_card_id" ON "min_stock_alerts" USING btree ("material_card_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_min_stock_alerts_severity" ON "min_stock_alerts" USING btree ("severity");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_min_stock_alerts_is_resolved" ON "min_stock_alerts" USING btree ("is_resolved");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_min_stock_alerts_created_at" ON "min_stock_alerts" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_consumption_production_order_id" ON "production_consumption" USING btree ("production_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_consumption_barcode_id" ON "production_consumption" USING btree ("barcode_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_consumption_operator_id" ON "production_consumption" USING btree ("operator_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_consumption_created_at" ON "production_consumption" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_invoices_vendor_id" ON "purchase_invoices" USING btree ("vendor_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_invoices_payment_status" ON "purchase_invoices" USING btree ("payment_status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_invoices_invoice_date" ON "purchase_invoices" USING btree ("invoice_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_invoices_created_at" ON "purchase_invoices" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_order_items_po_id" ON "purchase_order_items" USING btree ("po_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_order_items_raw_material_id" ON "purchase_order_items" USING btree ("raw_material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_orders_vendor_id" ON "purchase_orders" USING btree ("vendor_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_orders_status" ON "purchase_orders" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_orders_created_at" ON "purchase_orders" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_requisitions_material_id" ON "purchase_requisitions" USING btree ("material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_requisitions_status" ON "purchase_requisitions" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_requisitions_priority" ON "purchase_requisitions" USING btree ("priority");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_requisitions_required_date" ON "purchase_requisitions" USING btree ("required_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_purchase_requisitions_created_at" ON "purchase_requisitions" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_raw_materials_vendor_id" ON "raw_materials" USING btree ("vendor_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_raw_materials_warehouse_id" ON "raw_materials" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_raw_materials_category" ON "raw_materials" USING btree ("category");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_raw_materials_is_active" ON "raw_materials" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_raw_materials_created_at" ON "raw_materials" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_reservations_material_card_id" ON "stock_reservations" USING btree ("material_card_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_reservations_warehouse_id" ON "stock_reservations" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_reservations_status" ON "stock_reservations" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_reservations_required_date" ON "stock_reservations" USING btree ("required_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_reservations_created_at" ON "stock_reservations" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_vendors_is_active" ON "vendors" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_vendors_created_at" ON "vendors" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bom_headers_product_id" ON "bom_headers" USING btree ("product_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bom_headers_status" ON "bom_headers" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bom_headers_created_at" ON "bom_headers" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bom_items_bom_id" ON "bom_items" USING btree ("bom_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bom_items_component_id" ON "bom_items" USING btree ("component_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_bom_items_created_at" ON "bom_items" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_downtime_logs_work_center_id" ON "downtime_logs" USING btree ("work_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_downtime_logs_downtime_date" ON "downtime_logs" USING btree ("downtime_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_downtime_logs_category" ON "downtime_logs" USING btree ("category");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_downtime_logs_created_at" ON "downtime_logs" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_equipment_work_center_id" ON "equipment" USING btree ("work_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_equipment_category" ON "equipment" USING btree ("category");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_equipment_status" ON "equipment" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_equipment_is_active" ON "equipment" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_equipment_created_at" ON "equipment" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_mrp_results_mrp_run_id" ON "mrp_results" USING btree ("mrp_run_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_mrp_results_material_id" ON "mrp_results" USING btree ("material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_mrp_results_status" ON "mrp_results" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_mrp_results_required_date" ON "mrp_results" USING btree ("required_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_mrp_results_created_at" ON "mrp_results" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_mrp_runs_status" ON "mrp_runs" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_mrp_runs_run_date" ON "mrp_runs" USING btree ("run_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_mrp_runs_created_at" ON "mrp_runs" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_orders_product_id" ON "orders" USING btree ("product_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_orders_customer_id" ON "orders" USING btree ("customer_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_orders_priority" ON "orders" USING btree ("priority");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "orders" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_orders_updated_at" ON "orders" USING btree ("updated_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_fact_plan_line_id" ON "production_fact" USING btree ("plan_line_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_fact_product_id" ON "production_fact" USING btree ("product_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_fact_work_center_id" ON "production_fact" USING btree ("work_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_fact_operator_id" ON "production_fact" USING btree ("operator_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_fact_fact_date" ON "production_fact" USING btree ("fact_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_fact_created_at" ON "production_fact" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_facts_sm72_operator_id" ON "production_facts_sm72" USING btree ("operator_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_facts_sm72_work_center_id" ON "production_facts_sm72" USING btree ("work_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_facts_sm72_fact_date" ON "production_facts_sm72" USING btree ("fact_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_facts_sm72_created_at" ON "production_facts_sm72" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_order_components_production_order_id" ON "production_order_components" USING btree ("production_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_order_components_raw_material_id" ON "production_order_components" USING btree ("raw_material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_order_components_warehouse_id" ON "production_order_components" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_order_operations_production_order_id" ON "production_order_operations" USING btree ("production_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_order_operations_work_center_id" ON "production_order_operations" USING btree ("work_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_order_operations_status" ON "production_order_operations" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_orders_product_id" ON "production_orders" USING btree ("product_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_orders_work_center_id" ON "production_orders" USING btree ("work_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_orders_status" ON "production_orders" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_orders_priority" ON "production_orders" USING btree ("priority");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_orders_created_at" ON "production_orders" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_orders_updated_at" ON "production_orders" USING btree ("updated_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_plan_header_work_center_id" ON "production_plan_header" USING btree ("work_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_plan_header_status" ON "production_plan_header" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_plan_header_plan_date" ON "production_plan_header" USING btree ("plan_date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_plan_header_created_at" ON "production_plan_header" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_plan_lines_plan_id" ON "production_plan_lines" USING btree ("plan_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_plan_lines_order_id" ON "production_plan_lines" USING btree ("order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_plan_lines_product_id" ON "production_plan_lines" USING btree ("product_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_plan_lines_created_at" ON "production_plan_lines" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_qc_checks_production_order_id" ON "production_qc_checks" USING btree ("production_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_qc_checks_check_stage" ON "production_qc_checks" USING btree ("check_stage");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_qc_checks_created_at" ON "production_qc_checks" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_status_history_production_order_id" ON "production_status_history" USING btree ("production_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_status_history_new_status" ON "production_status_history" USING btree ("new_status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_production_status_history_changed_at" ON "production_status_history" USING btree ("changed_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products" USING btree ("category");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_products_is_active" ON "products" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_products_created_at" ON "products" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_routing_operations_routing_id" ON "routing_operations" USING btree ("routing_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_routing_operations_work_center_id" ON "routing_operations" USING btree ("work_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_routing_operations_created_at" ON "routing_operations" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_routings_product_id" ON "routings" USING btree ("product_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_routings_status" ON "routings" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_routings_created_at" ON "routings" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_shift_assignments_user_id" ON "shift_assignments" USING btree ("user_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_shift_assignments_date" ON "shift_assignments" USING btree ("date");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_shift_assignments_created_at" ON "shift_assignments" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_shift_calendars_work_center_id" ON "shift_calendars" USING btree ("work_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_shift_calendars_year_month_day" ON "shift_calendars" USING btree ("year","month","day");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_shift_calendars_created_at" ON "shift_calendars" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_shift_evaluations_operator_id" ON "shift_evaluations" USING btree ("operator_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_shift_evaluations_created_at" ON "shift_evaluations" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_work_center_capacity_work_center_id" ON "work_center_capacity" USING btree ("work_center_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_work_center_capacity_created_at" ON "work_center_capacity" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_work_centers_department_id" ON "work_centers" USING btree ("department_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_work_centers_is_active" ON "work_centers" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_work_centers_created_at" ON "work_centers" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_billing_documents_sales_order_id" ON "billing_documents" USING btree ("sales_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_billing_documents_customer_id" ON "billing_documents" USING btree ("customer_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_billing_documents_billing_status" ON "billing_documents" USING btree ("billing_status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_billing_documents_created_at" ON "billing_documents" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_billing_items_billing_document_id" ON "billing_items" USING btree ("billing_document_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_billing_items_material_id" ON "billing_items" USING btree ("material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_deliveries_sales_order_id" ON "deliveries" USING btree ("sales_order_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_deliveries_customer_id" ON "deliveries" USING btree ("customer_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_deliveries_status" ON "deliveries" USING btree ("delivery_status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_deliveries_created_at" ON "deliveries" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_delivery_items_delivery_id" ON "delivery_items" USING btree ("delivery_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_delivery_items_material_id" ON "delivery_items" USING btree ("material_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_delivery_items_picking_status" ON "delivery_items" USING btree ("picking_status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_quotations_customer_id" ON "quotations" USING btree ("customer_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_quotations_status" ON "quotations" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_quotations_created_at" ON "quotations" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_sales_invoices_customer_id" ON "sales_invoices" USING btree ("customer_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_sales_invoices_payment_status" ON "sales_invoices" USING btree ("payment_status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_sales_invoices_status" ON "sales_invoices" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_sales_invoices_created_at" ON "sales_invoices" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_transfer_lines_transfer_id" ON "stock_transfer_lines" USING btree ("transfer_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_transfers_status" ON "stock_transfers" USING btree ("status");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_transfers_from_warehouse" ON "stock_transfers" USING btree ("from_warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_transfers_to_warehouse" ON "stock_transfers" USING btree ("to_warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_stock_transfers_created_at" ON "stock_transfers" USING btree ("created_at");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_warehouse_bins_warehouse_id" ON "warehouse_bins" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_warehouse_bins_is_active" ON "warehouse_bins" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_warehouse_zones_warehouse_id" ON "warehouse_zones" USING btree ("warehouse_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_warehouse_zones_zone_type" ON "warehouse_zones" USING btree ("zone_type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_warehouses_type" ON "warehouses" USING btree ("type");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_warehouses_is_active" ON "warehouses" USING btree ("is_active");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "idx_warehouses_manager_id" ON "warehouses" USING btree ("manager_id");
EXCEPTION WHEN undefined_table OR undefined_column THEN
  NULL;
END $$;

