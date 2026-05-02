-- Migration: LMS Extended, Kanban Extended, Website Extended tables
-- Schema files: lms-extended.ts, kanban-extended.ts, website-extended.ts

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lms_exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"course_id" integer,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"passing_score" real DEFAULT 70 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lms_exam_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"options" jsonb NOT NULL,
	"correct_option" integer NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lms_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lms_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"content_type" varchar(20) DEFAULT 'text' NOT NULL,
	"content_url" text,
	"content_body" text,
	"duration_min" integer DEFAULT 0,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lms_exam_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"score" real,
	"status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lms_exam_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"selected_option" integer NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lms_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"exam_id" integer NOT NULL,
	"score" real NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kanban_card_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"is_done" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kanban_card_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_id" integer NOT NULL,
	"text" varchar(500) NOT NULL,
	"is_checked" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketing_content_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" varchar(30) NOT NULL,
	"content" text NOT NULL,
	"media_urls" jsonb DEFAULT '[]',
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"author_id" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketing_social_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" varchar(30) NOT NULL,
	"account_name" varchar(200) NOT NULL,
	"access_token_enc" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "website_portfolio" (
	"id" serial PRIMARY KEY NOT NULL,
	"title_uz" varchar(300) NOT NULL,
	"title_ru" varchar(300),
	"description_uz" text,
	"description_ru" text,
	"image_url" text,
	"category" varchar(100),
	"client_name" varchar(200),
	"completed_at" timestamp,
	"is_featured" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE "lms_exams" ADD CONSTRAINT "lms_exams_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "lms_exam_questions" ADD CONSTRAINT "lms_exam_questions_exam_id_lms_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."lms_exams"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "lms_modules" ADD CONSTRAINT "lms_modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "lms_lessons" ADD CONSTRAINT "lms_lessons_module_id_lms_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."lms_modules"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "lms_exam_attempts" ADD CONSTRAINT "lms_exam_attempts_exam_id_lms_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."lms_exams"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "lms_exam_attempts" ADD CONSTRAINT "lms_exam_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "lms_exam_answers" ADD CONSTRAINT "lms_exam_answers_attempt_id_lms_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."lms_exam_attempts"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "lms_certificates" ADD CONSTRAINT "lms_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "lms_certificates" ADD CONSTRAINT "lms_certificates_exam_id_lms_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."lms_exams"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "kanban_card_checklists" ADD CONSTRAINT "kanban_card_checklists_card_id_kanban_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."kanban_cards"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "kanban_card_checklist_items" ADD CONSTRAINT "kanban_card_checklist_items_checklist_id_kanban_card_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."kanban_card_checklists"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "marketing_content_posts" ADD CONSTRAINT "marketing_content_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
