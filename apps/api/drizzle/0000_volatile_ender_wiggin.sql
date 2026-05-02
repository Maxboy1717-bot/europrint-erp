CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'on_leave', 'sick_leave', 'remote');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('email', 'social_media', 'advertising', 'event', 'content', 'partnership');--> statement-breakpoint
CREATE TYPE "public"."deal_status" AS ENUM('new', 'in_progress', 'won', 'lost', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'dispatched', 'in_transit', 'delivered', 'cancelled', 'returned');--> statement-breakpoint
CREATE TYPE "public"."design_status" AS ENUM('pending', 'in_progress', 'under_review', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('active', 'on_leave', 'terminated', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."kanban_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."kanban_task_status" AS ENUM('todo', 'in_progress', 'review', 'done', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."lms_enrollment_status" AS ENUM('enrolled', 'in_progress', 'completed', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."maintenance_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('open', 'assigned', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."mes_session_status" AS ENUM('pending', 'active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('info', 'warning', 'error', 'success', 'task_assigned', 'approval_required', 'order_update', 'production_alert');--> statement-breakpoint
CREATE TYPE "public"."payroll_status" AS ENUM('pending', 'processing', 'completed', 'paid');--> statement-breakpoint
CREATE TYPE "public"."production_status" AS ENUM('pending', 'in_progress', 'on_hold', 'completed', 'cancelled', 'quality_check');--> statement-breakpoint
CREATE TYPE "public"."purchase_order_status" AS ENUM('draft', 'pending', 'approved', 'partially_received', 'received', 'invoiced', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."qc_status" AS ENUM('pending', 'in_progress', 'passed', 'failed', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."sales_order_status" AS ENUM('draft', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled', 'invoiced');--> statement-breakpoint
CREATE TYPE "public"."security_incident_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."security_incident_status" AS ENUM('open', 'investigating', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('receipt', 'issue', 'transfer', 'adjustment', 'return', 'scrap', 'production_input', 'production_output');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'supervisor', 'operator', 'employee', 'director', 'accountant', 'hr_manager', 'warehouse_manager', 'sales_manager', 'super_admin');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar(100) NOT NULL,
	"action" varchar(255) NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" text[],
	"reason" text,
	"transaction_id" varchar(100),
	"user_id" varchar,
	"user_full_name" text,
	"user_role" varchar(50),
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lead_id" uuid NOT NULL,
	"title" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'UZS' NOT NULL,
	"status" "deal_status" DEFAULT 'new' NOT NULL,
	"probability" integer DEFAULT 0,
	"won_at" timestamp with time zone,
	"lost_reason" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"email" text,
	"source" text,
	"status" text DEFAULT 'new' NOT NULL,
	"ai_score" numeric(5, 2),
	"assigned_to" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" integer PRIMARY KEY NOT NULL,
	"order_number" text,
	"customer_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"master_status" text,
	"overall_status" text,
	"total_amount" numeric(18, 2),
	"currency" text DEFAULT 'UZS',
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"document_number" text,
	"advance_paid_amount" numeric(18, 2),
	"advance_status" text,
	"balance_due_amount" numeric(18, 2),
	CONSTRAINT "sales_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY NOT NULL,
	"username" varchar,
	"email" varchar,
	"full_name" text,
	"profile_image_url" text,
	"employee_id" varchar,
	"phone" varchar,
	"status" varchar,
	"deleted_at" timestamp,
	"role" varchar,
	"department_id" integer,
	"manager_id" integer
);
--> statement-breakpoint
CREATE TABLE "boms" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_name" text,
	"version" text DEFAULT '1.0',
	"is_active" boolean DEFAULT true,
	"created_by" text,
	"items" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "downtime_events" (
	"id" integer PRIMARY KEY NOT NULL,
	"session_id" text,
	"work_center_id" text NOT NULL,
	"reason_code_id" text,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_min" numeric(8, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mes_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"production_order_id" uuid NOT NULL,
	"operator_id" uuid NOT NULL,
	"work_center_id" uuid,
	"status" "mes_session_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"quality_passed" boolean,
	"defect_qty" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_order_id" integer,
	"status" text DEFAULT 'pending',
	"bom_id" integer,
	"routing_id" integer,
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"order_number" text,
	"product_name" text,
	"quantity" integer,
	"unit" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "routings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"is_active" boolean DEFAULT true,
	"created_by" text,
	"steps" jsonb DEFAULT '[]'::jsonb,
	"work_centers" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "work_centers" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"type" text,
	"capacity" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "work_centers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" integer PRIMARY KEY NOT NULL,
	"order_number" text,
	"vendor_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(18, 2),
	"currency" text DEFAULT 'UZS',
	"expected_delivery" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "purchase_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "qc_inspections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reference_id" uuid NOT NULL,
	"reference_type" text NOT NULL,
	"inspector_id" uuid NOT NULL,
	"status" "qc_status" DEFAULT 'pending' NOT NULL,
	"items_checked" integer NOT NULL,
	"items_passed" integer NOT NULL,
	"items_failed" integer NOT NULL,
	"notes" text,
	"attachments" text DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"location" text,
	"quantity" numeric(15, 2) NOT NULL,
	"unit" text NOT NULL,
	"cost_price" numeric(15, 2) NOT NULL,
	"sell_price" numeric(15, 2),
	"expiry_date" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now(),
	"lot_number" text,
	"supplier_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_items_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY NOT NULL,
	"stock_item_id" uuid NOT NULL,
	"movement_type" "stock_movement_type" NOT NULL,
	"quantity" numeric(15, 2) NOT NULL,
	"reference_id" uuid,
	"reference_type" text,
	"performed_by" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tin" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"payment_terms" integer DEFAULT 30,
	"rating" numeric(3, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"is_free_storage" boolean DEFAULT false,
	"free_storage_days" integer DEFAULT 30,
	"monthly_rate" numeric(15, 2),
	"deleted_at" timestamp with time zone,
	"deleted_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"attendance_date" date,
	"check_in_time" text,
	"check_out_time" text,
	"status" text DEFAULT 'present',
	"late_minutes" integer DEFAULT 0,
	"early_leave_minutes" integer DEFAULT 0,
	"overtime_minutes" integer DEFAULT 0,
	"source" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"code" varchar,
	"parent_id" integer,
	"manager_id" integer,
	"is_active" boolean
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" integer,
	"employee_code" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"middle_name" varchar,
	"department_id" integer,
	"position_id" integer,
	"status" varchar,
	"employment_status" varchar,
	"employment_type" varchar,
	"is_active" boolean,
	"is_blocked" boolean DEFAULT false,
	"blocked_reason" text,
	"telegram_chat_id" varchar,
	"hire_date" date,
	"base_salary" text,
	"phone_number" varchar,
	"email_work" varchar,
	"gender" varchar,
	"date_of_birth" date,
	"birth_date" date,
	"manager_id" integer,
	"photo_url" text,
	"role" varchar,
	"total_points" integer DEFAULT 0,
	"created_at" timestamp,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" integer,
	"employee_id" text NOT NULL,
	"leave_type" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lms_courses" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text,
	"is_active" boolean,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "lms_enrollments" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" integer,
	"course_id" integer,
	"status" varchar,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payroll" (
	"id" uuid PRIMARY KEY NOT NULL,
	"employee_id" uuid NOT NULL,
	"period" text NOT NULL,
	"gross_salary" numeric(15, 2) NOT NULL,
	"inps_deduction" numeric(15, 2) NOT NULL,
	"jshd_deduction" numeric(15, 2) NOT NULL,
	"net_salary" numeric(15, 2) NOT NULL,
	"paid_at" timestamp with time zone,
	"status" "payroll_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text,
	"department_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_panels" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'My Dashboard' NOT NULL,
	"layout" text DEFAULT '[]' NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_panels_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "accounting_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"is_closed" boolean DEFAULT false,
	"closed_at" timestamp,
	"closed_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" text,
	"module" text NOT NULL,
	"action" text NOT NULL,
	"input_tokens" integer DEFAULT 0,
	"output_tokens" integer DEFAULT 0,
	"cost" numeric(10, 6) DEFAULT '0',
	"model" text,
	"status" text DEFAULT 'success' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" integer PRIMARY KEY NOT NULL,
	"document_type" text NOT NULL,
	"document_id" text NOT NULL,
	"document_number" text,
	"amount" numeric(18, 2) DEFAULT '0',
	"currency" text DEFAULT 'UZS',
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"rejected_by" text,
	"rejected_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budget_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"budget_id" uuid,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"planned_amount" numeric(18, 2) NOT NULL,
	"actual_amount" numeric(18, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"quarter" integer,
	"department" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_planned" numeric(18, 2) DEFAULT '0' NOT NULL,
	"total_actual" numeric(18, 2) DEFAULT '0' NOT NULL,
	"created_by" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cash_flow_transactions" (
	"id" integer PRIMARY KEY NOT NULL,
	"transaction_date" text,
	"transaction_type" text,
	"amount" numeric(18, 2),
	"category" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_financial_metrics" (
	"id" integer PRIMARY KEY NOT NULL,
	"metric_date" text NOT NULL,
	"total_revenue" numeric(18, 2) DEFAULT '0',
	"total_expenses" numeric(18, 2) DEFAULT '0',
	"gross_profit" numeric(18, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" integer PRIMARY KEY NOT NULL,
	"debit_account_id" text,
	"credit_account_id" text,
	"amount" numeric(18, 2),
	"entry_date" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_categories" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"parent_id" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_kpis" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"value" numeric(18, 2),
	"target" numeric(18, 2),
	"period" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gl_entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"entry_number" text NOT NULL,
	"debit_account" text NOT NULL,
	"credit_account" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text,
	"reference_id" uuid,
	"reference_type" text,
	"posted_by" uuid NOT NULL,
	"posted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gl_entries_entry_number_unique" UNIQUE("entry_number")
);
--> statement-breakpoint
CREATE TABLE "income_expense_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_type" text,
	"description" text,
	"counterparty_name" text,
	"amount" numeric(15, 2),
	"transaction_date" date,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_counts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"count_number" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"started_by" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "inventory_counts_count_number_unique" UNIQUE("count_number")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" integer PRIMARY KEY NOT NULL,
	"status" varchar,
	"amount" text,
	"due_date" date,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_costing_lines" (
	"id" integer PRIMARY KEY NOT NULL,
	"order_costing_id" integer,
	"type" text NOT NULL,
	"description" text,
	"amount" numeric(18, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_costings" (
	"id" integer PRIMARY KEY NOT NULL,
	"order_id" text,
	"material_cost" numeric(18, 2) DEFAULT '0',
	"labor_cost" numeric(18, 2) DEFAULT '0',
	"overhead" numeric(18, 2) DEFAULT '0',
	"overhead_cost" numeric(18, 2) DEFAULT '0',
	"energy_cost" numeric(18, 2) DEFAULT '0',
	"waste_cost" numeric(18, 2) DEFAULT '0',
	"total_cost" numeric(18, 2) DEFAULT '0',
	"selling_price" numeric(18, 2),
	"gross_profit" numeric(18, 2),
	"profit_margin" numeric(10, 4),
	"status" text DEFAULT 'draft',
	"calculated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"invoice_id" uuid,
	"amount" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'UZS' NOT NULL,
	"payment_method" text NOT NULL,
	"reference_number" text,
	"paid_at" timestamp with time zone NOT NULL,
	"recorded_by" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "campaign_type" NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"budget" numeric(15, 2),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"target_audience" text DEFAULT '{}',
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sales_order_id" uuid,
	"delivery_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"delivery_address" text NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"driver_id" uuid,
	"vehicle_number" text,
	"dispatched_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deliveries_delivery_number_unique" UNIQUE("delivery_number")
);
--> statement-breakpoint
CREATE TABLE "design_orders" (
	"id" integer PRIMARY KEY NOT NULL,
	"sales_order_id" text,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"assigned_to" text,
	"files" text DEFAULT '[]',
	"completed_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "employee_assets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"asset_id" text NOT NULL,
	"employee_id" uuid,
	"assigned_date" text NOT NULL,
	"return_date" text,
	"condition_on_assign" text DEFAULT 'good' NOT NULL,
	"condition_on_return" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_tasks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "kanban_task_status" DEFAULT 'todo' NOT NULL,
	"priority" "kanban_priority" DEFAULT 'medium' NOT NULL,
	"assigned_to" uuid,
	"due_date" timestamp with time zone,
	"tags" text DEFAULT '[]',
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"equipment_id" uuid,
	"equipment_name" text NOT NULL,
	"issue_description" text NOT NULL,
	"status" "maintenance_status" DEFAULT 'open' NOT NULL,
	"priority" "maintenance_priority" DEFAULT 'medium' NOT NULL,
	"assigned_to" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"production_order_affected" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text,
	"message" text,
	"type" text DEFAULT 'info',
	"is_read" boolean DEFAULT false,
	"entity_type" text,
	"entity_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "security_incidents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" "security_incident_severity" NOT NULL,
	"status" "security_incident_status" DEFAULT 'open' NOT NULL,
	"reported_by" uuid NOT NULL,
	"assigned_to" uuid,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technology_approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"papka_order_id" text NOT NULL,
	"action" text DEFAULT 'pending' NOT NULL,
	"bom_approved" boolean DEFAULT false NOT NULL,
	"routing_approved" boolean DEFAULT false NOT NULL,
	"tech_card_approved" boolean DEFAULT false NOT NULL,
	"notes" text,
	"approved_by_id" uuid,
	"approved_at" timestamp with time zone,
	"is_rejected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technology_approvals_papka_order_id_unique" UNIQUE("papka_order_id")
);
--> statement-breakpoint
CREATE TABLE "camera_ai_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar(50) NOT NULL,
	"camera_name" text,
	"detection_types" text,
	"zone" varchar(100),
	"alert_threshold" numeric(5, 4) DEFAULT '0.8',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "camera_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar(50),
	"camera_event_id" varchar(50),
	"alert_type" varchar(50),
	"severity" varchar(20) DEFAULT 'medium',
	"title" text,
	"title_ru" text,
	"message" text,
	"is_acknowledged" boolean DEFAULT false,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "camera_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar(50),
	"event_type" varchar(100) NOT NULL,
	"description" text DEFAULT '',
	"severity" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'new',
	"ai_confidence" numeric(5, 4),
	"screenshot_url" text,
	"telegram_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "camera_quality_defects" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar(50),
	"defect_type" varchar(100) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'open',
	"description" text,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "camera_safety_violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar(50),
	"violation_type" varchar(100) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'open',
	"description" text,
	"employee_id" varchar(100),
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "camera_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" integer,
	"zone_name" text NOT NULL,
	"zone_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cameras" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"location" text,
	"ip_address" varchar(50),
	"port" integer,
	"rtsp_url" text,
	"stream_url" text,
	"work_center_id" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"ai_enabled" boolean DEFAULT true,
	"ai_sensitivity" varchar(20) DEFAULT 'medium',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sensor_devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"device_code" text NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_reading_at" timestamp with time zone,
	"thresholds" text DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sensor_devices_device_code_unique" UNIQUE("device_code")
);
--> statement-breakpoint
CREATE TABLE "sensor_readings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"device_id" uuid NOT NULL,
	"value" numeric(15, 4) NOT NULL,
	"unit" text,
	"is_anomaly" boolean DEFAULT false,
	"anomaly_reason" text,
	"recorded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"title_ru" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"content_ru" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mm_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"tin" text,
	"phone" text,
	"email" text,
	"is_active" boolean DEFAULT true,
	"rating" numeric(3, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qc_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"cert_number" text NOT NULL,
	"order_id" integer,
	"product_name" text,
	"issued_date" text,
	"expiry_date" text,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"issued_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qc_certificates_cert_number_unique" UNIQUE("cert_number")
);
--> statement-breakpoint
CREATE TABLE "qc_checkpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"stage" text DEFAULT 'in_process' NOT NULL,
	"standard_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_defects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"inspection_id" uuid,
	"production_order_id" uuid,
	"work_center_id" uuid,
	"defect_code" text NOT NULL,
	"description" text NOT NULL,
	"severity" text DEFAULT 'minor' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"reported_by" text NOT NULL,
	"resolved_by" text,
	"resolved_at" timestamp with time zone,
	"resolution" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qc_lab_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"parameter_name" text NOT NULL,
	"value" numeric(12, 4),
	"unit" text,
	"result" text DEFAULT 'pending' NOT NULL,
	"min_value" numeric(12, 4),
	"max_value" numeric(12, 4),
	"tested_by" text,
	"notes" text,
	"tested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_parameters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"unit" text,
	"min_value" numeric(12, 4),
	"max_value" numeric(12, 4),
	"target_value" numeric(12, 4),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_reclamations" (
	"id" integer PRIMARY KEY NOT NULL,
	"production_order_id" text,
	"type" text NOT NULL,
	"severity" text DEFAULT 'low' NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qc_spc_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"parameter_id" integer,
	"value" numeric(12, 4) NOT NULL,
	"order_id" integer,
	"batch_id" text,
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_standards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"description" text,
	"parameters" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_supplier_quality" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer,
	"receipt_id" text,
	"material_id" integer,
	"batch_number" text,
	"sample_size" integer DEFAULT 0 NOT NULL,
	"defects_found" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_count_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"count_id" uuid,
	"stock_item_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"item_name" text NOT NULL,
	"system_quantity" numeric(12, 3) DEFAULT '0' NOT NULL,
	"counted_quantity" numeric(12, 3) DEFAULT '0' NOT NULL,
	"variance" numeric(12, 3) DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"location" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_code" text,
	"name" text,
	"category" text,
	"unit_of_measure" text,
	"unit_cost" numeric(15, 2),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "materials_material_code_unique" UNIQUE("material_code")
);
--> statement-breakpoint
CREATE TABLE "pos_movement_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"movement_id" uuid,
	"stock_item_id" uuid NOT NULL,
	"stock_item_name" text NOT NULL,
	"sku" text NOT NULL,
	"quantity" numeric(12, 3) NOT NULL,
	"unit" text NOT NULL,
	"unit_price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"lot_number" text,
	"expiry_date" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "pos_movement_types" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"direction" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "pos_movement_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "pos_movements" (
	"id" integer PRIMARY KEY NOT NULL,
	"movement_type_id" text,
	"warehouse_id" text,
	"source_warehouse_id" text,
	"destination_warehouse_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pos_warehouse_access" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"can_read" boolean DEFAULT true,
	"can_write" boolean DEFAULT false,
	"can_approve" boolean DEFAULT false,
	"granted_by" text NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transfer_request_lines" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_id" uuid,
	"stock_item_id" uuid NOT NULL,
	"item_name" text NOT NULL,
	"sku" text NOT NULL,
	"requested_qty" numeric(12, 3) NOT NULL,
	"approved_qty" numeric(12, 3),
	"unit" text DEFAULT 'pcs' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"request_number" text NOT NULL,
	"from_warehouse_id" uuid NOT NULL,
	"to_warehouse_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text NOT NULL,
	"requested_by" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "transfer_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
CREATE TABLE "retail_pos_products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"barcode" text NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category" text,
	"unit_price" numeric(18, 2) DEFAULT '0' NOT NULL,
	"unit" text DEFAULT 'dona' NOT NULL,
	"stock_quantity" numeric(12, 3) DEFAULT '0',
	"min_stock" numeric(12, 3) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"image_url" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "retail_pos_products_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "retail_pos_transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"transaction_number" text NOT NULL,
	"receipt_number" text,
	"cashier_id" text,
	"customer_name" text,
	"customer_id" text,
	"items" jsonb DEFAULT '[]' NOT NULL,
	"subtotal" numeric(18, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(18, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2) DEFAULT '12',
	"tax_amount" numeric(18, 2) DEFAULT '0',
	"total_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"payment_details" jsonb DEFAULT '{}',
	"status" text DEFAULT 'completed' NOT NULL,
	"notes" text,
	"refunded_at" timestamp with time zone,
	"refunded_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "retail_pos_transactions_transaction_number_unique" UNIQUE("transaction_number"),
	CONSTRAINT "retail_pos_transactions_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "position_feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" integer NOT NULL,
	"feature_key" varchar(100) NOT NULL,
	"is_allowed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" integer NOT NULL,
	"module_code" varchar(50) NOT NULL,
	"access_level" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar DEFAULT 'MEMBER',
	"unread_count" integer DEFAULT 0,
	"is_muted" boolean DEFAULT false,
	"muted_until" timestamp,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	"last_message_at" timestamp,
	"last_read_at" timestamp,
	"last_read_message_id" text
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar NOT NULL,
	"sender_id" text NOT NULL,
	"content" text,
	"text" text,
	"file_url" text,
	"file_name" text,
	"file_type" text,
	"message_type" varchar DEFAULT 'TEXT',
	"is_deleted" boolean DEFAULT false,
	"is_edited" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"reply_to_id" varchar,
	"thread_root_id" varchar,
	"forward_from_id" varchar,
	"thread_count" integer DEFAULT 0,
	"mentioned_user_ids" jsonb DEFAULT '[]'::jsonb,
	"client_msg_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_rooms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"type" varchar DEFAULT 'GROUP' NOT NULL,
	"description" text,
	"avatar_url" text,
	"last_message_text" text,
	"last_message_at" timestamp,
	"last_message_id" text,
	"member_count" integer DEFAULT 0,
	"is_archived" boolean DEFAULT false,
	"is_read_only" boolean DEFAULT false,
	"context_type" varchar,
	"context_id" varchar,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_org_departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"department_id" integer,
	"role" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "org_departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"name_ru" text,
	"parent_id" integer,
	"level" integer,
	"head_user_id" integer,
	"sort_order" integer,
	"is_active" boolean,
	"created_at" timestamp,
	"color" varchar,
	"description" text,
	"description_ru" text,
	"tskp" text,
	"tskp_ru" text,
	"node_type" varchar
);
--> statement-breakpoint
CREATE TABLE "shift_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"shift_date" date,
	"shift_type" text,
	"start_time" text,
	"end_time" text,
	"status" text DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text,
	"name" text,
	"account_type" text,
	"parent_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" integer PRIMARY KEY NOT NULL,
	"username" varchar,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "application_responses" (
	"id" integer PRIMARY KEY NOT NULL,
	"application_id" integer,
	"status" varchar,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" integer PRIMARY KEY NOT NULL,
	"status" varchar,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" integer PRIMARY KEY NOT NULL,
	"recipients_count" integer,
	"success_count" integer,
	"failed_count" integer,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_message_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar,
	"room_id" varchar,
	"title" text,
	"assigned_to" text,
	"due_date" text,
	"priority" varchar,
	"status" varchar DEFAULT 'pending',
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_poll_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" varchar NOT NULL,
	"user_id" text NOT NULL,
	"option_index" integer,
	"option_ids" jsonb DEFAULT '[]'::jsonb,
	"voted_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_polls" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar,
	"room_id" varchar,
	"created_by" text,
	"question" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_multiple" boolean DEFAULT false,
	"is_anonymous" boolean DEFAULT false,
	"expires_at" timestamp,
	"closes_at" timestamp,
	"is_closed" boolean DEFAULT false,
	"total_votes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_reactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"user_id" text NOT NULL,
	"emoji" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "iot_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"sensor_id" integer,
	"alert_type" text,
	"message" text,
	"severity" text DEFAULT 'info',
	"is_resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lms_events" (
	"id" integer PRIMARY KEY NOT NULL,
	"type" varchar,
	"status" varchar,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "lms_sessions" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" integer,
	"duration_seconds" integer,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "lms_test_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"test_id" text,
	"course_id" text,
	"score" numeric(5, 2),
	"passed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lms_tests" (
	"id" integer PRIMARY KEY NOT NULL,
	"module_id" text,
	"course_id" integer,
	"title" text NOT NULL,
	"max_score" integer DEFAULT 100,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mentorships" (
	"id" integer PRIMARY KEY NOT NULL,
	"mentor_id" integer,
	"mentee_id" integer,
	"status" varchar,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" integer PRIMARY KEY NOT NULL,
	"category" varchar,
	"name" text,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" integer PRIMARY KEY NOT NULL,
	"survey_id" integer,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" integer PRIMARY KEY NOT NULL,
	"status" varchar,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "system_alerts" (
	"id" integer PRIMARY KEY NOT NULL,
	"severity" varchar,
	"title" text,
	"message" text,
	"module" varchar,
	"created_at" timestamp,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" integer PRIMARY KEY NOT NULL,
	"skill_id" integer,
	"employee_id" integer,
	"user_id" integer,
	"verified" boolean,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "forecast_series" (
	"id" text PRIMARY KEY NOT NULL,
	"material_id" text NOT NULL,
	"period" timestamp with time zone NOT NULL,
	"actual_qty" numeric(14, 3),
	"forecast_qty" numeric(14, 3) NOT NULL,
	"method" text NOT NULL,
	"alpha" numeric(6, 4),
	"rmse" numeric(14, 6),
	"mape" numeric(10, 4),
	"mae" numeric(14, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "control_chart_point" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"process_id" text NOT NULL,
	"sample_size" integer NOT NULL,
	"defects" integer NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_defects_le_size" CHECK ("control_chart_point"."defects" <= "control_chart_point"."sample_size"),
	CONSTRAINT "chk_size_positive" CHECK ("control_chart_point"."sample_size" > 0)
);
--> statement-breakpoint
CREATE TABLE "employee_separation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"separation_date" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"is_regretted" boolean DEFAULT false NOT NULL,
	"tenure_months" integer NOT NULL,
	"department" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chk_separation_tenure_nonneg" CHECK ("employee_separation"."tenure_months" >= 0)
);
--> statement-breakpoint
CREATE TABLE "overtime_policy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"regular_overtime_hours" numeric(4, 1) DEFAULT '2' NOT NULL,
	"regular_multiplier" numeric(4, 2) DEFAULT '1.5' NOT NULL,
	"extended_multiplier" numeric(4, 2) DEFAULT '2.0' NOT NULL,
	"weekend_multiplier" numeric(4, 2) DEFAULT '2.0' NOT NULL,
	"night_shift_bonus" numeric(4, 2) DEFAULT '0.5' NOT NULL,
	"night_shift_start_hour" integer DEFAULT 22 NOT NULL,
	"night_shift_end_hour" integer DEFAULT 6 NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "chk_ot_multiplier_pos" CHECK ("overtime_policy"."regular_multiplier" >= 1.0),
	CONSTRAINT "chk_ot_ext_gt_reg" CHECK ("overtime_policy"."extended_multiplier" >= "overtime_policy"."regular_multiplier"),
	CONSTRAINT "chk_ot_night_start" CHECK ("overtime_policy"."night_shift_start_hour" >= 0 AND "overtime_policy"."night_shift_start_hour" <= 23),
	CONSTRAINT "chk_ot_night_end" CHECK ("overtime_policy"."night_shift_end_hour" >= 0 AND "overtime_policy"."night_shift_end_hour" <= 23)
);
--> statement-breakpoint
CREATE TABLE "lms_exam_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"exam_id" text,
	"user_id" text,
	"score" numeric(5, 2),
	"passed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_hr_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" text NOT NULL,
	"position_title" text NOT NULL,
	"interview_type" text DEFAULT 'screening' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_at" text,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer,
	"module" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"insight_type" text DEFAULT 'ai_generated' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_planning_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auto_approval_threshold" integer DEFAULT 90 NOT NULL,
	"max_shift_hours" integer DEFAULT 8 NOT NULL,
	"batch_grouping_enabled" boolean DEFAULT true NOT NULL,
	"energy_optimization_weight" integer DEFAULT 30 NOT NULL,
	"changeover_minutes" integer DEFAULT 15 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_planning_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_number" text NOT NULL,
	"plan_date" text NOT NULL,
	"plan_type" text DEFAULT 'daily' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"confidence_score" integer DEFAULT 87 NOT NULL,
	"auto_approved" boolean DEFAULT false NOT NULL,
	"auto_approval_threshold" integer,
	"total_orders" integer,
	"total_machine_hours" integer,
	"estimated_completion" timestamp with time zone,
	"plan_data" jsonb DEFAULT '[]'::jsonb,
	"optimization_metrics" jsonb DEFAULT '{}'::jsonb,
	"ai_recommendations" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_reservation_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_type" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb,
	"scheduled_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_reservation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"material_type" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" text DEFAULT 'dona' NOT NULL,
	"needed_by" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"optimization" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_starred_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_user_presence" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" varchar DEFAULT 'OFFLINE',
	"custom_status" text,
	"last_seen_at" timestamp,
	"active_room_id" varchar,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kanban_card_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_card_watchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" text NOT NULL,
	"title" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"assignee_id" integer,
	"due_date" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" text NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" text,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_robots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" text,
	"name" text NOT NULL,
	"trigger" text DEFAULT 'card_moved' NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_content_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"post_type" text DEFAULT 'blog' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"author_id" integer,
	"tags" text,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"template_type" text DEFAULT 'newsletter' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"account_name" text NOT NULL,
	"account_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text,
	"content" text NOT NULL,
	"platform" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"posted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"filter_type" text DEFAULT 'general' NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_disposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"disposal_type" text DEFAULT 'retired' NOT NULL,
	"disposal_date" timestamp with time zone,
	"sale_value" text,
	"reason" text,
	"approved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"category" text,
	"assigned_to" integer,
	"department_id" integer,
	"serial_number" text,
	"purchase_date" date,
	"purchase_value" numeric(15, 2),
	"notes" text,
	"status" text DEFAULT 'in_use',
	"location" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "asset_maintenance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"maintenance_type" text DEFAULT 'routine' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cost" text,
	"notes" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"from_dept_id" integer,
	"to_dept_id" integer,
	"transfer_date" timestamp with time zone,
	"reason" text,
	"approved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"all_day" boolean DEFAULT false NOT NULL,
	"event_type" text DEFAULT 'general' NOT NULL,
	"location" text,
	"attendees" jsonb DEFAULT '[]'::jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"telegram" text,
	"website" text,
	"working_hours" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guidelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saas_tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"plan" text DEFAULT 'basic' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"employee_limit" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"company_name" text,
	"timezone" text DEFAULT 'Asia/Tashkent' NOT NULL,
	"language" text DEFAULT 'uz' NOT NULL,
	"currency" text DEFAULT 'UZS' NOT NULL,
	"logo_url" text,
	"config" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "absence_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"absence_date" date NOT NULL,
	"consecutive_day_count" integer DEFAULT 1,
	"auto_blocked" boolean DEFAULT false,
	"is_excused" boolean DEFAULT false,
	"excuse_reason" text,
	"excuse_document_url" text,
	"excused_by" integer,
	"excused_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "badge_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text,
	"name_ru" text,
	"icon" text,
	"description" text,
	"criteria" text,
	"category" text,
	"point_value" integer DEFAULT 0,
	"is_auto_award" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "badge_catalog_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "career_path_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"career_path_id" integer NOT NULL,
	"step_order" integer,
	"position_title" text,
	"required_skills" text,
	"required_months" integer,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "career_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"current_position_id" integer,
	"target_position_id" integer,
	"created_by" integer,
	"estimated_months" integer,
	"progress_percent" integer DEFAULT 0,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "discipline_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"catalog_code" text,
	"violation_type" text,
	"discipline_type" text,
	"violation_name" text,
	"description" text,
	"violation_date" date,
	"issued_date" date,
	"severity" text DEFAULT 'low',
	"issued_by" integer,
	"fine_amount" numeric(12, 2),
	"fine_percent" numeric(5, 2),
	"violation_count_this_category" integer DEFAULT 1,
	"is_first_warning" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"acknowledged_at" timestamp,
	"approved_by" integer,
	"approved_at" timestamp,
	"is_expired" boolean DEFAULT false,
	"is_soft_deleted" boolean DEFAULT false,
	"notes" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_approval_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"approver_id" integer,
	"status" text DEFAULT 'pending',
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"reason" text,
	"blocked_by" integer,
	"unblocked_by" integer,
	"is_active" boolean DEFAULT true,
	"block_erp_access" boolean DEFAULT true,
	"block_payroll" boolean DEFAULT false,
	"block_physical_access" boolean DEFAULT false,
	"blocked_at" timestamp DEFAULT now(),
	"unblocked_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enps_survey_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"survey_id" integer,
	"employee_id" integer,
	"score" integer,
	"comment" text,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enps_surveys" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"questions" jsonb,
	"period" text DEFAULT 'quarterly',
	"status" text DEFAULT 'draft',
	"start_date" date,
	"end_date" date,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_daily_report_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"hr_user_id" integer NOT NULL,
	"previous_status" text,
	"new_status" text,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_daily_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"report_date" date NOT NULL,
	"tasks_completed" text,
	"metrics" text,
	"tomorrow_plan" text,
	"status" text DEFAULT 'submitted',
	"is_auto_absent" boolean DEFAULT false,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_documents" (
	"id" integer PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"document_type" text,
	"title" text,
	"content" text,
	"pdf_url" text,
	"status" text,
	"initiated_by" integer,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"channel" text DEFAULT 'all',
	"enabled" boolean DEFAULT true,
	"email_enabled" boolean DEFAULT true,
	"telegram_enabled" boolean DEFAULT true,
	"push_enabled" boolean DEFAULT true,
	"order_updates" boolean DEFAULT true,
	"production_alerts" boolean DEFAULT true,
	"hr_alerts" boolean DEFAULT true,
	"qc_alerts" boolean DEFAULT true,
	"finance_alerts" boolean DEFAULT true,
	"system_alerts" boolean DEFAULT true,
	"quiet_hours" jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "otp_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text,
	"identifier" text,
	"phone" text,
	"otp_code" text,
	"code" text,
	"is_used" boolean DEFAULT false,
	"used" boolean DEFAULT false,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pip_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"created_by" integer,
	"supervisor_id" integer,
	"duration_days" integer,
	"start_date" date,
	"end_date" date,
	"goals" text,
	"success_criteria" text,
	"status" text DEFAULT 'active',
	"outcome" text,
	"progress_percent" integer DEFAULT 0,
	"acknowledged_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pip_progress_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"pip_id" integer NOT NULL,
	"updated_by" integer,
	"notes" text,
	"status" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "violation_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"category" text,
	"name" text,
	"name_ru" text,
	"severity" text,
	"default_fine_percent" numeric(5, 2),
	"default_fine_amount" numeric(12, 2),
	"points_deducted" integer DEFAULT 0,
	"description" text,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "violation_catalog_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "crisis_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"reported_by" integer,
	"status" text DEFAULT 'open',
	"severity" text DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dokla" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"employee_id" integer,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mro_equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"status" text DEFAULT 'active',
	"location" text,
	"purchase_date" date,
	"next_maintenance_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mro_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"unit" text,
	"current_stock" numeric(15, 3),
	"min_stock" numeric(15, 3),
	"unit_cost" numeric(12, 2),
	"location" text,
	"supplier" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mro_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer,
	"requested_quantity" numeric(15, 3),
	"reason" text,
	"requested_by" integer,
	"priority" text DEFAULT 'normal',
	"status" text DEFAULT 'pending',
	"approved_by" integer,
	"approved_at" timestamp,
	"fulfillment_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mro_work_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer,
	"type" text DEFAULT 'preventive',
	"description" text,
	"assigned_to" integer,
	"priority" text DEFAULT 'normal',
	"status" text DEFAULT 'pending',
	"scheduled_date" date,
	"completed_date" date,
	"notes" text,
	"cost" numeric(12, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "okr_key_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"objective_id" integer NOT NULL,
	"title" text NOT NULL,
	"target_value" numeric(15, 2),
	"current_value" numeric(15, 2),
	"unit" text,
	"owner_id" integer,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "okr_objectives" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text DEFAULT 'company',
	"year" integer,
	"quarter" text,
	"description" text,
	"owner_id" integer,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "raci_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"role" text
);
--> statement-breakpoint
CREATE TABLE "raci_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"order_index" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "raci_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"responsible_id" integer,
	"accountable_id" integer,
	"created_by" integer,
	"deadline" date,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rasporyazhenie" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"issued_by" integer,
	"status" text DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "risk_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"risk_level" text,
	"description" text,
	"likelihood" integer,
	"impact" integer,
	"assessor_id" integer,
	"status" text DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seven_function_kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"function_id" integer NOT NULL,
	"name" text NOT NULL,
	"target_value" numeric(15, 2),
	"actual_value" numeric(15, 2),
	"unit" text,
	"responsible_id" integer,
	"frequency" text DEFAULT 'monthly',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seven_functions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" integer,
	"order_index" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "strategic_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3B82F6',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "strategic_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"title" text NOT NULL,
	"due_date" date,
	"description" text,
	"status" text DEFAULT 'pending',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "strategic_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category_id" integer,
	"assignee_id" integer,
	"created_by" integer,
	"due_date" date,
	"priority" text DEFAULT 'medium',
	"description" text,
	"status" text DEFAULT 'pending',
	"progress" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "advance_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"amount" numeric(15, 2),
	"request_date" date,
	"status" text DEFAULT 'pending',
	"document_id" integer,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cost_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50),
	"name" text,
	"name_ru" text,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "cost_centers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "expense_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"amount" numeric(15, 2),
	"category" text,
	"description" text,
	"requested_by" integer,
	"status" text DEFAULT 'pending',
	"comments" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gl_account_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_type" text,
	"account_code" text,
	"debit_account" text,
	"credit_account" text,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gl_journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer,
	"document_type" text,
	"debit_account" text,
	"credit_account" text,
	"amount" numeric(15, 2),
	"currency" text DEFAULT 'UZS',
	"description" text,
	"posted_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mm_goods_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"issued_by" integer,
	"cost_center" text,
	"work_order_id" integer,
	"notes" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mm_goods_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer,
	"received_by" integer,
	"status" text DEFAULT 'draft',
	"notes" text,
	"received_at" timestamp,
	"completed_by" integer,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mm_purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference_number" text,
	"vendor_id" integer,
	"status" text DEFAULT 'draft',
	"total_amount" numeric(15, 2),
	"received_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mm_purchase_requisition_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"requisition_id" integer NOT NULL,
	"material_id" integer,
	"quantity" numeric(15, 3),
	"unit_price" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "mm_purchase_requisitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"requested_by" integer,
	"needed_by" date,
	"notes" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offboarding_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"dismissal_type" text,
	"last_working_day" date,
	"dismiss_order_doc_id" integer,
	"status" text DEFAULT 'active',
	"total_items" integer DEFAULT 8,
	"completed_items" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offboarding_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"item_key" text,
	"label" text,
	"done" boolean DEFAULT false,
	"order_num" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "payroll_advances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"amount" numeric(15, 2),
	"request_date" date,
	"status" text DEFAULT 'pending',
	"document_id" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_deductions" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"deduction_type" text,
	"amount" numeric(15, 2),
	"fine_percent" numeric(5, 2),
	"reason" text,
	"document_id" integer,
	"status" text DEFAULT 'pending',
	"deduction_month" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_printer_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Printer',
	"printer_ip" text NOT NULL,
	"printer_port" integer DEFAULT 9100,
	"print_format" text DEFAULT 'ZPL',
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profit_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50),
	"name" text,
	"name_ru" text,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "profit_centers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"department" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wms_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer,
	"material_id" integer,
	"type" text NOT NULL,
	"severity" text DEFAULT 'medium',
	"message" text,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wms_stock_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"batch_number" text,
	"quantity_on_hand" numeric(15, 3),
	"unit_cost" numeric(12, 2),
	"received_at" timestamp DEFAULT now(),
	"expiry_date" date
);
--> statement-breakpoint
CREATE TABLE "wms_stock_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"quantity_on_hand" numeric(15, 3),
	"min_stock" numeric(15, 3),
	"max_stock" numeric(15, 3),
	"unit_cost" numeric(12, 2),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wms_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"type" text NOT NULL,
	"quantity" numeric(15, 3),
	"unit_cost" numeric(12, 2),
	"batch_number" text,
	"reference_id" integer,
	"created_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ap_aging_buckets" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" text,
	"current_amount" numeric(15, 2),
	"days_31_60" numeric(15, 2),
	"days_61_90" numeric(15, 2),
	"days_91_120" numeric(15, 2),
	"over_120" numeric(15, 2),
	"total_outstanding" numeric(15, 2),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ar_aging_buckets" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" text,
	"customer_type" text,
	"current_amount" numeric(15, 2),
	"days_31_60" numeric(15, 2),
	"days_61_90" numeric(15, 2),
	"days_91_120" numeric(15, 2),
	"over_120" numeric(15, 2),
	"total_outstanding" numeric(15, 2),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"type" text,
	"subject" text,
	"notes" text,
	"outcome" text,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"due_date" timestamp,
	"lead_id" integer,
	"deal_id" integer,
	"assigned_to" integer,
	"created_by" integer,
	"assignee_id" integer,
	"status" text DEFAULT 'scheduled',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"deal_id" integer,
	"text" text,
	"author_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_custom_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text,
	"field_name" text,
	"field_label" text,
	"field_type" text DEFAULT 'text',
	"is_required" boolean DEFAULT false,
	"options" jsonb,
	"is_active" boolean DEFAULT true,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"action" text,
	"changes" jsonb,
	"actor_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"amount" numeric(15, 2),
	"status" text DEFAULT 'draft',
	"due_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_lead_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"order_index" integer DEFAULT 0,
	"color" text,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "crm_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer,
	"title" text,
	"status" text DEFAULT 'draft',
	"amount" numeric(15, 2),
	"valid_until" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_robots" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"trigger_type" text,
	"action_type" text,
	"config" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"lead_id" integer,
	"deal_id" integer,
	"assigned_to" integer,
	"due_date" timestamp,
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fi_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_no" text,
	"vendor_id" integer,
	"customer_id" integer,
	"type" text DEFAULT 'payable',
	"amount" numeric(15, 2),
	"currency" text DEFAULT 'UZS',
	"due_date" date,
	"invoice_date" date,
	"status" text DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mro_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer,
	"month" integer,
	"category" text,
	"budget_amount" numeric(15, 2),
	"spent_amount" numeric(15, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text,
	"email" text,
	"phone" text,
	"company" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_gl_postings" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text,
	"reference_id" integer,
	"debit_account" text,
	"credit_account" text,
	"amount" numeric(15, 2),
	"status" text DEFAULT 'pending',
	"posted_at" timestamp,
	"error_msg" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "three_way_match_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer,
	"tolerance_percent" numeric(5, 2),
	"status" text DEFAULT 'pending',
	"match_details" jsonb,
	"matched_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "three_way_match_results_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer,
	"invoice_no" text,
	"amount" numeric(15, 2),
	"match_status" text DEFAULT 'unmatched',
	"po_id" integer,
	"gr_id" integer,
	"invoice_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_report_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"description" text,
	"is_active" boolean DEFAULT true,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_report_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"name" text NOT NULL,
	"slug" text,
	"description" text,
	"prompt_template" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_report_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"definition_id" integer NOT NULL,
	"frequency" text DEFAULT 'weekly',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"badge_id" integer,
	"reason" text,
	"awarded_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gamification_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"points" integer DEFAULT 0,
	"event_type" text,
	"description" text,
	"reference_id" integer,
	"reason" text,
	"given_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gamification_totals" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"total_points" integer DEFAULT 0,
	"monthly_points" integer DEFAULT 0,
	"quarterly_points" integer DEFAULT 0,
	"badge_count" integer DEFAULT 0,
	"rank" integer,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "gamification_totals_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "hr_interview_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" integer,
	"vacancy_id" integer,
	"interviewer_id" integer,
	"session_type" text,
	"status" text DEFAULT 'scheduled',
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"score" integer,
	"overall_score" integer,
	"communication_score" integer,
	"confidence_score" integer,
	"problem_solving_score" integer,
	"body_language_score" integer,
	"emotional_state_score" integer,
	"professional_appearance_score" integer,
	"recommendation" text,
	"ai_summary" text,
	"notes" text,
	"transcript" jsonb,
	"token" text,
	"expires_at" timestamp,
	"candidate_name" text,
	"candidate_language" text,
	"camera_rejections" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lms_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"text" text,
	"type" text DEFAULT 'multiple_choice',
	"options" jsonb,
	"correct_ans" jsonb,
	"points" integer DEFAULT 1,
	"order_index" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "mes_downtime_reasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text,
	"name" text,
	"category" text,
	"is_planned" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "mes_downtime_reasons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "papka_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text,
	"status" text DEFAULT 'pending_tech',
	"sales_order_id" integer,
	"client_name" text,
	"product_name" text,
	"product_type" text,
	"quantity" integer,
	"format_width" numeric(10, 2),
	"format_height" numeric(10, 2),
	"deadline" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "position_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" integer,
	"node_id" integer,
	"item_type" varchar(20),
	"title" varchar(255),
	"url" text,
	"folder_name" text,
	"description" text,
	"lms_course_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer,
	"supplier_name" text,
	"invoice_no" text,
	"total_amount" numeric(15, 2),
	"paid_amount" numeric(15, 2) DEFAULT '0',
	"amount" numeric(15, 2),
	"currency" text DEFAULT 'UZS',
	"invoice_date" date,
	"due_date" date,
	"status" text DEFAULT 'pending',
	"payment_status" text DEFAULT 'unpaid',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qc_root_causes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text,
	"name" text,
	"category" text,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "qc_root_causes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "questionnaire_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer,
	"text" text,
	"type" text DEFAULT 'text',
	"options" jsonb,
	"order_index" integer DEFAULT 0,
	"is_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "adaptation_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" integer,
	"milestone_number" integer,
	"milestone_title" text,
	"description" text,
	"due_date" date,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "adaptation_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_name" text NOT NULL,
	"description" text,
	"duration_days" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "adaptation_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"program_id" integer,
	"status" text DEFAULT 'active',
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"steps" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_360_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"assessment_period" text,
	"assessment_year" integer,
	"self_rating" numeric(4, 2),
	"manager_rating" numeric(4, 2),
	"peer_rating" numeric(4, 2),
	"average_rating" numeric(4, 2),
	"strengths" text,
	"areas_for_improvement" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "enps_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"survey_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"score" integer,
	"comment" text,
	"answers" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hazard_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_name" text NOT NULL,
	"zone_code" text,
	"department_id" integer,
	"hazard_level" text DEFAULT 'low',
	"required_ppe" text,
	"max_occupancy" integer,
	"is_active" boolean DEFAULT true,
	"last_inspection_date" date,
	"next_inspection_date" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_360_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"order_id" integer,
	"session_id" text,
	"quantity" numeric(10, 2),
	"defect_rate" numeric(7, 4),
	"oee" numeric(7, 4),
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_brand_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"brand_data" jsonb,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "hr_brand_settings_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "hr_conflict_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"party1" text,
	"party2" text,
	"description" text,
	"severity" text DEFAULT 'low',
	"status" text DEFAULT 'open',
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_health_checkups" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" integer,
	"department_name" text,
	"total_employees" integer DEFAULT 0,
	"examined_count" integer DEFAULT 0,
	"last_checkup_date" date,
	"next_checkup_date" date,
	"status" text DEFAULT 'pending',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"start_date" date,
	"end_date" date,
	"reason" text,
	"status" text DEFAULT 'pending',
	"requested_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" integer PRIMARY KEY NOT NULL,
	"period_id" text,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "payroll_periods_period_id_unique" UNIQUE("period_id")
);
--> statement-breakpoint
CREATE TABLE "ppe_compliance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"ppe_type" text,
	"issue_date" date,
	"expiry_date" date,
	"is_compliant" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "safety_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_type" text,
	"severity" text DEFAULT 'low',
	"description" text,
	"location_description" text,
	"department_id" integer,
	"incident_date" date,
	"investigation_status" text DEFAULT 'open',
	"status" text DEFAULT 'reported',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "safety_training_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"training_id" integer,
	"employee_id" integer,
	"completed_date" date,
	"expiry_date" date,
	"score" numeric(5, 2),
	"is_passed" boolean DEFAULT false,
	"certificate_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salary_history" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" integer,
	"employee_id" integer NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency" text DEFAULT 'UZS',
	"effective_date" timestamp with time zone,
	"reason" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"change_type" text
);
--> statement-breakpoint
CREATE TABLE "sales_invoices" (
	"id" integer PRIMARY KEY NOT NULL,
	"invoice_number" text,
	"sales_order_id" text,
	"customer_id" text,
	"amount" numeric(18, 2) NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0',
	"currency" text DEFAULT 'UZS',
	"status" text DEFAULT 'draft' NOT NULL,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "sales_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "skill_catalog" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "skill_catalog_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "visitor_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitor_name" text NOT NULL,
	"visitor_phone" text,
	"visitor_company" text,
	"purpose" text,
	"host_employee_id" integer,
	"badge_number" text,
	"check_in_at" timestamp DEFAULT now(),
	"check_out_at" timestamp,
	"registered_by" integer,
	"id_document" text,
	"id_document_type" text DEFAULT 'passport',
	"notes" text,
	"status" text DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "workflow_route_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" text NOT NULL,
	"steps" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" text,
	"symbol" text,
	"exchange_rate" numeric(15, 6),
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "employee_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"contract_number" text,
	"contract_type" text DEFAULT 'permanent',
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_skill_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"skill_code" text NOT NULL,
	"current_level" integer DEFAULT 0,
	"assessed_by" integer,
	"last_assessed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"skill_name" text,
	"proficiency_level" text DEFAULT 'beginner',
	"proficiency_score" numeric(5, 2),
	"certified_date" date,
	"expiry_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_adaptation_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"status" text DEFAULT 'active',
	"risk_level" text DEFAULT 'low',
	"adaptation_day" integer DEFAULT 0,
	"risk_reason" text,
	"notified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hrc_iq_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"text_uz" text,
	"text_ru" text,
	"options" jsonb,
	"category" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pip_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"pip_plan_id" integer NOT NULL,
	"title" text,
	"description" text,
	"status" text DEFAULT 'pending',
	"due_date" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "position_skill_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" integer NOT NULL,
	"skill_code" text NOT NULL,
	"required_level" integer DEFAULT 3
);
--> statement-breakpoint
CREATE TABLE "bot_candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text,
	"telegram_chat_id" text,
	"vacancy_id" integer,
	"cv_file_id" text,
	"cv_file_name" text,
	"screening_answers" jsonb,
	"lang" text DEFAULT 'uz',
	"status" text DEFAULT 'new',
	"applied_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"status" text DEFAULT 'active' NOT NULL,
	"instructor_id" text,
	"cover_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "current_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_card_id" integer NOT NULL,
	"warehouse_id" integer,
	"quantity_on_hand" numeric(15, 4) DEFAULT '0',
	"last_movement_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "employee_issuance_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"material_card_id" integer,
	"issued_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gl_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"gl_document_id" integer,
	"line_number" integer,
	"account_id" integer,
	"cost_center_id" integer,
	"profit_center_id" integer,
	"debit_amount" numeric(15, 2) DEFAULT '0',
	"credit_amount" numeric(15, 2) DEFAULT '0',
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'new',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_interview_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "hr_sick_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"days" integer,
	"reason" text,
	"document_file_id" text,
	"status" text DEFAULT 'pending',
	"reported_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ideal_rasm_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_name" text,
	"target_key" text,
	"target_value" numeric(15, 4),
	"unit" text,
	"horizon_years" integer,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ideal_rasm_targets_target_key_unique" UNIQUE("target_key")
);
--> statement-breakpoint
CREATE TABLE "inventory_barcode_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_card_id" integer,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kanban_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"column_id" integer,
	"title" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kanban_columns" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" integer,
	"title" text,
	"position" integer DEFAULT 0,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_status_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"from_status" text,
	"to_status" text,
	"changed_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_barcode_print_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_card_id" integer,
	"pos_movement_id" integer,
	"copies" integer DEFAULT 1,
	"print_format" text,
	"printer_ip" text,
	"trigger_type" text DEFAULT 'AUTO',
	"status" text DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_damage_qc_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"damage_movement_id" integer,
	"original_movement_id" integer,
	"material_card_id" integer,
	"damaged_qty" numeric(15, 4),
	"damage_description" text,
	"qc_status" text DEFAULT 'PENDING',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_inventory_count_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"gl_posted" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_movements_archive" (
	"id" integer PRIMARY KEY NOT NULL,
	"movement_number" text,
	"movement_type_id" integer,
	"status" text,
	"from_warehouse_id" integer,
	"to_warehouse_id" integer,
	"received_by_employee_id" integer,
	"created_by" text,
	"supplier_name" text,
	"document_number" text,
	"document_date" date,
	"notes" text,
	"created_at" timestamp,
	"updated_at" timestamp,
	"archived_at" timestamp DEFAULT now(),
	"archive_reason" text
);
--> statement-breakpoint
CREATE TABLE "questionnaire_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recruitment_bot_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_chat_id" text,
	"vacancy_id" integer,
	"attempts" integer DEFAULT 0,
	"last_attempt_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_advance_idempotency_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"advance_paid" numeric(15, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_sd_advance_idempotency" UNIQUE("order_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "sd_customer_competitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"name" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_customer_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"name" text,
	"phone" text,
	"email" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_customer_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"title" text,
	"file_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_sales_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text,
	"status" text DEFAULT 'pending',
	"company_id" integer,
	"total_amount" numeric(15, 2),
	"advance_required" integer DEFAULT 70,
	"advance_paid" numeric(15, 2) DEFAULT '0',
	"advance_status" text DEFAULT 'pending',
	"design_flag" boolean DEFAULT false,
	"sample_flag" boolean DEFAULT false,
	"is_vip" boolean DEFAULT false,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"version" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer,
	"material_id" integer,
	"quantity" numeric(15, 4) DEFAULT '0',
	"reserved_quantity" numeric(15, 4) DEFAULT '0',
	"expiry_date" date,
	"batch_number" text,
	"received_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_documents_archive" (
	"id" integer PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"document_type" text,
	"title" text,
	"content" text,
	"pdf_url" text,
	"status" text,
	"initiated_by" integer,
	"created_at" timestamp,
	"updated_at" timestamp,
	"archived_at" timestamp DEFAULT now(),
	"archive_reason" text
);
--> statement-breakpoint
CREATE TABLE "mm_goods_issue_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_id" integer,
	"material_id" integer,
	"quantity" numeric(15, 4) DEFAULT '0',
	"batch_number" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mm_goods_receipt_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_id" integer,
	"material_id" integer,
	"ordered_qty" numeric(15, 4) DEFAULT '0',
	"received_qty" numeric(15, 4) DEFAULT '0',
	"batch_number" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mm_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"code" text,
	"category" text,
	"unit_of_measure" text,
	"barcode" text,
	"sku" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mm_purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer,
	"material_id" integer,
	"unit_price" numeric(15, 2),
	"quantity" numeric(15, 4),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tech_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"papka_order_id" integer,
	"material" text,
	"ink_colors" text,
	"print_type" text,
	"finishing" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "routing_operations" (
	"id" integer PRIMARY KEY NOT NULL,
	"routing_id" text NOT NULL,
	"work_center_id" text,
	"name" text NOT NULL,
	"sequence" integer DEFAULT 0,
	"setup_time_min" numeric(8, 2) DEFAULT '0',
	"run_time_min" numeric(8, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wms_internal_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer,
	"material_id" integer,
	"quantity" numeric(15, 4),
	"requested_by" integer,
	"notes" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wms_inventory_counts" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer,
	"status" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wms_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_warehouse_id" integer,
	"to_warehouse_id" integer,
	"material_id" integer,
	"quantity" numeric(15, 4),
	"requested_by" integer,
	"notes" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wms_warehouses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_report_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer,
	"status" text DEFAULT 'running',
	"triggered_by" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expense_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"status" text DEFAULT 'draft',
	"total_amount" numeric(15, 2) DEFAULT '0',
	"currency" text DEFAULT 'UZS',
	"submitted_at" timestamp,
	"approved_at" timestamp,
	"employee_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gl_documents" (
	"id" integer PRIMARY KEY NOT NULL,
	"document_number" text,
	"document_type" text NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency" text DEFAULT 'UZS',
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"metadata" text,
	"posted_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "gl_documents_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "lms_certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"course_id" text,
	"issued_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mes_maintenance_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"equipment_id" integer,
	"requested_by" integer,
	"status" text DEFAULT 'pending',
	"priority" text DEFAULT 'medium',
	"description" text,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mm_goods_receipt_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"goods_receipt_id" integer,
	"material_id" integer,
	"quantity" numeric(15, 4),
	"unit_cost" numeric(15, 4),
	"qc_status" text,
	"qc_notes" text,
	"qc_by" integer,
	"qc_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qc_final_inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"inspector_id" integer,
	"status" text DEFAULT 'pending',
	"notes" text,
	"passed" boolean DEFAULT false,
	"result" text,
	"defect_count" integer DEFAULT 0,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qc_in_process_inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"inspector_id" integer,
	"check_point" text,
	"sample_size" integer,
	"defects_found" integer DEFAULT 0,
	"status" text DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "raw_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text,
	"name" text,
	"category" text,
	"unit" text,
	"current_stock" numeric(15, 4) DEFAULT '0',
	"unit_price" numeric(15, 2) DEFAULT '0',
	"warehouse_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_customer_complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"status" text DEFAULT 'open',
	"resolution" text,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_customer_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"type" text,
	"notes" text,
	"employee_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_moves" (
	"id" serial PRIMARY KEY NOT NULL,
	"move_number" text,
	"move_date" date,
	"move_type" text,
	"quantity" numeric(15, 4),
	"unit_cost" numeric(15, 4),
	"total_cost" numeric(15, 4),
	"reference" text,
	"warehouse_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "waste_records" (
	"id" text PRIMARY KEY NOT NULL,
	"production_order_id" text,
	"order_id" text,
	"machine_id" text,
	"operator_id" text,
	"waste_type" text,
	"material_type" text,
	"quantity" numeric(15, 4),
	"unit" text,
	"cost_per_unit" numeric(15, 4),
	"total_cost" numeric(15, 4),
	"cause" text,
	"correction_action" text,
	"shift_number" integer,
	"date" date,
	"notes" text,
	"is_recyclable" boolean DEFAULT false,
	"recycled_quantity" numeric(15, 4) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "waste_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"waste_type" text,
	"target_quantity" numeric(15, 4),
	"target_cost" numeric(15, 4),
	"period" text DEFAULT 'monthly',
	"period_start" date,
	"period_end" date,
	"department" text,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "advances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"amount" numeric(15, 2),
	"status" text DEFAULT 'pending',
	"purpose" text,
	"approved_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"check_in" timestamp,
	"check_out" timestamp,
	"date" date,
	"status" text DEFAULT 'present',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_contacts" (
	"id" integer PRIMARY KEY NOT NULL,
	"company_id" integer,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"position" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crm_deals" (
	"id" integer PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"company_id" text,
	"name" text,
	"title" text,
	"status" text DEFAULT 'open',
	"amount" numeric(18, 2),
	"expected_amount" numeric(18, 2),
	"assigned_to" integer,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"metadata" text,
	"stage_id" integer
);
--> statement-breakpoint
CREATE TABLE "crm_leads" (
	"id" integer PRIMARY KEY NOT NULL,
	"company_id" integer,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"status" text DEFAULT 'new',
	"stage_id" integer,
	"source" text,
	"assigned_to" integer,
	"notes" text,
	"ai_score" numeric(5, 2),
	"ai_analyzed_at" timestamp with time zone,
	"metadata" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hr_leave_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"leave_type" text,
	"year" integer,
	"total_days" integer DEFAULT 0,
	"used_days" integer DEFAULT 0,
	"remaining_days" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "iot_sensor_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"sensor_id" integer,
	"value" numeric(15, 4),
	"unit" text,
	"recorded_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "iot_sensors" (
	"id" integer PRIMARY KEY NOT NULL,
	"device_code" text NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_reading_at" timestamp with time zone,
	"thresholds" text DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "iot_sensors_device_code_unique" UNIQUE("device_code")
);
--> statement-breakpoint
CREATE TABLE "mes_maintenance_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer,
	"assigned_to" integer,
	"title" text,
	"status" text DEFAULT 'pending',
	"reason" text,
	"result" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mes_production_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"operator_id" integer,
	"machine_id" integer,
	"shift_id" integer,
	"session_date" date,
	"status" text DEFAULT 'active',
	"produced_qty" numeric(15, 4) DEFAULT '0',
	"defect_qty" numeric(15, 4) DEFAULT '0',
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mes_shift_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_date" date,
	"shift_number" integer,
	"machine_id" integer,
	"produced_qty" numeric(15, 4) DEFAULT '0',
	"defect_qty" numeric(15, 4) DEFAULT '0',
	"downtime_min" integer DEFAULT 0,
	"oee" numeric(5, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"product_id" integer,
	"quantity" numeric(15, 4),
	"price" numeric(15, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"cashier_id" integer,
	"status" text DEFAULT 'open',
	"total_amount" numeric(15, 2) DEFAULT '0',
	"payment_method" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_printer_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"type" text,
	"ip_address" text,
	"port" integer,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"category_id" integer,
	"barcode" text,
	"price" numeric(15, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "raci_matrix" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer,
	"employee_id" integer,
	"role_type" text,
	"stage_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_leads" (
	"id" integer PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"company" text,
	"email" text,
	"phone" text,
	"status" text DEFAULT 'new' NOT NULL,
	"assigned_to" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sd_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"amount" numeric(15, 2),
	"payment_method" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"order_id" integer,
	"status" text DEFAULT 'draft',
	"total_amount" numeric(15, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "camera_employee_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" integer,
	"employee_id" integer,
	"activity" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "camera_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" integer,
	"log_type" text,
	"message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_purchase_requisitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer,
	"quantity" numeric(15, 4),
	"status" text DEFAULT 'pending',
	"requested_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "face_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"embedding" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_invoice_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer,
	"description" text,
	"quantity" numeric(15, 4),
	"unit_price" numeric(15, 2),
	"total" numeric(15, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text,
	"invoice_type" text,
	"customer_id" integer,
	"vendor_id" integer,
	"total_amount" numeric(15, 2),
	"paid_amount" numeric(15, 2) DEFAULT '0',
	"payment_status" text DEFAULT 'unpaid',
	"due_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fp_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"period" text,
	"status" text DEFAULT 'open',
	"total_amount" numeric(15, 2) DEFAULT '0',
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_id" integer,
	"employee_id" integer,
	"base_salary" numeric(15, 2),
	"net_pay" numeric(15, 2),
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer,
	"score" numeric(5, 2),
	"on_time_rate" numeric(5, 2),
	"quality_rate" numeric(5, 2),
	"period" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "zone_tracking_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" integer,
	"employee_id" integer,
	"entered_at" timestamp,
	"exited_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "adaptation_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer,
	"from_id" integer,
	"score" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disciplinary_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"type" text,
	"reason" text,
	"severity" text DEFAULT 'warning',
	"issued_by" integer,
	"appeal_status" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_benefits" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"benefit_type" text,
	"amount" numeric(15, 2),
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"type" text,
	"location" text,
	"status" text DEFAULT 'active',
	"last_maintenance_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_daily_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_date" date,
	"department_id" integer,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_downtime_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" integer,
	"reason" text,
	"started_at" timestamp,
	"ended_at" timestamp,
	"duration_min" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_employee_work_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"work_center_id" integer,
	"role" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"erp_role" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_mrp_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" integer,
	"material_id" integer,
	"required_qty" numeric(15, 4),
	"available_qty" numeric(15, 4),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_mrp_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_date" date,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_production_facts" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"machine_id" integer,
	"produced_qty" numeric(15, 4) DEFAULT '0',
	"shift_date" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_production_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"plan_date" date,
	"planned_qty" numeric(15, 4),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "erp_shift_calendars" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_date" date,
	"shift_number" integer,
	"is_working" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"title" text,
	"description" text,
	"due_date" date,
	"status" text DEFAULT 'in_progress',
	"progress" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kpi_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"unit" text,
	"target_value" numeric(15, 4),
	"department_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kpi_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"kpi_id" integer,
	"employee_id" integer,
	"actual_value" numeric(15, 4),
	"period" text,
	"recorded_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lms_achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"badge_url" text,
	"points" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lms_assignments" (
	"id" integer PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"user_id" integer,
	"module_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"score" numeric(5, 2),
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"course_id" integer
);
--> statement-breakpoint
CREATE TABLE "lms_exams" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text,
	"title" text,
	"pass_score" integer DEFAULT 70,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lms_knowledge" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"content" text,
	"category" text,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lms_modules" (
	"id" integer PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lms_tests_ext" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text,
	"title" text,
	"pass_score" integer DEFAULT 70,
	"time_limit" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lms_user_achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"achievement_id" text,
	"earned_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "machine_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" integer,
	"operator_id" integer,
	"order_id" integer,
	"status" text DEFAULT 'pending',
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pip_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer,
	"period" text,
	"score" numeric(5, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"type" text,
	"logged_at" timestamp,
	"source" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customs_declarations" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_number" text,
	"type" text,
	"status" text DEFAULT 'draft',
	"total_value" numeric(15, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "design_order_revisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"version" integer DEFAULT 1,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_360_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer,
	"rater_id" integer,
	"scores" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_daily_kpi" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"kpi_date" date,
	"value" numeric(15, 4),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_daily_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"report_date" date,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"file_type" text,
	"file_name" text,
	"file_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_inventory_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"item_id" integer,
	"quantity" numeric(15, 4),
	"type" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_liability_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"amount" numeric(15, 2),
	"reason" text,
	"status" text DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_rating_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"goal_id" integer,
	"score" numeric(5, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"rater_id" integer,
	"score" numeric(5, 2),
	"period" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"from_department" integer,
	"to_department" integer,
	"from_position" integer,
	"to_position" integer,
	"effective_date" date,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exception_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" text,
	"error_msg" text,
	"stack" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_application_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer,
	"question_id" integer,
	"answer" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_candidate_funnels" (
	"id" integer PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"vacancy_id" integer,
	"funnel_id" integer,
	"funnel_stage" text DEFAULT 'applied' NOT NULL,
	"productivity_category" text,
	"source" text,
	"assigned_recruiter_id" integer,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"metadata" text,
	"screening_score" numeric(5, 2),
	"initial_screening_notes" text,
	"quick_rejection_reason" text,
	"rejected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"hired_at" timestamp with time zone,
	"is_quick_rejected" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "hr_capital_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"provider" text,
	"cost" numeric(15, 2),
	"duration" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_price_formulas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"formula" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sd_rentals" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"equipment_id" integer,
	"start_date" date,
	"end_date" date,
	"daily_rate" numeric(15, 2),
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shift_swap_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"requester_id" integer,
	"target_id" integer,
	"shift_date" date,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "succession_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" integer,
	"candidate_id" integer,
	"readiness" text DEFAULT 'medium',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouse_access_grants" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer,
	"employee_id" integer,
	"access_level" text DEFAULT 'read',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouse_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer,
	"item_id" integer,
	"batch_number" text,
	"quantity" numeric(15, 4),
	"received_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouse_rental_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer,
	"customer_id" integer,
	"start_date" date,
	"end_date" date,
	"monthly_rate" numeric(15, 2),
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouse_rental_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer,
	"free_days" integer DEFAULT 30,
	"daily_rate" numeric(15, 2),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouse_stock" (
	"id" integer PRIMARY KEY NOT NULL,
	"warehouse_id" integer NOT NULL,
	"material_id" text NOT NULL,
	"quantity" numeric(15, 4) DEFAULT '0' NOT NULL,
	"reserved_quantity" numeric(15, 4) DEFAULT '0',
	"unit" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wms_exit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" integer,
	"warehouse_id" integer,
	"quantity" numeric(15, 4),
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wms_production_supply" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"material_id" integer,
	"quantity" numeric(15, 4),
	"supplied_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_interview_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" integer,
	"status" text DEFAULT 'in_progress',
	"score" integer,
	"transcript" jsonb DEFAULT '[]'::jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assessment_skips" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "department_warehouse_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" integer,
	"warehouse_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goods_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer,
	"received_by" integer,
	"status" text DEFAULT 'draft',
	"notes" text,
	"received_at" timestamp,
	"completed_by" integer,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "internal_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer,
	"item_id" integer,
	"quantity" numeric(15, 4),
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer,
	"warehouse_id" integer,
	"quantity" numeric(15, 4),
	"order_id" integer,
	"status" text DEFAULT 'reserved',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouse_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" integer,
	"item_id" integer,
	"type" text,
	"quantity" numeric(15, 4),
	"reference_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouse_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_warehouse_id" integer,
	"to_warehouse_id" integer,
	"item_id" integer,
	"quantity" numeric(15, 4),
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer,
	"week_start" date,
	"status" text DEFAULT 'draft',
	"items" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" integer PRIMARY KEY NOT NULL,
	"vacancy_id" integer,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"full_name" text,
	"status" text DEFAULT 'applied',
	"rating" integer,
	"is_archived" boolean DEFAULT false,
	"source" text,
	"resume_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "crm_companies" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"industry" text,
	"website" text,
	"inn" text,
	"address" text,
	"credit_limit" numeric DEFAULT '0',
	"used_credit" numeric DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_pipelines" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sort" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_stages" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_id" integer,
	"sort" integer DEFAULT 0,
	"probability" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"department" text,
	"department_id" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"is_active" boolean DEFAULT true,
	"requirements" text,
	"closing_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"closed_at" timestamp with time zone,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "hr_employee_onboardings" (
	"id" integer PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"plan_id" text,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"progress" integer DEFAULT 0,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"mentor_id" integer,
	"expected_end_date" timestamp with time zone,
	"actual_end_date" timestamp with time zone,
	"weekly_progress" text,
	"probation_score" numeric(5, 2),
	"probation_notes" text,
	"is_probation_passed" boolean
);
--> statement-breakpoint
CREATE TABLE "hr_funnel_history" (
	"id" integer PRIMARY KEY NOT NULL,
	"candidate_id" integer,
	"funnel_id" text,
	"stage" text NOT NULL,
	"changed_by" text,
	"from_stage" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_job_descriptions" (
	"id" integer PRIMARY KEY NOT NULL,
	"position_id" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"is_current_version" boolean DEFAULT false,
	"created_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "hr_job_offers" (
	"id" integer PRIMARY KEY NOT NULL,
	"vacancy_id" integer,
	"candidate_id" integer NOT NULL,
	"funnel_id" integer,
	"position" text NOT NULL,
	"department" text,
	"start_date" timestamp with time zone,
	"probation_months" integer DEFAULT 3,
	"salary_probation" integer,
	"salary_after" integer,
	"work_schedule" text,
	"additional_benefits" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"offer_expires_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"decline_reason" text,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_motivation_plans" (
	"id" integer PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"title" text NOT NULL,
	"targets" text DEFAULT '[]',
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "hr_onboarding_plans" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"tasks" text DEFAULT '[]',
	"duration_days" integer DEFAULT 30,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"department_id" text,
	"position_id" integer,
	"created_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "hr_productivity_interviews" (
	"id" integer PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"funnel_id" integer,
	"interviewer_id" integer,
	"productivity_interview" text,
	"reference_check" text,
	"final_decision" text,
	"final_notes" text,
	"conducted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_references_checks" (
	"id" integer PRIMARY KEY NOT NULL,
	"funnel_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"previous_company" text NOT NULL,
	"contact_person" text NOT NULL,
	"contact_phone" text,
	"contact_position" text,
	"result" text,
	"would_rehire" boolean,
	"notes" text,
	"rating" integer,
	"checked_by_id" integer,
	"checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_tool_test_results" (
	"id" integer PRIMARY KEY NOT NULL,
	"candidate_id" integer NOT NULL,
	"vacancy_id" integer,
	"funnel_id" integer,
	"point_a" integer,
	"point_b" integer,
	"point_c" integer,
	"point_d" integer,
	"point_e" integer,
	"point_f" integer,
	"point_g" integer,
	"point_h" integer,
	"point_i" integer,
	"point_j" integer,
	"compulsive_points" text[],
	"total_score" integer,
	"category_result" text DEFAULT 'UNKNOWN',
	"position_match_score" integer,
	"position_match_notes" text,
	"tested_by_id" integer,
	"test_date" timestamp with time zone DEFAULT now() NOT NULL,
	"is_valid" boolean DEFAULT true NOT NULL,
	"invalid_reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_sequences" (
	"id" integer PRIMARY KEY NOT NULL,
	"document_type" text NOT NULL,
	"prefix" text,
	"last_number" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"month" integer,
	"year" integer,
	CONSTRAINT "document_sequences_document_type_unique" UNIQUE("document_type")
);
--> statement-breakpoint
CREATE TABLE "payroll_rows" (
	"id" integer PRIMARY KEY NOT NULL,
	"period_id" integer NOT NULL,
	"employee_id" text NOT NULL,
	"base_salary" numeric(18, 2),
	"bonus" numeric(18, 2) DEFAULT '0',
	"deductions" numeric(18, 2) DEFAULT '0',
	"net_pay" numeric(18, 2),
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" integer PRIMARY KEY NOT NULL,
	"purchase_order_id" text NOT NULL,
	"material_id" text,
	"description" text,
	"quantity" numeric(15, 4) NOT NULL,
	"unit" text,
	"unit_price" numeric(18, 2),
	"total_price" numeric(18, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouse_zones" (
	"id" integer PRIMARY KEY NOT NULL,
	"warehouse_id" integer NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"type" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bom_headers" (
	"id" integer PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"version" text DEFAULT '1.0',
	"status" text DEFAULT 'draft',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bom_items" (
	"id" integer PRIMARY KEY NOT NULL,
	"bom_id" integer NOT NULL,
	"material_id" text NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"unit" text,
	"scrap_percent" numeric(5, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "downtime_reason_codes" (
	"id" integer PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "downtime_reason_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "equipment_maintenance" (
	"id" integer PRIMARY KEY NOT NULL,
	"work_center_id" text NOT NULL,
	"type" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"assigned_to" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "machine_crews" (
	"id" integer PRIMARY KEY NOT NULL,
	"work_center_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"production_order_id" integer,
	"role" text,
	"start_date" text,
	"end_date" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"budget" numeric(18, 2),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "marketing_leads" (
	"id" integer PRIMARY KEY NOT NULL,
	"campaign_id" text,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"status" text DEFAULT 'new' NOT NULL,
	"converted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mro_inventory" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"part_number" text,
	"warehouse_id" text,
	"quantity" numeric(15, 4) DEFAULT '0',
	"unit" text,
	"min_quantity" numeric(15, 4) DEFAULT '0',
	"unit_price" numeric(18, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "mro_inventory_part_number_unique" UNIQUE("part_number")
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"parent_id" text,
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "qc_braks" (
	"id" integer PRIMARY KEY NOT NULL,
	"production_order_id" text,
	"material_id" text,
	"quantity" numeric(15, 4) NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "security_access" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"module" text NOT NULL,
	"can_access" boolean DEFAULT true,
	"granted_by" text,
	"granted_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "security_attendance" (
	"id" integer PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"event_type" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"gate_id" text,
	"method" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "website_banners" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_url" text,
	"link_url" text,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"position" text
);
--> statement-breakpoint
CREATE TABLE "website_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"type" text DEFAULT 'text',
	"updated_at" timestamp with time zone DEFAULT now(),
	"category" text,
	CONSTRAINT "website_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "customer_accounts" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"status" text DEFAULT 'active' NOT NULL,
	"credit_limit" numeric(18, 2) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"full_name" text,
	"company_name" text,
	"is_verified" boolean DEFAULT false,
	"password_hash" text,
	"verification_code" text,
	CONSTRAINT "customer_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customer_orders" (
	"id" integer PRIMARY KEY NOT NULL,
	"customer_id" text,
	"order_number" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(18, 2),
	"total" numeric(18, 2),
	"currency" text DEFAULT 'UZS',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"guest_name" text,
	"guest_phone" text,
	"payment_status" text,
	CONSTRAINT "customer_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "design_library_items" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"file_url" text,
	"thumbnail_url" text,
	"tags" text DEFAULT '[]',
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hitl_approvals" (
	"id" integer PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_by" text,
	"approved_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "logistics_routes" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"from_location" text,
	"to_location" text,
	"distance_km" numeric(8, 2),
	"estimated_hours" numeric(5, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mm_deliveries" (
	"id" integer PRIMARY KEY NOT NULL,
	"purchase_order_id" text,
	"vendor_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"delivered_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" integer PRIMARY KEY NOT NULL,
	"sort_order" integer DEFAULT 0,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"category_id" text,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "production_sessions" (
	"id" integer PRIMARY KEY NOT NULL,
	"production_order_id" text,
	"session_id" text,
	"work_center_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "public_products" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"description" text,
	"price" numeric(18, 2),
	"category_id" text,
	"is_active" boolean DEFAULT true,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"in_stock" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	CONSTRAINT "public_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sd_orders" (
	"id" integer PRIMARY KEY NOT NULL,
	"order_number" text,
	"customer_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(18, 2),
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sd_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "stock_transfer_lines" (
	"id" integer PRIMARY KEY NOT NULL,
	"transfer_id" text NOT NULL,
	"material_id" text NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"unit" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "website_pages" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	CONSTRAINT "website_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customer_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_number" varchar(50),
	"payment_date" varchar(10),
	"customer_id" varchar,
	"sales_invoice_id" varchar,
	"payment_method" varchar(30) DEFAULT 'bank_transfer',
	"bank_account" varchar(50),
	"amount" numeric DEFAULT '0',
	"currency" varchar(10) DEFAULT 'UZS',
	"exchange_rate" numeric DEFAULT '1',
	"reference" varchar(100),
	"status" varchar(20) DEFAULT 'received',
	"applied_at" timestamp with time zone,
	"approved_by" varchar,
	"approved_at" timestamp with time zone,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wms_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"qty" numeric(15, 3),
	"batch_no" varchar(100),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"deleted_by" integer
);
--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mes_sessions" ADD CONSTRAINT "mes_sessions_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mes_sessions" ADD CONSTRAINT "mes_sessions_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_item_id_stock_items_id_fk" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_entries" ADD CONSTRAINT "gl_entries_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_assets" ADD CONSTRAINT "employee_assets_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_approvals" ADD CONSTRAINT "technology_approvals_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_device_id_sensor_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."sensor_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_supplier_quality" ADD CONSTRAINT "qc_supplier_quality_vendor_id_mm_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."mm_vendors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_lines" ADD CONSTRAINT "inventory_count_lines_count_id_inventory_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."inventory_counts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_movement_lines" ADD CONSTRAINT "pos_movement_lines_movement_id_pos_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."pos_movements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_request_lines" ADD CONSTRAINT "transfer_request_lines_request_id_transfer_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."transfer_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deals_lead_id_idx" ON "deals" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "deals_status_idx" ON "deals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "deals_created_by_idx" ON "deals" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "leads_assigned_to_idx" ON "leads" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_key_idx" ON "settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "mes_sessions_production_order_id_idx" ON "mes_sessions" USING btree ("production_order_id");--> statement-breakpoint
CREATE INDEX "mes_sessions_operator_id_idx" ON "mes_sessions" USING btree ("operator_id");--> statement-breakpoint
CREATE INDEX "mes_sessions_status_idx" ON "mes_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "qc_inspections_reference_id_idx" ON "qc_inspections" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "qc_inspections_inspector_id_idx" ON "qc_inspections" USING btree ("inspector_id");--> statement-breakpoint
CREATE INDEX "qc_inspections_status_idx" ON "qc_inspections" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_items_sku_idx" ON "stock_items" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "stock_items_category_idx" ON "stock_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "stock_items_location_idx" ON "stock_items" USING btree ("location");--> statement-breakpoint
CREATE INDEX "stock_items_is_active_idx" ON "stock_items" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "stock_movements_stock_item_id_idx" ON "stock_movements" USING btree ("stock_item_id");--> statement-breakpoint
CREATE INDEX "stock_movements_movement_type_idx" ON "stock_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "stock_movements_reference_id_idx" ON "stock_movements" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "vendors_name_idx" ON "vendors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "vendors_is_active_idx" ON "vendors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "warehouses_name_idx" ON "warehouses" USING btree ("name");--> statement-breakpoint
CREATE INDEX "payroll_employee_id_idx" ON "payroll" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payroll_period_idx" ON "payroll" USING btree ("period");--> statement-breakpoint
CREATE INDEX "payroll_status_idx" ON "payroll" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "gl_entries_entry_number_idx" ON "gl_entries" USING btree ("entry_number");--> statement-breakpoint
CREATE INDEX "gl_entries_debit_account_idx" ON "gl_entries" USING btree ("debit_account");--> statement-breakpoint
CREATE INDEX "gl_entries_credit_account_idx" ON "gl_entries" USING btree ("credit_account");--> statement-breakpoint
CREATE INDEX "gl_entries_posted_at_idx" ON "gl_entries" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX "payments_invoice_id_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_paid_at_idx" ON "payments" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "campaigns_type_idx" ON "campaigns" USING btree ("type");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_created_by_idx" ON "campaigns" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "deliveries_delivery_number_idx" ON "deliveries" USING btree ("delivery_number");--> statement-breakpoint
CREATE INDEX "deliveries_sales_order_id_idx" ON "deliveries" USING btree ("sales_order_id");--> statement-breakpoint
CREATE INDEX "deliveries_status_idx" ON "deliveries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "deliveries_driver_id_idx" ON "deliveries" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "employee_assets_asset_id_idx" ON "employee_assets" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "employee_assets_employee_id_idx" ON "employee_assets" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "kanban_tasks_status_idx" ON "kanban_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "kanban_tasks_assigned_to_idx" ON "kanban_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "kanban_tasks_priority_idx" ON "kanban_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "maintenance_orders_equipment_id_idx" ON "maintenance_orders" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "maintenance_orders_status_idx" ON "maintenance_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "maintenance_orders_priority_idx" ON "maintenance_orders" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "maintenance_orders_assigned_to_idx" ON "maintenance_orders" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "security_incidents_severity_idx" ON "security_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "security_incidents_status_idx" ON "security_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "security_incidents_reported_by_idx" ON "security_incidents" USING btree ("reported_by");--> statement-breakpoint
CREATE INDEX "security_incidents_assigned_to_idx" ON "security_incidents" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "technology_approvals_papka_order_id_idx" ON "technology_approvals" USING btree ("papka_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "camera_ai_configs_camera_id_uidx" ON "camera_ai_configs" USING btree ("camera_id");--> statement-breakpoint
CREATE INDEX "camera_alerts_is_resolved_idx" ON "camera_alerts" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX "camera_alerts_severity_idx" ON "camera_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "camera_alerts_created_at_idx" ON "camera_alerts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "camera_events_camera_id_idx" ON "camera_events" USING btree ("camera_id");--> statement-breakpoint
CREATE INDEX "camera_events_event_type_idx" ON "camera_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "camera_events_status_idx" ON "camera_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "camera_events_created_at_idx" ON "camera_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "camera_quality_defects_status_idx" ON "camera_quality_defects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "camera_quality_defects_detected_at_idx" ON "camera_quality_defects" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "camera_safety_violations_status_idx" ON "camera_safety_violations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "camera_safety_violations_detected_at_idx" ON "camera_safety_violations" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "camera_zones_camera_id_idx" ON "camera_zones" USING btree ("camera_id");--> statement-breakpoint
CREATE INDEX "cameras_is_active_idx" ON "cameras" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "sensor_devices_device_code_idx" ON "sensor_devices" USING btree ("device_code");--> statement-breakpoint
CREATE INDEX "sensor_devices_type_idx" ON "sensor_devices" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sensor_devices_status_idx" ON "sensor_devices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sensor_readings_device_id_idx" ON "sensor_readings" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "sensor_readings_recorded_at_idx" ON "sensor_readings" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "sensor_readings_is_anomaly_idx" ON "sensor_readings" USING btree ("is_anomaly");--> statement-breakpoint
CREATE INDEX "retail_pos_products_barcode_idx" ON "retail_pos_products" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "retail_pos_products_active_idx" ON "retail_pos_products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "retail_pos_transactions_cashier_idx" ON "retail_pos_transactions" USING btree ("cashier_id");--> statement-breakpoint
CREATE INDEX "retail_pos_transactions_status_idx" ON "retail_pos_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "retail_pos_transactions_date_idx" ON "retail_pos_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pos_ff_position_feature" ON "position_feature_flags" USING btree ("position_id","feature_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pos_perm_position_module" ON "position_permissions" USING btree ("position_id","module_code");--> statement-breakpoint
CREATE UNIQUE INDEX "forecast_series_mat_period_method_uq" ON "forecast_series" USING btree ("material_id","period","method");--> statement-breakpoint
CREATE INDEX "forecast_series_mat_period_idx" ON "forecast_series" USING btree ("material_id","period");--> statement-breakpoint
CREATE INDEX "forecast_series_method_idx" ON "forecast_series" USING btree ("method");--> statement-breakpoint
CREATE INDEX "idx_chart_process_time" ON "control_chart_point" USING btree ("process_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_separation_employee" ON "employee_separation" USING btree ("employee_id","separation_date");--> statement-breakpoint
CREATE INDEX "idx_ot_policy_active" ON "overtime_policy" USING btree ("is_active","effective_from");--> statement-breakpoint
CREATE INDEX "ai_hr_interviews_status_idx" ON "ai_hr_interviews" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_insights_user_idx" ON "ai_insights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_planning_plans_status_idx" ON "ai_planning_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ai_reservation_requests_status_idx" ON "ai_reservation_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "kanban_card_comments_card_idx" ON "kanban_card_comments" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "kanban_checklist_items_checklist_idx" ON "kanban_checklist_items" USING btree ("checklist_id");--> statement-breakpoint
CREATE INDEX "kanban_checklists_card_idx" ON "kanban_checklists" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "kanban_flows_board_idx" ON "kanban_flows" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "kanban_robots_board_idx" ON "kanban_robots" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "mkt_posts_status_idx" ON "marketing_content_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mkt_social_posts_status_idx" ON "marketing_social_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "calendar_events_start_idx" ON "calendar_events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "guidelines_category_idx" ON "guidelines" USING btree ("category");