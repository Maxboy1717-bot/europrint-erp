CREATE SEQUENCE "public"."purchase_requisition_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."design_order_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "application_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"assigned_to" integer,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"notes" text,
	"response" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"last_notified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"description" text,
	"description_ru" text,
	"department_id" integer,
	"position_id" integer,
	"questions" jsonb NOT NULL,
	"due_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"message_ru" text,
	"media_type" varchar(20),
	"media_path" text,
	"media_caption" text,
	"sent_by" varchar,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"recipient_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"description" text,
	"description_ru" text,
	"type" varchar(20) NOT NULL,
	"course_id" integer,
	"trainer_id" integer,
	"room_id" integer,
	"start_date" varchar(10) NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"end_time" varchar(8) NOT NULL,
	"max_participants" integer,
	"target_departments" text[],
	"target_positions" text[],
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "company_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"period_start" varchar(10) NOT NULL,
	"period_end" varchar(10) NOT NULL,
	"responsible_department_id" integer,
	"target_value" numeric(18, 4),
	"kpi_code" varchar(50),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "company_plan_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" varchar,
	"task_title" text NOT NULL,
	"responsible_user_id" integer,
	"responsible_department_id" integer,
	"due_date" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_tskp" (
	"id" serial PRIMARY KEY NOT NULL,
	"tskp" text NOT NULL,
	"tskp_ru" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(100) DEFAULT 'info@europrint.uz' NOT NULL,
	"phone" varchar(50) DEFAULT '+998 71 123 45 67' NOT NULL,
	"website" varchar(100) DEFAULT 'www.europrint.uz' NOT NULL,
	"address" text DEFAULT 'Toshkent shahar, Yashnobod tumani' NOT NULL,
	"address_ru" text DEFAULT 'г. Ташкент, Яшнабадский район' NOT NULL,
	"working_hours" text DEFAULT '9:00 - 18:00 (Dushanba - Juma)' NOT NULL,
	"working_hours_ru" text DEFAULT '9:00 - 18:00 (Понедельник - Пятница)' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_date" varchar(10) NOT NULL,
	"user_id" integer,
	"shift" varchar(20),
	"work_center_id" varchar,
	"production_order_id" varchar,
	"plan_qty" integer DEFAULT 0 NOT NULL,
	"fact_qty" integer DEFAULT 0 NOT NULL,
	"scrap_qty" integer DEFAULT 0 NOT NULL,
	"downtime_minutes" integer DEFAULT 0 NOT NULL,
	"downtime_reason_code" varchar(50),
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "employee_functions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"function_id" varchar NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"workload_percent" integer DEFAULT 100 NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "employee_org_departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"org_department_id" varchar NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erp_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_name" varchar(50) NOT NULL,
	"role_name_ru" varchar(50),
	"description" text,
	"permissions" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "erp_roles_role_name_unique" UNIQUE("role_name")
);
--> statement-breakpoint
CREATE TABLE "event_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'registered' NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_alumni" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"full_name" varchar(200) NOT NULL,
	"last_position" varchar(200),
	"department_name" varchar(200),
	"exit_date" varchar(10),
	"exit_type" varchar(50) DEFAULT 'resigned',
	"current_employer" varchar(200),
	"contact_email" varchar(200),
	"is_returned" boolean DEFAULT false,
	"collaboration_project" varchar(300),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_health_checkups" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" integer,
	"department_name" varchar(200) NOT NULL,
	"total_employees" integer DEFAULT 0,
	"examined_count" integer DEFAULT 0,
	"last_checkup_date" varchar(10),
	"next_checkup_date" varchar(10),
	"status" varchar(50) DEFAULT 'scheduled',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_onboarding_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) DEFAULT 'onboarding' NOT NULL,
	"completed_items" integer DEFAULT 0,
	"total_items" integer DEFAULT 12,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"kpi_name" varchar(50) NOT NULL,
	"calculation_date" varchar(10) NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"work_center_id" varchar,
	"department_id" integer,
	"target_value" numeric(18, 4),
	"actual_value" numeric(18, 4) NOT NULL,
	"variance" numeric(18, 4),
	"variance_percent" numeric(18, 4),
	"status" varchar(20) DEFAULT 'normal' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"location" text,
	"location_ru" text,
	"capacity" integer NOT NULL,
	"facilities" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"description" text,
	"description_ru" text,
	"color" varchar(20) DEFAULT '#3b82f6' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"head_user_id" integer,
	"tskp" text,
	"tskp_ru" text,
	"parent_id" varchar,
	"hierarchy_level" integer DEFAULT 0 NOT NULL,
	"node_type" varchar(50) DEFAULT 'department' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_functions" (
	"id" serial PRIMARY KEY NOT NULL,
	"department_id" varchar NOT NULL,
	"sub_department_name" text,
	"sub_department_name_ru" text,
	"position_name" text NOT NULL,
	"position_name_ru" text,
	"function_description" text,
	"function_description_ru" text,
	"tskp" text,
	"tskp_ru" text,
	"tskp_target" integer,
	"tskp_measurement_unit" varchar(50),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"related_id" varchar,
	"title" text NOT NULL,
	"title_ru" text,
	"message" text,
	"message_ru" text,
	"remind_at" timestamp NOT NULL,
	"sent" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"date" varchar(10) NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_time" varchar(8) NOT NULL,
	"status" varchar(20) DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"response" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"survey_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"responded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"description" text,
	"description_ru" text,
	"questions" jsonb NOT NULL,
	"target_departments" jsonb,
	"target_positions" jsonb,
	"created_by" varchar,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"total_responses" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(100) DEFAULT 'Europrint' NOT NULL,
	"default_language" varchar(5) DEFAULT 'uz' NOT NULL,
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"pass_percentage" integer DEFAULT 80 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"randomize_questions" boolean DEFAULT true NOT NULL,
	"gpt_model" varchar(50) DEFAULT 'gpt-4o' NOT NULL,
	"prompt_template" text DEFAULT 'KONTEKST: Europrint {bo''lim} bo''limi, lavozim: {lavozim}.
YO''RIQNOMA: {yo''riqnoma_matni}
RUBRIKA VA VAZNLAR: {rubrika_json}
TOPSHIRIQ: {savol_matni}
XODIM JAVOBI: {xodim_javobi}' NOT NULL,
	"inps_rate" real DEFAULT 0.12,
	"min_wage" integer DEFAULT 1120000,
	"qqs_rate" real DEFAULT 12,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name_uz" varchar(150) NOT NULL,
	"name_ru" varchar(150),
	"parent_id" integer,
	"manager_id" integer,
	"vysotskiy_function" varchar(50),
	"level" integer DEFAULT 1,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text,
	"name_en" text,
	"organization_number" varchar(10),
	"description_ru" text,
	"vep" text,
	"vep_ru" text,
	"statistics_type" varchar(50),
	"department_code" varchar(20),
	"icon" varchar(50),
	"color" varchar(20)
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"message" text NOT NULL,
	"message_ru" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name_uz" varchar(150) NOT NULL,
	"name_ru" varchar(150),
	"department_id" integer,
	"level" integer DEFAULT 1,
	"rbac_tier" varchar(20) DEFAULT 'standard',
	"is_management" boolean DEFAULT false,
	"min_salary" integer,
	"max_salary" integer,
	"headcount" integer,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text,
	"name_en" text,
	"official_title" text,
	"ckp" text,
	"organization_number" varchar(10),
	"ai_exam_enabled" boolean DEFAULT false,
	"description_ru" text,
	"vep" text,
	"vep_ru" text,
	"statistics_type" varchar(50),
	"manager_id" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(100),
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"middle_name" varchar(100),
	"position_id" integer,
	"department_id" integer,
	"phone" varchar(20),
	"avatar_url" text,
	"telegram_chat_id" varchar(50),
	"language" varchar(5) DEFAULT 'uz',
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"full_name" text,
	"employee_id" varchar(50),
	"role" varchar(20) DEFAULT 'employee' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"profile_image_url" text,
	"manager_id" integer,
	"hierarchy_level" varchar(50),
	"ckp_code" varchar(50),
	"rfid_card" varchar(100),
	"age" integer,
	"gender" varchar(10),
	"children_count" integer DEFAULT 0,
	"marital_status" varchar(20),
	"children_education" text,
	"household_size" integer,
	"household_members" text,
	"housing_type" varchar(20),
	"latitude" numeric(18, 4),
	"longitude" numeric(18, 4),
	"shift" varchar(20),
	"district" text,
	"salary_type" varchar(20),
	"workshop_zone" varchar(100),
	"lang" varchar(5) DEFAULT 'uz',
	"birth_date" varchar(10),
	"hire_date" varchar(10),
	"address" text,
	"attestation_date" varchar(10),
	"deleted_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id"),
	CONSTRAINT "users_rfid_card_unique" UNIQUE("rfid_card")
);
--> statement-breakpoint
CREATE TABLE "ai_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"target_id" varchar,
	"insight_type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"severity" varchar(20) DEFAULT 'info' NOT NULL,
	"action_items" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benchmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"metric" varchar(50) NOT NULL,
	"value" integer NOT NULL,
	"source" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"target_id" varchar,
	"metric" varchar(50) NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"target_value" integer NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ru" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"content" text,
	"content_ru" text,
	"file_url" text,
	"file_type" varchar(20),
	"file_content" text,
	"tags" text[],
	"is_active" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "saved_filters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filter_data" jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "welcome_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ru" text NOT NULL,
	"description" text,
	"description_ru" text,
	"event_date" varchar(10) NOT NULL,
	"event_time" varchar(5),
	"location" text,
	"participants" text[],
	"agenda" jsonb,
	"organizer_id" varchar,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"attendance_count" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"insight_id" integer,
	"report_id" integer,
	"alert_type" varchar(50),
	"severity" varchar(20) DEFAULT 'medium',
	"title" text NOT NULL,
	"title_ru" text,
	"message" text,
	"message_ru" text,
	"data" jsonb,
	"is_read" boolean DEFAULT false,
	"is_resolved" boolean DEFAULT false,
	"resolved_by_id" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt_number" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" varchar(50),
	"prompt_text" text NOT NULL,
	"variables" jsonb DEFAULT '[]',
	"examples" jsonb DEFAULT '[]',
	"usage_count" integer DEFAULT 0 NOT NULL,
	"avg_rating" numeric(18, 4),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_prompts_prompt_number_unique" UNIQUE("prompt_number")
);
--> statement-breakpoint
CREATE TABLE "ai_report_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text NOT NULL,
	"icon" varchar(50),
	"color" varchar(20),
	"report_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_report_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ai_report_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"category_id" integer,
	"name" text NOT NULL,
	"name_ru" text NOT NULL,
	"description" text,
	"ai_engines" text[],
	"schedule" varchar(20) DEFAULT 'daily',
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_report_definitions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ai_report_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_run_id" integer,
	"ai_engine" varchar(50),
	"insight_type" varchar(50),
	"severity" varchar(20) DEFAULT 'info',
	"title" text NOT NULL,
	"title_ru" text,
	"content" text,
	"content_ru" text,
	"data" jsonb,
	"action_required" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_report_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer,
	"run_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"execution_time_ms" integer,
	"data_snapshot" jsonb,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "ai_report_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"report_id" integer,
	"delivery_channel" varchar(20) DEFAULT 'telegram',
	"schedule" varchar(20) DEFAULT 'daily',
	"is_active" boolean DEFAULT true NOT NULL,
	"last_delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"insight_id" integer,
	"alert_id" integer,
	"title" text NOT NULL,
	"title_ru" text,
	"description" text,
	"description_ru" text,
	"priority" varchar(20) DEFAULT 'medium',
	"status" varchar(20) DEFAULT 'pending',
	"assigned_to_id" varchar,
	"assigned_by_id" varchar,
	"due_date" timestamp,
	"completed_at" timestamp,
	"completion_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_id" varchar(100) NOT NULL,
	"document_number" varchar(100),
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"requested_by" varchar,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approver_user_id" varchar,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "approval_workflow_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" varchar NOT NULL,
	"step_number" integer NOT NULL,
	"approver_id" varchar NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"comment" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_workflow_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" varchar NOT NULL,
	"step_number" integer NOT NULL,
	"approver_role" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_workflow_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_id" varchar(100) NOT NULL,
	"template_id" varchar NOT NULL,
	"creator_id" varchar NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"symbol" varchar(5) NOT NULL,
	"is_base_currency" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"decimal_places" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "currencies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "document_reversals" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_document_type" varchar(50) NOT NULL,
	"original_document_id" varchar(100) NOT NULL,
	"original_document_number" varchar(100),
	"reversal_reason" text NOT NULL,
	"reversal_document_id" varchar(100),
	"reversal_document_number" varchar(100),
	"reversed_by" varchar,
	"reversed_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'reversed' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"prefix" varchar(20) NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "document_sequences_prefix_year_month_unique" UNIQUE("prefix","year","month")
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) NOT NULL,
	"rate" numeric(18, 4) NOT NULL,
	"rate_date" varchar(10) NOT NULL,
	"source" varchar(50) DEFAULT 'manual',
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_trail_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(50) NOT NULL,
	"table_name" varchar(100),
	"record_id" varchar(100),
	"document_number" varchar(50),
	"user_id" integer,
	"user_full_name" text,
	"user_role" varchar(50),
	"module" varchar(30),
	"old_data" jsonb,
	"new_data" jsonb,
	"changed_fields" text[],
	"ip_address" varchar(50),
	"user_agent" text,
	"session_id" varchar(100),
	"request_id" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_code" varchar(50) NOT NULL,
	"rule_name" text NOT NULL,
	"rule_name_ru" text,
	"rule_type" varchar(30) NOT NULL,
	"category" varchar(50) NOT NULL,
	"target_table" varchar(100),
	"target_action" varchar(30),
	"condition" jsonb NOT NULL,
	"error_message_uz" text NOT NULL,
	"error_message_ru" text,
	"priority" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approver_role" varchar(50),
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "business_rules_rule_code_unique" UNIQUE("rule_code")
);
--> statement-breakpoint
CREATE TABLE "deleted_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar NOT NULL,
	"record_data" jsonb NOT NULL,
	"deleted_by" varchar,
	"deleted_by_name" text,
	"deleted_at" timestamp DEFAULT now() NOT NULL,
	"delete_reason" text,
	"can_restore" boolean DEFAULT true NOT NULL,
	"restored_at" timestamp,
	"restored_by" varchar
);
--> statement-breakpoint
CREATE TABLE "exception_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"exception_type" varchar(50) NOT NULL,
	"module" varchar(30) NOT NULL,
	"related_table" varchar(100),
	"related_record_id" varchar(100),
	"document_number" varchar(50),
	"description" text NOT NULL,
	"original_value" jsonb,
	"override_value" jsonb,
	"requested_by" varchar NOT NULL,
	"requested_by_name" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_by" varchar,
	"approved_by_name" text,
	"approved_by_role" varchar(50),
	"approved_at" timestamp,
	"reason" text NOT NULL,
	"business_justification" text,
	"status" varchar(20) DEFAULT 'approved' NOT NULL,
	"ip_address" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpi_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"kpi_code" varchar(50) NOT NULL,
	"kpi_name" text NOT NULL,
	"kpi_name_ru" text,
	"category" varchar(50) NOT NULL,
	"calculation_method" varchar(30) NOT NULL,
	"calculation_query" text,
	"calculation_formula" text,
	"target_value" numeric(18, 4),
	"warning_threshold" numeric(18, 4),
	"critical_threshold" numeric(18, 4),
	"threshold_direction" varchar(10) DEFAULT 'above' NOT NULL,
	"unit" varchar(20),
	"frequency" varchar(20) DEFAULT 'daily' NOT NULL,
	"block_on_violation" boolean DEFAULT false NOT NULL,
	"alert_on_warning" boolean DEFAULT true NOT NULL,
	"alert_on_critical" boolean DEFAULT true NOT NULL,
	"notify_roles" jsonb,
	"notify_user_ids" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kpi_definitions_kpi_code_unique" UNIQUE("kpi_code")
);
--> statement-breakpoint
CREATE TABLE "kpi_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"kpi_id" varchar NOT NULL,
	"kpi_code" varchar(50) NOT NULL,
	"period_date" varchar(10) NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"value" numeric(18, 4) NOT NULL,
	"previous_value" numeric(18, 4),
	"change_percent" numeric(18, 4),
	"status" varchar(20) NOT NULL,
	"target_value" numeric(18, 4),
	"achievement_percent" numeric(18, 4),
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_dashboard_widgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(50) NOT NULL,
	"widget_code" varchar(50) NOT NULL,
	"widget_name" text NOT NULL,
	"widget_name_ru" text,
	"widget_type" varchar(30) NOT NULL,
	"widget_config" jsonb,
	"data_source_type" varchar(30),
	"data_source" text,
	"refresh_interval" integer DEFAULT 300,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"grid_column" integer DEFAULT 1,
	"grid_row" integer DEFAULT 1,
	"grid_width" integer DEFAULT 1,
	"grid_height" integer DEFAULT 1,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(50) NOT NULL,
	"menu_code" varchar(50) NOT NULL,
	"menu_name" text NOT NULL,
	"menu_name_ru" text,
	"parent_menu_id" varchar,
	"menu_path" text,
	"menu_icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"permissions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" varchar NOT NULL,
	"rule_code" varchar(50) NOT NULL,
	"violation_type" varchar(30) NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar,
	"attempted_data" jsonb,
	"violation_message" text NOT NULL,
	"user_id" integer,
	"user_full_name" text,
	"ip_address" varchar(50),
	"override_approved_by" varchar,
	"override_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_change_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar NOT NULL,
	"document_number" varchar(50),
	"old_status" varchar(50) NOT NULL,
	"new_status" varchar(50) NOT NULL,
	"changed_by" varchar,
	"changed_by_name" text,
	"change_reason" text,
	"is_reversal" boolean DEFAULT false NOT NULL,
	"approval_required" boolean DEFAULT false NOT NULL,
	"approved_by" varchar,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_type" varchar(30) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"message" text NOT NULL,
	"message_ru" text,
	"source_type" varchar(50),
	"source_id" varchar,
	"related_table" varchar(100),
	"related_record_id" varchar,
	"action_required" boolean DEFAULT false NOT NULL,
	"action_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"read_by" varchar,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"resolution_notes" text,
	"notified_users" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_of_measures" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category" varchar(30) NOT NULL,
	"base_unit_id" varchar,
	"conversion_factor" numeric(18, 4) DEFAULT 1,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unit_of_measures_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "validation_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"validation_rule_id" varchar NOT NULL,
	"rule_code" varchar(50) NOT NULL,
	"run_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) NOT NULL,
	"violation_count" integer DEFAULT 0,
	"violation_details" jsonb,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"resolution_notes" text
);
--> statement-breakpoint
CREATE TABLE "validation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_code" varchar(50) NOT NULL,
	"rule_name" text NOT NULL,
	"rule_name_ru" text,
	"rule_description" text,
	"category" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"check_query" text,
	"expected_result" varchar(50),
	"error_message_uz" text NOT NULL,
	"error_message_ru" text,
	"suggested_action_uz" text,
	"suggested_action_ru" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"run_frequency" varchar(20) DEFAULT 'daily',
	"last_run_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "validation_rules_rule_code_unique" UNIQUE("rule_code")
);
--> statement-breakpoint
CREATE TABLE "batch_lot_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_lot_id" varchar,
	"movement_type" varchar(30) NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"from_warehouse_id" integer,
	"to_warehouse_id" integer,
	"reference_type" varchar(50),
	"reference_id" varchar(100),
	"movement_date" timestamp DEFAULT now(),
	"moved_by_user_id" varchar,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "batch_lots" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_number" varchar(50) NOT NULL,
	"product_id" integer,
	"material_id" integer,
	"production_date" timestamp,
	"expiry_date" timestamp,
	"quantity" numeric(18, 4) NOT NULL,
	"remaining_quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"warehouse_id" integer,
	"quality_status" varchar(30) DEFAULT 'pending',
	"quality_check_date" timestamp,
	"quality_check_by" integer,
	"supplier_batch_number" varchar(50),
	"supplier_id" integer,
	"cost_per_unit" numeric(18, 4),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "change_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_number" varchar(50) NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"target_table" varchar(100),
	"target_id" varchar(100),
	"target_field" varchar(100),
	"old_value" jsonb,
	"new_value" jsonb,
	"reason" text NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"requested_by" varchar,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_notes" text,
	"implemented_by" varchar,
	"implemented_at" timestamp,
	"effective_date" timestamp,
	CONSTRAINT "change_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
CREATE TABLE "cost_objects" (
	"id" serial PRIMARY KEY NOT NULL,
	"object_type" varchar(30) NOT NULL,
	"object_code" varchar(50) NOT NULL,
	"object_name" text NOT NULL,
	"object_name_ru" text,
	"parent_id" varchar,
	"cost_center_id" varchar,
	"responsible_user_id" integer,
	"budget" numeric(18, 2),
	"actual_cost" numeric(18, 2) DEFAULT '0' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cost_objects_object_code_unique" UNIQUE("object_code")
);
--> statement-breakpoint
CREATE TABLE "currency_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_id" varchar(100) NOT NULL,
	"original_currency" varchar(10) NOT NULL,
	"original_amount" numeric(18, 4) NOT NULL,
	"base_currency" varchar(10) DEFAULT 'UZS',
	"base_amount" numeric(18, 4) NOT NULL,
	"exchange_rate" numeric(18, 4) NOT NULL,
	"rate_date" timestamp NOT NULL,
	"exchange_difference" numeric(18, 4) DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_lifecycle" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_id" varchar(100) NOT NULL,
	"document_number" varchar(100),
	"current_status" varchar(30) DEFAULT 'draft' NOT NULL,
	"previous_status" varchar(30),
	"status_changed_by" varchar,
	"status_changed_at" timestamp DEFAULT now() NOT NULL,
	"reason" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "document_lifecycle_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_id" varchar(100) NOT NULL,
	"from_status" varchar(30),
	"to_status" varchar(30) NOT NULL,
	"changed_by" varchar,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"reason" text,
	"ip_address" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "exception_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"exception_id" varchar NOT NULL,
	"activity_type" varchar(30) NOT NULL,
	"content" text,
	"previous_value" text,
	"new_value" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exception_inbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"exception_type_id" varchar,
	"exception_code" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"category" varchar(50) NOT NULL,
	"source_type" varchar(50),
	"source_id" varchar(100),
	"source_document_number" varchar(100),
	"affected_amount" numeric(18, 2),
	"currency" varchar(3) DEFAULT 'UZS',
	"status" varchar(30) DEFAULT 'open' NOT NULL,
	"assigned_to" integer,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"resolution" text,
	"due_date" timestamp,
	"escalated_at" timestamp,
	"escalated_to" varchar,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "exception_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"type_code" varchar(50) NOT NULL,
	"type_name" text NOT NULL,
	"type_name_ru" text,
	"category" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"detection_query" text,
	"threshold_value" numeric(18, 4),
	"threshold_operator" varchar(10),
	"auto_resolve_after_days" integer,
	"escalation_after_hours" integer,
	"escalation_role" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exception_types_type_code_unique" UNIQUE("type_code")
);
--> statement-breakpoint
CREATE TABLE "fiscal_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"period_name" varchar(50) NOT NULL,
	"period_type" varchar(20) DEFAULT 'month',
	"status" varchar(20) DEFAULT 'open',
	"opened_at" timestamp DEFAULT now(),
	"soft_closed_at" timestamp,
	"hard_closed_at" timestamp,
	"closed_by_user_id" varchar,
	"reopened_at" timestamp,
	"reopened_by_user_id" varchar,
	"reopen_reason" text,
	"closing_notes" text,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "posting_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_number" varchar(50) NOT NULL,
	"source_type" varchar(50) NOT NULL,
	"source_id" varchar(100) NOT NULL,
	"source_document_number" varchar(100),
	"posting_date" timestamp NOT NULL,
	"account_code" varchar(20) NOT NULL,
	"account_name" text,
	"debit" numeric(18, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(18, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1' NOT NULL,
	"amount_in_base_currency" numeric(18, 2) DEFAULT '0' NOT NULL,
	"cost_center_id" varchar,
	"cost_object_type" varchar(30),
	"cost_object_id" varchar(100),
	"description" text,
	"reference" text,
	"is_reversed" boolean DEFAULT false NOT NULL,
	"reversal_entry_id" varchar,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "posting_entries_entry_number_unique" UNIQUE("entry_number")
);
--> statement-breakpoint
CREATE TABLE "process_chains" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_uz" varchar(100) NOT NULL,
	"name_ru" varchar(100),
	"description" text,
	"chain_type" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "role_ui_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(50) NOT NULL,
	"config_type" varchar(30) NOT NULL,
	"target_module" varchar(50),
	"target_page" varchar(100),
	"visible_elements" jsonb,
	"hidden_elements" jsonb,
	"read_only_elements" jsonb,
	"default_filters" jsonb,
	"default_sort" jsonb,
	"custom_layout" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "separation_of_duties_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_code" varchar(50) NOT NULL,
	"rule_name" text NOT NULL,
	"rule_name_ru" text,
	"document_type" varchar(50) NOT NULL,
	"creator_role" varchar(50) NOT NULL,
	"approver_role" varchar(50) NOT NULL,
	"payer_role" varchar(50),
	"auditor_role" varchar(50),
	"require_different_users" boolean DEFAULT true NOT NULL,
	"min_approvers" integer DEFAULT 1 NOT NULL,
	"max_amount" numeric(18, 2),
	"escalation_role" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "separation_of_duties_rules_rule_code_unique" UNIQUE("rule_code")
);
--> statement-breakpoint
CREATE TABLE "sop_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"sop_id" varchar NOT NULL,
	"step_number" integer NOT NULL,
	"step_name" text NOT NULL,
	"step_name_ru" text,
	"description" text,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"required_role" varchar(50),
	"expected_duration" integer,
	"checklist_items" jsonb,
	"next_step_on_complete" integer,
	"next_step_on_fail" integer,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sop_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"sop_code" varchar(50) NOT NULL,
	"sop_name" text NOT NULL,
	"sop_name_ru" text,
	"process_type" varchar(50) NOT NULL,
	"description" text,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "sop_templates_sop_code_unique" UNIQUE("sop_code")
);
--> statement-breakpoint
CREATE TABLE "crm_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_type_id" integer NOT NULL,
	"owner_id" integer NOT NULL,
	"type_id" integer NOT NULL,
	"provider" varchar(50),
	"provider_type_id" varchar(50),
	"subject" text NOT NULL,
	"description" text,
	"description_ru" text,
	"start_time" timestamp,
	"end_time" timestamp,
	"deadline" timestamp,
	"completed" boolean DEFAULT false,
	"status" varchar(50),
	"priority" varchar(20) DEFAULT 'medium',
	"responsible_id" varchar NOT NULL,
	"created_by_id" integer,
	"date_create" timestamp DEFAULT now() NOT NULL,
	"date_modify" timestamp DEFAULT now() NOT NULL,
	"direction" varchar(20),
	"communication_channel" varchar(50),
	"communication_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "crm_activity_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"icon" varchar(50),
	"color" varchar(20) DEFAULT '#2196f3',
	"requires_deadline" boolean DEFAULT true,
	"requires_description" boolean DEFAULT false,
	"allows_attachments" boolean DEFAULT true,
	"is_system" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"sort" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_activity_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "crm_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" integer NOT NULL,
	"content" text NOT NULL,
	"attachments" jsonb,
	"mentioned_user_ids" jsonb DEFAULT '[]'::jsonb,
	"author_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"customer_code" varchar(20),
	"customer_type" varchar(20) DEFAULT 'legal',
	"status" varchar(20) DEFAULT 'active',
	"stir" varchar(20),
	"director_name" varchar(255),
	"company_size" varchar(20),
	"first_name" varchar(100),
	"last_name" varchar(100),
	"passport_number" varchar(20),
	"birth_date" date,
	"customer_category" varchar(1) DEFAULT 'C',
	"abc_score" numeric(5, 2) DEFAULT '0',
	"source" varchar(30) DEFAULT 'other',
	"payment_terms_days" integer DEFAULT 30,
	"discount_rate" numeric(5, 2) DEFAULT '0',
	"company_type" varchar(50),
	"industry" varchar(100),
	"employees" integer,
	"revenue" numeric(18, 4),
	"currency_id" varchar(3) DEFAULT 'UZS',
	"phones" jsonb DEFAULT '[]'::jsonb,
	"emails" jsonb DEFAULT '[]'::jsonb,
	"websites" jsonb DEFAULT '[]'::jsonb,
	"address" text,
	"address_legal" text,
	"banking_details" text,
	"assigned_by_id" integer,
	"created_by_id" integer,
	"modify_by_id" integer,
	"date_create" timestamp DEFAULT now() NOT NULL,
	"date_modify" timestamp DEFAULT now() NOT NULL,
	"opened" boolean DEFAULT true,
	"comments" text,
	"parent_company_id" integer,
	"annual_revenue" numeric,
	"employee_count" integer,
	"last_contacted_at" timestamp,
	"credit_limit" numeric(15, 2) DEFAULT '100000000',
	"credit_used" numeric(15, 2) DEFAULT '0',
	"segment" varchar(20) DEFAULT 'new',
	"is_blocked" boolean DEFAULT false NOT NULL,
	"block_reason" text,
	"open_debt" numeric(18, 4) DEFAULT 0,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"second_name" text,
	"last_name" text,
	"photo" text,
	"birthdate" varchar(10),
	"phones" jsonb DEFAULT '[]'::jsonb,
	"emails" jsonb DEFAULT '[]'::jsonb,
	"websites" jsonb DEFAULT '[]'::jsonb,
	"im" jsonb DEFAULT '[]'::jsonb,
	"post" varchar(255),
	"company_id" integer,
	"assigned_by_id" integer,
	"created_by_id" integer,
	"modify_by_id" integer,
	"date_create" timestamp DEFAULT now() NOT NULL,
	"date_modify" timestamp DEFAULT now() NOT NULL,
	"opened" boolean DEFAULT true,
	"comments" text,
	"source_id" varchar(50),
	"source_description" text,
	"whatsapp_number" varchar(50),
	"telegram_username" varchar(100),
	"customer_journey" jsonb,
	"last_contacted_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_custom_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"field_name" varchar(100) NOT NULL,
	"field_label" varchar(255) NOT NULL,
	"field_label_ru" varchar(255),
	"field_type" varchar(50) NOT NULL,
	"options" jsonb,
	"is_required" boolean DEFAULT false,
	"is_visible" boolean DEFAULT true,
	"sort" integer DEFAULT 500,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_deal_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"owner_type" varchar(20) DEFAULT 'D',
	"product_id" integer,
	"product_name" text NOT NULL,
	"price" numeric(18, 4) NOT NULL,
	"price_exclusive" numeric(18, 4),
	"price_netto" numeric(18, 4),
	"price_brutto" numeric(18, 4),
	"quantity" numeric(18, 4) NOT NULL,
	"discount_type_id" varchar(20),
	"discount_rate" numeric(18, 4),
	"discount_sum" numeric(18, 4),
	"tax_rate" numeric(18, 4),
	"tax_included" boolean DEFAULT true,
	"measure_code" integer,
	"measure_name" varchar(50),
	"sort" integer DEFAULT 500
);
--> statement-breakpoint
CREATE TABLE "crm_deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category_id" integer DEFAULT 0,
	"stage_id" varchar(50) DEFAULT 'C0:NEW' NOT NULL,
	"stage_semantic_id" varchar(20),
	"is_new" boolean DEFAULT true,
	"is_recurring" boolean DEFAULT false,
	"is_return_customer" boolean DEFAULT false,
	"is_repeated_approach" boolean DEFAULT false,
	"probability" integer DEFAULT 0,
	"currency_id" varchar(3) DEFAULT 'UZS',
	"opportunity" numeric(18, 4) NOT NULL,
	"is_manual_opportunity" boolean DEFAULT false,
	"tax_value" numeric(18, 4),
	"company_id" integer,
	"contact_ids" jsonb DEFAULT '[]'::jsonb,
	"begin_date" varchar(10),
	"close_date" varchar(10),
	"assigned_by_id" integer NOT NULL,
	"created_by_id" integer,
	"modify_by_id" integer,
	"date_create" timestamp DEFAULT now() NOT NULL,
	"date_modify" timestamp DEFAULT now() NOT NULL,
	"opened" boolean DEFAULT true,
	"closed" boolean DEFAULT false,
	"comments" text,
	"additional_info" text,
	"originator_id" varchar(50),
	"origin_id" varchar(255),
	"sales_order_id" varchar,
	"forecast_amount" numeric,
	"sla_deadline" timestamp,
	"is_repeating" boolean DEFAULT false,
	"last_activity_at" timestamp,
	"next_activity_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" integer,
	"document_type" varchar(50) NOT NULL,
	"file_path" text,
	"file_size" integer,
	"mime_type" varchar(100),
	"is_template" boolean DEFAULT false,
	"template_content" text,
	"template_variables" jsonb,
	"status" varchar(30) DEFAULT 'draft',
	"signed_at" timestamp,
	"signed_by_id" varchar,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_documents_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "crm_entity_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"entity_id" integer NOT NULL,
	"action" varchar(30) NOT NULL,
	"field_name" varchar(100),
	"old_value" text,
	"new_value" text,
	"old_stage_id" varchar(50),
	"new_stage_id" varchar(50),
	"user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_followup_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) DEFAULT 'call' NOT NULL,
	"subject" text NOT NULL,
	"note" text,
	"due_date" timestamp,
	"is_done" boolean DEFAULT false NOT NULL,
	"entity_type" varchar(50),
	"entity_id" integer,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_invoice_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(10) DEFAULT 'UZS',
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment_method" varchar(50),
	"reference" varchar(255),
	"notes" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_invoice_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"product_id" integer,
	"product_name" text NOT NULL,
	"product_description" text,
	"sku" varchar(100),
	"quantity" numeric(18, 4) DEFAULT 1 NOT NULL,
	"unit_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"discount" numeric(18, 4) DEFAULT 0,
	"discount_type" varchar(20) DEFAULT 'percent',
	"tax_rate" numeric(18, 4) DEFAULT 0,
	"total_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 100
);
--> statement-breakpoint
CREATE TABLE "crm_invoice_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"stage_id" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"color" varchar(20) DEFAULT '#2196f3',
	"sort" integer DEFAULT 100,
	"semantic_id" varchar(20),
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_invoice_stages_stage_id_unique" UNIQUE("stage_id")
);
--> statement-breakpoint
CREATE TABLE "crm_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"deal_id" integer,
	"proposal_id" integer,
	"contact_id" integer,
	"company_id" integer,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"stage_id" varchar(50),
	"total_amount" numeric(18, 4) DEFAULT 0,
	"paid_amount" numeric(18, 4) DEFAULT 0,
	"currency" varchar(10) DEFAULT 'UZS',
	"tax_amount" numeric(18, 4) DEFAULT 0,
	"discount_amount" numeric(18, 4) DEFAULT 0,
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp,
	"paid_date" timestamp,
	"payment_method" varchar(50),
	"bank_details" jsonb,
	"description" text,
	"terms" text,
	"notes" text,
	"document_path" text,
	"template_id" integer,
	"assigned_by_id" integer,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_lead_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"stage_id" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"color" varchar(20) DEFAULT '#2196f3',
	"sort" integer DEFAULT 100,
	"semantic_id" varchar(20),
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "crm_lead_stages_stage_id_unique" UNIQUE("stage_id")
);
--> statement-breakpoint
CREATE TABLE "crm_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"name" text,
	"second_name" text,
	"last_name" text,
	"company_title" text,
	"source_id" varchar(50),
	"source_description" text,
	"status_id" varchar(50) DEFAULT 'NEW' NOT NULL,
	"status_description" text,
	"phones" jsonb DEFAULT '[]'::jsonb,
	"emails" jsonb DEFAULT '[]'::jsonb,
	"websites" jsonb DEFAULT '[]'::jsonb,
	"assigned_by_id" integer,
	"created_by_id" integer,
	"modify_by_id" integer,
	"date_create" timestamp DEFAULT now() NOT NULL,
	"date_modify" timestamp DEFAULT now() NOT NULL,
	"opened" boolean DEFAULT false,
	"comments" text,
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"budget" numeric,
	"opportunity_amount" numeric,
	"source_score" integer,
	"call_status" varchar(50),
	"last_activity_at" timestamp,
	"next_activity_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_pipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"sort" integer DEFAULT 500,
	"is_default" boolean DEFAULT false,
	"created_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"sort" integer DEFAULT 500,
	"active" boolean DEFAULT true,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category_id" integer,
	"price" numeric(18, 4) NOT NULL,
	"currency_id" varchar(3) DEFAULT 'UZS',
	"vat_id" varchar(50),
	"vat_included" boolean DEFAULT true,
	"measure_code" integer,
	"measure_name" varchar(50),
	"description" text,
	"description_ru" text,
	"active" boolean DEFAULT true,
	"sort" integer DEFAULT 500
);
--> statement-breakpoint
CREATE TABLE "crm_proposal_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL,
	"product_id" integer,
	"product_name" text NOT NULL,
	"product_description" text,
	"sku" varchar(100),
	"quantity" numeric(18, 4) DEFAULT 1 NOT NULL,
	"unit_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"discount" numeric(18, 4) DEFAULT 0,
	"discount_type" varchar(20) DEFAULT 'percent',
	"tax_rate" numeric(18, 4) DEFAULT 0,
	"total_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 100
);
--> statement-breakpoint
CREATE TABLE "crm_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"deal_id" integer,
	"contact_id" integer,
	"company_id" integer,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(18, 4) DEFAULT 0,
	"currency" varchar(10) DEFAULT 'UZS',
	"tax_amount" numeric(18, 4) DEFAULT 0,
	"discount_amount" numeric(18, 4) DEFAULT 0,
	"discount_percent" numeric(18, 4) DEFAULT 0,
	"valid_until" timestamp,
	"sent_at" timestamp,
	"approved_at" timestamp,
	"description" text,
	"terms" text,
	"notes" text,
	"document_path" text,
	"template_id" integer,
	"assigned_by_id" integer,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_robots" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"stage_id" varchar(50),
	"name" varchar(255) NOT NULL,
	"name_ru" varchar(255),
	"description" text,
	"trigger_type" varchar(50) NOT NULL,
	"trigger_conditions" jsonb,
	"delay_minutes" integer,
	"action_type" varchar(50) NOT NULL,
	"action_config" jsonb,
	"target_type" varchar(50),
	"target_user_id" varchar,
	"is_active" boolean DEFAULT true,
	"sort" integer DEFAULT 500,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "crm_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"status_id" varchar(50) NOT NULL,
	"entity_id" varchar(50) DEFAULT 'DEAL_STAGE' NOT NULL,
	"category_id" integer DEFAULT 0,
	"name" text NOT NULL,
	"name_ru" text,
	"sort" integer DEFAULT 500,
	"color" varchar(20),
	"semantics" varchar(20),
	CONSTRAINT "crm_stages_status_id_unique" UNIQUE("status_id")
);
--> statement-breakpoint
CREATE TABLE "crm_watchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer NOT NULL,
	"user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customer_competitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"competitor_name" varchar(255) NOT NULL,
	"product_type" varchar(100),
	"estimated_share_percent" numeric(5, 2),
	"reason" varchar(50),
	"win_back_potential" varchar(20) DEFAULT 'medium',
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"order_id" varchar(50),
	"complaint_number" varchar(20),
	"type" varchar(30) DEFAULT 'other' NOT NULL,
	"description" text NOT NULL,
	"responsible_department" varchar(50),
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"resolution" text,
	"compensation_amount" numeric(15, 2),
	"satisfaction_score" integer,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"position" varchar(100),
	"phone" varchar(20),
	"email" varchar(255),
	"telegram" varchar(50),
	"contact_type" varchar(30) DEFAULT 'primary',
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(30) NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"expires_at" date,
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"direction" varchar(10) DEFAULT 'out',
	"contact_id" integer,
	"manager_id" integer,
	"subject" varchar(255) NOT NULL,
	"description" text,
	"outcome" text,
	"next_action" text,
	"next_action_date" timestamp,
	"duration_minutes" integer,
	"interaction_date" timestamp DEFAULT now() NOT NULL,
	"file_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"phone" varchar(20) NOT NULL,
	"password_hash" text,
	"full_name" text NOT NULL,
	"company_name" text,
	"crm_company_id" integer,
	"inn" varchar(20),
	"address" text,
	"is_verified" boolean DEFAULT false,
	"verification_code" varchar(10),
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_accounts_email_unique" UNIQUE("email"),
	CONSTRAINT "customer_accounts_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "customer_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"customer_id" varchar,
	"guest_phone" varchar(20),
	"guest_name" text,
	"guest_email" varchar(255),
	"status" varchar(20) DEFAULT 'new',
	"items" jsonb NOT NULL,
	"subtotal" numeric(18, 4) NOT NULL,
	"delivery_fee" numeric(18, 4) DEFAULT 0,
	"total" numeric(18, 4) NOT NULL,
	"delivery_address" text,
	"delivery_method" varchar(30),
	"payment_method" varchar(30),
	"payment_status" varchar(20) DEFAULT 'pending',
	"notes" text,
	"attachments" jsonb,
	"estimated_delivery" timestamp,
	"crm_lead_id" integer,
	"crm_deal_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "customer_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "portfolio_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"description" text,
	"description_ru" text,
	"client_name" text,
	"category_id" varchar,
	"images" jsonb NOT NULL,
	"year" integer,
	"is_featured" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" varchar,
	"name" text NOT NULL,
	"name_ru" text,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"description_ru" text,
	"short_description" text,
	"short_description_ru" text,
	"images" jsonb,
	"specifications" jsonb,
	"price_per_unit" numeric(18, 4),
	"min_order_quantity" integer DEFAULT 100,
	"unit" varchar(20) DEFAULT 'dona',
	"in_stock" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"erp_product_id" varchar,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "public_products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "website_banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text,
	"title_ru" text,
	"subtitle" text,
	"subtitle_ru" text,
	"image_url" text NOT NULL,
	"image_url_mobile" text,
	"link_url" text,
	"button_text" text,
	"button_text_ru" text,
	"position" varchar(30) DEFAULT 'hero',
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "website_pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"content" text,
	"content_ru" text,
	"seo_title" text,
	"seo_description" text,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "website_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "website_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"value_ru" text,
	"type" varchar(30) DEFAULT 'text',
	"category" varchar(50),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "website_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "accounting_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_code" varchar(7) NOT NULL,
	"fiscal_year" integer NOT NULL,
	"month" integer NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"closed_by" varchar,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounting_periods_period_code_unique" UNIQUE("period_code")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_code" varchar(20) NOT NULL,
	"account_name" text NOT NULL,
	"account_name_ru" text,
	"account_type" varchar(20) NOT NULL,
	"parent_account_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "accounts_account_code_unique" UNIQUE("account_code")
);
--> statement-breakpoint
CREATE TABLE "advance_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_number" varchar(30) NOT NULL,
	"vendor_id" varchar,
	"employee_id" varchar,
	"payment_type" varchar(30) NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(5) DEFAULT 'UZS' NOT NULL,
	"purpose" text NOT NULL,
	"purchase_order_id" varchar,
	"status" varchar(20) DEFAULT 'requested' NOT NULL,
	"approval_request_id" varchar,
	"disbursed_at" timestamp,
	"settled_amount" numeric(18, 4) DEFAULT 0,
	"settlement_status" varchar(20) DEFAULT 'unsettled',
	"gl_document_id" varchar,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_finance_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"insight_type" varchar(30) NOT NULL,
	"segment" varchar(30) NOT NULL,
	"insight_date" varchar(10) NOT NULL,
	"confidence" numeric(18, 4),
	"priority" varchar(10) DEFAULT 'medium',
	"title" text NOT NULL,
	"title_ru" text,
	"description" text NOT NULL,
	"description_ru" text,
	"impact" text,
	"impact_ru" text,
	"recommendation" text,
	"recommendation_ru" text,
	"payload" jsonb,
	"action_required" boolean DEFAULT false NOT NULL,
	"action_taken" boolean DEFAULT false NOT NULL,
	"action_taken_by" varchar,
	"action_taken_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ap_aging_buckets" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" varchar,
	"current" numeric(18, 4) DEFAULT 0 NOT NULL,
	"days_31_to_60" numeric(18, 4) DEFAULT 0 NOT NULL,
	"days_61_to_90" numeric(18, 4) DEFAULT 0 NOT NULL,
	"days_91_to_120" numeric(18, 4) DEFAULT 0 NOT NULL,
	"over_120" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_outstanding" numeric(18, 4) DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ar_aging_buckets" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" varchar,
	"customer_type" varchar(20),
	"current" numeric(18, 4) DEFAULT 0 NOT NULL,
	"days_31_to_60" numeric(18, 4) DEFAULT 0 NOT NULL,
	"days_61_to_90" numeric(18, 4) DEFAULT 0 NOT NULL,
	"days_91_to_120" numeric(18, 4) DEFAULT 0 NOT NULL,
	"over_120" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_outstanding" numeric(18, 4) DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"bank_name" text NOT NULL,
	"bank_name_ru" text,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"account_type" varchar(20) DEFAULT 'current' NOT NULL,
	"balance" numeric(18, 4) DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bank_accounts_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
CREATE TABLE "bank_statements" (
	"id" serial PRIMARY KEY NOT NULL,
	"bank_account" varchar(50) NOT NULL,
	"transaction_date" varchar(10) NOT NULL,
	"value_date" varchar(10),
	"description" text,
	"reference" varchar(100),
	"debit_amount" numeric(18, 4) DEFAULT 0,
	"credit_amount" numeric(18, 4) DEFAULT 0,
	"balance" numeric(18, 4),
	"is_matched" boolean DEFAULT false,
	"matched_invoice_id" varchar,
	"imported_at" timestamp DEFAULT now(),
	"imported_by" varchar
);
--> statement-breakpoint
CREATE TABLE "budget_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"budget_code" varchar(50) NOT NULL,
	"budget_name" text NOT NULL,
	"budget_name_ru" text,
	"budget_type" varchar(30) NOT NULL,
	"reference_id" varchar,
	"fiscal_year" varchar(4) NOT NULL,
	"period_type" varchar(20) NOT NULL,
	"period_code" varchar(10),
	"budget_amount" numeric(18, 4) NOT NULL,
	"committed_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"actual_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"available_amount" numeric(18, 4) NOT NULL,
	"currency" varchar(10) DEFAULT 'UZS' NOT NULL,
	"warning_percent" numeric(18, 4) DEFAULT 80,
	"block_percent" numeric(18, 4) DEFAULT 100,
	"allow_overspend" boolean DEFAULT false NOT NULL,
	"overspend_limit" numeric(18, 4),
	"approver_role_for_overspend" varchar(50),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "budget_controls_budget_code_unique" UNIQUE("budget_code")
);
--> statement-breakpoint
CREATE TABLE "budget_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"budget_id" varchar NOT NULL,
	"account_id" varchar,
	"cost_center_id" varchar,
	"planned_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"actual_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"variance_amount" numeric(18, 4),
	"variance_percent" numeric(18, 4),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"budget_name" text NOT NULL,
	"fiscal_year" integer NOT NULL,
	"period_type" varchar(20) DEFAULT 'annual' NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"created_by" integer,
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_flow_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_date" varchar(10) NOT NULL,
	"transaction_type" varchar(20) NOT NULL,
	"category" varchar(30) NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"bank_account_id" varchar,
	"description" text,
	"reference_type" varchar(50),
	"reference_id" varchar(100),
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_registers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"location" text,
	"currency" varchar(10) DEFAULT 'UZS' NOT NULL,
	"custodian_id" varchar,
	"opening_balance" numeric(18, 4) DEFAULT 0 NOT NULL,
	"current_balance" numeric(18, 4) DEFAULT 0 NOT NULL,
	"daily_limit" numeric(18, 4),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"register_id" varchar NOT NULL,
	"session_number" varchar(50) NOT NULL,
	"opened_by" varchar NOT NULL,
	"closed_by" varchar,
	"opening_balance" numeric(18, 4) NOT NULL,
	"closing_balance" numeric(18, 4),
	"expected_balance" numeric(18, 4),
	"variance" numeric(18, 4),
	"total_inflow" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_outflow" numeric(18, 4) DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"notes" text,
	CONSTRAINT "cash_sessions_session_number_unique" UNIQUE("session_number")
);
--> statement-breakpoint
CREATE TABLE "cash_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar,
	"register_id" varchar NOT NULL,
	"transaction_number" varchar(50) NOT NULL,
	"transaction_date" varchar(10) NOT NULL,
	"transaction_time" varchar(8),
	"transaction_type" varchar(20) NOT NULL,
	"category_id" varchar,
	"counterparty" text,
	"counterparty_type" varchar(20),
	"payment_method" varchar(20) DEFAULT 'cash' NOT NULL,
	"reference_type" varchar(30),
	"reference_id" varchar,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(10) DEFAULT 'UZS' NOT NULL,
	"description" text,
	"approved_by" varchar,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cash_transactions_transaction_number_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
CREATE TABLE "cfo_bot_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_chat_id" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar(30) DEFAULT 'text',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cfo_bot_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_chat_id" varchar(100) NOT NULL,
	"file_name" text NOT NULL,
	"file_type" varchar(50),
	"summary" text,
	"key_points" text,
	"original_size" integer,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cfo_bot_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_chat_id" varchar(100) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'UZS',
	"category" varchar(100),
	"description" text,
	"vendor" varchar(200),
	"receipt_image_url" text,
	"source_type" varchar(20) DEFAULT 'manual',
	"status" varchar(20) DEFAULT 'confirmed',
	"expense_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cfo_bot_health_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_chat_id" varchar(100) NOT NULL,
	"log_type" varchar(30) NOT NULL,
	"log_date" timestamp DEFAULT now(),
	"description" text,
	"calories" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cfo_bot_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_chat_id" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"remind_at" timestamp NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"recurring_pattern" varchar(50),
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cfo_bot_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_chat_id" varchar(100) NOT NULL,
	"owner_name" varchar(200),
	"language" varchar(10) DEFAULT 'uz',
	"timezone" varchar(50) DEFAULT 'Asia/Tashkent',
	"morning_report_enabled" boolean DEFAULT true,
	"morning_report_time" varchar(10) DEFAULT '08:00',
	"weekly_report_enabled" boolean DEFAULT true,
	"weekly_report_day" integer DEFAULT 1,
	"alerts_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cfo_bot_settings_telegram_chat_id_unique" UNIQUE("telegram_chat_id")
);
--> statement-breakpoint
CREATE TABLE "cost_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"department_id" integer,
	"manager_id" integer,
	"parent_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "cost_centers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "customer_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_number" varchar(50) NOT NULL,
	"payment_date" varchar(10) NOT NULL,
	"customer_id" varchar,
	"sales_invoice_id" varchar,
	"payment_method" varchar(30) NOT NULL,
	"bank_account" varchar(50),
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(10) DEFAULT 'UZS' NOT NULL,
	"exchange_rate" numeric(18, 4) DEFAULT 1,
	"reference" varchar(100),
	"status" varchar(20) DEFAULT 'received' NOT NULL,
	"applied_at" timestamp,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_payments_payment_number_unique" UNIQUE("payment_number")
);
--> statement-breakpoint
CREATE TABLE "daily_financial_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_date" varchar(10) NOT NULL,
	"cash_balance" numeric(18, 4) DEFAULT 0,
	"bank_balance" numeric(18, 4) DEFAULT 0,
	"total_liquidity" numeric(18, 4) DEFAULT 0,
	"daily_income" numeric(18, 4) DEFAULT 0,
	"daily_expense" numeric(18, 4) DEFAULT 0,
	"daily_net_cash" numeric(18, 4) DEFAULT 0,
	"total_receivables" numeric(18, 4) DEFAULT 0,
	"total_payables" numeric(18, 4) DEFAULT 0,
	"overdue_receivables" numeric(18, 4) DEFAULT 0,
	"overdue_payables" numeric(18, 4) DEFAULT 0,
	"inventory_value" numeric(18, 4) DEFAULT 0,
	"raw_material_value" numeric(18, 4) DEFAULT 0,
	"finished_goods_value" numeric(18, 4) DEFAULT 0,
	"new_orders_count" integer DEFAULT 0,
	"new_orders_value" numeric(18, 4) DEFAULT 0,
	"invoiced_value" numeric(18, 4) DEFAULT 0,
	"collected_value" numeric(18, 4) DEFAULT 0,
	"production_value" numeric(18, 4) DEFAULT 0,
	"production_cost" numeric(18, 4) DEFAULT 0,
	"daily_gross_profit" numeric(18, 4) DEFAULT 0,
	"daily_gross_margin" numeric(18, 4) DEFAULT 0,
	"cash_trend" numeric(18, 4) DEFAULT 0,
	"income_trend" numeric(18, 4) DEFAULT 0,
	"orders_trend" numeric(18, 4) DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "daily_financial_metrics_metric_date_unique" UNIQUE("metric_date")
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_number" varchar(50) NOT NULL,
	"entry_date" varchar(10) NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_id" varchar,
	"debit_account_id" varchar,
	"credit_account_id" varchar,
	"amount" numeric(18, 4) NOT NULL,
	"description" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "entries_entry_number_unique" UNIQUE("entry_number")
);
--> statement-breakpoint
CREATE TABLE "expense_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_report_id" varchar NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(50),
	"file_size" integer,
	"description" varchar(500),
	"amount" numeric(18, 4),
	"receipt_date" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_request_id" varchar NOT NULL,
	"report_number" varchar(30) NOT NULL,
	"total_spent" numeric(18, 4) NOT NULL,
	"total_receipts" integer DEFAULT 0 NOT NULL,
	"remaining_cash" numeric(18, 4) DEFAULT 0,
	"deficit" numeric(18, 4) DEFAULT 0,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"submitted_by" varchar NOT NULL,
	"verified_by" varchar,
	"verified_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_number" varchar(30) NOT NULL,
	"requested_by" varchar NOT NULL,
	"department" varchar(100),
	"category" varchar(50) NOT NULL,
	"purpose" text NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(5) DEFAULT 'UZS' NOT NULL,
	"budget_line_id" varchar,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"approval_request_id" varchar,
	"cash_register_id" varchar,
	"disbursed_amount" numeric(18, 4),
	"disbursed_at" timestamp,
	"disbursed_by" varchar,
	"settlement_status" varchar(20) DEFAULT 'not_settled',
	"settled_amount" numeric(18, 4),
	"settled_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "finance_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category_type" varchar(20) NOT NULL,
	"parent_id" varchar,
	"account_id" varchar,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"color" varchar(7),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "finance_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "financial_kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"kpi_date" varchar(10) NOT NULL,
	"kpi_period" varchar(20) DEFAULT 'monthly' NOT NULL,
	"current_ratio" numeric(18, 4),
	"quick_ratio" numeric(18, 4),
	"debt_to_equity" numeric(18, 4),
	"gross_profit_margin" numeric(18, 4),
	"net_profit_margin" numeric(18, 4),
	"return_on_assets" numeric(18, 4),
	"return_on_equity" numeric(18, 4),
	"inventory_turnover" numeric(18, 4),
	"receivables_turnover" numeric(18, 4),
	"payables_turnover" numeric(18, 4),
	"cash_conversion_cycle" numeric(18, 4),
	"working_capital" numeric(18, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gl_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_number" varchar(50) NOT NULL,
	"document_date" varchar(10) NOT NULL,
	"posting_date" varchar(10) NOT NULL,
	"document_type" varchar(20) NOT NULL,
	"reference_type" varchar(30),
	"reference_id" varchar,
	"description" text,
	"currency" varchar(10) DEFAULT 'UZS' NOT NULL,
	"total_debit" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_credit" numeric(18, 4) DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"posted_by" varchar,
	"posted_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gl_documents_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "gl_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"gl_document_id" varchar NOT NULL,
	"line_number" integer NOT NULL,
	"account_id" varchar NOT NULL,
	"cost_center_id" varchar,
	"profit_center_id" varchar,
	"debit_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"credit_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_expense_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_number" varchar(50) NOT NULL,
	"transaction_date" varchar(10) NOT NULL,
	"transaction_type" varchar(20) NOT NULL,
	"category_id" varchar,
	"account_id" varchar,
	"counterparty_type" varchar(20),
	"counterparty_id" varchar,
	"counterparty_name" text,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(10) DEFAULT 'UZS' NOT NULL,
	"exchange_rate" numeric(18, 4) DEFAULT 1,
	"description" text,
	"reference_type" varchar(30),
	"reference_id" varchar,
	"gl_document_id" varchar,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_by" integer,
	"approved_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"posted_at" timestamp,
	CONSTRAINT "income_expense_transactions_transaction_number_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
CREATE TABLE "invoice_payment_matching" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" varchar,
	"payment_id" varchar,
	"matched_amount" numeric(18, 4) NOT NULL,
	"matched_by" varchar,
	"matched_at" timestamp DEFAULT now(),
	"is_auto_matched" boolean DEFAULT false,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "invoice_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_number" varchar(50) NOT NULL,
	"payment_date" varchar(10) NOT NULL,
	"vendor_id" varchar,
	"purchase_invoice_id" varchar,
	"payment_method" varchar(30) NOT NULL,
	"bank_account" varchar(50),
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(10) DEFAULT 'UZS' NOT NULL,
	"exchange_rate" numeric(18, 4) DEFAULT 1,
	"reference" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"cleared_at" timestamp,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_payments_payment_number_unique" UNIQUE("payment_number")
);
--> statement-breakpoint
CREATE TABLE "order_costing_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_costing_id" varchar NOT NULL,
	"cost_type" varchar(20) NOT NULL,
	"item_name" text NOT NULL,
	"quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"unit_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_costings" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_order_id" varchar,
	"production_order_id" varchar,
	"material_cost" numeric(18, 4) DEFAULT 0 NOT NULL,
	"labor_cost" numeric(18, 4) DEFAULT 0 NOT NULL,
	"overhead_cost" numeric(18, 4) DEFAULT 0 NOT NULL,
	"energy_cost" numeric(18, 4) DEFAULT 0 NOT NULL,
	"waste_cost" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_cost" numeric(18, 4) DEFAULT 0 NOT NULL,
	"selling_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"gross_profit" numeric(18, 4),
	"profit_margin" numeric(18, 4),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"calculated_by" varchar,
	"calculated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_ai_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"period_month" varchar(7) NOT NULL,
	"evidence_id" varchar,
	"recommendation_type" varchar(30) NOT NULL,
	"priority" varchar(10) DEFAULT 'medium',
	"title" text NOT NULL,
	"title_ru" text,
	"description" text NOT NULL,
	"description_ru" text,
	"suggested_amount" numeric(18, 4),
	"impact_percentage" numeric(18, 4),
	"analysis_details" jsonb,
	"confidence" numeric(18, 4) DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_id" varchar,
	"employee_id" varchar NOT NULL,
	"contract_id" varchar,
	"pay_type" varchar(20) NOT NULL,
	"work_days" integer DEFAULT 0,
	"work_hours" numeric(18, 4) DEFAULT 0,
	"overtime_hours" numeric(18, 4) DEFAULT 0,
	"production_units" numeric(18, 4) DEFAULT 0,
	"base_pay" numeric(18, 4) DEFAULT 0 NOT NULL,
	"hourly_pay" numeric(18, 4) DEFAULT 0,
	"piecework_pay" numeric(18, 4) DEFAULT 0,
	"overtime_pay" numeric(18, 4) DEFAULT 0,
	"bonuses" numeric(18, 4) DEFAULT 0,
	"allowances" numeric(18, 4) DEFAULT 0,
	"gross_pay" numeric(18, 4) NOT NULL,
	"tax_inps" numeric(18, 4) DEFAULT 0 NOT NULL,
	"tax_jshd" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_taxes" numeric(18, 4) DEFAULT 0 NOT NULL,
	"other_deductions" numeric(18, 4) DEFAULT 0,
	"advances" numeric(18, 4) DEFAULT 0,
	"loans" numeric(18, 4) DEFAULT 0,
	"total_deductions" numeric(18, 4) DEFAULT 0 NOT NULL,
	"net_pay" numeric(18, 4) NOT NULL,
	"min_wage_top_up" numeric(18, 4) DEFAULT 0,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"calculated_at" timestamp,
	"approved_by" varchar,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"pay_type" varchar(20) NOT NULL,
	"base_salary" numeric(18, 4),
	"hourly_rate" numeric(18, 4),
	"piecework_rate" numeric(18, 4),
	"piecework_unit" varchar(20),
	"min_wage_guarantee" boolean DEFAULT true NOT NULL,
	"work_schedule" varchar(20) DEFAULT 'full_time',
	"monthly_hours" integer DEFAULT 176,
	"effective_from" varchar(10) NOT NULL,
	"effective_to" varchar(10),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "payroll_contracts_contract_number_unique" UNIQUE("contract_number")
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_name" text NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"total_amount" numeric(18, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payroll_rows" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_id" varchar,
	"employee_id" varchar,
	"work_days" integer DEFAULT 0 NOT NULL,
	"production_quantity" integer DEFAULT 0 NOT NULL,
	"rate_per_unit" numeric(18, 4),
	"base_salary" numeric(18, 4) DEFAULT 0 NOT NULL,
	"bonuses" numeric(18, 4) DEFAULT 0 NOT NULL,
	"deductions" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_salary" numeric(18, 4) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_tax_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"tax_code" varchar(20) NOT NULL,
	"tax_name" text NOT NULL,
	"tax_name_ru" text,
	"tax_type" varchar(20) NOT NULL,
	"rate" numeric(18, 4) NOT NULL,
	"employee_share" numeric(18, 4) DEFAULT 0 NOT NULL,
	"employer_share" numeric(18, 4) DEFAULT 0 NOT NULL,
	"min_threshold" numeric(18, 4),
	"max_threshold" numeric(18, 4),
	"effective_from" varchar(10) NOT NULL,
	"effective_to" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payroll_tax_rules_tax_code_unique" UNIQUE("tax_code")
);
--> statement-breakpoint
CREATE TABLE "payroll_work_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"period_month" varchar(7) NOT NULL,
	"attendance_work_days" integer DEFAULT 0,
	"attendance_work_hours" numeric(18, 4) DEFAULT 0,
	"attendance_source" varchar(30) DEFAULT 'camera',
	"attendance_confidence" numeric(18, 4) DEFAULT 0,
	"production_units" numeric(18, 4) DEFAULT 0,
	"production_source" varchar(30) DEFAULT 'iot',
	"production_confidence" numeric(18, 4) DEFAULT 0,
	"tracked_hours" numeric(18, 4) DEFAULT 0,
	"task_completion_count" integer DEFAULT 0,
	"time_tracking_source" varchar(30) DEFAULT 'kanban',
	"time_tracking_confidence" numeric(18, 4) DEFAULT 0,
	"overtime_hours" numeric(18, 4) DEFAULT 0,
	"weekend_hours" numeric(18, 4) DEFAULT 0,
	"holiday_hours" numeric(18, 4) DEFAULT 0,
	"overall_confidence" numeric(18, 4) DEFAULT 0,
	"data_quality_score" varchar(10) DEFAULT 'medium',
	"anomalies_detected" boolean DEFAULT false,
	"anomaly_details" jsonb,
	"manual_override" boolean DEFAULT false,
	"override_by" varchar,
	"override_reason" text,
	"override_at" timestamp,
	"aggregated_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"barcode" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category" varchar(50),
	"unit_price" numeric(18, 4) NOT NULL,
	"unit" varchar(20) DEFAULT 'dona' NOT NULL,
	"stock_quantity" numeric(18, 4) DEFAULT 0,
	"min_stock" numeric(18, 4) DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pos_products_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "pos_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_number" varchar(30) NOT NULL,
	"customer_id" varchar,
	"customer_name" text,
	"cashier_id" varchar,
	"items" jsonb NOT NULL,
	"subtotal" numeric(18, 4) NOT NULL,
	"tax_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"tax_rate" numeric(18, 4) DEFAULT 12,
	"discount_amount" numeric(18, 4) DEFAULT 0,
	"total_amount" numeric(18, 4) NOT NULL,
	"payment_method" varchar(20) NOT NULL,
	"payment_details" jsonb,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"receipt_number" varchar(30),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pos_transactions_transaction_number_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
CREATE TABLE "profit_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"description" text,
	"manager_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profit_centers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "stock_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_master_id" varchar,
	"material_card_id" varchar,
	"warehouse_id" varchar,
	"batch_number" varchar(50),
	"on_hand_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"reserved_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"available_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"in_transit_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"ordered_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"unit_cost" numeric(18, 4),
	"total_value" numeric(18, 4),
	"last_received_at" timestamp,
	"last_issued_at" timestamp,
	"last_counted_at" timestamp,
	"expiry_date" varchar(10),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "abc_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"grade" varchar(1) DEFAULT 'C' NOT NULL,
	"score" integer DEFAULT 3 NOT NULL,
	"performance_rate" integer DEFAULT 0,
	"attendance_rate" integer DEFAULT 0,
	"punctuality_rate" integer DEFAULT 0,
	"discipline_score" integer DEFAULT 0,
	"course_completion_rate" integer DEFAULT 0,
	"test_pass_rate" integer DEFAULT 0,
	"task_completion_rate" integer DEFAULT 0,
	"initiative_count" integer DEFAULT 0,
	"loyalty_score" integer DEFAULT 0,
	"benefits" jsonb,
	"notes" text,
	"notes_ru" text,
	"last_calculated" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "abc_analysis_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "adaptation_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"new_employee_id" varchar NOT NULL,
	"feedback_type" varchar(20) NOT NULL,
	"scheduled_date" varchar(10) NOT NULL,
	"completed_date" varchar(10),
	"conducted_by" varchar,
	"rating" integer,
	"satisfaction_level" varchar(20),
	"strengths" text,
	"weaknesses" text,
	"suggestions" text,
	"employee_feedback" text,
	"mentor_feedback" text,
	"action_items" jsonb,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adaptation_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_ru" text NOT NULL,
	"description" text,
	"description_ru" text,
	"position_id" integer,
	"department_id" integer,
	"duration" integer NOT NULL,
	"duration_type" varchar(20) NOT NULL,
	"tasks" jsonb NOT NULL,
	"checkpoints" jsonb,
	"mentor_required" boolean DEFAULT true NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "adaptation_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"program_id" varchar,
	"mentor_id" varchar,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"current_phase" varchar(50),
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_cv_screenings" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" varchar NOT NULL,
	"vacancy_id" varchar,
	"resume_text" text,
	"ocr_raw_text" text,
	"extracted_data" jsonb,
	"hr_capital_category" varchar(30),
	"productivity_score" integer,
	"stability_score" integer,
	"overall_score" integer,
	"match_score" integer,
	"strengths" jsonb,
	"weaknesses" jsonb,
	"red_flags" jsonb,
	"recommendation" varchar(20),
	"ai_analysis" text,
	"ai_model" varchar(50),
	"tokens_used" integer,
	"processing_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_interview_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"stage" integer,
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_interview_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" varchar NOT NULL,
	"vacancy_id" varchar,
	"interview_type" varchar(20) DEFAULT 'text' NOT NULL,
	"language" varchar(5) DEFAULT 'uz' NOT NULL,
	"current_stage" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"scores" jsonb,
	"evaluation" jsonb,
	"system_prompt" text,
	"ai_model" varchar(50),
	"total_tokens_used" integer DEFAULT 0,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"check_in" varchar(8),
	"check_out" varchar(8),
	"is_late" boolean DEFAULT false NOT NULL,
	"is_early_leave" boolean DEFAULT false NOT NULL,
	"minutes_late" integer DEFAULT 0,
	"minutes_early" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'present' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"rfid_card" varchar(100),
	"event_type" varchar(10) NOT NULL,
	"device_id" varchar(100),
	"location" varchar(200),
	"event_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bonus_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"payment_date" varchar(10) NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"bonus_type" varchar(30) NOT NULL,
	"description" text,
	"approved_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"destination" varchar(255) NOT NULL,
	"purpose" text NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"total_days" integer NOT NULL,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"daily_allowance" numeric(18, 4),
	"transport_cost" numeric(18, 4),
	"accommodation_cost" numeric(18, 4),
	"total_cost" numeric(18, 4),
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"approved_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(100),
	"telegram_chat_id" varchar(50),
	"department_id" integer,
	"position_id" integer,
	"vacancy_id" varchar,
	"questionnaire_response_id" varchar,
	"resume_url" text,
	"source" varchar(50),
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "cash_advances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"request_date" varchar(10) NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_date" varchar(10),
	"paid_date" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" varchar NOT NULL,
	"certificate_number" varchar(50) NOT NULL,
	"score" integer,
	"bonus_amount" numeric(18, 4) DEFAULT 0,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "certificates_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
CREATE TABLE "daily_attendance_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"date" varchar(10) NOT NULL,
	"first_seen_at" timestamp,
	"last_seen_at" timestamp,
	"total_minutes" integer DEFAULT 0,
	"work_zone_minutes" integer DEFAULT 0,
	"rest_zone_minutes" integer DEFAULT 0,
	"zones_visited" jsonb DEFAULT '[]'::jsonb,
	"detection_count" integer DEFAULT 0,
	"avg_confidence" numeric(18, 4) DEFAULT 0,
	"status" varchar(20) DEFAULT 'present',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "discipline_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" numeric(18, 4),
	"reason" text NOT NULL,
	"reason_ru" text,
	"given_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "employee_360_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"reviewer_type" varchar(30) NOT NULL,
	"reviewer_name" varchar(200),
	"score" integer NOT NULL,
	"comment" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_bank_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"bank_name" varchar(255) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"card_number" varchar(50),
	"card_holder_name" varchar(255),
	"mfo" varchar(20),
	"inn" varchar(20),
	"is_primary" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_career_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"next_recommended_position" varchar(300),
	"succession_for" varchar(300),
	"cross_training_status" varchar(20) DEFAULT 'not_started',
	"cross_training_notes" text,
	"career_path_direction" varchar(300),
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_career_profiles_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "employee_comparison_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"compared_by" varchar,
	"employee1_id" varchar NOT NULL,
	"employee2_id" varchar NOT NULL,
	"comparison_date" varchar(10) NOT NULL,
	"comparison_type" varchar(50) DEFAULT 'performance' NOT NULL,
	"results" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_daily_kpi" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"evaluation_date" varchar(10) NOT NULL,
	"department_id" integer,
	"attendance_score" numeric(18, 4) DEFAULT 0,
	"task_completion_score" numeric(18, 4) DEFAULT 0,
	"quality_score" numeric(18, 4) DEFAULT 0,
	"productivity_score" numeric(18, 4) DEFAULT 0,
	"teamwork_score" numeric(18, 4) DEFAULT 0,
	"discipline_score" numeric(18, 4) DEFAULT 0,
	"overall_score" numeric(18, 4) DEFAULT 0,
	"bonus_percent" numeric(18, 4) DEFAULT 0,
	"penalty_percent" numeric(18, 4) DEFAULT 0,
	"net_score" numeric(18, 4) DEFAULT 0,
	"evaluator_id" varchar,
	"ai_generated" boolean DEFAULT false,
	"ai_confidence" numeric(18, 4),
	"notes" text,
	"factors" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_emergency_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"relationship" varchar(100) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"alternative_phone" varchar(20),
	"address" text,
	"is_primary" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_face_encodings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"encoding_data" text NOT NULL,
	"face_image_url" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_type" varchar(50),
	"file_size" integer,
	"description" text,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_fines" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"fine_date" varchar(10) NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"fine_type" varchar(30) NOT NULL,
	"description" text,
	"deducted_from_salary" boolean DEFAULT false NOT NULL,
	"deduction_date" varchar(10),
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"problem" text,
	"cause" text,
	"solution" text,
	"expected_result" text,
	"description" text,
	"category" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"assigned_to" integer,
	"implementer_id" varchar,
	"estimated_cost" text,
	"estimated_duration" varchar(100),
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"implemented_at" timestamp,
	"admin_notes" text,
	"admin_response" text,
	"discussion_notes" text,
	"return_reason" text,
	"likes" integer DEFAULT 0 NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"reward" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_passports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"passport_number" varchar(20) NOT NULL,
	"passport_series" varchar(10),
	"issued_by" varchar(255),
	"issued_date" varchar(10),
	"expiry_date" varchar(10),
	"birth_place" varchar(255),
	"citizenship" varchar(100) DEFAULT 'Uzbekistan',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"metric_date" varchar(10) NOT NULL,
	"period_type" varchar(20) DEFAULT 'daily' NOT NULL,
	"total_work_minutes" integer DEFAULT 0 NOT NULL,
	"planned_work_minutes" integer DEFAULT 480 NOT NULL,
	"productivity_score" numeric(18, 4),
	"quality_score" numeric(18, 4),
	"speed_score" numeric(18, 4),
	"attendance_score" numeric(18, 4),
	"overall_rating" numeric(18, 4),
	"absence_days" integer DEFAULT 0 NOT NULL,
	"overtime_minutes" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_productivity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"shift" varchar(20),
	"work_center_id" varchar,
	"total_work_minutes" integer DEFAULT 0,
	"active_work_minutes" integer DEFAULT 0,
	"idle_minutes" integer DEFAULT 0,
	"break_minutes" integer DEFAULT 0,
	"units_produced" integer DEFAULT 0,
	"defects_count" integer DEFAULT 0,
	"safety_violations_count" integer DEFAULT 0,
	"productivity_score" numeric(18, 4) DEFAULT 0,
	"quality_score" numeric(18, 4) DEFAULT 0,
	"safety_score" numeric(18, 4) DEFAULT 0,
	"overall_score" numeric(18, 4) DEFAULT 0,
	"ai_notes" text,
	"ai_notes_ru" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "employee_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"productivity_score" numeric(18, 4) DEFAULT 0,
	"productivity_weight" numeric(18, 4) DEFAULT 40,
	"discipline_score" numeric(18, 4) DEFAULT 0,
	"discipline_weight" numeric(18, 4) DEFAULT 20,
	"quality_score" numeric(18, 4) DEFAULT 0,
	"quality_weight" numeric(18, 4) DEFAULT 20,
	"skills_score" numeric(18, 4) DEFAULT 0,
	"skills_weight" numeric(18, 4) DEFAULT 10,
	"teamwork_score" numeric(18, 4) DEFAULT 0,
	"teamwork_weight" numeric(18, 4) DEFAULT 10,
	"composite_score" numeric(18, 4) DEFAULT 0,
	"rank" integer,
	"trend" varchar(10),
	"camera_presence_hours" numeric(18, 4) DEFAULT 0,
	"production_output" numeric(18, 4) DEFAULT 0,
	"task_completion_rate" numeric(18, 4) DEFAULT 0,
	"qc_pass_rate" numeric(18, 4) DEFAULT 0,
	"attendance_rate" numeric(18, 4) DEFAULT 0,
	"lms_courses_completed" integer DEFAULT 0,
	"calculated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"skill_name" varchar(255) NOT NULL,
	"skill_category" varchar(50) NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"required_level" integer,
	"certification_id" varchar,
	"certified_date" varchar(20),
	"expiry_date" varchar(20),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"verified_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_strengths_weaknesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"analysis_date" varchar(10) NOT NULL,
	"period_type" varchar(20) DEFAULT 'monthly' NOT NULL,
	"strengths" jsonb NOT NULL,
	"weaknesses" jsonb NOT NULL,
	"ai_summary" text,
	"recommendations" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_transfer_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"transfer_date" varchar(10) NOT NULL,
	"transfer_type" varchar(50) NOT NULL,
	"from_department_id" varchar,
	"from_position_id" varchar,
	"from_work_center_id" varchar,
	"to_department_id" varchar,
	"to_position_id" varchar,
	"to_work_center_id" varchar,
	"reason" text,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_work_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"work_center_id" varchar NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employment_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contract_number" varchar(50) NOT NULL,
	"contract_type" varchar(30) NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10),
	"salary" numeric(18, 4) NOT NULL,
	"salary_currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"probation_end_date" varchar(10),
	"work_schedule" varchar(50),
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "face_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"embedding" text NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"confidence" numeric(18, 4) DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "face_recognition_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar,
	"zone_id" varchar,
	"employee_id" varchar,
	"is_recognized" boolean DEFAULT false,
	"confidence" numeric(18, 4) DEFAULT 0,
	"face_image_url" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"flagged_as" varchar(30),
	"flagged_by" varchar,
	"flagged_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "hazard_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_name" varchar(255) NOT NULL,
	"location" varchar(255),
	"risk_level" varchar(20) DEFAULT 'medium' NOT NULL,
	"hazard_type" varchar(100),
	"description" text,
	"control_measures" text,
	"responsible_user_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hr_capital_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"visotskiy_category" varchar(30),
	"tool_test_score" varchar(5),
	"psychological_profile" varchar(200),
	"onboarding_status" varchar(20) DEFAULT 'not_started',
	"offboarding_status" varchar(200),
	"recruiting_channel" varchar(200),
	"notes" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hr_capital_profiles_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "hr_conflict_reports" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"party1" text NOT NULL,
	"party2" text NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(20) DEFAULT 'low' NOT NULL,
	"status" varchar(30) DEFAULT 'open' NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" varchar NOT NULL,
	"vacancy_id" varchar,
	"scheduled_date" varchar(10) NOT NULL,
	"scheduled_time" varchar(5) NOT NULL,
	"interviewer_ids" jsonb NOT NULL,
	"type" varchar(20) DEFAULT 'phone' NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"rating" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "job_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" varchar NOT NULL,
	"template_name" text NOT NULL,
	"template_name_ru" text NOT NULL,
	"description" text,
	"description_ru" text,
	"experience_years" integer,
	"experience_years_ru" text,
	"education_level" text,
	"education_level_ru" text,
	"technical_skills" text[],
	"technical_skills_ru" text[],
	"soft_skills" text[],
	"soft_skills_ru" text[],
	"language_requirements" jsonb,
	"certifications" text,
	"certifications_ru" text,
	"other_requirements" text,
	"other_requirements_ru" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"leave_type" varchar(30) NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"total_days" integer NOT NULL,
	"reason" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_date" varchar(10),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar,
	"trigger_name" varchar(100) NOT NULL,
	"channel" varchar(20) DEFAULT 'telegram' NOT NULL,
	"recipient_chat_id" varchar(100),
	"message" text,
	"status" varchar(20) DEFAULT 'sent' NOT NULL,
	"error_detail" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"operator_id" varchar,
	"date" varchar(10) NOT NULL,
	"machine_task_id" varchar(100),
	"papka_order_id" varchar(100),
	"equipment_id" varchar(100),
	"planned_qty" integer DEFAULT 0,
	"actual_qty" integer DEFAULT 0,
	"defect_qty" integer DEFAULT 0,
	"production_time_min" integer DEFAULT 0,
	"efficiency_percent" numeric(18, 4) DEFAULT 0,
	"overtime_min" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overtime_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"work_date" varchar(10) NOT NULL,
	"hours" numeric(18, 4) NOT NULL,
	"hourly_rate" numeric(18, 4) NOT NULL,
	"multiplier" numeric(18, 4) DEFAULT 1.5 NOT NULL,
	"total_amount" numeric(18, 4) NOT NULL,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"reason" text,
	"approved_by" varchar,
	"is_paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" varchar NOT NULL,
	"goal_type" varchar(30) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"target_value" numeric(18, 4) NOT NULL,
	"current_value" numeric(18, 4) DEFAULT 0,
	"unit" varchar(30),
	"start_date" varchar(20) NOT NULL,
	"end_date" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_required_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" varchar NOT NULL,
	"course_id" varchar NOT NULL,
	"is_onboarding" boolean DEFAULT false NOT NULL,
	"days_to_complete" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_skill_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" varchar,
	"position_name" varchar(255) NOT NULL,
	"skill_name" varchar(255) NOT NULL,
	"skill_category" varchar(50) NOT NULL,
	"required_level" integer DEFAULT 1 NOT NULL,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"course_id" varchar,
	"certification_required" boolean DEFAULT false,
	"certification_validity_months" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ppe_compliance" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ppe_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'compliant' NOT NULL,
	"issued_date" varchar(10),
	"expiry_date" varchar(10),
	"notes" text,
	"checked_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "questionnaire_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" varchar,
	"question" text NOT NULL,
	"question_ru" text NOT NULL,
	"question_type" varchar(20) DEFAULT 'text' NOT NULL,
	"options" jsonb,
	"order" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "questionnaire_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" varchar,
	"full_name" text NOT NULL,
	"phone" varchar(20) NOT NULL,
	"telegram_chat_id" varchar(50) NOT NULL,
	"lang" varchar(5) DEFAULT 'uz' NOT NULL,
	"position_id" integer,
	"vacancy_id" varchar,
	"responses" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "questionnaire_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ru" text NOT NULL,
	"description" text,
	"description_ru" text,
	"position_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safety_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"incident_type" varchar(50) DEFAULT 'near_miss' NOT NULL,
	"severity" varchar(20) DEFAULT 'minor' NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"incident_date" varchar(10) NOT NULL,
	"location" varchar(255),
	"description" text NOT NULL,
	"root_cause" text,
	"corrective_action" text,
	"reported_by" varchar,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "safety_trainings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"training_name" varchar(255) NOT NULL,
	"training_type" varchar(50) DEFAULT 'safety',
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"scheduled_date" varchar(10),
	"completed_date" varchar(10),
	"expiry_date" varchar(10),
	"trainer" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salary_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"effective_date" varchar(10) NOT NULL,
	"previous_salary" numeric(18, 4),
	"new_salary" numeric(18, 4) NOT NULL,
	"change_type" varchar(30) NOT NULL,
	"change_percent" numeric(18, 4),
	"reason" text,
	"approved_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_handovers" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_shift_id" varchar,
	"to_shift_id" varchar,
	"handover_date" varchar(20) NOT NULL,
	"department" varchar(100) NOT NULL,
	"machine_status" text,
	"pending_tasks" text,
	"quality_issues" text,
	"safety_notes" text,
	"material_status" text,
	"handed_over_by" varchar NOT NULL,
	"received_by" varchar,
	"signature_data" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"shift_type" varchar(30) NOT NULL,
	"department" varchar(100) NOT NULL,
	"required_workers" integer NOT NULL,
	"required_skills" text,
	"machine_id" varchar,
	"effective_from" varchar(20) NOT NULL,
	"effective_to" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_swap_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"requested_by" varchar NOT NULL,
	"swap_with" varchar,
	"original_shift_date" varchar(20) NOT NULL,
	"original_shift_type" varchar(30) NOT NULL,
	"requested_shift_date" varchar(20),
	"requested_shift_type" varchar(30),
	"reason" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sick_leaves" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"total_days" integer NOT NULL,
	"diagnosis" text,
	"hospital_name" varchar(255),
	"doctor_name" varchar(255),
	"document_number" varchar(50),
	"is_paid" boolean DEFAULT true NOT NULL,
	"payment_percent" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "succession_plans" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"target_position_id" varchar,
	"target_date" varchar(10),
	"notes" text,
	"status" varchar(30) DEFAULT 'on_track' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" integer,
	"title" text NOT NULL,
	"title_ru" text,
	"description" text,
	"description_ru" text,
	"department_id" integer,
	"experience_years" integer,
	"experience_years_ru" text,
	"education_level" text,
	"education_level_ru" text,
	"technical_skills" text[],
	"technical_skills_ru" text[],
	"soft_skills" text[],
	"soft_skills_ru" text[],
	"language_requirements" jsonb,
	"certifications" text,
	"certifications_ru" text,
	"other_requirements" text,
	"other_requirements_ru" text,
	"requirements" text,
	"requirements_ru" text,
	"open_positions" integer DEFAULT 1 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "camera_ai_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar(50) NOT NULL,
	"camera_name" varchar(100),
	"zone" varchar(100) NOT NULL,
	"location" varchar(200),
	"ai_prompt" text NOT NULL,
	"detection_types" jsonb DEFAULT '[]'::jsonb,
	"alert_threshold" numeric(18, 4) DEFAULT 0.8,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_analyzed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "camera_ai_configs_camera_id_unique" UNIQUE("camera_id")
);
--> statement-breakpoint
CREATE TABLE "camera_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar NOT NULL,
	"camera_event_id" varchar,
	"alert_type" varchar(30) NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"message" text,
	"message_ru" text,
	"telegram_sent" boolean DEFAULT false NOT NULL,
	"telegram_sent_at" timestamp,
	"telegram_recipients" jsonb,
	"is_acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledged_by_id" varchar,
	"acknowledged_at" timestamp,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by_id" varchar,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "camera_dashboard_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"shift" varchar(20),
	"total_cameras" integer DEFAULT 0,
	"active_cameras" integer DEFAULT 0,
	"total_events" integer DEFAULT 0,
	"safety_events" integer DEFAULT 0,
	"quality_events" integer DEFAULT 0,
	"productivity_events" integer DEFAULT 0,
	"machine_events" integer DEFAULT 0,
	"safety_violations_count" integer DEFAULT 0,
	"helmet_violations" integer DEFAULT 0,
	"gloves_violations" integer DEFAULT 0,
	"danger_zone_violations" integer DEFAULT 0,
	"defects_detected" integer DEFAULT 0,
	"defects_rejected" integer DEFAULT 0,
	"defects_reworked" integer DEFAULT 0,
	"total_machines" integer DEFAULT 0,
	"running_machines" integer DEFAULT 0,
	"idle_machines" integer DEFAULT 0,
	"stopped_machines" integer DEFAULT 0,
	"total_employees_detected" integer DEFAULT 0,
	"avg_productivity_score" numeric(18, 4) DEFAULT 0,
	"oee_availability" numeric(18, 4) DEFAULT 0,
	"oee_performance" numeric(18, 4) DEFAULT 0,
	"oee_quality" numeric(18, 4) DEFAULT 0,
	"oee_overall" numeric(18, 4) DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "camera_detections" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar NOT NULL,
	"user_id" integer,
	"detection_date" varchar(10) NOT NULL,
	"detection_time" varchar(8) NOT NULL,
	"zone_name" text,
	"confidence" numeric(18, 4),
	"snapshot_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "camera_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar,
	"user_id" integer,
	"zone_id" varchar,
	"event_type" varchar(50) NOT NULL,
	"event_date" varchar(10) NOT NULL,
	"event_time" varchar(8) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"screenshot_url" text,
	"video_url" text,
	"ai_confidence" numeric(18, 4),
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"assigned_to" integer,
	"notes" text,
	"telegram_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "camera_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar,
	"zone_name" text NOT NULL,
	"zone_type" varchar(50) NOT NULL,
	"coordinates" jsonb,
	"ai_model_type" varchar(50),
	"confidence_threshold" numeric(18, 4) DEFAULT 0.7 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cameras" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"rtsp_url" text,
	"stream_url" text,
	"stream_type" varchar(20),
	"thumbnail_url" text,
	"ip_address" varchar(50),
	"port" integer,
	"username" varchar(50),
	"password_hash" text,
	"work_center_id" varchar,
	"location" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"ai_prompt" text,
	"ai_categories" jsonb,
	"ai_sensitivity" varchar(20) DEFAULT 'medium',
	"ai_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "cameras_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "employee_zone_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"camera_id" varchar,
	"zone_name" text NOT NULL,
	"tracking_date" varchar(10) NOT NULL,
	"entry_time" varchar(8),
	"exit_time" varchar(8),
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"visit_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iot_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"sensor_id" varchar NOT NULL,
	"alert_type" varchar(20) NOT NULL,
	"severity" varchar(10) NOT NULL,
	"message" text NOT NULL,
	"value" numeric(18, 4),
	"threshold" numeric(18, 4),
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iot_sensor_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"sensor_id" varchar NOT NULL,
	"value" numeric(18, 4) NOT NULL,
	"status" varchar(20) DEFAULT 'normal' NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iot_sensors" (
	"id" serial PRIMARY KEY NOT NULL,
	"sensor_code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"type" varchar(30) NOT NULL,
	"machine_id" varchar,
	"location" text,
	"unit" varchar(20),
	"min_threshold" numeric(18, 4),
	"max_threshold" numeric(18, 4),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_reading" numeric(18, 4),
	"last_reading_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "iot_sensors_sensor_code_unique" UNIQUE("sensor_code")
);
--> statement-breakpoint
CREATE TABLE "machine_status_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_center_id" varchar NOT NULL,
	"camera_id" varchar,
	"status" varchar(30) NOT NULL,
	"previous_status" varchar(30),
	"status_started_at" timestamp DEFAULT now() NOT NULL,
	"status_ended_at" timestamp,
	"duration_minutes" integer,
	"stop_reason" varchar(50),
	"stop_reason_detail" text,
	"operator_id" varchar,
	"ai_detected" boolean DEFAULT false NOT NULL,
	"ai_confidence" numeric(18, 4),
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_performance_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"operator_id" varchar NOT NULL,
	"shift_date" varchar(10) NOT NULL,
	"shift_type" varchar(20) DEFAULT 'day',
	"papka_order_id" varchar,
	"total_tasks_completed" integer DEFAULT 0,
	"total_qty_produced" integer DEFAULT 0,
	"total_defects" integer DEFAULT 0,
	"total_production_time_min" integer DEFAULT 0,
	"efficiency_score" numeric(18, 4) DEFAULT 0,
	"quality_score" numeric(18, 4) DEFAULT 0,
	"overtime_min" integer DEFAULT 0,
	"payroll_bonus" numeric(18, 4) DEFAULT 0,
	"payroll_deduction" numeric(18, 4) DEFAULT 0,
	"payroll_synced" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pm_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" varchar(100) NOT NULL,
	"equipment_name" text,
	"equipment_code" varchar(50),
	"task_name" text NOT NULL,
	"task_description" text,
	"interval_days" integer NOT NULL,
	"last_done_date" varchar(10),
	"next_due_date" varchar(10),
	"assigned_to" varchar(100),
	"estimated_hours" numeric(18, 4),
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"required_parts" jsonb,
	"status" varchar(30) DEFAULT 'scheduled' NOT NULL,
	"completed_dates" jsonb DEFAULT '[]'::jsonb,
	"completed_at" varchar(30),
	"completed_by" varchar(100),
	"actual_hours" numeric(18, 4),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quality_defects_camera" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_event_id" varchar,
	"camera_id" varchar NOT NULL,
	"work_center_id" varchar,
	"production_order_id" varchar,
	"defect_type" varchar(50) NOT NULL,
	"defect_location" text,
	"image_url" text,
	"ai_confidence" numeric(18, 4),
	"defect_count" integer DEFAULT 1,
	"batch_id" varchar(100),
	"action_taken" varchar(30),
	"reviewed_by_id" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "safety_violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_event_id" varchar,
	"camera_id" varchar NOT NULL,
	"user_id" integer,
	"violation_type" varchar(50) NOT NULL,
	"location" text,
	"image_url" text,
	"video_clip_url" text,
	"ai_confidence" numeric(18, 4),
	"action_taken" text,
	"penalty_applied" boolean DEFAULT false NOT NULL,
	"penalty_amount" numeric(18, 4),
	"acknowledged_by_id" varchar,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_robots" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" varchar(50) NOT NULL,
	"trigger_column_id" varchar,
	"action_type" varchar(50) NOT NULL,
	"action_config" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "kanban_boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" varchar(20) DEFAULT 'custom' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "kanban_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" varchar NOT NULL,
	"column_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"related_type" varchar(20),
	"related_id" varchar(100),
	"owner_user_id" varchar,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"due_date" varchar(10),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"parent_card_id" varchar,
	"project_id" varchar,
	"estimated_time" integer,
	"start_date" varchar(10),
	"recurrence_pattern" varchar(20),
	"recurrence_interval" integer DEFAULT 1,
	"recurrence_end_date" varchar(10),
	"last_recurrence_created" timestamp,
	"source" varchar(20) DEFAULT 'kanban' NOT NULL,
	"telegram_message_id" varchar(100),
	"telegram_chat_id" varchar(100),
	"accepted_at" timestamp,
	"accepted_by_id" varchar,
	"completed_at" timestamp,
	"completion_report" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "kanban_columns" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" varchar NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"color" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "kanban_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_card_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_chat_message_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"message" text NOT NULL,
	"message_type" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_id" varchar NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_co_executors" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"added_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_collaborators" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"uploaded_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_flows" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"board_id" varchar,
	"assignment_type" varchar(20) NOT NULL,
	"user_ids" text[],
	"last_assigned_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"card_id" varchar,
	"type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_observers" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"added_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_project_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" varchar(20) DEFAULT '#3b82f6' NOT NULL,
	"start_date" varchar(10),
	"end_date" varchar(10),
	"owner_id" varchar,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "task_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"reminder_at" timestamp NOT NULL,
	"sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_result_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"result_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"description" text,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"from_column_id" varchar,
	"to_column_id" varchar,
	"from_status" varchar(50),
	"to_status" varchar(50),
	"changed_by_id" varchar,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_subtasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_card_id" varchar NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"assignee_id" varchar,
	"due_date" varchar(10),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" varchar(20) DEFAULT '#3b82f6' NOT NULL,
	"board_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"checklist_items" text[],
	"board_id" varchar,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "task_time_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_minutes" integer,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_time_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_minutes" integer,
	"target_minutes" integer,
	"is_running" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_view_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"board_id" varchar,
	"view_type" varchar(20) DEFAULT 'kanban' NOT NULL,
	"filters" text,
	"sort_by" varchar(50),
	"sort_order" varchar(10) DEFAULT 'asc',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"description" text NOT NULL,
	"description_ru" text,
	"icon" text,
	"points" integer DEFAULT 0 NOT NULL,
	"condition" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "achievements_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ai_exam_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"position_id" varchar NOT NULL,
	"questions" jsonb NOT NULL,
	"answers" jsonb NOT NULL,
	"gpt_analysis" text,
	"score" integer,
	"evaluation" jsonb,
	"status" varchar(20) DEFAULT 'assigned' NOT NULL,
	"assigned_by" varchar,
	"assigned_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp,
	"analyzed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" varchar NOT NULL,
	"question_id" varchar NOT NULL,
	"response" text NOT NULL,
	"score" integer,
	"feedback" text,
	"gpt_feedback" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" varchar NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"start_date" varchar(10),
	"end_date" varchar(10),
	"due_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"test_id" varchar NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"score" integer,
	"passed" boolean,
	"gpt_used" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" varchar NOT NULL,
	"course_id" varchar NOT NULL,
	"video_position" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"last_accessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"description" text,
	"description_ru" text,
	"thumbnail" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"duration" integer,
	"level" varchar(20) DEFAULT 'beginner' NOT NULL,
	"department_id" integer,
	"mentor_id" varchar,
	"start_date" varchar(10),
	"end_date" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "courses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "guidelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" integer,
	"file_path" text NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "hr_capital_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_number" integer,
	"title" text NOT NULL,
	"title_ru" text,
	"content" text,
	"content_structured" jsonb,
	"keywords" text[],
	"difficulty" varchar(20) DEFAULT 'intermediate',
	"duration_minutes" integer,
	"author" varchar(100),
	"source_pdf_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_capital_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar NOT NULL,
	"module_number" integer,
	"title" text NOT NULL,
	"title_ru" text,
	"content" text,
	"learning_objectives" text[],
	"key_concepts" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_capital_quiz_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"module_id" varchar NOT NULL,
	"score" integer,
	"total_questions" integer,
	"correct_answers" integer,
	"answers" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_capital_quiz_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" varchar NOT NULL,
	"question_type" varchar(50) DEFAULT 'multiple_choice' NOT NULL,
	"question_text" text NOT NULL,
	"question_text_ru" text,
	"options" jsonb,
	"correct_answer" text,
	"explanation" text,
	"explanation_ru" text,
	"difficulty" varchar(20) DEFAULT 'intermediate',
	"generated_by_ai" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" varchar NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"content" text,
	"content_ru" text,
	"file_path" text,
	"duration" integer,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mentors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"source" text,
	"achievements" text,
	"experience" text,
	"expertise" text,
	"user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "mentorship_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentorship_id" varchar NOT NULL,
	"date" varchar(10) NOT NULL,
	"duration" integer NOT NULL,
	"topics" text,
	"feedback" text,
	"next_steps" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentorships" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentor_id" varchar NOT NULL,
	"mentee_id" varchar NOT NULL,
	"course_id" varchar NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10),
	"deadline" varchar(10),
	"bonus_percentage" integer DEFAULT 0,
	"goals" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" varchar NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "onboarding_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"position_id" integer,
	"title" text NOT NULL,
	"title_ru" text,
	"description" text,
	"description_ru" text,
	"type" varchar(20) NOT NULL,
	"related_id" varchar,
	"days_to_complete" integer,
	"order" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" varchar NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" varchar NOT NULL,
	"type" varchar(20) NOT NULL,
	"question" text NOT NULL,
	"question_ru" text,
	"options" jsonb,
	"options_ru" jsonb,
	"correct_answer" text,
	"difficulty" varchar(20) DEFAULT 'medium' NOT NULL,
	"category" text,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category" varchar(50) NOT NULL,
	"level" varchar(20) DEFAULT 'beginner' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer,
	"module_id" varchar,
	"department_id" integer,
	"position_id" integer,
	"title" text NOT NULL,
	"title_ru" text,
	"pass_percentage" integer DEFAULT 80 NOT NULL,
	"time_limit" integer,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"randomize_questions" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_id" varchar NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_onboarding_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"task_id" varchar NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"source" varchar(50) NOT NULL,
	"source_id" varchar,
	"reason" text,
	"reason_ru" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"skill_id" varchar NOT NULL,
	"level" varchar(20) NOT NULL,
	"verified_by" varchar,
	"verified_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "video_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" varchar NOT NULL,
	"current_time" integer DEFAULT 0 NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"last_watched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title_uz" varchar(500) NOT NULL,
	"title_ru" varchar(500),
	"body_uz" text,
	"body_ru" text,
	"excerpt" text,
	"cover_image" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"seo_title" varchar(255),
	"seo_description" text,
	"is_published" boolean DEFAULT false,
	"published_at" timestamp,
	"author_id" varchar(36),
	"view_count" integer DEFAULT 0,
	"is_ai_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_calendar" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"platform" varchar(100) NOT NULL,
	"type" varchar(50) DEFAULT 'post',
	"scheduled_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'planned',
	"content_id" varchar(36),
	"campaign_id" varchar(36),
	"assigned_to" varchar(36),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_posts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"body_uz" text,
	"body_ru" text,
	"media_urls" jsonb DEFAULT '[]'::jsonb,
	"platforms" jsonb DEFAULT '[]'::jsonb,
	"hashtags" text,
	"status" varchar(20) DEFAULT 'draft',
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"campaign_id" varchar(36),
	"created_by" varchar(36),
	"approved_by" varchar(36),
	"is_ai_generated" boolean DEFAULT false,
	"ai_prompt_used" text,
	"publish_results" jsonb DEFAULT '{}'::jsonb,
	"engagement_stats" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exhibition_leads" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"exhibition_id" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"company" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"interest" text,
	"estimated_volume" varchar(100),
	"crm_lead_id" varchar(36),
	"notes" text,
	"scanned_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exhibitions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_ru" varchar(255),
	"location" varchar(255),
	"country" varchar(100) DEFAULT 'Uzbekistan',
	"start_date" timestamp,
	"end_date" timestamp,
	"budget" numeric(15, 2) DEFAULT '0',
	"spent_amount" numeric(15, 2) DEFAULT '0',
	"actual_spend" numeric(15, 2) DEFAULT '0',
	"lead_count" integer DEFAULT 0,
	"deal_count" integer DEFAULT 0,
	"deal_value" numeric(15, 2) DEFAULT '0',
	"roi" numeric(10, 2),
	"status" varchar(50) DEFAULT 'planned',
	"description" text,
	"team_members" text,
	"assigned_team" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"qr_code" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "marketing_ab_tests" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"campaign_id" varchar(36),
	"name" varchar(255) NOT NULL,
	"description" text,
	"variant_a" varchar(500) NOT NULL,
	"variant_b" varchar(500) NOT NULL,
	"impressions_a" integer DEFAULT 0,
	"impressions_b" integer DEFAULT 0,
	"clicks_a" integer DEFAULT 0,
	"clicks_b" integer DEFAULT 0,
	"conversions_a" integer DEFAULT 0,
	"conversions_b" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'running',
	"winner" varchar(10),
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"created_by" varchar(36),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_ads" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"campaign_id" varchar(36),
	"platform" varchar(100) NOT NULL,
	"type" varchar(50) DEFAULT 'image',
	"status" varchar(50) DEFAULT 'draft',
	"budget" numeric(15, 2) DEFAULT '0',
	"spent_amount" numeric(15, 2) DEFAULT '0',
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"target_url" text,
	"ad_content" text,
	"image_url" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "marketing_budget_items" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"category" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"year" integer NOT NULL,
	"month" integer,
	"planned_amount" numeric(15, 2) DEFAULT '0',
	"actual_amount" numeric(15, 2) DEFAULT '0',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_budget_lines" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"month" integer,
	"category" varchar(50) NOT NULL,
	"planned_amount" numeric(15, 2) DEFAULT '0',
	"actual_amount" numeric(15, 2) DEFAULT '0',
	"description" varchar(500),
	"approved_by" varchar(36),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) DEFAULT 'digital',
	"status" varchar(50) DEFAULT 'draft',
	"budget" numeric(15, 2) DEFAULT '0',
	"spent_amount" numeric(15, 2) DEFAULT '0',
	"platform" varchar(100),
	"start_date" timestamp,
	"end_date" timestamp,
	"target_audience" text,
	"goals" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar(36),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "marketing_content" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"content_ru" text,
	"type" varchar(50) DEFAULT 'post',
	"platform" varchar(100),
	"status" varchar(50) DEFAULT 'draft',
	"campaign_id" varchar(36),
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"image_url" text,
	"engagement" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar(36),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "marketing_lead_contacts" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"lead_id" varchar(36) NOT NULL,
	"type" varchar(50) NOT NULL,
	"summary" text,
	"outcome" varchar(100),
	"contacted_by" varchar(36),
	"contacted_at" timestamp DEFAULT now(),
	"next_follow_up" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_leads" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"company" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"source" varchar(100) DEFAULT 'website',
	"channel" varchar(100),
	"campaign_id" varchar(36),
	"status" varchar(50) DEFAULT 'new',
	"score" integer DEFAULT 0,
	"notes" text,
	"crm_lead_id" varchar(36),
	"assigned_to" varchar(36),
	"lost_reason" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "marketing_settings" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"category" varchar(100) DEFAULT 'general',
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "marketing_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "nps_responses" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"papka_order_id" varchar(36),
	"customer_id" integer,
	"score" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pr_activities" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"media" varchar(255),
	"media_name" varchar(255),
	"title" varchar(500) NOT NULL,
	"date" timestamp,
	"publish_date" timestamp,
	"url" text,
	"reach" integer DEFAULT 0,
	"sentiment" varchar(20),
	"status" varchar(50) DEFAULT 'planned',
	"description" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "social_api_configs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"platform" varchar(20) NOT NULL,
	"access_token" text,
	"page_id" varchar(255),
	"account_id" varchar(255),
	"webhook_secret" varchar(255),
	"bot_token" varchar(255),
	"is_active" boolean DEFAULT false,
	"last_sync_at" timestamp,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "social_api_configs_platform_unique" UNIQUE("platform")
);
--> statement-breakpoint
CREATE TABLE "social_conversations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"platform" varchar(50) NOT NULL,
	"external_id" varchar(255),
	"contact_name" varchar(255),
	"contact_phone" varchar(50),
	"contact_avatar" text,
	"contact_id" varchar(255),
	"crm_lead_id" varchar(36),
	"crm_contact_id" integer,
	"status" varchar(50) DEFAULT 'open',
	"assigned_to" varchar(36),
	"is_ai_handling" boolean DEFAULT true,
	"last_message" text,
	"last_message_at" timestamp,
	"unread_count" integer DEFAULT 0,
	"priority" varchar(20) DEFAULT 'normal',
	"tags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_messages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"conversation_id" varchar(36) NOT NULL,
	"direction" varchar(20) DEFAULT 'incoming',
	"text" text,
	"media_url" text,
	"media_type" varchar(20),
	"is_ai" boolean DEFAULT false,
	"is_ai_generated" boolean DEFAULT false,
	"is_read" boolean DEFAULT false,
	"external_message_id" varchar(255),
	"sent_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_material_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_number" varchar(30) NOT NULL,
	"material_id" varchar,
	"material_name" text NOT NULL,
	"material_type" varchar(50),
	"quantity" numeric(18, 4) NOT NULL,
	"reserved_quantity" numeric(18, 4) DEFAULT 0,
	"available_quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(20) DEFAULT 'kg' NOT NULL,
	"expiry_date" varchar(10),
	"received_date" varchar(10),
	"warehouse_id" varchar,
	"location" text,
	"cost_per_unit" numeric(18, 4) DEFAULT 0,
	"quality_grade" varchar(10) DEFAULT 'A',
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_material_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_id" varchar,
	"warehouse_id" varchar,
	"insight_type" varchar(30) NOT NULL,
	"insight_date" varchar(10) NOT NULL,
	"confidence" numeric(18, 4),
	"priority" varchar(10) DEFAULT 'medium',
	"title" text NOT NULL,
	"title_ru" text,
	"description" text NOT NULL,
	"description_ru" text,
	"payload" jsonb,
	"action_required" boolean DEFAULT false NOT NULL,
	"action_taken" boolean DEFAULT false NOT NULL,
	"action_taken_by" varchar,
	"action_taken_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_reservation_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar,
	"requested_by" varchar,
	"material_type" varchar(50) NOT NULL,
	"required_quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(20) DEFAULT 'kg' NOT NULL,
	"required_by_date" varchar(10),
	"priority" varchar(10) DEFAULT 'normal' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"ai_recommendation" jsonb,
	"reserved_batches" jsonb,
	"total_reserved" numeric(18, 4) DEFAULT 0,
	"shortage_amount" numeric(18, 4) DEFAULT 0,
	"ai_confidence" numeric(18, 4) DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_number" varchar(50) NOT NULL,
	"product_id" varchar,
	"production_order_id" varchar,
	"quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"manufacturing_date" varchar(10) NOT NULL,
	"expiry_date" varchar(10),
	"warehouse_id" varchar,
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"quality_status" varchar(20) DEFAULT 'pending',
	"remaining_quantity" numeric(18, 4),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "consumption_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"papka_order_id" varchar NOT NULL,
	"material_card_id" varchar NOT NULL,
	"formula_id" varchar,
	"suggested_quantity" numeric(18, 4) NOT NULL,
	"unit_of_measure" varchar(20) NOT NULL,
	"calculation_details" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"executed_transaction_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creditor_debts" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" varchar,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(5) DEFAULT 'UZS' NOT NULL,
	"due_date" varchar(10),
	"description" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"paid_amount" numeric(18, 4) DEFAULT 0,
	"registered_by" varchar,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "driver_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"driver_id" varchar,
	"vehicle_id" varchar(50),
	"order_id" varchar,
	"expense_type" varchar(50) NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(5) DEFAULT 'UZS' NOT NULL,
	"receipt_image_url" text,
	"ocr_extracted_data" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"notes" text,
	"expense_date" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goods_issue_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"gi_id" varchar NOT NULL,
	"raw_material_id" varchar NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goods_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"gi_number" varchar(50) NOT NULL,
	"issue_date" varchar(10) NOT NULL,
	"issue_type" varchar(20) NOT NULL,
	"reference_id" varchar(100),
	"warehouse_id" varchar NOT NULL,
	"issued_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "goods_issues_gi_number_unique" UNIQUE("gi_number")
);
--> statement-breakpoint
CREATE TABLE "goods_receipt_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"gr_id" varchar NOT NULL,
	"raw_material_id" varchar NOT NULL,
	"ordered_qty" numeric(18, 4) NOT NULL,
	"received_qty" numeric(18, 4) NOT NULL,
	"unit" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goods_receipt_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_id" varchar NOT NULL,
	"material_card_id" varchar,
	"ordered_quantity" numeric(18, 4),
	"received_quantity" numeric(18, 4) NOT NULL,
	"accepted_quantity" numeric(18, 4),
	"rejected_quantity" numeric(18, 4) DEFAULT 0,
	"unit_cost" numeric(18, 4) DEFAULT 0,
	"total_cost" numeric(18, 4) DEFAULT 0,
	"batch_number" varchar(50),
	"expiry_date" varchar(10),
	"qc_status" varchar(20) DEFAULT 'pending',
	"qc_notes" text,
	"qc_date" varchar(10),
	"bin_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goods_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt_number" varchar(50) NOT NULL,
	"receipt_date" varchar(10) NOT NULL,
	"supplier_id" varchar,
	"supplier_name" text,
	"warehouse_id" varchar,
	"purchase_order_id" varchar,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_items" integer DEFAULT 0,
	"total_value" numeric(18, 4) DEFAULT 0,
	"qc_required_items" integer DEFAULT 0,
	"qc_passed_items" integer DEFAULT 0,
	"received_by" varchar,
	"qc_by" varchar,
	"notes" text,
	"invoice_number" varchar(50),
	"invoice_date" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"received_at" timestamp,
	CONSTRAINT "goods_receipts_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "inventory_count_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"count_id" varchar NOT NULL,
	"material_id" varchar,
	"product_id" varchar,
	"item_type" varchar(20) NOT NULL,
	"book_quantity" numeric(18, 4) NOT NULL,
	"counted_quantity" numeric(18, 4),
	"variance" numeric(18, 4),
	"variance_percent" numeric(18, 4),
	"unit_cost" numeric(18, 4) NOT NULL,
	"book_value" numeric(18, 4) NOT NULL,
	"counted_value" numeric(18, 4),
	"value_variance" numeric(18, 4),
	"reason" text,
	"counted_by" varchar,
	"counted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_counts" (
	"id" serial PRIMARY KEY NOT NULL,
	"count_number" varchar(50) NOT NULL,
	"count_date" varchar(10) NOT NULL,
	"warehouse_id" varchar,
	"count_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"total_items" integer DEFAULT 0,
	"counted_items" integer DEFAULT 0,
	"variance_items" integer DEFAULT 0,
	"total_book_value" numeric(18, 4) DEFAULT 0,
	"total_counted_value" numeric(18, 4) DEFAULT 0,
	"total_variance" numeric(18, 4) DEFAULT 0,
	"assigned_to" integer,
	"approved_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"approved_at" timestamp,
	CONSTRAINT "inventory_counts_count_number_unique" UNIQUE("count_number")
);
--> statement-breakpoint
CREATE TABLE "material_barcodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"barcode_id" varchar(100) NOT NULL,
	"material_card_id" varchar,
	"lot_number" varchar(50),
	"quantity" numeric(18, 4) NOT NULL,
	"remaining_quantity" numeric(18, 4) NOT NULL,
	"reserved_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"uom" varchar(20) NOT NULL,
	"current_location" varchar(100) DEFAULT 'RECEIVING' NOT NULL,
	"warehouse_id" varchar,
	"bin_id" varchar,
	"status" varchar(20) DEFAULT 'QC_HOLD' NOT NULL,
	"received_date" timestamp,
	"production_date" varchar(10),
	"expiry_date" varchar(10),
	"gtin" varchar(14),
	"sscc" varchar(18),
	"vendor_id" varchar,
	"po_number" varchar(50),
	"goods_receipt_id" varchar,
	"parent_barcode_id" varchar,
	"unit_cost" numeric(18, 4) DEFAULT 0,
	"total_cost" numeric(18, 4) DEFAULT 0,
	"qc_status" varchar(20) DEFAULT 'pending',
	"qc_notes" text,
	"qc_inspector_id" varchar,
	"qc_date" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "material_barcodes_barcode_id_unique" UNIQUE("barcode_id")
);
--> statement-breakpoint
CREATE TABLE "material_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_number" varchar(50) NOT NULL,
	"material_card_id" varchar,
	"warehouse_id" varchar,
	"bin_id" varchar,
	"quantity" numeric(18, 4) NOT NULL,
	"remaining_quantity" numeric(18, 4) NOT NULL,
	"unit_cost" numeric(18, 4) DEFAULT 0,
	"production_date" varchar(10),
	"expiry_date" varchar(10),
	"supplier_id" varchar,
	"supplier_batch_number" varchar(100),
	"goods_receipt_id" varchar,
	"qc_status" varchar(20) DEFAULT 'pending',
	"barcode" varchar(100),
	"qr_code" text,
	"status" varchar(20) DEFAULT 'active',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "material_batches_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "material_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"kod" varchar(50) NOT NULL,
	"xom_ashyo" text NOT NULL,
	"xom_ashyo_ru" text,
	"unit_of_measure" varchar(20) NOT NULL,
	"category" varchar(30),
	"format_a" numeric(18, 4),
	"format_b" numeric(18, 4),
	"grammage" numeric(18, 4),
	"current_stock" numeric(18, 4) DEFAULT 0,
	"reserved_stock" numeric(18, 4) DEFAULT 0,
	"available_stock" numeric(18, 4) DEFAULT 0,
	"min_stock" numeric(18, 4) DEFAULT 0,
	"max_stock" numeric(18, 4),
	"reorder_point" numeric(18, 4),
	"unit_price" numeric(18, 4),
	"currency" varchar(10) DEFAULT 'UZS',
	"last_purchase_price" numeric(18, 4),
	"last_purchase_date" varchar(10),
	"supplier_name" text,
	"vendor_id" varchar,
	"description" text,
	"raw_material_id" varchar,
	"warehouse_id" varchar,
	"material_type" varchar(30) DEFAULT 'raw_material',
	"storage_conditions" jsonb,
	"shelf_life_days" integer,
	"abc_segment" varchar(1) DEFAULT 'C',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "material_cards_kod_unique" UNIQUE("kod")
);
--> statement-breakpoint
CREATE TABLE "material_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" varchar(50),
	"unit" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_inventory_valuations" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" varchar,
	"material_id" varchar,
	"valuation_date" varchar(10) NOT NULL,
	"valuation_method" varchar(20) DEFAULT 'weighted_avg' NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_cost" numeric(18, 4) NOT NULL,
	"total_cost" numeric(18, 4) NOT NULL,
	"previous_quantity" numeric(18, 4),
	"previous_cost" numeric(18, 4),
	"variance" numeric(18, 4),
	"variance_percent" numeric(18, 4),
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_kit_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"kit_id" varchar NOT NULL,
	"material_id" varchar,
	"material_name" text NOT NULL,
	"category_id" varchar,
	"required_quantity" numeric(18, 4) NOT NULL,
	"issued_quantity" numeric(18, 4) DEFAULT 0,
	"returned_quantity" numeric(18, 4) DEFAULT 0,
	"consumed_quantity" numeric(18, 4) DEFAULT 0,
	"unit" varchar(20) NOT NULL,
	"item_barcode" text,
	"is_scanned" boolean DEFAULT false,
	"scanned_at" timestamp,
	"scanned_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_kits" (
	"id" serial PRIMARY KEY NOT NULL,
	"kit_number" varchar(50) NOT NULL,
	"order_id" varchar NOT NULL,
	"machine_task_id" varchar,
	"equipment_id" varchar,
	"scheduled_date" varchar(10) NOT NULL,
	"scheduled_time" varchar(5),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"prepared_by" varchar,
	"prepared_at" timestamp,
	"delivered_by" varchar,
	"delivered_at" timestamp,
	"confirmed_by" varchar,
	"confirmed_at" timestamp,
	"barcode" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "material_kits_kit_number_unique" UNIQUE("kit_number")
);
--> statement-breakpoint
CREATE TABLE "material_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"order_id" varchar,
	"kit_id" varchar,
	"material_id" varchar,
	"material_name" text NOT NULL,
	"movement_type" varchar(20) NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"barcode" text,
	"scanned_at" timestamp,
	"performed_by" varchar NOT NULL,
	"equipment_id" varchar,
	"reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "min_stock_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_card_id" varchar NOT NULL,
	"alert_date" varchar(10) NOT NULL,
	"alert_type" varchar(20) DEFAULT 'min_stock',
	"current_stock" numeric(18, 4) NOT NULL,
	"min_stock" numeric(18, 4) NOT NULL,
	"deficit" numeric(18, 4) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"is_acknowledged" boolean DEFAULT false,
	"acknowledged_by" varchar,
	"acknowledged_at" timestamp,
	"is_resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"telegram_sent" boolean DEFAULT false,
	"telegram_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mm_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_no" varchar(50),
	"order_id" varchar,
	"customer_id" varchar,
	"customer_name" varchar(200),
	"address" text,
	"vehicle_id" varchar,
	"plate_number" varchar(30),
	"driver_id" varchar,
	"driver_name" varchar(100),
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"estimated_arrival" timestamp,
	"actual_arrival" timestamp,
	"weight" numeric(18, 4),
	"cost" numeric(18, 4) DEFAULT 0,
	"distance" numeric(18, 4),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mro_budgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"department" varchar(100) NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"budget_amount" numeric(18, 4) NOT NULL,
	"spent_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"remaining_amount" numeric(18, 4) NOT NULL,
	"currency" varchar(5) DEFAULT 'UZS' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mro_cleaning_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"area" varchar(200) NOT NULL,
	"frequency" varchar(30) DEFAULT 'daily' NOT NULL,
	"last_cleaned" timestamp,
	"next_cleaning" timestamp,
	"responsible" varchar(200) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mro_consumption" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" varchar,
	"item_id" varchar NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_cost" numeric(18, 4) DEFAULT 0,
	"total_cost" numeric(18, 4) DEFAULT 0,
	"consumed_by" varchar NOT NULL,
	"department" varchar(100),
	"equipment_id" varchar,
	"purpose" varchar(500),
	"consumed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mro_facilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"facility_type" varchar(30) DEFAULT 'room' NOT NULL,
	"area_m2" numeric(18, 4) DEFAULT 0 NOT NULL,
	"capacity" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_inspection" varchar(10),
	"next_inspection" varchar(10),
	"responsible" varchar(200),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mro_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_code" varchar(30) NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_ru" varchar(255),
	"category" varchar(50) NOT NULL,
	"unit" varchar(20) DEFAULT 'dona' NOT NULL,
	"min_stock" numeric(18, 4) DEFAULT 0,
	"max_stock" numeric(18, 4),
	"current_stock" numeric(18, 4) DEFAULT 0 NOT NULL,
	"unit_cost" numeric(18, 4) DEFAULT 0,
	"warehouse_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mro_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_number" varchar(30) NOT NULL,
	"item_id" varchar NOT NULL,
	"requested_quantity" numeric(18, 4) NOT NULL,
	"approved_quantity" numeric(18, 4),
	"issued_quantity" numeric(18, 4),
	"purpose" text,
	"equipment_id" varchar,
	"requested_by" varchar NOT NULL,
	"department" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"issued_by" varchar,
	"issued_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mro_utility_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"utility_type" varchar(20) NOT NULL,
	"unit" varchar(20) DEFAULT 'kWt' NOT NULL,
	"reading_date" varchar(10) NOT NULL,
	"today_value" numeric(18, 4) DEFAULT 0 NOT NULL,
	"yesterday_value" numeric(18, 4) DEFAULT 0 NOT NULL,
	"month_total" numeric(18, 4) DEFAULT 0 NOT NULL,
	"month_budget" numeric(18, 4) DEFAULT 0 NOT NULL,
	"trend_percent" numeric(18, 4) DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_material_balance" (
	"id" serial PRIMARY KEY NOT NULL,
	"operator_id" varchar NOT NULL,
	"barcode_id" varchar NOT NULL,
	"production_order_id" varchar NOT NULL,
	"qty_debt" numeric(18, 4) NOT NULL,
	"reason" varchar(30) NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"supervisor_id" varchar,
	"resolved_at" timestamp,
	"resolution_note" text,
	"deduction_amount" numeric(18, 4),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_consumption" (
	"id" serial PRIMARY KEY NOT NULL,
	"production_order_id" varchar NOT NULL,
	"barcode_id" varchar NOT NULL,
	"operator_id" varchar NOT NULL,
	"qty_issued" numeric(18, 4) NOT NULL,
	"qty_used" numeric(18, 4) DEFAULT 0,
	"qty_scrap" numeric(18, 4) DEFAULT 0,
	"qty_returned" numeric(18, 4) DEFAULT 0,
	"variance" numeric(18, 4) DEFAULT 0,
	"verified" boolean DEFAULT false,
	"issued_at" timestamp,
	"confirmed_at" timestamp,
	"return_barcode_id" varchar,
	"scrap_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"invoice_date" varchar(10) NOT NULL,
	"supplier_name" text NOT NULL,
	"vendor_id" varchar,
	"total_amount" numeric(18, 4) NOT NULL,
	"paid_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"payment_status" varchar(20) DEFAULT 'unpaid' NOT NULL,
	"due_date" varchar(10),
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_id" varchar NOT NULL,
	"raw_material_id" varchar NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"unit_price" numeric(18, 4) NOT NULL,
	"total_price" numeric(18, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_number" varchar(50) NOT NULL,
	"vendor_id" varchar NOT NULL,
	"order_date" varchar(10) NOT NULL,
	"delivery_date" varchar(10),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_amount" numeric(18, 4) DEFAULT 0,
	"currency" varchar(10) DEFAULT 'UZS',
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "purchase_requisitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"requisition_number" varchar(50) NOT NULL,
	"mrp_result_id" varchar,
	"mrp_run_id" varchar,
	"material_id" varchar NOT NULL,
	"required_quantity" numeric(18, 4) NOT NULL,
	"required_date" varchar(10) NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"supplier_suggestion" varchar(200),
	"supplier_id" varchar,
	"estimated_cost" numeric(18, 4),
	"purchase_order_id" varchar,
	"requested_by" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "purchase_requisitions_requisition_number_unique" UNIQUE("requisition_number")
);
--> statement-breakpoint
CREATE TABLE "raw_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category" varchar(50) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"minimum_stock" numeric(18, 4) DEFAULT 0 NOT NULL,
	"current_stock" numeric(18, 4) DEFAULT 0 NOT NULL,
	"unit_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"supplier_name" text,
	"vendor_id" varchar,
	"warehouse_id" varchar,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "raw_materials_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"reservation_number" varchar(50) NOT NULL,
	"reservation_date" varchar(10) NOT NULL,
	"material_card_id" varchar,
	"warehouse_id" varchar,
	"order_id" varchar,
	"order_type" varchar(30),
	"quantity" numeric(18, 4) NOT NULL,
	"reserved_quantity" numeric(18, 4) DEFAULT 0,
	"issued_quantity" numeric(18, 4) DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 5,
	"required_date" varchar(10),
	"expiry_date" varchar(10),
	"batch_number" varchar(50),
	"requested_by" varchar,
	"reserved_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reserved_at" timestamp,
	"issued_at" timestamp,
	CONSTRAINT "stock_reservations_reservation_number_unique" UNIQUE("reservation_number")
);
--> statement-breakpoint
CREATE TABLE "three_way_match_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" varchar NOT NULL,
	"purchase_order_id" varchar NOT NULL,
	"goods_receipt_id" varchar,
	"po_total_amount" numeric(18, 4) NOT NULL,
	"gr_total_amount" numeric(18, 4),
	"invoice_total_amount" numeric(18, 4) NOT NULL,
	"price_variance_percent" numeric(18, 4) DEFAULT 0,
	"quantity_variance_percent" numeric(18, 4) DEFAULT 0,
	"overall_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"tolerance_percent" numeric(18, 4) DEFAULT 5,
	"auto_approved" boolean DEFAULT false,
	"matched_by" varchar,
	"matched_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mm_vehicle_fuel_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar NOT NULL,
	"plate_number" varchar(30),
	"date" varchar(10) NOT NULL,
	"liters" numeric(18, 4) NOT NULL,
	"cost_per_liter" numeric(18, 4) NOT NULL,
	"total_cost" numeric(18, 4) NOT NULL,
	"station" varchar(100),
	"mileage" integer,
	"driver_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar(50) NOT NULL,
	"driver_id" varchar,
	"driver_name" varchar(100),
	"plate_number" varchar(20),
	"latitude" numeric(18, 4) NOT NULL,
	"longitude" numeric(18, 4) NOT NULL,
	"speed" numeric(18, 4) DEFAULT 0,
	"status" varchar(20) DEFAULT 'idle' NOT NULL,
	"order_id" varchar,
	"notes" text,
	"recorded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mm_vehicle_maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_id" varchar NOT NULL,
	"plate_number" varchar(30),
	"type" varchar(100) NOT NULL,
	"date" varchar(10) NOT NULL,
	"cost" numeric(18, 4) DEFAULT 0 NOT NULL,
	"mileage" integer,
	"next_due_date" varchar(10),
	"workshop" varchar(100),
	"description" text,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mm_vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"plate_number" varchar(30) NOT NULL,
	"model" varchar(100) NOT NULL,
	"type" varchar(20) DEFAULT 'own' NOT NULL,
	"status" varchar(20) DEFAULT 'idle' NOT NULL,
	"driver_id" varchar,
	"driver_name" varchar(100),
	"driver_phone" varchar(20),
	"fuel_level" integer DEFAULT 0,
	"mileage" integer DEFAULT 0,
	"last_service_date" varchar(10),
	"next_service_date" varchar(10),
	"insurance_expiry" varchar(10),
	"technical_inspection_expiry" varchar(10),
	"year" integer,
	"vin" varchar(50),
	"load_capacity" numeric(18, 4),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "mm_vehicles_plate_number_unique" UNIQUE("plate_number")
);
--> statement-breakpoint
CREATE TABLE "vendor_invoice_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" varchar NOT NULL,
	"po_line_id" varchar,
	"material_id" varchar,
	"description" varchar(500),
	"quantity" numeric(18, 4) NOT NULL,
	"unit_price" numeric(18, 4) NOT NULL,
	"total_price" numeric(18, 4) NOT NULL,
	"po_quantity" numeric(18, 4),
	"po_unit_price" numeric(18, 4),
	"gr_quantity" numeric(18, 4),
	"price_match" boolean DEFAULT false,
	"quantity_match" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"vendor_id" varchar NOT NULL,
	"purchase_order_id" varchar,
	"goods_receipt_id" varchar,
	"invoice_date" varchar(20) NOT NULL,
	"due_date" varchar(20),
	"total_amount" numeric(18, 4) NOT NULL,
	"tax_amount" numeric(18, 4) DEFAULT 0,
	"currency" varchar(5) DEFAULT 'UZS' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"match_status" varchar(20) DEFAULT 'unmatched' NOT NULL,
	"match_score" numeric(18, 4) DEFAULT 0,
	"price_variance" numeric(18, 4) DEFAULT 0,
	"quantity_variance" numeric(18, 4) DEFAULT 0,
	"gl_document_id" varchar,
	"approved_by" varchar,
	"approved_at" timestamp,
	"notes" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" varchar NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"on_time_deliveries" integer DEFAULT 0 NOT NULL,
	"late_deliveries" integer DEFAULT 0 NOT NULL,
	"quality_score" numeric(18, 4) DEFAULT 0,
	"price_competitiveness" numeric(18, 4) DEFAULT 0,
	"return_rate" numeric(18, 4) DEFAULT 0,
	"overall_rating" numeric(18, 4) DEFAULT 0,
	"total_spend" numeric(18, 4) DEFAULT 0,
	"currency" varchar(5) DEFAULT 'UZS' NOT NULL,
	"notes" text,
	"calculated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"address" text,
	"phone" varchar(20),
	"email" varchar(100),
	"tax_id" varchar(50),
	"payment_terms" varchar(50),
	"currency" varchar(10) DEFAULT 'UZS',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "vendors_vendor_code_unique" UNIQUE("vendor_code")
);
--> statement-breakpoint
CREATE TABLE "bom_headers" (
	"id" serial PRIMARY KEY NOT NULL,
	"bom_number" varchar(50) NOT NULL,
	"product_id" varchar NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"base_quantity" numeric(18, 4) DEFAULT 1 NOT NULL,
	"base_unit" varchar(20) DEFAULT 'dona' NOT NULL,
	"valid_from" varchar(10),
	"valid_to" varchar(10),
	"description" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar,
	CONSTRAINT "bom_headers_bom_number_unique" UNIQUE("bom_number")
);
--> statement-breakpoint
CREATE TABLE "bom_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bom_id" varchar NOT NULL,
	"item_number" varchar(10) NOT NULL,
	"component_type" varchar(20) DEFAULT 'material' NOT NULL,
	"component_id" varchar NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(20) DEFAULT 'dona' NOT NULL,
	"scrap_percentage" numeric(18, 4) DEFAULT 0 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "downtime_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_center_id" varchar,
	"downtime_date" varchar(10) NOT NULL,
	"shift" varchar(20),
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5),
	"duration_minutes" integer,
	"reason" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"reported_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_number" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"description" text,
	"category" varchar(50) NOT NULL,
	"manufacturer" varchar(100),
	"model" varchar(100),
	"serial_number" varchar(100),
	"work_center_id" varchar,
	"location" text,
	"installation_date" varchar(10),
	"warranty_end_date" varchar(10),
	"purchase_value" numeric(18, 4),
	"current_value" numeric(18, 4),
	"currency" varchar(10) DEFAULT 'UZS',
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_maintenance_date" varchar(10),
	"next_maintenance_date" varchar(10),
	"maintenance_interval" integer,
	"operating_hours" numeric(18, 4) DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "equipment_equipment_number_unique" UNIQUE("equipment_number")
);
--> statement-breakpoint
CREATE TABLE "mrp_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"mrp_run_id" varchar NOT NULL,
	"material_id" varchar NOT NULL,
	"required_date" varchar(10) NOT NULL,
	"gross_requirement" numeric(18, 4) NOT NULL,
	"scheduled_receipts" numeric(18, 4) DEFAULT 0 NOT NULL,
	"on_hand_stock" numeric(18, 4) DEFAULT 0 NOT NULL,
	"net_requirement" numeric(18, 4) NOT NULL,
	"planned_order" numeric(18, 4) DEFAULT 0 NOT NULL,
	"order_date" varchar(10),
	"lead_time_days" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mrp_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_number" varchar(50) NOT NULL,
	"run_date" varchar(10) NOT NULL,
	"planning_horizon_days" integer DEFAULT 90 NOT NULL,
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"total_products" integer DEFAULT 0 NOT NULL,
	"total_requirements" integer DEFAULT 0 NOT NULL,
	"total_shortages" integer DEFAULT 0 NOT NULL,
	"run_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mrp_runs_run_number_unique" UNIQUE("run_number")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"product_id" varchar,
	"quantity" integer NOT NULL,
	"customer_name" text,
	"customer_id" integer,
	"due_date" varchar(10),
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "production_fact" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_line_id" varchar,
	"product_id" varchar,
	"work_center_id" varchar,
	"fact_date" varchar(10) NOT NULL,
	"shift" varchar(20),
	"fact_quantity" integer NOT NULL,
	"good_quantity" integer NOT NULL,
	"scrap_quantity" integer DEFAULT 0 NOT NULL,
	"rework_quantity" integer DEFAULT 0 NOT NULL,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"operator_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_facts_sm72" (
	"id" serial PRIMARY KEY NOT NULL,
	"papka_no" varchar(50) NOT NULL,
	"fact_date" varchar(10) NOT NULL,
	"operator_id" varchar NOT NULL,
	"work_center_id" varchar,
	"planned_qty" integer NOT NULL,
	"actual_qty" integer NOT NULL,
	"variance" integer NOT NULL,
	"defects" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_order_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"production_order_id" varchar NOT NULL,
	"raw_material_id" varchar NOT NULL,
	"required_quantity" numeric(18, 4) NOT NULL,
	"issued_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"unit" varchar(20) NOT NULL,
	"warehouse_id" varchar
);
--> statement-breakpoint
CREATE TABLE "production_order_operations" (
	"id" serial PRIMARY KEY NOT NULL,
	"production_order_id" varchar NOT NULL,
	"routing_operation_id" varchar,
	"operation_number" varchar(10) NOT NULL,
	"work_center_id" varchar,
	"planned_duration" numeric(18, 4) DEFAULT 0 NOT NULL,
	"actual_duration" numeric(18, 4) DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"operator_id" varchar
);
--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"product_id" varchar NOT NULL,
	"bom_id" varchar,
	"routing_id" varchar,
	"sales_order_id" varchar,
	"planned_quantity" numeric(18, 4) NOT NULL,
	"confirmed_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"scrap_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"order_type" varchar(20) DEFAULT 'standard' NOT NULL,
	"status" varchar(20) DEFAULT 'created' NOT NULL,
	"planned_start_date" varchar(10),
	"planned_end_date" varchar(10),
	"actual_start_date" varchar(10),
	"actual_end_date" varchar(10),
	"priority" integer DEFAULT 3 NOT NULL,
	"work_center_id" varchar,
	"production_type" varchar(30) DEFAULT 'other',
	"defective_qty" double precision DEFAULT 0 NOT NULL,
	"planned_cost" double precision,
	"actual_cost" double precision,
	"responsible_manager_id" varchar,
	"shift_supervisor_id" varchar,
	"qc_inspector_id" varchar,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "production_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "production_plan_header" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_number" varchar(50) NOT NULL,
	"plan_date" varchar(10) NOT NULL,
	"plan_type" varchar(20) DEFAULT 'daily' NOT NULL,
	"work_center_id" varchar,
	"shift" varchar(20),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "production_plan_header_plan_number_unique" UNIQUE("plan_number")
);
--> statement-breakpoint
CREATE TABLE "production_plan_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" varchar,
	"order_id" varchar,
	"product_id" varchar,
	"planned_quantity" integer NOT NULL,
	"planned_start_time" varchar(5),
	"planned_end_time" varchar(5),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_qc_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"production_order_id" varchar NOT NULL,
	"check_stage" varchar(20) NOT NULL,
	"checked_qty" integer DEFAULT 0 NOT NULL,
	"passed_qty" integer DEFAULT 0 NOT NULL,
	"failed_qty" integer DEFAULT 0 NOT NULL,
	"defect_types" jsonb DEFAULT '[]'::jsonb,
	"checked_by" varchar,
	"checked_at" timestamp DEFAULT now(),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"production_order_id" varchar NOT NULL,
	"old_status" varchar(30),
	"new_status" varchar(30) NOT NULL,
	"reason" text,
	"changed_by" varchar,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category" varchar(50),
	"unit" varchar(20) DEFAULT 'dona' NOT NULL,
	"standard_cost" numeric(18, 4),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "products_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "routing_operations" (
	"id" serial PRIMARY KEY NOT NULL,
	"routing_id" varchar NOT NULL,
	"operation_number" varchar(10) NOT NULL,
	"operation_description" text NOT NULL,
	"work_center_id" varchar NOT NULL,
	"setup_time" numeric(18, 4) DEFAULT 0 NOT NULL,
	"machine_time" numeric(18, 4) DEFAULT 0 NOT NULL,
	"labor_time" numeric(18, 4) DEFAULT 0 NOT NULL,
	"base_quantity" numeric(18, 4) DEFAULT 1 NOT NULL,
	"sequence" integer NOT NULL,
	"is_parallel" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "routings" (
	"id" serial PRIMARY KEY NOT NULL,
	"routing_number" varchar(50) NOT NULL,
	"product_id" varchar NOT NULL,
	"version" varchar(20) DEFAULT '1.0' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"valid_from" varchar(10),
	"valid_to" varchar(10),
	"description" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar,
	CONSTRAINT "routings_routing_number_unique" UNIQUE("routing_number")
);
--> statement-breakpoint
CREATE TABLE "shift_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"shift" varchar(5) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shift_calendars" (
	"id" serial PRIMARY KEY NOT NULL,
	"calendar_name" varchar(100) NOT NULL,
	"work_center_id" varchar,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"day" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"is_working_day" boolean DEFAULT true NOT NULL,
	"shift_number" integer DEFAULT 1 NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"break_minutes" integer DEFAULT 60 NOT NULL,
	"net_working_hours" numeric(18, 4) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"eval_id" varchar(30) NOT NULL,
	"shift_name" varchar(50) NOT NULL,
	"operator_id" varchar,
	"safety_score" integer,
	"quality_score" integer,
	"productivity_score" integer,
	"teamwork_score" integer,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"issues_reported" text,
	"suggestions" text,
	"skipped" boolean DEFAULT false NOT NULL,
	"skip_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shift_evaluations_eval_id_unique" UNIQUE("eval_id")
);
--> statement-breakpoint
CREATE TABLE "work_center_capacity" (
	"id" serial PRIMARY KEY NOT NULL,
	"work_center_id" varchar NOT NULL,
	"valid_from" varchar(10) NOT NULL,
	"valid_to" varchar(10),
	"number_of_machines" integer DEFAULT 1 NOT NULL,
	"utilization_percentage" numeric(18, 4) DEFAULT 85 NOT NULL,
	"shifts_per_day" integer DEFAULT 1 NOT NULL,
	"hours_per_shift" numeric(18, 4) DEFAULT 8 NOT NULL,
	"working_days_per_week" integer DEFAULT 5 NOT NULL,
	"total_capacity_hours" numeric(18, 4),
	"available_capacity_hours" numeric(18, 4),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "work_centers" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"type" varchar(20) NOT NULL,
	"capacity" integer,
	"department_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "work_centers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "excel_import_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"sheet_name" text NOT NULL,
	"source_type" varchar(30) NOT NULL,
	"total_rows" integer DEFAULT 0,
	"imported_rows" integer DEFAULT 0,
	"error_rows" integer DEFAULT 0,
	"mismatch_rows" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'uploaded' NOT NULL,
	"error_log" jsonb,
	"column_mapping" jsonb,
	"imported_by" varchar,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "excel_import_rows" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" varchar NOT NULL,
	"row_number" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"normalized_data" jsonb,
	"target_record_id" varchar,
	"target_table" varchar(50),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"mismatch_details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "excel_source_columns" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" varchar NOT NULL,
	"col_letter" varchar(5) NOT NULL,
	"col_index" integer NOT NULL,
	"col_name" text NOT NULL,
	"mapped_field" varchar(100),
	"data_type" varchar(20),
	"has_formula" boolean DEFAULT false,
	"formula_pattern" text,
	"sample_values" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formula_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"formula_id" varchar NOT NULL,
	"papka_order_id" varchar,
	"excel_import_row_id" varchar,
	"input_values" jsonb NOT NULL,
	"calculated_result" numeric(18, 4),
	"excel_result" numeric(18, 4),
	"has_mismatch" boolean DEFAULT false,
	"mismatch_percentage" numeric(18, 4),
	"mismatch_reason" text,
	"status" varchar(20) DEFAULT 'calculated' NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formula_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"description" text,
	"excel_formula" text NOT NULL,
	"excel_column" varchar(5),
	"variables" jsonb NOT NULL,
	"operation" text NOT NULL,
	"result_unit" varchar(20),
	"division_factor" numeric(18, 4) DEFAULT 1,
	"coefficients" jsonb,
	"min_value" numeric(18, 4),
	"max_value" numeric(18, 4),
	"allow_empty" boolean DEFAULT true,
	"is_active" boolean DEFAULT true NOT NULL,
	"category" varchar(30),
	"source_type" varchar(30),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "formula_definitions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "machine_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_number" integer,
	"title" text NOT NULL,
	"title_ru" text,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"responsible_person" text,
	"responsible_user_id" integer,
	"due_date" varchar(10),
	"completed_date" varchar(10),
	"instructions" text,
	"instructions_ru" text,
	"equipment_id" varchar,
	"papka_order_id" varchar,
	"routing_operation_id" varchar,
	"work_center_id" varchar,
	"planned_quantity" numeric(18, 4),
	"completed_quantity" numeric(18, 4) DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"completion_percent" numeric(18, 4) DEFAULT 0,
	"excel_import_row_id" varchar,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "papka_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"papka_no" varchar(50) NOT NULL,
	"mijoz_nomi" text NOT NULL,
	"mahsulot_nomi" text NOT NULL,
	"mahsulot_turi" varchar(50),
	"tiraj" integer NOT NULL,
	"list_soni" integer,
	"qoshimcha_list" integer DEFAULT 0,
	"format_a" numeric(18, 4),
	"format_b" numeric(18, 4),
	"gofra_format_a" numeric(18, 4),
	"gofra_format_b" numeric(18, 4),
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"bolim" varchar(30),
	"sana" varchar(10),
	"plan_sana_ich" varchar(10),
	"tayyor_bolish_sanasi" varchar(10),
	"material_menejer" text,
	"material_taminot" text,
	"dizayner" text,
	"marketolog" text,
	"bom_id" varchar,
	"product_id" varchar,
	"routing_id" varchar,
	"material_requirements" jsonb,
	"stock_check_result" jsonb,
	"estimated_production_time" numeric(18, 4),
	"notes" text,
	"texnologik_karta" jsonb,
	"excel_source_batch_id" varchar,
	"sales_order_id" varchar(36),
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "papka_orders_papka_no_unique" UNIQUE("papka_no")
);
--> statement-breakpoint
CREATE TABLE "planning_operations" (
	"id" serial PRIMARY KEY NOT NULL,
	"papka_order_id" varchar NOT NULL,
	"operation_code" varchar(30) NOT NULL,
	"operation_name" text NOT NULL,
	"operation_name_ru" text,
	"sequence" integer NOT NULL,
	"equipment_id" varchar,
	"machine_code" varchar(30),
	"shift" varchar(10),
	"planned_date" varchar(10),
	"planned_start_time" varchar(5),
	"planned_end_time" varchar(5),
	"planned_duration_minutes" integer,
	"planned_quantity" integer,
	"planned_unit" varchar(20),
	"actual_start_time" varchar(5),
	"actual_end_time" varchar(5),
	"actual_quantity" integer,
	"actual_duration_minutes" integer,
	"status" varchar(20) DEFAULT 'planned' NOT NULL,
	"completion_percent" numeric(18, 4) DEFAULT 0,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_facts" (
	"id" serial PRIMARY KEY NOT NULL,
	"papka_order_id" varchar,
	"papka_no" varchar(50) NOT NULL,
	"planning_operation_id" varchar,
	"sana" varchar(10) NOT NULL,
	"buyurtma_nomi" text,
	"bajarilgan_list_soni" integer NOT NULL,
	"brak" integer DEFAULT 0,
	"izoh" text,
	"berilgan_bolim" varchar(50),
	"operator1" text,
	"operator2" text,
	"operator3" text,
	"operator4" text,
	"muammolar" text,
	"plan_quantity" integer,
	"variance" integer,
	"variance_percent" numeric(18, 4),
	"brak_percent" numeric(18, 4),
	"excel_import_row_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "downtime_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"event_type" varchar(20) NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"duration_seconds" integer,
	"reason_code" varchar(20) DEFAULT 'unknown' NOT NULL,
	"reason_description" text,
	"reason_description_ru" text,
	"reported_by" varchar,
	"is_planned" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "downtime_reason_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category" varchar(30) NOT NULL,
	"color" varchar(10) DEFAULT '#808080',
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "downtime_reason_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "oee_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" varchar NOT NULL,
	"snapshot_date" varchar(10) NOT NULL,
	"snapshot_hour" integer,
	"planned_production_time" integer,
	"actual_running_time" integer,
	"total_stopped_time" integer,
	"planned_downtime" integer,
	"unplanned_downtime" integer,
	"target_quantity" integer,
	"actual_quantity" integer,
	"defect_quantity" integer,
	"availability" numeric(18, 4),
	"performance" numeric(18, 4),
	"quality" numeric(18, 4),
	"oee" numeric(18, 4),
	"top_downtime_reasons" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_number" varchar(50) NOT NULL,
	"production_order_id" varchar NOT NULL,
	"equipment_id" varchar NOT NULL,
	"device_id" varchar,
	"worker_id" varchar NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"target_quantity" integer NOT NULL,
	"actual_quantity" integer DEFAULT 0 NOT NULL,
	"defect_quantity" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"last_signal_at" timestamp,
	"running_time_seconds" integer DEFAULT 0 NOT NULL,
	"stopped_time_seconds" integer DEFAULT 0 NOT NULL,
	"worker_notes" text,
	"availability" numeric(18, 4),
	"performance" numeric(18, 4),
	"quality" numeric(18, 4),
	"oee" numeric(18, 4),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "production_sessions_session_number_unique" UNIQUE("session_number")
);
--> statement-breakpoint
CREATE TABLE "sensor_devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"device_type" varchar(30) NOT NULL,
	"equipment_id" varchar,
	"work_center_id" varchar,
	"connection_type" varchar(20) DEFAULT 'http' NOT NULL,
	"ip_address" varchar(50),
	"port" integer,
	"auth_token" text,
	"signal_threshold_seconds" integer DEFAULT 10 NOT NULL,
	"pulse_per_unit" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_heartbeat" timestamp,
	"status" varchar(20) DEFAULT 'offline' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sensor_devices_device_code_unique" UNIQUE("device_code")
);
--> statement-breakpoint
CREATE TABLE "sensor_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" varchar NOT NULL,
	"pulse_count" integer DEFAULT 1 NOT NULL,
	"reading_time" timestamp DEFAULT now() NOT NULL,
	"session_id" varchar,
	"is_processed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_session_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"worker_id" varchar NOT NULL,
	"event_type" varchar(30) NOT NULL,
	"defect_quantity" integer,
	"defect_reason" text,
	"description" text,
	"description_ru" text,
	"attachment_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_number" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"brand_name" text,
	"category" varchar(50),
	"colors" jsonb DEFAULT '[]' NOT NULL,
	"fonts" jsonb DEFAULT '[]',
	"logo_url" text,
	"design_elements" jsonb,
	"style_guide" text,
	"base_prompt" text,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "brand_templates_template_number_unique" UNIQUE("template_number")
);
--> statement-breakpoint
CREATE TABLE "design_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"design_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"comment_text" text NOT NULL,
	"type" varchar(20) DEFAULT 'comment' NOT NULL,
	"attachment_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designOrderMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" varchar NOT NULL,
	"senderId" varchar NOT NULL,
	"senderName" varchar,
	"senderRole" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"attachments" text[],
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designOrderNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" varchar NOT NULL,
	"recipientId" varchar NOT NULL,
	"recipientRole" varchar(20),
	"notificationType" varchar(30) NOT NULL,
	"title" varchar NOT NULL,
	"body" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "design_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"deal_id" varchar,
	"papka_order_id" varchar,
	"client_name" text NOT NULL,
	"client_company" text,
	"client_phone" varchar(20),
	"client_email" varchar(100),
	"product_type" varchar(50) NOT NULL,
	"product_name" text NOT NULL,
	"brand_name" text,
	"quantity" integer DEFAULT 1000 NOT NULL,
	"description" text,
	"requirements" text,
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"priority" varchar(20) DEFAULT 'normal' NOT NULL,
	"deadline" varchar(10),
	"assigned_designer_id" varchar,
	"manager_id" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "design_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "design_tooling" (
	"id" serial PRIMARY KEY NOT NULL,
	"tooling_number" varchar(50) NOT NULL,
	"tooling_type" varchar(30) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"supplier" text,
	"location" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"max_usage_count" integer DEFAULT 100000 NOT NULL,
	"total_usage_count" integer DEFAULT 0 NOT NULL,
	"wear_percentage" numeric(5, 2) DEFAULT '0',
	"purchase_date" varchar(10),
	"purchase_cost" numeric(18, 2),
	"technical_specs" jsonb DEFAULT '{}',
	"last_maintenance_date" varchar(10),
	"next_maintenance_date" varchar(10),
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "design_tooling_tooling_number_unique" UNIQUE("tooling_number")
);
--> statement-breakpoint
CREATE TABLE "designs" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar NOT NULL,
	"design_number" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slogan" text,
	"image_url" text,
	"prompt_used" text,
	"template_id" varchar,
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"ai_model" varchar(50) DEFAULT 'gpt-5',
	"generation_time" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "designs_design_number_unique" UNIQUE("design_number")
);
--> statement-breakpoint
CREATE TABLE "ai_planning_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"config_key" varchar(50) NOT NULL,
	"config_value" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "ai_planning_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "ai_planning_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" varchar NOT NULL,
	"decision_type" varchar(30) NOT NULL,
	"description" text NOT NULL,
	"confidence_score" numeric(18, 4) DEFAULT 0,
	"impact" varchar(10) DEFAULT 'medium' NOT NULL,
	"status" varchar(20) DEFAULT 'proposed' NOT NULL,
	"executed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_production_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_number" varchar(20) NOT NULL,
	"plan_date" varchar(10) NOT NULL,
	"plan_type" varchar(20) DEFAULT 'daily' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"confidence_score" numeric(18, 4) DEFAULT 0 NOT NULL,
	"auto_approved" boolean DEFAULT false NOT NULL,
	"auto_approval_threshold" numeric(18, 4) DEFAULT 85,
	"total_orders" integer DEFAULT 0,
	"total_machine_hours" numeric(18, 4) DEFAULT 0,
	"estimated_completion" varchar(20),
	"plan_data" jsonb,
	"optimization_metrics" jsonb,
	"ai_recommendations" jsonb,
	"created_by" integer,
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "asset_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_code" varchar(50) NOT NULL,
	"asset_name" text NOT NULL,
	"asset_name_ru" text,
	"asset_type" varchar(30) NOT NULL,
	"location" text,
	"department_id" integer,
	"responsible_id" varchar,
	"purchase_date" varchar(10),
	"purchase_value" numeric(18, 4) NOT NULL,
	"current_value" numeric(18, 4) NOT NULL,
	"depreciation_method" varchar(20) DEFAULT 'straight_line',
	"useful_life" integer,
	"salvage_value" numeric(18, 4) DEFAULT 0,
	"accumulated_depreciation" numeric(18, 4) DEFAULT 0,
	"condition" varchar(20) DEFAULT 'good',
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_inventory_date" varchar(10),
	"serial_number" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "asset_inventory_asset_code_unique" UNIQUE("asset_code")
);
--> statement-breakpoint
CREATE TABLE "bom_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_type" varchar(50) NOT NULL,
	"material_category" varchar(50) NOT NULL,
	"material_name" text NOT NULL,
	"formula" text NOT NULL,
	"unit" varchar(20) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_id" varchar NOT NULL,
	"category" varchar(30) NOT NULL,
	"item_type" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT true,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"completed_by" varchar,
	"value" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "defect_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"order_id" varchar,
	"quantity" integer NOT NULL,
	"defect_type" varchar(50) NOT NULL,
	"defect_cause" varchar(50),
	"description" text,
	"image_url" text,
	"reported_by" varchar NOT NULL,
	"verified_by" varchar,
	"verified_at" timestamp,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "equipment_maintenance" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_name" varchar(255) NOT NULL,
	"equipment_code" varchar(50),
	"location" varchar(200),
	"maintenance_type" varchar(30) NOT NULL,
	"scheduled_date" varchar(20),
	"completed_date" varchar(20),
	"frequency" varchar(30),
	"last_maintenance_date" varchar(20),
	"next_maintenance_date" varchar(20),
	"assigned_to" integer,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"cost" numeric(18, 4) DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machine_crews" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"master_id" varchar NOT NULL,
	"polmaster_id" varchar,
	"shogird_id" varchar,
	"rokler_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_consumption" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"order_id" varchar NOT NULL,
	"kit_id" varchar,
	"material_id" varchar,
	"material_name" text NOT NULL,
	"issued_quantity" numeric(18, 4) NOT NULL,
	"consumed_quantity" numeric(18, 4) NOT NULL,
	"returned_quantity" numeric(18, 4) DEFAULT 0,
	"waste_quantity" numeric(18, 4) DEFAULT 0,
	"unit" varchar(20) NOT NULL,
	"calculated_by_ai" boolean DEFAULT false,
	"notes" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"recorded_by" varchar
);
--> statement-breakpoint
CREATE TABLE "material_norms" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar,
	"technology_card_id" varchar,
	"material_category_id" varchar,
	"material_id" varchar,
	"material_name" text NOT NULL,
	"norm_quantity_per_1000" numeric(18, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"waste_percentage" numeric(18, 4) DEFAULT 5,
	"safety_stock_percentage" numeric(18, 4) DEFAULT 10,
	"based_on_orders_count" integer DEFAULT 0,
	"average_actual_consumption" numeric(18, 4),
	"calculated_by_ai" boolean DEFAULT true,
	"formula" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "oee_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"machine_id" varchar NOT NULL,
	"date" varchar(10) NOT NULL,
	"shift_number" integer,
	"availability" numeric(18, 4) NOT NULL,
	"performance" numeric(18, 4) NOT NULL,
	"quality" numeric(18, 4) NOT NULL,
	"oee" numeric(18, 4) NOT NULL,
	"planned_production_time" numeric(18, 4) DEFAULT 0,
	"actual_run_time" numeric(18, 4) DEFAULT 0,
	"total_count" integer DEFAULT 0,
	"good_count" integer DEFAULT 0,
	"ideal_cycle_time" numeric(18, 4) DEFAULT 0,
	"downtime_minutes" numeric(18, 4) DEFAULT 0,
	"downtime_reasons" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar NOT NULL,
	"stage" varchar(30) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"stage_data" jsonb,
	"design_file_url" text,
	"design_version" varchar(20),
	"bom_approved" boolean,
	"routing_approved" boolean,
	"tech_card_approved" boolean,
	"qc_test_id" varchar,
	"material_approved" boolean,
	"advance_percentage" numeric(18, 4),
	"advance_amount" numeric(18, 4),
	"credit_limit_ok" boolean,
	"debt_status_ok" boolean,
	"comments" text,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_production_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar NOT NULL,
	"session_id" varchar,
	"equipment_id" varchar,
	"equipment_name" text,
	"master_id" varchar,
	"master_name" text,
	"polmaster_id" varchar,
	"polmaster_name" text,
	"shogird_id" varchar,
	"shogird_name" text,
	"roxlerchi_id" varchar,
	"roxlerchi_name" text,
	"planned_duration_minutes" integer,
	"actual_duration_minutes" integer,
	"setup_duration_minutes" integer,
	"downtime_minutes" integer,
	"planned_quantity" integer,
	"actual_quantity" integer,
	"defect_quantity" integer,
	"materials_plan" text,
	"materials_actual" text,
	"materials_variance" text,
	"total_material_cost" numeric(18, 4),
	"waste_analysis" text,
	"availability" numeric(18, 4),
	"performance" numeric(18, 4),
	"quality" numeric(18, 4),
	"oee" numeric(18, 4),
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"description_ru" text,
	"image_url" text,
	"parent_id" varchar,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_masters" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_code" varchar(50) NOT NULL,
	"product_name" text NOT NULL,
	"product_name_ru" text,
	"product_type" varchar(30) NOT NULL,
	"category_code" varchar(50),
	"unit_of_measure_id" varchar,
	"default_warehouse_id" varchar,
	"minimum_stock" numeric(18, 4) DEFAULT 0,
	"maximum_stock" numeric(18, 4),
	"reorder_point" numeric(18, 4),
	"reorder_quantity" numeric(18, 4),
	"standard_cost" numeric(18, 4),
	"list_price" numeric(18, 4),
	"currency" varchar(10) DEFAULT 'UZS',
	"lead_time_days" integer DEFAULT 0,
	"shelf_life_days" integer,
	"is_batch_managed" boolean DEFAULT false,
	"is_serial_managed" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "product_masters_product_code_unique" UNIQUE("product_code")
);
--> statement-breakpoint
CREATE TABLE "setup_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"kit_id" varchar,
	"order_id" varchar,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"completed_by" varchar,
	"all_materials_scanned" boolean DEFAULT false,
	"all_settings_confirmed" boolean DEFAULT false,
	"all_crew_assigned" boolean DEFAULT false,
	"test_piece_approved" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sos_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"worker_id" varchar NOT NULL,
	"worker_name" varchar(255) NOT NULL,
	"session_id" varchar,
	"equipment_id" varchar,
	"alert_type" varchar(50) DEFAULT 'other' NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technology_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" varchar,
	"papka_order_id" varchar,
	"product_type" varchar(50),
	"format_a" integer,
	"format_b" integer,
	"operations" text,
	"total_duration_minutes" integer,
	"setup_duration_minutes" integer,
	"based_on_orders_count" integer DEFAULT 0,
	"average_actual_duration" integer,
	"calculated_by_ai" boolean DEFAULT true,
	"ai_model" varchar(50),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" varchar
);
--> statement-breakpoint
CREATE TABLE "waste_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"production_order_id" varchar,
	"order_id" varchar,
	"machine_id" varchar,
	"operator_id" varchar,
	"waste_type" varchar(30) NOT NULL,
	"material_type" varchar(50),
	"quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(20) DEFAULT 'kg' NOT NULL,
	"cost_per_unit" numeric(18, 4) DEFAULT 0,
	"total_cost" numeric(18, 4) DEFAULT 0,
	"cause" text,
	"correction_action" text,
	"shift_number" integer,
	"date" varchar(10) NOT NULL,
	"notes" text,
	"is_recyclable" boolean DEFAULT false,
	"recycled_quantity" numeric(18, 4) DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waste_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"machine_id" varchar,
	"material_type" varchar(50),
	"max_waste_percentage" numeric(18, 4) NOT NULL,
	"max_waste_cost" numeric(18, 4),
	"period" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inline_qc_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar NOT NULL,
	"sample_size" integer DEFAULT 10 NOT NULL,
	"defect_count" integer DEFAULT 0 NOT NULL,
	"pass_rate" integer DEFAULT 100 NOT NULL,
	"notes" text,
	"checked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_braks" (
	"id" serial PRIMARY KEY NOT NULL,
	"papka_order_id" varchar,
	"brak_date" varchar(10) NOT NULL,
	"stage" varchar(50) NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"unit" varchar(20) DEFAULT 'dona',
	"reason" varchar(100) NOT NULL,
	"description" text,
	"equipment_id" varchar,
	"operator_id" varchar,
	"cost_impact" numeric(18, 4) DEFAULT 0,
	"is_reworkable" boolean DEFAULT false,
	"reworked" boolean DEFAULT false,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_final_inspections" (
	"id" serial PRIMARY KEY NOT NULL,
	"papka_order_id" varchar NOT NULL,
	"inspected_by" varchar,
	"inspected_at" timestamp DEFAULT now() NOT NULL,
	"sample_size" integer DEFAULT 10 NOT NULL,
	"passed_count" integer DEFAULT 0 NOT NULL,
	"defect_count" integer DEFAULT 0 NOT NULL,
	"defect_rate" numeric(18, 4),
	"parameters" jsonb,
	"result" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"photos" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_material_tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar,
	"material_card_id" varchar,
	"batch_number" varchar(50),
	"test_category" varchar(50) DEFAULT 'physical' NOT NULL,
	"test_date" varchar(10) NOT NULL,
	"tested_by" varchar,
	"equipment_used" text,
	"test_results" jsonb NOT NULL,
	"overall_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"passed_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"warning_count" integer DEFAULT 0,
	"ai_analysis" jsonb,
	"ai_confidence_score" numeric(18, 4),
	"notes" text,
	"certificate_number" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "qc_parameter_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"category" varchar(50) NOT NULL,
	"unit" varchar(30),
	"data_type" varchar(20) DEFAULT 'number' NOT NULL,
	"min_value" numeric(18, 4),
	"max_value" numeric(18, 4),
	"warning_min_value" numeric(18, 4),
	"warning_max_value" numeric(18, 4),
	"default_value" numeric(18, 4),
	"standard_id" varchar,
	"test_method" text,
	"test_method_ru" text,
	"equipment_required" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qc_parameter_definitions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "qc_reclamations" (
	"id" serial PRIMARY KEY NOT NULL,
	"reclamation_number" varchar(30) NOT NULL,
	"papka_order_id" varchar,
	"client_id" varchar,
	"client_name" text NOT NULL,
	"claim_date" varchar(10) NOT NULL,
	"issue_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"defect_quantity" integer DEFAULT 0,
	"defect_unit" varchar(20) DEFAULT 'dona',
	"photos" jsonb,
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"responsible_user_id" integer,
	"resolution" text,
	"resolved_at" timestamp,
	"deadline_days" integer DEFAULT 5,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qc_reclamations_reclamation_number_unique" UNIQUE("reclamation_number")
);
--> statement-breakpoint
CREATE TABLE "qc_root_causes" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(30) NOT NULL,
	"entity_id" varchar NOT NULL,
	"papka_order_id" varchar,
	"why1" text,
	"why2" text,
	"why3" text,
	"why4" text,
	"why5" text,
	"root_cause" text,
	"category" varchar(50),
	"corrective_action" text,
	"preventive_action" text,
	"responsible_user_id" integer,
	"due_date" varchar(10),
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"closed_at" timestamp,
	"closed_by" varchar,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_standards" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"type" varchar(30) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"description_ru" text,
	"valid_from" varchar(10),
	"valid_to" varchar(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"document_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "qc_standards_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "qc_supplier_quality" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" varchar,
	"supplier_name" text NOT NULL,
	"material_card_id" varchar,
	"delivery_date" varchar(10) NOT NULL,
	"total_quantity" integer DEFAULT 0 NOT NULL,
	"rejected_quantity" integer DEFAULT 0,
	"pass_rate" numeric(18, 4) DEFAULT 100,
	"quality_score" integer DEFAULT 100,
	"test_id" varchar,
	"issues" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saas_tenant_api_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar,
	"date" varchar(10) NOT NULL,
	"api_calls" integer DEFAULT 0 NOT NULL,
	"storage_used_mb" integer DEFAULT 0,
	"active_users" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saas_tenant_error_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar,
	"level" varchar(10) DEFAULT 'error' NOT NULL,
	"module" varchar(50),
	"message" text NOT NULL,
	"stack" text,
	"user_id" varchar(100),
	"request_path" varchar(255),
	"request_method" varchar(10),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saas_tenant_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar NOT NULL,
	"module_key" varchar(50) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"enabled_at" timestamp DEFAULT now() NOT NULL,
	"disabled_at" timestamp,
	"enabled_by" varchar(100),
	"config" jsonb
);
--> statement-breakpoint
CREATE TABLE "saas_tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"domain" varchar(100) NOT NULL,
	"plan" varchar(30) DEFAULT 'basic' NOT NULL,
	"status" varchar(20) DEFAULT 'trial' NOT NULL,
	"users_count" integer DEFAULT 0 NOT NULL,
	"users_limit" integer DEFAULT 10 NOT NULL,
	"modules_enabled" jsonb DEFAULT '["crm","sd"]'::jsonb NOT NULL,
	"expires_at" varchar(10),
	"contact_email" varchar(100),
	"contact_phone" varchar(30),
	"contact_name" varchar(200),
	"country" varchar(50) DEFAULT 'UZ',
	"city" varchar(100),
	"industry" varchar(100),
	"notes" text,
	"monthly_fee" numeric(18, 4) DEFAULT 0,
	"currency" varchar(10) DEFAULT 'USD',
	"last_payment_at" varchar(10),
	"next_payment_at" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "saas_tenants_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "sd_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" varchar NOT NULL,
	"name" text NOT NULL,
	"position" varchar(100),
	"phone" varchar(30),
	"email" varchar(100),
	"telegram" varchar(100),
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar NOT NULL,
	"contract_number" varchar(30) NOT NULL,
	"template_type" varchar(30) DEFAULT 'standard',
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"signed_at" timestamp,
	"signed_ip" varchar(50),
	"pdf_url" text,
	"valid_until" varchar(10),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sd_contracts_contract_number_unique" UNIQUE("contract_number")
);
--> statement-breakpoint
CREATE TABLE "sd_customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stir" varchar(20),
	"legal_address" text,
	"actual_address" text,
	"segment" varchar(20) DEFAULT 'new' NOT NULL,
	"manager_id" varchar,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"block_reason" text,
	"credit_limit" numeric(18, 4) DEFAULT 0,
	"open_debt" numeric(18, 4) DEFAULT 0,
	"total_orders" integer DEFAULT 0,
	"total_revenue" numeric(18, 4) DEFAULT 0,
	"last_order_date" varchar(10),
	"notes" text,
	"crm_company_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_lead_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" varchar NOT NULL,
	"type" varchar(30) NOT NULL,
	"note" text,
	"manager_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(50) DEFAULT 'other' NOT NULL,
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"customer_id" varchar,
	"contact_name" text,
	"contact_phone" varchar(30),
	"manager_id" varchar,
	"product_interest" text,
	"estimated_volume" numeric(18, 4),
	"estimated_value" numeric(18, 4),
	"lost_reason" text,
	"next_contact_date" varchar(10),
	"converted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_manager_quotas" (
	"id" serial PRIMARY KEY NOT NULL,
	"manager_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"quota_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"achieved_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_order_timeline" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar NOT NULL,
	"status" varchar(30) NOT NULL,
	"note" text,
	"changed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(30) NOT NULL,
	"quotation_id" varchar,
	"customer_id" varchar NOT NULL,
	"manager_id" varchar,
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"total_amount" numeric(18, 4) NOT NULL,
	"advance_percent" numeric(18, 4) DEFAULT 70 NOT NULL,
	"advance_paid" numeric(18, 4) DEFAULT 0 NOT NULL,
	"balance_due" numeric(18, 4) DEFAULT 0 NOT NULL,
	"delivery_date" varchar(10),
	"delivery_address" text,
	"delivery_type" varchar(20) DEFAULT 'own',
	"receiver_name" text,
	"receiver_phone" varchar(30),
	"special_instructions" text,
	"cancel_reason" text,
	"cancelled_at" timestamp,
	"delivered_at" timestamp,
	"warehouse_entry_date" timestamp,
	"production_order_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sd_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "sd_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar NOT NULL,
	"customer_id" varchar NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"due_date" varchar(10),
	"paid_date" varchar(10),
	"payment_method" varchar(30),
	"overdue_days" integer DEFAULT 0,
	"notes" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_price_formulas" (
	"id" serial PRIMARY KEY NOT NULL,
	"paper_b_price" numeric(18, 4) DEFAULT 4200 NOT NULL,
	"paper_c_price" numeric(18, 4) DEFAULT 4500 NOT NULL,
	"paper_bc_price" numeric(18, 4) DEFAULT 5200 NOT NULL,
	"paper_e_price" numeric(18, 4) DEFAULT 3900 NOT NULL,
	"print_1color_price" numeric(18, 4) DEFAULT 15000 NOT NULL,
	"print_2color_price" numeric(18, 4) DEFAULT 22000 NOT NULL,
	"print_4color_price" numeric(18, 4) DEFAULT 38000 NOT NULL,
	"lamination_price" numeric(18, 4) DEFAULT 3500 NOT NULL,
	"embossing_price" numeric(18, 4) DEFAULT 2800 NOT NULL,
	"perforation_price" numeric(18, 4) DEFAULT 1200 NOT NULL,
	"plate_cost_per_color" numeric(18, 4) DEFAULT 250000 NOT NULL,
	"die_cost_new" numeric(18, 4) DEFAULT 1800000 NOT NULL,
	"die_cost_existing" numeric(18, 4) DEFAULT 0 NOT NULL,
	"hourly_labor_rate" numeric(18, 4) DEFAULT 25000 NOT NULL,
	"delivery_base_cost" numeric(18, 4) DEFAULT 50000 NOT NULL,
	"storage_daily_rate" numeric(18, 4) DEFAULT 2500 NOT NULL,
	"storage_freedays" integer DEFAULT 8 NOT NULL,
	"default_markup_percent" numeric(18, 4) DEFAULT 35 NOT NULL,
	"vat_rate" numeric(18, 4) DEFAULT 12 NOT NULL,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_quotation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_id" varchar NOT NULL,
	"product_type" varchar(50) DEFAULT 'box' NOT NULL,
	"paper_type" varchar(50),
	"thickness_mm" numeric(18, 4),
	"length_mm" numeric(18, 4),
	"width_mm" numeric(18, 4),
	"height_mm" numeric(18, 4),
	"print_colors" integer DEFAULT 0,
	"lamination" boolean DEFAULT false,
	"perforation" boolean DEFAULT false,
	"special_coating" boolean DEFAULT false,
	"is_new_die" boolean DEFAULT false,
	"quantity" integer NOT NULL,
	"unit_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"cost_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"paper_cost" numeric(18, 4) DEFAULT 0,
	"production_cost" numeric(18, 4) DEFAULT 0,
	"print_cost" numeric(18, 4) DEFAULT 0,
	"delivery_cost" numeric(18, 4) DEFAULT 0,
	"die_cost" numeric(18, 4) DEFAULT 0,
	"setup_time_minutes" integer DEFAULT 15,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sd_quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_number" varchar(30) NOT NULL,
	"lead_id" varchar,
	"customer_id" varchar,
	"manager_id" varchar,
	"total_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"cost_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"margin" numeric(18, 4) DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"valid_until" varchar(10),
	"payment_terms" text,
	"notes" text,
	"sent_at" timestamp,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sd_quotations_quotation_number_unique" UNIQUE("quotation_number")
);
--> statement-breakpoint
CREATE TABLE "sd_storage_fees" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10),
	"area_m2" numeric(18, 4) DEFAULT 1 NOT NULL,
	"days" integer DEFAULT 0 NOT NULL,
	"free_days" integer DEFAULT 8 NOT NULL,
	"daily_rate" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"billed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"billing_number" varchar(50) NOT NULL,
	"billing_type" varchar(10) DEFAULT 'F2' NOT NULL,
	"billing_date" varchar(10) NOT NULL,
	"sales_order_id" varchar,
	"delivery_id" varchar,
	"customer_id" integer,
	"net_value" numeric(18, 4) NOT NULL,
	"tax_amount" numeric(18, 4) NOT NULL,
	"total_value" numeric(18, 4) NOT NULL,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"payment_terms" varchar(10) DEFAULT '0014',
	"accounting_document" varchar(50),
	"fiscal_year" integer,
	"billing_status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL,
	"cancelled_by" varchar,
	"cancellation_of" varchar,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "billing_documents_billing_number_unique" UNIQUE("billing_number")
);
--> statement-breakpoint
CREATE TABLE "billing_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"billing_document_id" varchar NOT NULL,
	"item_number" varchar(10) NOT NULL,
	"sales_order_item_id" varchar,
	"delivery_item_id" varchar,
	"material_id" varchar,
	"billed_quantity" numeric(18, 4) NOT NULL,
	"net_price" numeric(18, 4) NOT NULL,
	"tax_code" varchar(10) DEFAULT 'V1' NOT NULL,
	"tax_amount" numeric(18, 4) NOT NULL,
	"total_price" numeric(18, 4) NOT NULL,
	"revenue_account" varchar(20) DEFAULT '400000',
	"cost_center" varchar(20),
	"profit_center" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"year" integer NOT NULL,
	"month" integer,
	"quarter" integer,
	"basis_amount" numeric(18, 4) NOT NULL,
	"base_commission" numeric(18, 4) NOT NULL,
	"bonuses" numeric(18, 4) DEFAULT 0,
	"adjustments" numeric(18, 4) DEFAULT 0,
	"total_commission" numeric(18, 4) NOT NULL,
	"commission_details" jsonb,
	"status" varchar(20) DEFAULT 'calculated',
	"approved_by" varchar,
	"approved_at" timestamp,
	"paid_at" timestamp,
	"calculated_at" timestamp DEFAULT now(),
	"calculated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "commission_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"applicable_to" varchar(50) DEFAULT 'all',
	"user_ids" jsonb,
	"team_ids" jsonb,
	"basis_type" varchar(50) NOT NULL,
	"tiers" jsonb,
	"target_achievement_bonus" jsonb,
	"product_multipliers" jsonb,
	"payment_frequency" varchar(20) DEFAULT 'monthly',
	"is_active" boolean DEFAULT true,
	"valid_from" varchar(10) NOT NULL,
	"valid_to" varchar(10),
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_check_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"sales_order_id" varchar,
	"order_amount" numeric(18, 4) NOT NULL,
	"current_balance" numeric(18, 4),
	"credit_limit" numeric(18, 4),
	"check_result" varchar(20) NOT NULL,
	"rejection_reason" text,
	"checked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_credit_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"credit_limit" numeric(18, 4) NOT NULL,
	"temporary_credit_limit" numeric(18, 4),
	"temporary_limit_valid_until" varchar(10),
	"current_balance" numeric(18, 4) DEFAULT 0,
	"available_credit" numeric(18, 4) NOT NULL,
	"payment_terms_days" integer DEFAULT 30,
	"risk_rating" varchar(20) DEFAULT 'medium',
	"blocked_for_credit" boolean DEFAULT false,
	"block_reason" text,
	"last_review_date" varchar(10),
	"next_review_date" varchar(10),
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "customer_credit_limits_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "daily_target_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_target_id" varchar,
	"date" varchar(10) NOT NULL,
	"daily_revenue" numeric(18, 4) DEFAULT 0,
	"daily_order_count" integer DEFAULT 0,
	"daily_new_customers" integer DEFAULT 0,
	"cumulative_revenue" numeric(18, 4) DEFAULT 0,
	"cumulative_order_count" integer DEFAULT 0,
	"calculated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"delivery_number" varchar(50) NOT NULL,
	"delivery_type" varchar(10) DEFAULT 'LF' NOT NULL,
	"shipping_point" varchar(10) DEFAULT 'SP01' NOT NULL,
	"loading_point" varchar(10) DEFAULT 'LP01' NOT NULL,
	"sales_order_id" varchar,
	"customer_id" integer,
	"planned_goods_movement_date" varchar(10),
	"actual_goods_movement_date" varchar(10),
	"delivery_status" varchar(20) DEFAULT 'PICKING' NOT NULL,
	"total_weight" numeric(18, 4),
	"total_volume" numeric(18, 4),
	"number_of_packages" integer,
	"driver_name" varchar(100),
	"vehicle_number" varchar(20),
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "deliveries_delivery_number_unique" UNIQUE("delivery_number")
);
--> statement-breakpoint
CREATE TABLE "delivery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"delivery_id" varchar NOT NULL,
	"item_number" varchar(10) NOT NULL,
	"sales_order_item_id" varchar,
	"material_id" varchar,
	"delivery_quantity" numeric(18, 4) NOT NULL,
	"picked_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"plant" varchar(10) DEFAULT 'P001' NOT NULL,
	"storage_location" varchar(10) DEFAULT 'SL02' NOT NULL,
	"batch" varchar(50),
	"picking_status" varchar(20) DEFAULT 'NOT_PICKED' NOT NULL,
	"goods_issue_status" varchar(20) DEFAULT 'NOT_ISSUED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_order_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"order_amount" numeric(18, 4) NOT NULL,
	"commission_rate" numeric(18, 4) NOT NULL,
	"commission_amount" numeric(18, 4) NOT NULL,
	"calculation_id" varchar,
	"calculated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_status_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_order_id" varchar NOT NULL,
	"from_status" varchar(50),
	"to_status" varchar(50) NOT NULL,
	"changed_by" varchar,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"reason" varchar(200),
	"notes" text,
	"triggered_by" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" serial PRIMARY KEY NOT NULL,
	"quotation_number" varchar(50) NOT NULL,
	"customer_id" integer,
	"customer_name" text NOT NULL,
	"quotation_date" varchar(10) NOT NULL,
	"valid_until" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"net_value" numeric(18, 4) DEFAULT 0 NOT NULL,
	"tax_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_value" numeric(18, 4) DEFAULT 0 NOT NULL,
	"payment_terms" varchar(50),
	"notes" text,
	"markup_percent" numeric(18, 4) DEFAULT 35,
	"vat_rate" numeric(18, 4) DEFAULT 12,
	"manager_id" varchar,
	"converted_to_order_id" varchar,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "quotations_quotation_number_unique" UNIQUE("quotation_number")
);
--> statement-breakpoint
CREATE TABLE "sales_forecasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"forecast_period" varchar(20) NOT NULL,
	"forecasted_revenue" numeric(18, 4) NOT NULL,
	"forecasted_order_count" integer,
	"forecasted_new_customers" integer,
	"confidence_level" numeric(18, 4),
	"forecast_method" varchar(50) NOT NULL,
	"pipeline_total" numeric(18, 4),
	"weighted_pipeline" numeric(18, 4),
	"actual_revenue" numeric(18, 4),
	"actual_order_count" integer,
	"accuracy" numeric(18, 4),
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"invoice_date" varchar(10) NOT NULL,
	"customer_name" text NOT NULL,
	"customer_id" integer,
	"order_id" varchar,
	"net_value" numeric(18, 4) DEFAULT 0 NOT NULL,
	"tax_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_amount" numeric(18, 4) NOT NULL,
	"paid_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"payment_status" varchar(20) DEFAULT 'unpaid' NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"gl_document_id" varchar,
	"due_date" varchar(10),
	"notes" text,
	"created_by" integer,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "sales_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sales_order_id" varchar NOT NULL,
	"item_number" varchar(10) NOT NULL,
	"material_id" varchar,
	"material_number" varchar(50),
	"description" text NOT NULL,
	"order_quantity" numeric(18, 4) NOT NULL,
	"delivered_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"open_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"unit" varchar(10) DEFAULT 'PC' NOT NULL,
	"net_price" numeric(18, 4) NOT NULL,
	"tax_code" varchar(10) DEFAULT 'V1' NOT NULL,
	"tax_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_price" numeric(18, 4) DEFAULT 0 NOT NULL,
	"plant" varchar(10) DEFAULT 'P001' NOT NULL,
	"storage_location" varchar(10) DEFAULT 'SL02' NOT NULL,
	"delivery_date" varchar(10),
	"confirmed_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"delivery_status" varchar(20) DEFAULT 'NOT_DELIVERED' NOT NULL,
	"billing_status" varchar(20) DEFAULT 'NOT_BILLED' NOT NULL,
	"production_order_id" varchar,
	"delivery_item_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_number" varchar(50) NOT NULL,
	"document_type" varchar(10) DEFAULT 'OR' NOT NULL,
	"sales_org" varchar(10) DEFAULT 'EURO' NOT NULL,
	"distribution_channel" varchar(10) DEFAULT '10' NOT NULL,
	"division" varchar(10) DEFAULT '00' NOT NULL,
	"customer_id" integer,
	"sold_to_party" varchar(50),
	"ship_to_party" varchar(50),
	"bill_to_party" varchar(50),
	"order_date" varchar(10) NOT NULL,
	"requested_delivery_date" varchar(10),
	"pricing_date" varchar(10) NOT NULL,
	"currency" varchar(3) DEFAULT 'UZS' NOT NULL,
	"payment_terms" varchar(10) DEFAULT '0014',
	"overall_status" varchar(20) DEFAULT 'IN_PROCESS' NOT NULL,
	"delivery_status" varchar(20) DEFAULT 'NOT_DELIVERED' NOT NULL,
	"billing_status" varchar(20) DEFAULT 'NOT_BILLED' NOT NULL,
	"net_value" numeric(18, 4) DEFAULT 0 NOT NULL,
	"tax_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_value" numeric(18, 4) DEFAULT 0 NOT NULL,
	"quotation_id" varchar,
	"crm_deal_id" varchar,
	"advance_percent" numeric(18, 4) DEFAULT 70,
	"advance_paid_amount" numeric(18, 4) DEFAULT 0,
	"balance_due_amount" numeric(18, 4) DEFAULT 0,
	"advance_due_date" varchar(10),
	"balance_due_date" varchar(10),
	"module_status" varchar(30) DEFAULT 'sales',
	"master_status" varchar(50) DEFAULT 'draft' NOT NULL,
	"design_flag" boolean DEFAULT false NOT NULL,
	"sample_flag" boolean DEFAULT false NOT NULL,
	"is_vip" boolean DEFAULT false NOT NULL,
	"advance_required_percent" numeric(18, 4) DEFAULT 70 NOT NULL,
	"advance_status" varchar(30) DEFAULT 'no_advance' NOT NULL,
	"pp_queued_at" timestamp,
	"pp_released_at" timestamp,
	"fg_warehouse_entry_at" timestamp,
	"storage_free_days" integer DEFAULT 8 NOT NULL,
	"storage_tariff_per_m2" numeric(18, 4) DEFAULT 500 NOT NULL,
	"storage_total_m2" numeric(18, 4) DEFAULT 0,
	"storage_accrued_amount" numeric(18, 4) DEFAULT 0,
	"storage_days" integer DEFAULT 0,
	"tech_bom_approved" boolean DEFAULT false NOT NULL,
	"tech_routing_approved" boolean DEFAULT false NOT NULL,
	"tech_card_approved" boolean DEFAULT false NOT NULL,
	"tech_approved_by" varchar,
	"tech_approved_at" timestamp,
	"tech_notes" text,
	"created_by" varchar,
	"changed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "sales_orders_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "sales_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"target_type" varchar(20) NOT NULL,
	"user_id" integer,
	"team_id" varchar,
	"year" integer NOT NULL,
	"month" integer,
	"quarter" integer,
	"revenue_target" numeric(18, 4),
	"order_count_target" integer,
	"new_customer_target" integer,
	"product_targets" jsonb,
	"actual_revenue" numeric(18, 4) DEFAULT 0,
	"actual_order_count" integer DEFAULT 0,
	"actual_new_customers" integer DEFAULT 0,
	"revenue_achievement" numeric(18, 4) DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_matrix_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"min_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"max_amount" numeric(18, 4),
	"approval_level" integer DEFAULT 1 NOT NULL,
	"approver_role" varchar(50) NOT NULL,
	"approver_id" varchar,
	"department_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_queue_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"queue" varchar(100) NOT NULL,
	"data" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"result" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "multi_level_approval_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" varchar NOT NULL,
	"level" integer NOT NULL,
	"action" varchar(20) NOT NULL,
	"approver_id" varchar NOT NULL,
	"approver_role" varchar(50),
	"comments" text,
	"action_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ppe_violations" (
	"id" serial PRIMARY KEY NOT NULL,
	"camera_id" varchar(100) NOT NULL,
	"camera_name" varchar(200),
	"location" varchar(200),
	"employee_id" varchar(100),
	"employee_name" varchar(200) DEFAULT 'Noma''lum xodim',
	"violation_type" varchar(50) NOT NULL,
	"label" varchar(200),
	"confidence" numeric(18, 4) DEFAULT 0.8,
	"image_url" text,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar(100) DEFAULT 'default' NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(20) DEFAULT 'medium' NOT NULL,
	"location" varchar(200) NOT NULL,
	"reported_by" varchar(200) NOT NULL,
	"assigned_to" varchar(200),
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"resolved_by" varchar(200),
	"resolved_at" timestamp,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_ppe_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_name" varchar(200) NOT NULL,
	"department" varchar(100) NOT NULL,
	"helmet_ok" boolean DEFAULT true NOT NULL,
	"vest_ok" boolean DEFAULT true NOT NULL,
	"gloves_ok" boolean DEFAULT true NOT NULL,
	"boots_ok" boolean DEFAULT true NOT NULL,
	"notes" text,
	"checked_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_error_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"path" varchar(500) NOT NULL,
	"method" varchar(10) DEFAULT 'GET' NOT NULL,
	"message" text NOT NULL,
	"status_code" integer NOT NULL,
	"stack" text,
	"user_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"company" varchar(200) DEFAULT '' NOT NULL,
	"purpose" varchar(500) NOT NULL,
	"host_employee_name" varchar(200) NOT NULL,
	"entered_at" timestamp DEFAULT now() NOT NULL,
	"exited_at" timestamp,
	"badge_number" varchar(50),
	"status" varchar(20) DEFAULT 'inside' NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_crises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ru" varchar(100),
	"description" text,
	"description_ru" text,
	"symptoms" text[],
	"solutions" text[],
	"prevention_tips" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"stage_number" integer,
	"name" varchar(100) NOT NULL,
	"name_ru" varchar(100),
	"description" text,
	"description_ru" text,
	"typical_employee_count" varchar(50),
	"typical_revenue_range" varchar(100),
	"key_challenges" text[],
	"success_factors" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_functions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_ru" varchar(100),
	"description" text,
	"description_ru" text,
	"icon" varchar(50),
	"color" varchar(20),
	"order_index" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_health_assessment" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_date" date NOT NULL,
	"current_stage_id" varchar,
	"employee_count" integer,
	"monthly_revenue" numeric(15, 2),
	"identified_crises" text[],
	"ai_recommendations" jsonb,
	"overall_health_score" integer,
	"assessed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "function_kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"function_id" varchar NOT NULL,
	"kpi_name" varchar(200) NOT NULL,
	"kpi_name_ru" varchar(200),
	"description" text,
	"measurement_unit" varchar(50),
	"target_value" numeric(10, 2),
	"current_value" numeric(10, 2),
	"calculation_formula" text,
	"update_frequency" varchar(50) DEFAULT 'monthly',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_chart_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar(200),
	"ceo_user_id" varchar,
	"chart_style" varchar(50) DEFAULT 'hierarchical',
	"show_photos" boolean DEFAULT true,
	"show_contact_info" boolean DEFAULT false,
	"color_by" varchar(50) DEFAULT 'department',
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_chart_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_date" date NOT NULL,
	"chart_data" jsonb NOT NULL,
	"employee_count" integer,
	"department_count" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raci_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(20) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raci_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_name" varchar(200) NOT NULL,
	"task_name_ru" varchar(200),
	"description" text,
	"category" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategic_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"code" varchar(50) NOT NULL,
	"description" text,
	"color" varchar(20) DEFAULT '#3B82F6',
	"icon" varchar(50),
	"parent_id" varchar,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "strategic_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "strategic_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" varchar NOT NULL,
	"title" text NOT NULL,
	"title_ru" text,
	"target_date" varchar(10),
	"completed_date" varchar(10),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategic_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_number" integer NOT NULL,
	"category_id" varchar,
	"title" text NOT NULL,
	"title_ru" text,
	"description" text,
	"description_ru" text,
	"priority" varchar(20) DEFAULT 'medium' NOT NULL,
	"status" varchar(30) DEFAULT 'planned' NOT NULL,
	"phase" varchar(30),
	"target_module" varchar(50),
	"assigned_department_id" varchar,
	"assigned_user_id" varchar,
	"start_date" varchar(10),
	"target_date" varchar(10),
	"completed_date" varchar(10),
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"estimated_hours" numeric(18, 4),
	"actual_hours" numeric(18, 4),
	"kpi_impact" text,
	"ai_recommendation" text,
	"ai_priority" numeric(18, 4),
	"dependencies" jsonb,
	"tags" jsonb,
	"notes" text,
	"is_automatable" boolean DEFAULT false,
	"automation_level" varchar(20),
	"industry_adaptable" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_blacklist" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" varchar,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "barcode_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"barcode_id" varchar NOT NULL,
	"movement_type" varchar(30) NOT NULL,
	"from_location" varchar(100),
	"to_location" varchar(100),
	"from_bin_id" varchar,
	"to_bin_id" varchar,
	"quantity" numeric(18, 4) NOT NULL,
	"uom" varchar(20) NOT NULL,
	"reference_type" varchar(50),
	"reference_id" varchar(100),
	"production_order_id" varchar,
	"moved_by" varchar NOT NULL,
	"scanned" boolean DEFAULT true,
	"scan_device" varchar(50),
	"gl_posted" boolean DEFAULT false,
	"gl_journal_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "barcode_print_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"barcode_id" varchar,
	"barcode_data" text NOT NULL,
	"printer_name" varchar(100),
	"template_name" varchar(100),
	"copies" integer DEFAULT 1,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"label_type" varchar(30),
	"printed_at" timestamp,
	"error_message" text,
	"requested_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cycle_count_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" varchar,
	"barcode_id" varchar,
	"material_card_id" varchar,
	"bin_id" varchar,
	"warehouse_id" varchar,
	"system_quantity" numeric(18, 4) NOT NULL,
	"counted_quantity" numeric(18, 4) NOT NULL,
	"variance" numeric(18, 4) NOT NULL,
	"variance_percent" numeric(18, 4) NOT NULL,
	"adjustment_action" varchar(20),
	"adjustment_approved_by" varchar,
	"adjustment_approved_at" timestamp,
	"gl_posted" boolean DEFAULT false,
	"counted_by" varchar NOT NULL,
	"counted_at" timestamp DEFAULT now(),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_warehouse_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_date" varchar(10) NOT NULL,
	"total_orders" integer DEFAULT 0,
	"total_kits" integer DEFAULT 0,
	"prepared_kits" integer DEFAULT 0,
	"delivered_kits" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"prepared_by" varchar,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"person_id" varchar,
	"person_name" varchar(200),
	"ai_detected_object" boolean DEFAULT false,
	"object_type" varchar(50),
	"object_size" varchar(20),
	"ai_confidence" numeric(18, 4),
	"barcode_scanned" varchar(100),
	"barcode_valid" boolean,
	"authorized" boolean,
	"authorization_type" varchar(50),
	"approved_by" varchar,
	"photo_path" text,
	"video_path" text,
	"exit_allowed" boolean,
	"exit_time" timestamp DEFAULT now(),
	"alert_level" varchar(20) DEFAULT 'NONE',
	"security_notified" boolean DEFAULT false,
	"gate_id" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internal_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "internal_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"request_no" varchar(50) NOT NULL,
	"request_type" varchar(30) DEFAULT 'material' NOT NULL,
	"requester_id" varchar,
	"requester_name" varchar(255),
	"department_id" integer,
	"material_id" varchar(100),
	"material_name" varchar(255) NOT NULL,
	"quantity" numeric(18, 4) DEFAULT 1 NOT NULL,
	"unit" varchar(20) DEFAULT 'dona' NOT NULL,
	"urgency" varchar(20) DEFAULT 'normal' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"approved_by_id" varchar,
	"approved_at" timestamp,
	"issued_at" timestamp,
	"telegram_message_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "internal_requests_request_no_unique" UNIQUE("request_no")
);
--> statement-breakpoint
CREATE TABLE "inventory_valuation" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" varchar NOT NULL,
	"material_id" varchar NOT NULL,
	"material_name" varchar(255),
	"valuation_method" varchar(20) DEFAULT 'MOVING_AVG' NOT NULL,
	"current_stock" numeric(18, 4) DEFAULT 0 NOT NULL,
	"unit_cost" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_value" numeric(18, 4) DEFAULT 0 NOT NULL,
	"currency" varchar(5) DEFAULT 'UZS' NOT NULL,
	"last_movement_date" timestamp,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "picking_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_number" varchar(50) NOT NULL,
	"task_type" varchar(20) DEFAULT 'PICK' NOT NULL,
	"production_order_id" varchar,
	"sales_order_id" varchar,
	"material_card_id" varchar,
	"required_qty" numeric(18, 4) NOT NULL,
	"picked_qty" numeric(18, 4) DEFAULT 0,
	"barcodes_to_pick" jsonb,
	"picked_barcodes" jsonb,
	"from_bin_id" varchar,
	"to_bin_id" varchar,
	"warehouse_id" varchar,
	"assigned_to" integer,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"priority" integer DEFAULT 5,
	"started_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "picking_tasks_task_number_unique" UNIQUE("task_number")
);
--> statement-breakpoint
CREATE TABLE "production_material_balance" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "production_material_balance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"papka_order_id" integer,
	"machine_task_id" integer,
	"material_id" varchar(100) NOT NULL,
	"material_name" varchar(255) NOT NULL,
	"unit" varchar(20) DEFAULT 'dona' NOT NULL,
	"planned_qty" numeric(18, 4) DEFAULT 0 NOT NULL,
	"taken_qty" numeric(18, 4) DEFAULT 0 NOT NULL,
	"used_qty" numeric(18, 4) DEFAULT 0 NOT NULL,
	"returned_qty" numeric(18, 4) DEFAULT 0 NOT NULL,
	"waste_qty" numeric(18, 4) DEFAULT 0 NOT NULL,
	"operator_id" varchar,
	"action" varchar(20) DEFAULT 'take' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movement_gl_postings" (
	"id" serial PRIMARY KEY NOT NULL,
	"movement_type" varchar(50) NOT NULL,
	"movement_id" varchar NOT NULL,
	"movement_number" varchar,
	"warehouse_id" varchar,
	"material_id" varchar,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_cost" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"debit_account_code" varchar(20) NOT NULL,
	"credit_account_code" varchar(20) NOT NULL,
	"gl_document_id" varchar,
	"gl_posting_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"cost_center_id" varchar,
	"profit_center_id" varchar,
	"posted_by" varchar,
	"posted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_moves" (
	"id" serial PRIMARY KEY NOT NULL,
	"move_number" varchar(50) NOT NULL,
	"move_date" varchar(10) NOT NULL,
	"move_type" varchar(20) NOT NULL,
	"product_id" varchar,
	"warehouse_id" varchar,
	"to_warehouse_id" varchar,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_cost" numeric(18, 4),
	"total_cost" numeric(18, 4),
	"reference" text,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_moves_move_number_unique" UNIQUE("move_number")
);
--> statement-breakpoint
CREATE TABLE "stock_transfer_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"transfer_id" varchar NOT NULL,
	"material_card_id" varchar,
	"product_id" varchar,
	"item_type" varchar(20) NOT NULL,
	"requested_quantity" numeric(18, 4) NOT NULL,
	"shipped_quantity" numeric(18, 4),
	"received_quantity" numeric(18, 4),
	"unit_cost" numeric(18, 4) DEFAULT 0,
	"total_cost" numeric(18, 4) DEFAULT 0,
	"batch_number" varchar(50),
	"expiry_date" varchar(10),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"transfer_number" varchar(50) NOT NULL,
	"transfer_date" varchar(10) NOT NULL,
	"from_warehouse_id" varchar NOT NULL,
	"to_warehouse_id" varchar NOT NULL,
	"from_bin_id" varchar,
	"to_bin_id" varchar,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"total_items" integer DEFAULT 0,
	"total_value" numeric(18, 4) DEFAULT 0,
	"requested_by" varchar,
	"approved_by" varchar,
	"shipped_by" varchar,
	"received_by" varchar,
	"requested_at" timestamp,
	"approved_at" timestamp,
	"shipped_at" timestamp,
	"received_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stock_transfers_transfer_number_unique" UNIQUE("transfer_number")
);
--> statement-breakpoint
CREATE TABLE "warehouse_bins" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" varchar NOT NULL,
	"warehouse_id" varchar NOT NULL,
	"bin_code" varchar(50) NOT NULL,
	"row" varchar(10),
	"shelf" varchar(10),
	"level" varchar(10),
	"bin_type" varchar(30) DEFAULT 'standard',
	"max_weight" numeric(18, 4),
	"max_volume" numeric(18, 4),
	"current_occupancy" numeric(18, 4) DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse_rental_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_number" varchar(50) NOT NULL,
	"order_id" varchar,
	"order_number" varchar(50),
	"product_name" text NOT NULL,
	"manager_id" integer,
	"manager_name" varchar(255),
	"customer_id" varchar(100),
	"customer_name" varchar(255),
	"warehouse_id" varchar,
	"warehouse_name" varchar(255),
	"area_m2" numeric(18, 4) DEFAULT 1 NOT NULL,
	"admitted_date" varchar(10) NOT NULL,
	"free_days" integer DEFAULT 8 NOT NULL,
	"daily_rate_per_m2" numeric(18, 4) DEFAULT 0 NOT NULL,
	"total_days" integer DEFAULT 0 NOT NULL,
	"billable_days" integer DEFAULT 0 NOT NULL,
	"total_amount" numeric(18, 4) DEFAULT 0 NOT NULL,
	"exclude_weekends" boolean DEFAULT false NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"notified_at" timestamp,
	"closed_date" varchar(10),
	"paid_at" timestamp,
	"notes" text,
	"last_calculated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_rental_records_record_number_unique" UNIQUE("record_number")
);
--> statement-breakpoint
CREATE TABLE "warehouse_rental_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"default_free_days" integer DEFAULT 8 NOT NULL,
	"default_daily_rate_per_m2" numeric(18, 4) DEFAULT 0 NOT NULL,
	"exclude_weekends" boolean DEFAULT false NOT NULL,
	"custom_rates" jsonb DEFAULT '[]',
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar
);
--> statement-breakpoint
CREATE TABLE "warehouse_stock" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" varchar NOT NULL,
	"material_card_id" varchar NOT NULL,
	"quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"reserved_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"available_quantity" numeric(18, 4) DEFAULT 0 NOT NULL,
	"unit_of_measure" varchar(20),
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_card_id" varchar NOT NULL,
	"transaction_date" varchar(10) NOT NULL,
	"transaction_type" varchar(20) NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit_of_measure" varchar(20) NOT NULL,
	"bulim" varchar(50),
	"responsible_person" text,
	"responsible_user_id" integer,
	"document_number" varchar(50),
	"papka_order_id" varchar,
	"production_fact_id" varchar,
	"is_auto_suggested" boolean DEFAULT false,
	"suggestion_source" varchar(30),
	"balance_before" numeric(18, 4),
	"balance_after" numeric(18, 4),
	"excel_import_row_id" varchar,
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"warehouse_id" varchar NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"zone_type" varchar(30) DEFAULT 'storage',
	"capacity" numeric(18, 4),
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"name_ru" text,
	"type" varchar(30) DEFAULT 'main' NOT NULL,
	"location" text,
	"manager_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ai_interview_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"interview_id" varchar,
	"question_order" integer,
	"question_text" text NOT NULL,
	"question_type" varchar(50),
	"expected_duration_seconds" integer DEFAULT 60,
	"response_text" text,
	"response_audio_url" text,
	"response_timestamp" timestamp,
	"score" integer,
	"strengths" text[],
	"weaknesses" text[],
	"ai_feedback" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"candidate_id" varchar,
	"job_id" varchar,
	"session_id" varchar(100) NOT NULL,
	"provider" varchar(50) DEFAULT 'gemini',
	"transcript" jsonb,
	"audio_recording_url" text,
	"video_recording_url" text,
	"evaluation" jsonb,
	"language" varchar(10) DEFAULT 'uz',
	"duration_seconds" integer,
	"status" varchar(20) DEFAULT 'scheduled',
	"scheduled_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_interviews_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "ai_providers_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"monthly_budget" numeric(10, 2) DEFAULT '100',
	"monthly_spent" numeric(10, 2) DEFAULT '0',
	"daily_request_limit" integer DEFAULT 1000,
	"daily_requests_used" integer DEFAULT 0,
	"rate_limit_per_minute" integer DEFAULT 60,
	"config" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_providers_config_provider_name_unique" UNIQUE("provider_name")
);
--> statement-breakpoint
CREATE TABLE "ai_tasks_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_type" varchar(100) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"priority" integer DEFAULT 5,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"status" varchar(20) DEFAULT 'pending',
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"created_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp,
	"next_retry_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"task_type" varchar(100),
	"model" varchar(100),
	"input_tokens" integer DEFAULT 0,
	"output_tokens" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"estimated_cost" numeric(10, 6) DEFAULT '0',
	"user_id" integer,
	"session_id" varchar(100),
	"request_summary" text,
	"response_summary" text,
	"latency_ms" integer,
	"status" varchar(20) DEFAULT 'success',
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "abc_thresholds" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(1) NOT NULL,
	"min_score" numeric(5, 2) NOT NULL,
	"max_score" numeric(5, 2) NOT NULL,
	"bonus_percentage" numeric(5, 2) NOT NULL,
	"description" text,
	"attendance_weight" numeric(5, 2) DEFAULT '0.40',
	"quality_weight" numeric(5, 2) DEFAULT '0.25',
	"task_weight" numeric(5, 2) DEFAULT '0.20',
	"lms_weight" numeric(5, 2) DEFAULT '0.15',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "abc_thresholds_category_unique" UNIQUE("category")
);
--> statement-breakpoint
CREATE TABLE "leave_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name_uz" varchar(100) NOT NULL,
	"name_ru" varchar(100),
	"max_days_per_year" integer,
	"is_paid" boolean DEFAULT true NOT NULL,
	"requires_medical_cert" boolean DEFAULT false NOT NULL,
	"requires_director_approval" boolean DEFAULT false NOT NULL,
	"min_days_before_request" integer DEFAULT 5,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leave_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "shift_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name_uz" varchar(100) NOT NULL,
	"name_ru" varchar(100),
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"duration_hours" numeric(4, 1) NOT NULL,
	"is_overnight" boolean DEFAULT false NOT NULL,
	"overtime_multiplier" numeric(3, 1) DEFAULT '1.5',
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shift_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "skill_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name_uz" varchar(100) NOT NULL,
	"name_ru" varchar(100),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skill_categories_code_unique" UNIQUE("code")
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
	"extra_actions" jsonb,
	"valid_from" date,
	"valid_until" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_responses" ADD CONSTRAINT "application_responses_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_responses" ADD CONSTRAINT "application_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_responses" ADD CONSTRAINT "application_responses_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_responses" ADD CONSTRAINT "application_responses_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_sent_by_admins_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_trainer_id_users_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_room_id_meeting_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."meeting_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_goals" ADD CONSTRAINT "company_goals_responsible_department_id_departments_id_fk" FOREIGN KEY ("responsible_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_plan_items" ADD CONSTRAINT "company_plan_items_goal_id_company_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."company_goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_plan_items" ADD CONSTRAINT "company_plan_items_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_plan_items" ADD CONSTRAINT "company_plan_items_responsible_department_id_departments_id_fk" FOREIGN KEY ("responsible_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_production_order_id_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_functions" ADD CONSTRAINT "employee_functions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_functions" ADD CONSTRAINT "employee_functions_function_id_org_functions_id_fk" FOREIGN KEY ("function_id") REFERENCES "public"."org_functions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_org_departments" ADD CONSTRAINT "employee_org_departments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_org_departments" ADD CONSTRAINT "employee_org_departments_org_department_id_org_departments_id_fk" FOREIGN KEY ("org_department_id") REFERENCES "public"."org_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_calendar_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."calendar_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_alumni" ADD CONSTRAINT "hr_alumni_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_health_checkups" ADD CONSTRAINT "hr_health_checkups_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_onboarding_checklists" ADD CONSTRAINT "hr_onboarding_checklists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_results" ADD CONSTRAINT "kpi_results_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_results" ADD CONSTRAINT "kpi_results_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_departments" ADD CONSTRAINT "org_departments_head_user_id_users_id_fk" FOREIGN KEY ("head_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_functions" ADD CONSTRAINT "org_functions_department_id_org_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."org_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_room_id_meeting_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."meeting_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_bookings" ADD CONSTRAINT "room_bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "benchmarks" ADD CONSTRAINT "benchmarks_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welcome_events" ADD CONSTRAINT "welcome_events_organizer_id_admins_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_alerts" ADD CONSTRAINT "ai_alerts_insight_id_ai_report_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."ai_report_insights"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_alerts" ADD CONSTRAINT "ai_alerts_report_id_ai_report_definitions_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."ai_report_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_alerts" ADD CONSTRAINT "ai_alerts_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_prompts" ADD CONSTRAINT "ai_prompts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_report_definitions" ADD CONSTRAINT "ai_report_definitions_category_id_ai_report_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."ai_report_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_report_insights" ADD CONSTRAINT "ai_report_insights_report_run_id_ai_report_runs_id_fk" FOREIGN KEY ("report_run_id") REFERENCES "public"."ai_report_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_report_runs" ADD CONSTRAINT "ai_report_runs_report_id_ai_report_definitions_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."ai_report_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_report_subscriptions" ADD CONSTRAINT "ai_report_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_report_subscriptions" ADD CONSTRAINT "ai_report_subscriptions_report_id_ai_report_definitions_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."ai_report_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_insight_id_ai_report_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."ai_report_insights"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_alert_id_ai_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."ai_alerts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tasks" ADD CONSTRAINT "ai_tasks_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_approver_user_id_users_id_fk" FOREIGN KEY ("approver_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflow_approvals" ADD CONSTRAINT "approval_workflow_approvals_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."approval_workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflow_approvals" ADD CONSTRAINT "approval_workflow_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflow_steps" ADD CONSTRAINT "approval_workflow_steps_template_id_approval_workflow_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."approval_workflow_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_template_id_approval_workflow_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."approval_workflow_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_reversals" ADD CONSTRAINT "document_reversals_reversed_by_users_id_fk" FOREIGN KEY ("reversed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_trail_log" ADD CONSTRAINT "audit_trail_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_rules" ADD CONSTRAINT "business_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deleted_records" ADD CONSTRAINT "deleted_records_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deleted_records" ADD CONSTRAINT "deleted_records_restored_by_users_id_fk" FOREIGN KEY ("restored_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_logs" ADD CONSTRAINT "exception_logs_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_logs" ADD CONSTRAINT "exception_logs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpi_values" ADD CONSTRAINT "kpi_values_kpi_id_kpi_definitions_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpi_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_menus" ADD CONSTRAINT "role_menus_parent_menu_id_role_menus_id_fk" FOREIGN KEY ("parent_menu_id") REFERENCES "public"."role_menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_violations" ADD CONSTRAINT "rule_violations_rule_id_business_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."business_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_violations" ADD CONSTRAINT "rule_violations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_violations" ADD CONSTRAINT "rule_violations_override_approved_by_users_id_fk" FOREIGN KEY ("override_approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_change_history" ADD CONSTRAINT "status_change_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_change_history" ADD CONSTRAINT "status_change_history_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_alerts" ADD CONSTRAINT "system_alerts_read_by_users_id_fk" FOREIGN KEY ("read_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_alerts" ADD CONSTRAINT "system_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_of_measures" ADD CONSTRAINT "unit_of_measures_base_unit_id_unit_of_measures_id_fk" FOREIGN KEY ("base_unit_id") REFERENCES "public"."unit_of_measures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_results" ADD CONSTRAINT "validation_results_validation_rule_id_validation_rules_id_fk" FOREIGN KEY ("validation_rule_id") REFERENCES "public"."validation_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_results" ADD CONSTRAINT "validation_results_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_lot_movements" ADD CONSTRAINT "batch_lot_movements_batch_lot_id_batch_lots_id_fk" FOREIGN KEY ("batch_lot_id") REFERENCES "public"."batch_lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_lot_movements" ADD CONSTRAINT "batch_lot_movements_moved_by_user_id_users_id_fk" FOREIGN KEY ("moved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_lots" ADD CONSTRAINT "batch_lots_quality_check_by_users_id_fk" FOREIGN KEY ("quality_check_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_implemented_by_users_id_fk" FOREIGN KEY ("implemented_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_objects" ADD CONSTRAINT "cost_objects_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_objects" ADD CONSTRAINT "cost_objects_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_lifecycle" ADD CONSTRAINT "document_lifecycle_status_changed_by_users_id_fk" FOREIGN KEY ("status_changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_lifecycle_history" ADD CONSTRAINT "document_lifecycle_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_activities" ADD CONSTRAINT "exception_activities_exception_id_exception_inbox_id_fk" FOREIGN KEY ("exception_id") REFERENCES "public"."exception_inbox"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_activities" ADD CONSTRAINT "exception_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_inbox" ADD CONSTRAINT "exception_inbox_exception_type_id_exception_types_id_fk" FOREIGN KEY ("exception_type_id") REFERENCES "public"."exception_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_inbox" ADD CONSTRAINT "exception_inbox_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_inbox" ADD CONSTRAINT "exception_inbox_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exception_inbox" ADD CONSTRAINT "exception_inbox_escalated_to_users_id_fk" FOREIGN KEY ("escalated_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_reopened_by_user_id_users_id_fk" FOREIGN KEY ("reopened_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posting_entries" ADD CONSTRAINT "posting_entries_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posting_entries" ADD CONSTRAINT "posting_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sop_steps" ADD CONSTRAINT "sop_steps_sop_id_sop_templates_id_fk" FOREIGN KEY ("sop_id") REFERENCES "public"."sop_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sop_templates" ADD CONSTRAINT "sop_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_comments" ADD CONSTRAINT "crm_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_companies" ADD CONSTRAINT "crm_companies_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_companies" ADD CONSTRAINT "crm_companies_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_companies" ADD CONSTRAINT "crm_companies_modify_by_id_users_id_fk" FOREIGN KEY ("modify_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_company_id_crm_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_modify_by_id_users_id_fk" FOREIGN KEY ("modify_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal_products" ADD CONSTRAINT "crm_deal_products_owner_id_crm_deals_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."crm_deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deal_products" ADD CONSTRAINT "crm_deal_products_product_id_crm_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."crm_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_category_id_crm_pipelines_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."crm_pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_company_id_crm_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_modify_by_id_users_id_fk" FOREIGN KEY ("modify_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_documents" ADD CONSTRAINT "crm_documents_signed_by_id_users_id_fk" FOREIGN KEY ("signed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_documents" ADD CONSTRAINT "crm_documents_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_entity_history" ADD CONSTRAINT "crm_entity_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_followup_activities" ADD CONSTRAINT "crm_followup_activities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoice_payments" ADD CONSTRAINT "crm_invoice_payments_invoice_id_crm_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."crm_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoice_payments" ADD CONSTRAINT "crm_invoice_payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoice_products" ADD CONSTRAINT "crm_invoice_products_invoice_id_crm_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."crm_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoice_products" ADD CONSTRAINT "crm_invoice_products_product_id_crm_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."crm_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_deal_id_crm_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_proposal_id_crm_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."crm_proposals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_contact_id_crm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_company_id_crm_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_invoices" ADD CONSTRAINT "crm_invoices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_modify_by_id_users_id_fk" FOREIGN KEY ("modify_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_products" ADD CONSTRAINT "crm_products_category_id_crm_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."crm_product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_proposal_products" ADD CONSTRAINT "crm_proposal_products_proposal_id_crm_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."crm_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_proposal_products" ADD CONSTRAINT "crm_proposal_products_product_id_crm_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."crm_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_proposals" ADD CONSTRAINT "crm_proposals_deal_id_crm_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_proposals" ADD CONSTRAINT "crm_proposals_contact_id_crm_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."crm_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_proposals" ADD CONSTRAINT "crm_proposals_company_id_crm_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_proposals" ADD CONSTRAINT "crm_proposals_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_proposals" ADD CONSTRAINT "crm_proposals_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_robots" ADD CONSTRAINT "crm_robots_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_stages" ADD CONSTRAINT "crm_stages_category_id_crm_pipelines_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."crm_pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_watchers" ADD CONSTRAINT "crm_watchers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_competitors" ADD CONSTRAINT "customer_competitors_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_competitors" ADD CONSTRAINT "customer_competitors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_complaints" ADD CONSTRAINT "customer_complaints_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_complaints" ADD CONSTRAINT "customer_complaints_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_complaints" ADD CONSTRAINT "customer_complaints_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_documents" ADD CONSTRAINT "customer_documents_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_documents" ADD CONSTRAINT "customer_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_contact_id_customer_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."customer_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_accounts" ADD CONSTRAINT "customer_accounts_crm_company_id_crm_companies_id_fk" FOREIGN KEY ("crm_company_id") REFERENCES "public"."crm_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customer_id_customer_accounts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_crm_lead_id_crm_leads_id_fk" FOREIGN KEY ("crm_lead_id") REFERENCES "public"."crm_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_crm_deal_id_crm_deals_id_fk" FOREIGN KEY ("crm_deal_id") REFERENCES "public"."crm_deals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_products" ADD CONSTRAINT "public_products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_products" ADD CONSTRAINT "public_products_erp_product_id_products_id_fk" FOREIGN KEY ("erp_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_periods" ADD CONSTRAINT "accounting_periods_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_account_id_accounts_id_fk" FOREIGN KEY ("parent_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advance_payments" ADD CONSTRAINT "advance_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advance_payments" ADD CONSTRAINT "advance_payments_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advance_payments" ADD CONSTRAINT "advance_payments_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advance_payments" ADD CONSTRAINT "advance_payments_approval_request_id_approval_requests_id_fk" FOREIGN KEY ("approval_request_id") REFERENCES "public"."approval_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advance_payments" ADD CONSTRAINT "advance_payments_gl_document_id_gl_documents_id_fk" FOREIGN KEY ("gl_document_id") REFERENCES "public"."gl_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advance_payments" ADD CONSTRAINT "advance_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_finance_insights" ADD CONSTRAINT "ai_finance_insights_action_taken_by_users_id_fk" FOREIGN KEY ("action_taken_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ap_aging_buckets" ADD CONSTRAINT "ap_aging_buckets_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_matched_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("matched_invoice_id") REFERENCES "public"."sales_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_controls" ADD CONSTRAINT "budget_controls_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "cash_flow_transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "cash_flow_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_custodian_id_users_id_fk" FOREIGN KEY ("custodian_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_register_id_cash_registers_id_fk" FOREIGN KEY ("register_id") REFERENCES "public"."cash_registers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_session_id_cash_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."cash_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_register_id_cash_registers_id_fk" FOREIGN KEY ("register_id") REFERENCES "public"."cash_registers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transactions" ADD CONSTRAINT "cash_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_parent_id_cost_centers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cost_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_sales_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("sales_invoice_id") REFERENCES "public"."sales_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_payments" ADD CONSTRAINT "customer_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_debit_account_id_accounts_id_fk" FOREIGN KEY ("debit_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_credit_account_id_accounts_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_expense_report_id_expense_reports_id_fk" FOREIGN KEY ("expense_report_id") REFERENCES "public"."expense_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_expense_request_id_expense_requests_id_fk" FOREIGN KEY ("expense_request_id") REFERENCES "public"."expense_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_approval_request_id_approval_requests_id_fk" FOREIGN KEY ("approval_request_id") REFERENCES "public"."approval_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_cash_register_id_cash_registers_id_fk" FOREIGN KEY ("cash_register_id") REFERENCES "public"."cash_registers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_requests" ADD CONSTRAINT "expense_requests_disbursed_by_users_id_fk" FOREIGN KEY ("disbursed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_parent_id_finance_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."finance_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_documents" ADD CONSTRAINT "gl_documents_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_lines" ADD CONSTRAINT "gl_lines_gl_document_id_gl_documents_id_fk" FOREIGN KEY ("gl_document_id") REFERENCES "public"."gl_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_lines" ADD CONSTRAINT "gl_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_lines" ADD CONSTRAINT "gl_lines_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gl_lines" ADD CONSTRAINT "gl_lines_profit_center_id_profit_centers_id_fk" FOREIGN KEY ("profit_center_id") REFERENCES "public"."profit_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_expense_transactions" ADD CONSTRAINT "income_expense_transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_expense_transactions" ADD CONSTRAINT "income_expense_transactions_gl_document_id_gl_documents_id_fk" FOREIGN KEY ("gl_document_id") REFERENCES "public"."gl_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_expense_transactions" ADD CONSTRAINT "income_expense_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_expense_transactions" ADD CONSTRAINT "income_expense_transactions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment_matching" ADD CONSTRAINT "invoice_payment_matching_invoice_id_sales_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."sales_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment_matching" ADD CONSTRAINT "invoice_payment_matching_payment_id_customer_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."customer_payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payment_matching" ADD CONSTRAINT "invoice_payment_matching_matched_by_users_id_fk" FOREIGN KEY ("matched_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_purchase_invoice_id_purchase_invoices_id_fk" FOREIGN KEY ("purchase_invoice_id") REFERENCES "public"."purchase_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_costing_lines" ADD CONSTRAINT "order_costing_lines_order_costing_id_order_costings_id_fk" FOREIGN KEY ("order_costing_id") REFERENCES "public"."order_costings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_costings" ADD CONSTRAINT "order_costings_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_costings" ADD CONSTRAINT "order_costings_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_costings" ADD CONSTRAINT "order_costings_calculated_by_users_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_ai_recommendations" ADD CONSTRAINT "payroll_ai_recommendations_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_ai_recommendations" ADD CONSTRAINT "payroll_ai_recommendations_evidence_id_payroll_work_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."payroll_work_evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_ai_recommendations" ADD CONSTRAINT "payroll_ai_recommendations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_calculations" ADD CONSTRAINT "payroll_calculations_period_id_payroll_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_calculations" ADD CONSTRAINT "payroll_calculations_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_calculations" ADD CONSTRAINT "payroll_calculations_contract_id_payroll_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."payroll_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_calculations" ADD CONSTRAINT "payroll_calculations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_contracts" ADD CONSTRAINT "payroll_contracts_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_rows" ADD CONSTRAINT "payroll_rows_period_id_payroll_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."payroll_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_rows" ADD CONSTRAINT "payroll_rows_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_work_evidence" ADD CONSTRAINT "payroll_work_evidence_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_work_evidence" ADD CONSTRAINT "payroll_work_evidence_override_by_users_id_fk" FOREIGN KEY ("override_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_centers" ADD CONSTRAINT "profit_centers_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_product_master_id_product_masters_id_fk" FOREIGN KEY ("product_master_id") REFERENCES "public"."product_masters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abc_analysis" ADD CONSTRAINT "abc_analysis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptation_feedback" ADD CONSTRAINT "adaptation_feedback_new_employee_id_adaptation_records_id_fk" FOREIGN KEY ("new_employee_id") REFERENCES "public"."adaptation_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptation_feedback" ADD CONSTRAINT "adaptation_feedback_conducted_by_admins_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptation_programs" ADD CONSTRAINT "adaptation_programs_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptation_programs" ADD CONSTRAINT "adaptation_programs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptation_programs" ADD CONSTRAINT "adaptation_programs_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptation_records" ADD CONSTRAINT "adaptation_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptation_records" ADD CONSTRAINT "adaptation_records_program_id_adaptation_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."adaptation_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptation_records" ADD CONSTRAINT "adaptation_records_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adaptation_records" ADD CONSTRAINT "adaptation_records_created_by_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_cv_screenings" ADD CONSTRAINT "ai_cv_screenings_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_cv_screenings" ADD CONSTRAINT "ai_cv_screenings_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interview_messages" ADD CONSTRAINT "ai_interview_messages_session_id_ai_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interview_sessions" ADD CONSTRAINT "ai_interview_sessions_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interview_sessions" ADD CONSTRAINT "ai_interview_sessions_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_payments" ADD CONSTRAINT "bonus_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bonus_payments" ADD CONSTRAINT "bonus_payments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_trips" ADD CONSTRAINT "business_trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_trips" ADD CONSTRAINT "business_trips_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_questionnaire_response_id_questionnaire_responses_id_fk" FOREIGN KEY ("questionnaire_response_id") REFERENCES "public"."questionnaire_responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_advances" ADD CONSTRAINT "cash_advances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_advances" ADD CONSTRAINT "cash_advances_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_attendance_summary" ADD CONSTRAINT "daily_attendance_summary_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipline_records" ADD CONSTRAINT "discipline_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipline_records" ADD CONSTRAINT "discipline_records_given_by_users_id_fk" FOREIGN KEY ("given_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_360_assessments" ADD CONSTRAINT "employee_360_assessments_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_bank_accounts" ADD CONSTRAINT "employee_bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_career_profiles" ADD CONSTRAINT "employee_career_profiles_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_comparison_logs" ADD CONSTRAINT "employee_comparison_logs_compared_by_users_id_fk" FOREIGN KEY ("compared_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_comparison_logs" ADD CONSTRAINT "employee_comparison_logs_employee1_id_users_id_fk" FOREIGN KEY ("employee1_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_comparison_logs" ADD CONSTRAINT "employee_comparison_logs_employee2_id_users_id_fk" FOREIGN KEY ("employee2_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_daily_kpi" ADD CONSTRAINT "employee_daily_kpi_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_daily_kpi" ADD CONSTRAINT "employee_daily_kpi_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_daily_kpi" ADD CONSTRAINT "employee_daily_kpi_evaluator_id_users_id_fk" FOREIGN KEY ("evaluator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_emergency_contacts" ADD CONSTRAINT "employee_emergency_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_face_encodings" ADD CONSTRAINT "employee_face_encodings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_files" ADD CONSTRAINT "employee_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_files" ADD CONSTRAINT "employee_files_uploaded_by_admins_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_fines" ADD CONSTRAINT "employee_fines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_fines" ADD CONSTRAINT "employee_fines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_ideas" ADD CONSTRAINT "employee_ideas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_ideas" ADD CONSTRAINT "employee_ideas_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_ideas" ADD CONSTRAINT "employee_ideas_implementer_id_users_id_fk" FOREIGN KEY ("implementer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_ideas" ADD CONSTRAINT "employee_ideas_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_passports" ADD CONSTRAINT "employee_passports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_performance_metrics" ADD CONSTRAINT "employee_performance_metrics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_productivity" ADD CONSTRAINT "employee_productivity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_productivity" ADD CONSTRAINT "employee_productivity_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_ratings" ADD CONSTRAINT "employee_ratings_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_skills" ADD CONSTRAINT "employee_skills_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_strengths_weaknesses" ADD CONSTRAINT "employee_strengths_weaknesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_transfer_history" ADD CONSTRAINT "employee_transfer_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_transfer_history" ADD CONSTRAINT "employee_transfer_history_from_department_id_departments_id_fk" FOREIGN KEY ("from_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_transfer_history" ADD CONSTRAINT "employee_transfer_history_from_position_id_positions_id_fk" FOREIGN KEY ("from_position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_transfer_history" ADD CONSTRAINT "employee_transfer_history_from_work_center_id_work_centers_id_fk" FOREIGN KEY ("from_work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_transfer_history" ADD CONSTRAINT "employee_transfer_history_to_department_id_departments_id_fk" FOREIGN KEY ("to_department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_transfer_history" ADD CONSTRAINT "employee_transfer_history_to_position_id_positions_id_fk" FOREIGN KEY ("to_position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_transfer_history" ADD CONSTRAINT "employee_transfer_history_to_work_center_id_work_centers_id_fk" FOREIGN KEY ("to_work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_transfer_history" ADD CONSTRAINT "employee_transfer_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_work_centers" ADD CONSTRAINT "employee_work_centers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_work_centers" ADD CONSTRAINT "employee_work_centers_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "face_embeddings" ADD CONSTRAINT "face_embeddings_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "face_recognition_logs" ADD CONSTRAINT "face_recognition_logs_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "face_recognition_logs" ADD CONSTRAINT "face_recognition_logs_zone_id_camera_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."camera_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "face_recognition_logs" ADD CONSTRAINT "face_recognition_logs_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "face_recognition_logs" ADD CONSTRAINT "face_recognition_logs_flagged_by_users_id_fk" FOREIGN KEY ("flagged_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hazard_zones" ADD CONSTRAINT "hazard_zones_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_capital_profiles" ADD CONSTRAINT "hr_capital_profiles_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_conflict_reports" ADD CONSTRAINT "hr_conflict_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_templates" ADD CONSTRAINT "job_templates_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_daily_stats" ADD CONSTRAINT "operator_daily_stats_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_payments" ADD CONSTRAINT "overtime_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_payments" ADD CONSTRAINT "overtime_payments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_goals" ADD CONSTRAINT "performance_goals_employee_id_users_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_goals" ADD CONSTRAINT "performance_goals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_required_courses" ADD CONSTRAINT "position_required_courses_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_required_courses" ADD CONSTRAINT "position_required_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppe_compliance" ADD CONSTRAINT "ppe_compliance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppe_compliance" ADD CONSTRAINT "ppe_compliance_checked_by_users_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_questions" ADD CONSTRAINT "questionnaire_questions_template_id_questionnaire_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."questionnaire_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_template_id_questionnaire_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."questionnaire_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_templates" ADD CONSTRAINT "questionnaire_templates_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_incidents" ADD CONSTRAINT "safety_incidents_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_trainings" ADD CONSTRAINT "safety_trainings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_history" ADD CONSTRAINT "salary_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_history" ADD CONSTRAINT "salary_history_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handovers" ADD CONSTRAINT "shift_handovers_handed_over_by_users_id_fk" FOREIGN KEY ("handed_over_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_handovers" ADD CONSTRAINT "shift_handovers_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_swap_with_users_id_fk" FOREIGN KEY ("swap_with") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_swap_requests" ADD CONSTRAINT "shift_swap_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sick_leaves" ADD CONSTRAINT "sick_leaves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "succession_plans" ADD CONSTRAINT "succession_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_alerts" ADD CONSTRAINT "camera_alerts_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_alerts" ADD CONSTRAINT "camera_alerts_camera_event_id_camera_events_id_fk" FOREIGN KEY ("camera_event_id") REFERENCES "public"."camera_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_alerts" ADD CONSTRAINT "camera_alerts_acknowledged_by_id_users_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_alerts" ADD CONSTRAINT "camera_alerts_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_detections" ADD CONSTRAINT "camera_detections_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_detections" ADD CONSTRAINT "camera_detections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_events" ADD CONSTRAINT "camera_events_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_events" ADD CONSTRAINT "camera_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_events" ADD CONSTRAINT "camera_events_zone_id_camera_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."camera_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_events" ADD CONSTRAINT "camera_events_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_zones" ADD CONSTRAINT "camera_zones_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cameras" ADD CONSTRAINT "cameras_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_zone_tracking" ADD CONSTRAINT "employee_zone_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_zone_tracking" ADD CONSTRAINT "employee_zone_tracking_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_sensor_id_iot_sensors_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."iot_sensors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iot_alerts" ADD CONSTRAINT "iot_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iot_sensor_readings" ADD CONSTRAINT "iot_sensor_readings_sensor_id_iot_sensors_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."iot_sensors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_status_logs" ADD CONSTRAINT "machine_status_logs_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_status_logs" ADD CONSTRAINT "machine_status_logs_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_status_logs" ADD CONSTRAINT "machine_status_logs_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_defects_camera" ADD CONSTRAINT "quality_defects_camera_camera_event_id_camera_events_id_fk" FOREIGN KEY ("camera_event_id") REFERENCES "public"."camera_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_defects_camera" ADD CONSTRAINT "quality_defects_camera_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_defects_camera" ADD CONSTRAINT "quality_defects_camera_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_defects_camera" ADD CONSTRAINT "quality_defects_camera_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quality_defects_camera" ADD CONSTRAINT "quality_defects_camera_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_violations" ADD CONSTRAINT "safety_violations_camera_event_id_camera_events_id_fk" FOREIGN KEY ("camera_event_id") REFERENCES "public"."camera_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_violations" ADD CONSTRAINT "safety_violations_camera_id_cameras_id_fk" FOREIGN KEY ("camera_id") REFERENCES "public"."cameras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_violations" ADD CONSTRAINT "safety_violations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_violations" ADD CONSTRAINT "safety_violations_acknowledged_by_id_users_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_robots" ADD CONSTRAINT "automation_robots_board_id_kanban_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_robots" ADD CONSTRAINT "automation_robots_trigger_column_id_kanban_columns_id_fk" FOREIGN KEY ("trigger_column_id") REFERENCES "public"."kanban_columns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_robots" ADD CONSTRAINT "automation_robots_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_board_id_kanban_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_column_id_kanban_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."kanban_columns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_accepted_by_id_users_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_board_id_kanban_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_comments" ADD CONSTRAINT "kanban_comments_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kanban_comments" ADD CONSTRAINT "kanban_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_card_tags" ADD CONSTRAINT "task_card_tags_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_card_tags" ADD CONSTRAINT "task_card_tags_tag_id_task_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."task_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_chat_message_files" ADD CONSTRAINT "task_chat_message_files_message_id_task_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."task_chat_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_chat_messages" ADD CONSTRAINT "task_chat_messages_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_chat_messages" ADD CONSTRAINT "task_chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_checklist_items" ADD CONSTRAINT "task_checklist_items_checklist_id_task_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."task_checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_checklists" ADD CONSTRAINT "task_checklists_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_co_executors" ADD CONSTRAINT "task_co_executors_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_co_executors" ADD CONSTRAINT "task_co_executors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_co_executors" ADD CONSTRAINT "task_co_executors_added_by_id_users_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_collaborators" ADD CONSTRAINT "task_collaborators_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_collaborators" ADD CONSTRAINT "task_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_files" ADD CONSTRAINT "task_files_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_files" ADD CONSTRAINT "task_files_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_flows" ADD CONSTRAINT "task_flows_board_id_kanban_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_notifications" ADD CONSTRAINT "task_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_notifications" ADD CONSTRAINT "task_notifications_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_observers" ADD CONSTRAINT "task_observers_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_observers" ADD CONSTRAINT "task_observers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_observers" ADD CONSTRAINT "task_observers_added_by_id_users_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_project_members" ADD CONSTRAINT "task_project_members_project_id_task_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."task_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_project_members" ADD CONSTRAINT "task_project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_projects" ADD CONSTRAINT "task_projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reminders" ADD CONSTRAINT "task_reminders_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_reminders" ADD CONSTRAINT "task_reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_result_files" ADD CONSTRAINT "task_result_files_result_id_task_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."task_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_results" ADD CONSTRAINT "task_results_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_results" ADD CONSTRAINT "task_results_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_from_column_id_kanban_columns_id_fk" FOREIGN KEY ("from_column_id") REFERENCES "public"."kanban_columns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_to_column_id_kanban_columns_id_fk" FOREIGN KEY ("to_column_id") REFERENCES "public"."kanban_columns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_status_history" ADD CONSTRAINT "task_status_history_changed_by_id_users_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_parent_card_id_kanban_cards_id_fk" FOREIGN KEY ("parent_card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_subtasks" ADD CONSTRAINT "task_subtasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_tags" ADD CONSTRAINT "task_tags_board_id_kanban_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_board_id_kanban_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_time_entries" ADD CONSTRAINT "task_time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_time_tracks" ADD CONSTRAINT "task_time_tracks_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_time_tracks" ADD CONSTRAINT "task_time_tracks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_view_preferences" ADD CONSTRAINT "task_view_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_view_preferences" ADD CONSTRAINT "task_view_preferences_board_id_kanban_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."kanban_boards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_exam_attempts" ADD CONSTRAINT "ai_exam_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_exam_attempts" ADD CONSTRAINT "ai_exam_attempts_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_exam_attempts" ADD CONSTRAINT "ai_exam_attempts_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_mentor_id_mentors_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guidelines" ADD CONSTRAINT "guidelines_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_capital_modules" ADD CONSTRAINT "hr_capital_modules_course_id_hr_capital_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."hr_capital_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_capital_quiz_attempts" ADD CONSTRAINT "hr_capital_quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_capital_quiz_attempts" ADD CONSTRAINT "hr_capital_quiz_attempts_module_id_hr_capital_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."hr_capital_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_capital_quiz_questions" ADD CONSTRAINT "hr_capital_quiz_questions_module_id_hr_capital_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."hr_capital_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentorship_id_mentorships_id_fk" FOREIGN KEY ("mentorship_id") REFERENCES "public"."mentorships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_tasks" ADD CONSTRAINT "onboarding_tasks_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_onboarding_progress" ADD CONSTRAINT "user_onboarding_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_onboarding_progress" ADD CONSTRAINT "user_onboarding_progress_task_id_onboarding_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."onboarding_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_ads" ADD CONSTRAINT "marketing_ads_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_material_insights" ADD CONSTRAINT "ai_material_insights_material_id_raw_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_material_insights" ADD CONSTRAINT "ai_material_insights_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_material_insights" ADD CONSTRAINT "ai_material_insights_action_taken_by_users_id_fk" FOREIGN KEY ("action_taken_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_reservation_requests" ADD CONSTRAINT "ai_reservation_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_suggestions" ADD CONSTRAINT "consumption_suggestions_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_suggestions" ADD CONSTRAINT "consumption_suggestions_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_suggestions" ADD CONSTRAINT "consumption_suggestions_formula_id_formula_definitions_id_fk" FOREIGN KEY ("formula_id") REFERENCES "public"."formula_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_suggestions" ADD CONSTRAINT "consumption_suggestions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumption_suggestions" ADD CONSTRAINT "consumption_suggestions_executed_transaction_id_warehouse_transactions_id_fk" FOREIGN KEY ("executed_transaction_id") REFERENCES "public"."warehouse_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creditor_debts" ADD CONSTRAINT "creditor_debts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_expenses" ADD CONSTRAINT "driver_expenses_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_issue_items" ADD CONSTRAINT "goods_issue_items_gi_id_goods_issues_id_fk" FOREIGN KEY ("gi_id") REFERENCES "public"."goods_issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_issue_items" ADD CONSTRAINT "goods_issue_items_raw_material_id_raw_materials_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_issues" ADD CONSTRAINT "goods_issues_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_issues" ADD CONSTRAINT "goods_issues_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_gr_id_goods_receipts_id_fk" FOREIGN KEY ("gr_id") REFERENCES "public"."goods_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_raw_material_id_raw_materials_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."goods_receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_bin_id_warehouse_bins_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."warehouse_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_supplier_id_vendors_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_qc_by_users_id_fk" FOREIGN KEY ("qc_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_lines" ADD CONSTRAINT "inventory_count_lines_count_id_inventory_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."inventory_counts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_lines" ADD CONSTRAINT "inventory_count_lines_material_id_raw_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_lines" ADD CONSTRAINT "inventory_count_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_count_lines" ADD CONSTRAINT "inventory_count_lines_counted_by_users_id_fk" FOREIGN KEY ("counted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_barcodes" ADD CONSTRAINT "material_barcodes_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_barcodes" ADD CONSTRAINT "material_barcodes_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_barcodes" ADD CONSTRAINT "material_barcodes_bin_id_warehouse_bins_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."warehouse_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_barcodes" ADD CONSTRAINT "material_barcodes_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_barcodes" ADD CONSTRAINT "material_barcodes_qc_inspector_id_users_id_fk" FOREIGN KEY ("qc_inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_barcodes" ADD CONSTRAINT "material_barcodes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_batches" ADD CONSTRAINT "material_batches_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_batches" ADD CONSTRAINT "material_batches_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_batches" ADD CONSTRAINT "material_batches_bin_id_warehouse_bins_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."warehouse_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_batches" ADD CONSTRAINT "material_batches_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "public"."goods_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_cards" ADD CONSTRAINT "material_cards_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_cards" ADD CONSTRAINT "material_cards_raw_material_id_raw_materials_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_cards" ADD CONSTRAINT "material_cards_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_inventory_valuations" ADD CONSTRAINT "material_inventory_valuations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_inventory_valuations" ADD CONSTRAINT "material_inventory_valuations_material_id_raw_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_inventory_valuations" ADD CONSTRAINT "material_inventory_valuations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_kit_items" ADD CONSTRAINT "material_kit_items_kit_id_material_kits_id_fk" FOREIGN KEY ("kit_id") REFERENCES "public"."material_kits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_kit_items" ADD CONSTRAINT "material_kit_items_material_id_raw_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_kit_items" ADD CONSTRAINT "material_kit_items_category_id_material_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."material_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_kit_items" ADD CONSTRAINT "material_kit_items_scanned_by_users_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_kits" ADD CONSTRAINT "material_kits_order_id_papka_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_kits" ADD CONSTRAINT "material_kits_machine_task_id_machine_tasks_id_fk" FOREIGN KEY ("machine_task_id") REFERENCES "public"."machine_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_kits" ADD CONSTRAINT "material_kits_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_kits" ADD CONSTRAINT "material_kits_prepared_by_users_id_fk" FOREIGN KEY ("prepared_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_kits" ADD CONSTRAINT "material_kits_delivered_by_users_id_fk" FOREIGN KEY ("delivered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_kits" ADD CONSTRAINT "material_kits_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_movements" ADD CONSTRAINT "material_movements_session_id_production_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."production_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_movements" ADD CONSTRAINT "material_movements_order_id_papka_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_movements" ADD CONSTRAINT "material_movements_kit_id_material_kits_id_fk" FOREIGN KEY ("kit_id") REFERENCES "public"."material_kits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_movements" ADD CONSTRAINT "material_movements_material_id_raw_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_movements" ADD CONSTRAINT "material_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_movements" ADD CONSTRAINT "material_movements_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "min_stock_alerts" ADD CONSTRAINT "min_stock_alerts_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "min_stock_alerts" ADD CONSTRAINT "min_stock_alerts_acknowledged_by_users_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_deliveries" ADD CONSTRAINT "mm_deliveries_vehicle_id_mm_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."mm_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_deliveries" ADD CONSTRAINT "mm_deliveries_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mro_consumption" ADD CONSTRAINT "mro_consumption_request_id_mro_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."mro_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mro_consumption" ADD CONSTRAINT "mro_consumption_item_id_mro_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."mro_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mro_consumption" ADD CONSTRAINT "mro_consumption_consumed_by_users_id_fk" FOREIGN KEY ("consumed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mro_items" ADD CONSTRAINT "mro_items_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mro_requests" ADD CONSTRAINT "mro_requests_item_id_mro_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."mro_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mro_requests" ADD CONSTRAINT "mro_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mro_requests" ADD CONSTRAINT "mro_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mro_requests" ADD CONSTRAINT "mro_requests_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_material_balance" ADD CONSTRAINT "operator_material_balance_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_material_balance" ADD CONSTRAINT "operator_material_balance_barcode_id_material_barcodes_id_fk" FOREIGN KEY ("barcode_id") REFERENCES "public"."material_barcodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_material_balance" ADD CONSTRAINT "operator_material_balance_supervisor_id_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumption" ADD CONSTRAINT "production_consumption_barcode_id_material_barcodes_id_fk" FOREIGN KEY ("barcode_id") REFERENCES "public"."material_barcodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_consumption" ADD CONSTRAINT "production_consumption_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_invoices" ADD CONSTRAINT "purchase_invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_po_id_purchase_orders_id_fk" FOREIGN KEY ("po_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_raw_material_id_raw_materials_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_mrp_result_id_mrp_results_id_fk" FOREIGN KEY ("mrp_result_id") REFERENCES "public"."mrp_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_mrp_run_id_mrp_runs_id_fk" FOREIGN KEY ("mrp_run_id") REFERENCES "public"."mrp_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_material_id_products_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_reserved_by_users_id_fk" FOREIGN KEY ("reserved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "three_way_match_results" ADD CONSTRAINT "three_way_match_results_invoice_id_vendor_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."vendor_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "three_way_match_results" ADD CONSTRAINT "three_way_match_results_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "three_way_match_results" ADD CONSTRAINT "three_way_match_results_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "public"."goods_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "three_way_match_results" ADD CONSTRAINT "three_way_match_results_matched_by_users_id_fk" FOREIGN KEY ("matched_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_vehicle_fuel_logs" ADD CONSTRAINT "mm_vehicle_fuel_logs_vehicle_id_mm_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."mm_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_vehicle_fuel_logs" ADD CONSTRAINT "mm_vehicle_fuel_logs_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_locations" ADD CONSTRAINT "vehicle_locations_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_vehicle_maintenance" ADD CONSTRAINT "mm_vehicle_maintenance_vehicle_id_mm_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."mm_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mm_vehicles" ADD CONSTRAINT "mm_vehicles_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoice_lines" ADD CONSTRAINT "vendor_invoice_lines_invoice_id_vendor_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."vendor_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_goods_receipt_id_goods_receipts_id_fk" FOREIGN KEY ("goods_receipt_id") REFERENCES "public"."goods_receipts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_gl_document_id_gl_documents_id_fk" FOREIGN KEY ("gl_document_id") REFERENCES "public"."gl_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invoices" ADD CONSTRAINT "vendor_invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_performance_metrics" ADD CONSTRAINT "vendor_performance_metrics_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_headers" ADD CONSTRAINT "bom_headers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_headers" ADD CONSTRAINT "bom_headers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bom_id_bom_headers_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bom_headers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_component_id_products_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downtime_logs" ADD CONSTRAINT "downtime_logs_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downtime_logs" ADD CONSTRAINT "downtime_logs_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_results" ADD CONSTRAINT "mrp_results_mrp_run_id_mrp_runs_id_fk" FOREIGN KEY ("mrp_run_id") REFERENCES "public"."mrp_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_results" ADD CONSTRAINT "mrp_results_material_id_products_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mrp_runs" ADD CONSTRAINT "mrp_runs_run_by_users_id_fk" FOREIGN KEY ("run_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_fact" ADD CONSTRAINT "production_fact_plan_line_id_production_plan_lines_id_fk" FOREIGN KEY ("plan_line_id") REFERENCES "public"."production_plan_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_fact" ADD CONSTRAINT "production_fact_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_fact" ADD CONSTRAINT "production_fact_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_fact" ADD CONSTRAINT "production_fact_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_facts_sm72" ADD CONSTRAINT "production_facts_sm72_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_facts_sm72" ADD CONSTRAINT "production_facts_sm72_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_components" ADD CONSTRAINT "production_order_components_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_components" ADD CONSTRAINT "production_order_components_raw_material_id_raw_materials_id_fk" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_components" ADD CONSTRAINT "production_order_components_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_operations" ADD CONSTRAINT "production_order_operations_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_operations" ADD CONSTRAINT "production_order_operations_routing_operation_id_routing_operations_id_fk" FOREIGN KEY ("routing_operation_id") REFERENCES "public"."routing_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_operations" ADD CONSTRAINT "production_order_operations_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_order_operations" ADD CONSTRAINT "production_order_operations_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_bom_id_bom_headers_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bom_headers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_routing_id_routings_id_fk" FOREIGN KEY ("routing_id") REFERENCES "public"."routings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_responsible_manager_id_users_id_fk" FOREIGN KEY ("responsible_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_shift_supervisor_id_users_id_fk" FOREIGN KEY ("shift_supervisor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_qc_inspector_id_users_id_fk" FOREIGN KEY ("qc_inspector_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_plan_header" ADD CONSTRAINT "production_plan_header_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_plan_header" ADD CONSTRAINT "production_plan_header_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_plan_lines" ADD CONSTRAINT "production_plan_lines_plan_id_production_plan_header_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."production_plan_header"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_plan_lines" ADD CONSTRAINT "production_plan_lines_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_plan_lines" ADD CONSTRAINT "production_plan_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_qc_checks" ADD CONSTRAINT "production_qc_checks_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_qc_checks" ADD CONSTRAINT "production_qc_checks_checked_by_users_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_status_history" ADD CONSTRAINT "production_status_history_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_status_history" ADD CONSTRAINT "production_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_routing_id_routings_id_fk" FOREIGN KEY ("routing_id") REFERENCES "public"."routings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routing_operations" ADD CONSTRAINT "routing_operations_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routings" ADD CONSTRAINT "routings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routings" ADD CONSTRAINT "routings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_calendars" ADD CONSTRAINT "shift_calendars_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_evaluations" ADD CONSTRAINT "shift_evaluations_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_center_capacity" ADD CONSTRAINT "work_center_capacity_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_centers" ADD CONSTRAINT "work_centers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "excel_import_batches" ADD CONSTRAINT "excel_import_batches_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "excel_import_rows" ADD CONSTRAINT "excel_import_rows_batch_id_excel_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."excel_import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "excel_source_columns" ADD CONSTRAINT "excel_source_columns_batch_id_excel_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."excel_import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_calculations" ADD CONSTRAINT "formula_calculations_formula_id_formula_definitions_id_fk" FOREIGN KEY ("formula_id") REFERENCES "public"."formula_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_calculations" ADD CONSTRAINT "formula_calculations_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "formula_calculations" ADD CONSTRAINT "formula_calculations_excel_import_row_id_excel_import_rows_id_fk" FOREIGN KEY ("excel_import_row_id") REFERENCES "public"."excel_import_rows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_tasks" ADD CONSTRAINT "machine_tasks_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_tasks" ADD CONSTRAINT "machine_tasks_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_tasks" ADD CONSTRAINT "machine_tasks_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_tasks" ADD CONSTRAINT "machine_tasks_routing_operation_id_routing_operations_id_fk" FOREIGN KEY ("routing_operation_id") REFERENCES "public"."routing_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_tasks" ADD CONSTRAINT "machine_tasks_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_tasks" ADD CONSTRAINT "machine_tasks_excel_import_row_id_excel_import_rows_id_fk" FOREIGN KEY ("excel_import_row_id") REFERENCES "public"."excel_import_rows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_tasks" ADD CONSTRAINT "machine_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papka_orders" ADD CONSTRAINT "papka_orders_bom_id_bom_headers_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bom_headers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papka_orders" ADD CONSTRAINT "papka_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papka_orders" ADD CONSTRAINT "papka_orders_routing_id_routings_id_fk" FOREIGN KEY ("routing_id") REFERENCES "public"."routings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papka_orders" ADD CONSTRAINT "papka_orders_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papka_orders" ADD CONSTRAINT "papka_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_operations" ADD CONSTRAINT "planning_operations_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_operations" ADD CONSTRAINT "planning_operations_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_operations" ADD CONSTRAINT "planning_operations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_facts" ADD CONSTRAINT "production_facts_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_facts" ADD CONSTRAINT "production_facts_planning_operation_id_planning_operations_id_fk" FOREIGN KEY ("planning_operation_id") REFERENCES "public"."planning_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_facts" ADD CONSTRAINT "production_facts_excel_import_row_id_excel_import_rows_id_fk" FOREIGN KEY ("excel_import_row_id") REFERENCES "public"."excel_import_rows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downtime_events" ADD CONSTRAINT "downtime_events_session_id_production_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."production_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "downtime_events" ADD CONSTRAINT "downtime_events_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oee_snapshots" ADD CONSTRAINT "oee_snapshots_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_sessions" ADD CONSTRAINT "production_sessions_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_sessions" ADD CONSTRAINT "production_sessions_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_sessions" ADD CONSTRAINT "production_sessions_device_id_sensor_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."sensor_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_sessions" ADD CONSTRAINT "production_sessions_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_devices" ADD CONSTRAINT "sensor_devices_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_devices" ADD CONSTRAINT "sensor_devices_work_center_id_work_centers_id_fk" FOREIGN KEY ("work_center_id") REFERENCES "public"."work_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_device_id_sensor_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."sensor_devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sensor_readings" ADD CONSTRAINT "sensor_readings_session_id_production_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."production_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_session_events" ADD CONSTRAINT "worker_session_events_session_id_production_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."production_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_session_events" ADD CONSTRAINT "worker_session_events_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_templates" ADD CONSTRAINT "brand_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_comments" ADD CONSTRAINT "design_comments_design_id_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_comments" ADD CONSTRAINT "design_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designOrderMessages" ADD CONSTRAINT "designOrderMessages_orderId_design_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."design_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designOrderMessages" ADD CONSTRAINT "designOrderMessages_senderId_users_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designOrderNotifications" ADD CONSTRAINT "designOrderNotifications_orderId_design_orders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."design_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designOrderNotifications" ADD CONSTRAINT "designOrderNotifications_recipientId_users_id_fk" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_orders" ADD CONSTRAINT "design_orders_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_orders" ADD CONSTRAINT "design_orders_assigned_designer_id_users_id_fk" FOREIGN KEY ("assigned_designer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_orders" ADD CONSTRAINT "design_orders_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_orders" ADD CONSTRAINT "design_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "design_tooling" ADD CONSTRAINT "design_tooling_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designs" ADD CONSTRAINT "designs_order_id_design_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."design_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designs" ADD CONSTRAINT "designs_template_id_brand_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."brand_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designs" ADD CONSTRAINT "designs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designs" ADD CONSTRAINT "designs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_planning_decisions" ADD CONSTRAINT "ai_planning_decisions_plan_id_ai_production_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."ai_production_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_production_plans" ADD CONSTRAINT "ai_production_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_production_plans" ADD CONSTRAINT "ai_production_plans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_inventory" ADD CONSTRAINT "asset_inventory_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_inventory" ADD CONSTRAINT "asset_inventory_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_setup_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."setup_checklists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defect_reports" ADD CONSTRAINT "defect_reports_session_id_production_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."production_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defect_reports" ADD CONSTRAINT "defect_reports_order_id_papka_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defect_reports" ADD CONSTRAINT "defect_reports_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "defect_reports" ADD CONSTRAINT "defect_reports_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_crews" ADD CONSTRAINT "machine_crews_session_id_production_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."production_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_crews" ADD CONSTRAINT "machine_crews_master_id_users_id_fk" FOREIGN KEY ("master_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_crews" ADD CONSTRAINT "machine_crews_polmaster_id_users_id_fk" FOREIGN KEY ("polmaster_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_crews" ADD CONSTRAINT "machine_crews_shogird_id_users_id_fk" FOREIGN KEY ("shogird_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_crews" ADD CONSTRAINT "machine_crews_rokler_id_users_id_fk" FOREIGN KEY ("rokler_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_consumption" ADD CONSTRAINT "material_consumption_session_id_production_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."production_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_consumption" ADD CONSTRAINT "material_consumption_order_id_papka_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_consumption" ADD CONSTRAINT "material_consumption_kit_id_material_kits_id_fk" FOREIGN KEY ("kit_id") REFERENCES "public"."material_kits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_consumption" ADD CONSTRAINT "material_consumption_material_id_raw_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_consumption" ADD CONSTRAINT "material_consumption_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_norms" ADD CONSTRAINT "material_norms_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_norms" ADD CONSTRAINT "material_norms_technology_card_id_technology_cards_id_fk" FOREIGN KEY ("technology_card_id") REFERENCES "public"."technology_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_norms" ADD CONSTRAINT "material_norms_material_category_id_material_categories_id_fk" FOREIGN KEY ("material_category_id") REFERENCES "public"."material_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_norms" ADD CONSTRAINT "material_norms_material_id_raw_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."raw_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_order_id_papka_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_approvals" ADD CONSTRAINT "order_approvals_qc_test_id_qc_material_tests_id_fk" FOREIGN KEY ("qc_test_id") REFERENCES "public"."qc_material_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_production_history" ADD CONSTRAINT "order_production_history_order_id_papka_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_production_history" ADD CONSTRAINT "order_production_history_session_id_production_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."production_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_production_history" ADD CONSTRAINT "order_production_history_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_production_history" ADD CONSTRAINT "order_production_history_master_id_users_id_fk" FOREIGN KEY ("master_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_production_history" ADD CONSTRAINT "order_production_history_polmaster_id_users_id_fk" FOREIGN KEY ("polmaster_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_production_history" ADD CONSTRAINT "order_production_history_shogird_id_users_id_fk" FOREIGN KEY ("shogird_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_production_history" ADD CONSTRAINT "order_production_history_roxlerchi_id_users_id_fk" FOREIGN KEY ("roxlerchi_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_product_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_masters" ADD CONSTRAINT "product_masters_unit_of_measure_id_unit_of_measures_id_fk" FOREIGN KEY ("unit_of_measure_id") REFERENCES "public"."unit_of_measures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_masters" ADD CONSTRAINT "product_masters_default_warehouse_id_warehouses_id_fk" FOREIGN KEY ("default_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_masters" ADD CONSTRAINT "product_masters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_checklists" ADD CONSTRAINT "setup_checklists_session_id_production_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."production_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_checklists" ADD CONSTRAINT "setup_checklists_kit_id_material_kits_id_fk" FOREIGN KEY ("kit_id") REFERENCES "public"."material_kits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_checklists" ADD CONSTRAINT "setup_checklists_order_id_papka_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setup_checklists" ADD CONSTRAINT "setup_checklists_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_worker_id_users_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sos_alerts" ADD CONSTRAINT "sos_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_cards" ADD CONSTRAINT "technology_cards_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_cards" ADD CONSTRAINT "technology_cards_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waste_records" ADD CONSTRAINT "waste_records_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_braks" ADD CONSTRAINT "qc_braks_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_braks" ADD CONSTRAINT "qc_braks_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_braks" ADD CONSTRAINT "qc_braks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_final_inspections" ADD CONSTRAINT "qc_final_inspections_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_final_inspections" ADD CONSTRAINT "qc_final_inspections_inspected_by_users_id_fk" FOREIGN KEY ("inspected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_material_tests" ADD CONSTRAINT "qc_material_tests_order_id_papka_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_material_tests" ADD CONSTRAINT "qc_material_tests_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_material_tests" ADD CONSTRAINT "qc_material_tests_tested_by_users_id_fk" FOREIGN KEY ("tested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_parameter_definitions" ADD CONSTRAINT "qc_parameter_definitions_standard_id_qc_standards_id_fk" FOREIGN KEY ("standard_id") REFERENCES "public"."qc_standards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_reclamations" ADD CONSTRAINT "qc_reclamations_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_reclamations" ADD CONSTRAINT "qc_reclamations_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_reclamations" ADD CONSTRAINT "qc_reclamations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_root_causes" ADD CONSTRAINT "qc_root_causes_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_root_causes" ADD CONSTRAINT "qc_root_causes_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_root_causes" ADD CONSTRAINT "qc_root_causes_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_root_causes" ADD CONSTRAINT "qc_root_causes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_supplier_quality" ADD CONSTRAINT "qc_supplier_quality_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qc_supplier_quality" ADD CONSTRAINT "qc_supplier_quality_test_id_qc_material_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."qc_material_tests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_tenant_api_usage" ADD CONSTRAINT "saas_tenant_api_usage_tenant_id_saas_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."saas_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_tenant_error_logs" ADD CONSTRAINT "saas_tenant_error_logs_tenant_id_saas_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."saas_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_tenant_modules" ADD CONSTRAINT "saas_tenant_modules_tenant_id_saas_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."saas_tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_contacts" ADD CONSTRAINT "sd_contacts_customer_id_sd_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."sd_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_contracts" ADD CONSTRAINT "sd_contracts_order_id_sd_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sd_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_lead_activities" ADD CONSTRAINT "sd_lead_activities_lead_id_sd_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."sd_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_leads" ADD CONSTRAINT "sd_leads_customer_id_sd_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."sd_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_orders" ADD CONSTRAINT "sd_orders_quotation_id_sd_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."sd_quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_orders" ADD CONSTRAINT "sd_orders_customer_id_sd_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."sd_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_payments" ADD CONSTRAINT "sd_payments_order_id_sd_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sd_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_payments" ADD CONSTRAINT "sd_payments_customer_id_sd_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."sd_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_quotation_items" ADD CONSTRAINT "sd_quotation_items_quotation_id_sd_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."sd_quotations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_quotations" ADD CONSTRAINT "sd_quotations_lead_id_sd_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."sd_leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_quotations" ADD CONSTRAINT "sd_quotations_customer_id_sd_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."sd_customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sd_storage_fees" ADD CONSTRAINT "sd_storage_fees_order_id_sd_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."sd_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_documents" ADD CONSTRAINT "billing_documents_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_documents" ADD CONSTRAINT "billing_documents_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_documents" ADD CONSTRAINT "billing_documents_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_documents" ADD CONSTRAINT "billing_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_items" ADD CONSTRAINT "billing_items_billing_document_id_billing_documents_id_fk" FOREIGN KEY ("billing_document_id") REFERENCES "public"."billing_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_items" ADD CONSTRAINT "billing_items_sales_order_item_id_sales_order_items_id_fk" FOREIGN KEY ("sales_order_item_id") REFERENCES "public"."sales_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_items" ADD CONSTRAINT "billing_items_delivery_item_id_delivery_items_id_fk" FOREIGN KEY ("delivery_item_id") REFERENCES "public"."delivery_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_items" ADD CONSTRAINT "billing_items_material_id_products_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_calculations" ADD CONSTRAINT "commission_calculations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_calculations" ADD CONSTRAINT "commission_calculations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_calculations" ADD CONSTRAINT "commission_calculations_calculated_by_users_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_check_logs" ADD CONSTRAINT "credit_check_logs_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_check_logs" ADD CONSTRAINT "credit_check_logs_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_limits" ADD CONSTRAINT "customer_credit_limits_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_limits" ADD CONSTRAINT "customer_credit_limits_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_target_tracking" ADD CONSTRAINT "daily_target_tracking_sales_target_id_sales_targets_id_fk" FOREIGN KEY ("sales_target_id") REFERENCES "public"."sales_targets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_delivery_id_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_sales_order_item_id_sales_order_items_id_fk" FOREIGN KEY ("sales_order_item_id") REFERENCES "public"."sales_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_material_id_products_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_commissions" ADD CONSTRAINT "order_commissions_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_commissions" ADD CONSTRAINT "order_commissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_commissions" ADD CONSTRAINT "order_commissions_calculation_id_commission_calculations_id_fk" FOREIGN KEY ("calculation_id") REFERENCES "public"."commission_calculations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_forecasts" ADD CONSTRAINT "sales_forecasts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_gl_document_id_gl_documents_id_fk" FOREIGN KEY ("gl_document_id") REFERENCES "public"."gl_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_invoices" ADD CONSTRAINT "sales_invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_sales_order_id_sales_orders_id_fk" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_material_id_products_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_production_order_id_production_orders_id_fk" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_crm_companies_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."crm_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_matrix_config" ADD CONSTRAINT "approval_matrix_config_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_level_approval_history" ADD CONSTRAINT "multi_level_approval_history_request_id_approval_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."approval_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_level_approval_history" ADD CONSTRAINT "multi_level_approval_history_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_ppe_checks" ADD CONSTRAINT "security_ppe_checks_checked_by_users_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_visitors" ADD CONSTRAINT "security_visitors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_health_assessment" ADD CONSTRAINT "company_health_assessment_current_stage_id_business_stages_id_fk" FOREIGN KEY ("current_stage_id") REFERENCES "public"."business_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_health_assessment" ADD CONSTRAINT "company_health_assessment_assessed_by_users_id_fk" FOREIGN KEY ("assessed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "function_kpis" ADD CONSTRAINT "function_kpis_function_id_company_functions_id_fk" FOREIGN KEY ("function_id") REFERENCES "public"."company_functions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_chart_settings" ADD CONSTRAINT "org_chart_settings_ceo_user_id_users_id_fk" FOREIGN KEY ("ceo_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_chart_snapshots" ADD CONSTRAINT "org_chart_snapshots_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raci_assignments" ADD CONSTRAINT "raci_assignments_task_id_raci_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."raci_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raci_assignments" ADD CONSTRAINT "raci_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_milestones" ADD CONSTRAINT "strategic_milestones_task_id_strategic_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."strategic_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_tasks" ADD CONSTRAINT "strategic_tasks_category_id_strategic_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."strategic_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_tasks" ADD CONSTRAINT "strategic_tasks_assigned_department_id_departments_id_fk" FOREIGN KEY ("assigned_department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategic_tasks" ADD CONSTRAINT "strategic_tasks_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barcode_movements" ADD CONSTRAINT "barcode_movements_barcode_id_material_barcodes_id_fk" FOREIGN KEY ("barcode_id") REFERENCES "public"."material_barcodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barcode_movements" ADD CONSTRAINT "barcode_movements_from_bin_id_warehouse_bins_id_fk" FOREIGN KEY ("from_bin_id") REFERENCES "public"."warehouse_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barcode_movements" ADD CONSTRAINT "barcode_movements_to_bin_id_warehouse_bins_id_fk" FOREIGN KEY ("to_bin_id") REFERENCES "public"."warehouse_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barcode_movements" ADD CONSTRAINT "barcode_movements_moved_by_users_id_fk" FOREIGN KEY ("moved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barcode_print_queue" ADD CONSTRAINT "barcode_print_queue_barcode_id_material_barcodes_id_fk" FOREIGN KEY ("barcode_id") REFERENCES "public"."material_barcodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barcode_print_queue" ADD CONSTRAINT "barcode_print_queue_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_count_results" ADD CONSTRAINT "cycle_count_results_task_id_picking_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."picking_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_count_results" ADD CONSTRAINT "cycle_count_results_barcode_id_material_barcodes_id_fk" FOREIGN KEY ("barcode_id") REFERENCES "public"."material_barcodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_count_results" ADD CONSTRAINT "cycle_count_results_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_count_results" ADD CONSTRAINT "cycle_count_results_bin_id_warehouse_bins_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."warehouse_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_count_results" ADD CONSTRAINT "cycle_count_results_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_count_results" ADD CONSTRAINT "cycle_count_results_adjustment_approved_by_users_id_fk" FOREIGN KEY ("adjustment_approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_count_results" ADD CONSTRAINT "cycle_count_results_counted_by_users_id_fk" FOREIGN KEY ("counted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_warehouse_plans" ADD CONSTRAINT "daily_warehouse_plans_prepared_by_users_id_fk" FOREIGN KEY ("prepared_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_logs" ADD CONSTRAINT "exit_logs_person_id_users_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_logs" ADD CONSTRAINT "exit_logs_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_requests" ADD CONSTRAINT "internal_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_requests" ADD CONSTRAINT "internal_requests_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_valuation" ADD CONSTRAINT "inventory_valuation_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picking_tasks" ADD CONSTRAINT "picking_tasks_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picking_tasks" ADD CONSTRAINT "picking_tasks_from_bin_id_warehouse_bins_id_fk" FOREIGN KEY ("from_bin_id") REFERENCES "public"."warehouse_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picking_tasks" ADD CONSTRAINT "picking_tasks_to_bin_id_warehouse_bins_id_fk" FOREIGN KEY ("to_bin_id") REFERENCES "public"."warehouse_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picking_tasks" ADD CONSTRAINT "picking_tasks_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picking_tasks" ADD CONSTRAINT "picking_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "picking_tasks" ADD CONSTRAINT "picking_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_material_balance" ADD CONSTRAINT "production_material_balance_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement_gl_postings" ADD CONSTRAINT "stock_movement_gl_postings_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement_gl_postings" ADD CONSTRAINT "stock_movement_gl_postings_gl_document_id_gl_documents_id_fk" FOREIGN KEY ("gl_document_id") REFERENCES "public"."gl_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement_gl_postings" ADD CONSTRAINT "stock_movement_gl_postings_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement_gl_postings" ADD CONSTRAINT "stock_movement_gl_postings_profit_center_id_profit_centers_id_fk" FOREIGN KEY ("profit_center_id") REFERENCES "public"."profit_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movement_gl_postings" ADD CONSTRAINT "stock_movement_gl_postings_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_moves" ADD CONSTRAINT "stock_moves_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_transfer_id_stock_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."stock_transfers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_from_warehouse_id_warehouses_id_fk" FOREIGN KEY ("from_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_to_warehouse_id_warehouses_id_fk" FOREIGN KEY ("to_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_from_bin_id_warehouse_bins_id_fk" FOREIGN KEY ("from_bin_id") REFERENCES "public"."warehouse_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_to_bin_id_warehouse_bins_id_fk" FOREIGN KEY ("to_bin_id") REFERENCES "public"."warehouse_bins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_shipped_by_users_id_fk" FOREIGN KEY ("shipped_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_bins" ADD CONSTRAINT "warehouse_bins_zone_id_warehouse_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."warehouse_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_bins" ADD CONSTRAINT "warehouse_bins_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_rental_records" ADD CONSTRAINT "warehouse_rental_records_order_id_papka_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_rental_records" ADD CONSTRAINT "warehouse_rental_records_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_rental_records" ADD CONSTRAINT "warehouse_rental_records_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_rental_settings" ADD CONSTRAINT "warehouse_rental_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_stock" ADD CONSTRAINT "warehouse_stock_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_material_card_id_material_cards_id_fk" FOREIGN KEY ("material_card_id") REFERENCES "public"."material_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_papka_order_id_papka_orders_id_fk" FOREIGN KEY ("papka_order_id") REFERENCES "public"."papka_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_production_fact_id_production_facts_id_fk" FOREIGN KEY ("production_fact_id") REFERENCES "public"."production_facts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_excel_import_row_id_excel_import_rows_id_fk" FOREIGN KEY ("excel_import_row_id") REFERENCES "public"."excel_import_rows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_transactions" ADD CONSTRAINT "warehouse_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_zones" ADD CONSTRAINT "warehouse_zones_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interview_questions" ADD CONSTRAINT "ai_interview_questions_interview_id_ai_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."ai_interviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interviews" ADD CONSTRAINT "ai_interviews_candidate_id_users_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_feature_flags" ADD CONSTRAINT "position_feature_flags_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_permissions" ADD CONSTRAINT "position_permissions_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_read" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_users_status" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_users_department_id" ON "users" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_telegram_chat_id" ON "users" USING btree ("telegram_chat_id");--> statement-breakpoint
CREATE INDEX "idx_sales_orders_status" ON "sales_orders" USING btree ("overall_status");--> statement-breakpoint
CREATE INDEX "idx_sales_orders_customer_id" ON "sales_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_sales_orders_master_status" ON "sales_orders" USING btree ("master_status");--> statement-breakpoint
CREATE INDEX "idx_sales_orders_created_at" ON "sales_orders" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pos_ff_position_feature" ON "position_feature_flags" USING btree ("position_id","feature_key");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pos_perm_position_module" ON "position_permissions" USING btree ("position_id","module_code");