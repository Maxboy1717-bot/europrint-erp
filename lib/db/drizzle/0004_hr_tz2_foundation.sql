-- HR-01: pgvector extension + 12 hr_tz2_* tables (Foundation)
-- Matches Drizzle schema in lib/db/src/schema/hr-tz2-schema.ts
-- All FKs to employees/positions/departments/vacancies use INTEGER (serial PKs).

--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS vector;

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_territory_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" integer NOT NULL,
	"event_type" varchar(30) NOT NULL,
	"camera_id" uuid,
	"ts" timestamp NOT NULL,
	"face_confidence" numeric(5, 2),
	"room_code" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hr_tz2_territory_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_territory_emp_ts_idx" ON "hr_tz2_territory_logs" ("employee_id","ts");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_territory_event_idx" ON "hr_tz2_territory_logs" ("event_type");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_attendance_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" integer NOT NULL,
	"photo_url" text NOT NULL,
	"taken_at" timestamp NOT NULL,
	"room_code" varchar(50),
	"analysis_result" jsonb,
	"processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hr_tz2_attendance_photos_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_photos_emp_taken_idx" ON "hr_tz2_attendance_photos" ("employee_id","taken_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_photos_processed_idx" ON "hr_tz2_attendance_photos" ("processed");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_ai_question_banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"position_id" integer,
	"position_code" varchar(50),
	"category" varchar(30) NOT NULL,
	"question_uz" text NOT NULL,
	"question_ru" text,
	"question_en" text,
	"expected_keywords" jsonb,
	"scoring_rubric" jsonb,
	"follow_up_questions" jsonb,
	"difficulty" integer DEFAULT 3 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hr_tz2_ai_question_banks_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_qbank_position_idx" ON "hr_tz2_ai_question_banks" ("position_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_qbank_category_idx" ON "hr_tz2_ai_question_banks" ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_qbank_active_idx" ON "hr_tz2_ai_question_banks" ("is_active");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_room_reference_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_code" varchar(50) NOT NULL,
	"room_name" varchar(200) NOT NULL,
	"department_code" varchar(50),
	"photo_url" text NOT NULL,
	"description" text,
	"last_updated_at" timestamp,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hr_tz2_room_reference_photos_room_code_key" UNIQUE("room_code")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_room_ref_code_idx" ON "hr_tz2_room_reference_photos" ("room_code");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_ai_room_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_code" varchar(50) NOT NULL,
	"reference_photo_id" uuid,
	"current_photo_url" text NOT NULL,
	"analyzed_at" timestamp NOT NULL,
	"cleanliness_score" numeric(5, 2),
	"order_score" numeric(5, 2),
	"equipment_ok" boolean,
	"issues" jsonb,
	"anomalies" jsonb,
	"notified_hr" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hr_tz2_ai_room_analysis_reference_photo_id_fkey" FOREIGN KEY ("reference_photo_id") REFERENCES "hr_tz2_room_reference_photos"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_room_analysis_code_idx" ON "hr_tz2_ai_room_analysis" ("room_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_room_analysis_at_idx" ON "hr_tz2_ai_room_analysis" ("analyzed_at");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_internal_job_postings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vacancy_id" integer,
	"title" varchar(200) NOT NULL,
	"department_id" integer,
	"description" text,
	"min_experience_months" integer,
	"required_skills" jsonb,
	"salary_range" jsonb,
	"deadline" date,
	"status" varchar(20) DEFAULT 'OPEN' NOT NULL,
	"applicants_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	CONSTRAINT "hr_tz2_internal_job_postings_vacancy_id_fkey" FOREIGN KEY ("vacancy_id") REFERENCES "vacancies"("id") ON DELETE SET NULL,
	CONSTRAINT "hr_tz2_internal_job_postings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_ijp_status_idx" ON "hr_tz2_internal_job_postings" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_ijp_dept_idx" ON "hr_tz2_internal_job_postings" ("department_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_ijp_deadline_idx" ON "hr_tz2_internal_job_postings" ("deadline");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_internal_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"posting_id" uuid NOT NULL,
	"employee_id" integer NOT NULL,
	"cover_letter" text,
	"current_position" varchar(200),
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hrtz2_iapp_posting_emp_uniq" UNIQUE("posting_id","employee_id"),
	CONSTRAINT "hr_tz2_internal_applications_posting_id_fkey" FOREIGN KEY ("posting_id") REFERENCES "hr_tz2_internal_job_postings"("id") ON DELETE CASCADE,
	CONSTRAINT "hr_tz2_internal_applications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_iapp_posting_idx" ON "hr_tz2_internal_applications" ("posting_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_iapp_employee_idx" ON "hr_tz2_internal_applications" ("employee_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_iapp_status_idx" ON "hr_tz2_internal_applications" ("status");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_talent_pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" integer NOT NULL,
	"readiness_level" varchar(20),
	"target_position_ids" jsonb,
	"development_plan" text,
	"strengths" jsonb,
	"gaps" jsonb,
	"mentor_id" integer,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"next_review_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hr_tz2_talent_pool_employee_id_key" UNIQUE("employee_id"),
	CONSTRAINT "hr_tz2_talent_pool_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
	CONSTRAINT "hr_tz2_talent_pool_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "employees"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_talent_readiness_idx" ON "hr_tz2_talent_pool" ("readiness_level");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_talent_mentor_idx" ON "hr_tz2_talent_pool" ("mentor_id");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_contract_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"contract_type" varchar(30),
	"start_date" date,
	"end_date" date,
	"position_id" integer,
	"department_id" integer,
	"salary_amount" numeric(15, 2),
	"salary_currency" varchar(5) DEFAULT 'UZS' NOT NULL,
	"changes_summary" text,
	"document_url" text,
	"signed_by_employee" boolean DEFAULT false NOT NULL,
	"signed_by_hr" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hrtz2_contract_emp_version_uniq" UNIQUE("employee_id","version_number"),
	CONSTRAINT "hr_tz2_contract_versions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE,
	CONSTRAINT "hr_tz2_contract_versions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL,
	CONSTRAINT "hr_tz2_contract_versions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_contract_emp_idx" ON "hr_tz2_contract_versions" ("employee_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_contract_type_idx" ON "hr_tz2_contract_versions" ("contract_type");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_signed_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" integer NOT NULL,
	"policy_name" varchar(200) NOT NULL,
	"policy_version" varchar(20),
	"policy_url" text,
	"signed_at" timestamp,
	"signature_method" varchar(20),
	"signature_evidence_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hrtz2_policy_emp_name_ver_uniq" UNIQUE("employee_id","policy_name","policy_version"),
	CONSTRAINT "hr_tz2_signed_policies_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_policy_emp_idx" ON "hr_tz2_signed_policies" ("employee_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_policy_name_idx" ON "hr_tz2_signed_policies" ("policy_name");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_recruiter_kpi_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recruiter_id" integer NOT NULL,
	"date" date NOT NULL,
	"vacancies_owned" integer DEFAULT 0 NOT NULL,
	"candidates_screened" integer DEFAULT 0 NOT NULL,
	"ai_interviews_sent" integer DEFAULT 0 NOT NULL,
	"live_interviews_scheduled" integer DEFAULT 0 NOT NULL,
	"offers_made" integer DEFAULT 0 NOT NULL,
	"hires_closed" integer DEFAULT 0 NOT NULL,
	"avg_time_to_hire_days" numeric(5, 1),
	"sla_breaches" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hrtz2_kpi_recruiter_date_uniq" UNIQUE("recruiter_id","date"),
	CONSTRAINT "hr_tz2_recruiter_kpi_daily_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "employees"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_kpi_recruiter_idx" ON "hr_tz2_recruiter_kpi_daily" ("recruiter_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_kpi_date_idx" ON "hr_tz2_recruiter_kpi_daily" ("date");

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hr_tz2_monthly_employee_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" integer NOT NULL,
	"year_month" varchar(7) NOT NULL,
	"work_days_total" integer,
	"work_days_actual" integer,
	"late_count" integer,
	"absence_count" integer,
	"daily_reports_submitted" integer,
	"daily_reports_missed" integer,
	"avg_360_score" numeric(4, 2),
	"avg_kpi_score" numeric(4, 2),
	"rewards_count" integer,
	"penalties_total" numeric(15, 2),
	"penalties_currency" varchar(5) DEFAULT 'UZS' NOT NULL,
	"salary_base" numeric(15, 2),
	"salary_bonus" numeric(15, 2),
	"salary_advance" numeric(15, 2),
	"salary_deductions" numeric(15, 2),
	"salary_net" numeric(15, 2),
	"pdf_url" text,
	"generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "hrtz2_monthly_emp_month_uniq" UNIQUE("employee_id","year_month"),
	CONSTRAINT "hr_tz2_monthly_employee_cards_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_monthly_emp_idx" ON "hr_tz2_monthly_employee_cards" ("employee_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hrtz2_monthly_yearmonth_idx" ON "hr_tz2_monthly_employee_cards" ("year_month");
