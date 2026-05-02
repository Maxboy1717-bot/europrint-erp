-- Migration: Recruitment funnel yangilash
-- 1. recruitment_funnel_stage enum ga yangi bosqichlar qo'shish
-- 2. productivity_category enum yangi nomlar bilan yangilash
-- 3. hr_references_checks jadvali yaratish
-- 4. job_offer_status enum va hr_job_offers jadvali yaratish
-- 5. Mavjud PROCESSNIK → PROTSESSNIK, UNPRODUCTIVE → TRABLDAYKER batch-update

-- Step 1: Add new values to recruitment_funnel_stage enum
ALTER TYPE "public"."recruitment_funnel_stage" ADD VALUE IF NOT EXISTS 'TEST_ANALYSIS';
ALTER TYPE "public"."recruitment_funnel_stage" ADD VALUE IF NOT EXISTS 'REFERENCES_CHECK';
ALTER TYPE "public"."recruitment_funnel_stage" ADD VALUE IF NOT EXISTS 'PROBATION';

-- Step 2: Update productivity_category enum
-- PostgreSQL enums require creating new type and swapping
-- Add new values first (old values remain for backward compatibility)
ALTER TYPE "public"."productivity_category" ADD VALUE IF NOT EXISTS 'PROTSESSNIK';
ALTER TYPE "public"."productivity_category" ADD VALUE IF NOT EXISTS 'TRABLDAYKER';

-- Step 3: Batch-update existing records to use new terminology
UPDATE "public"."hr_candidate_funnels"
SET productivity_category = 'PROTSESSNIK'::productivity_category
WHERE productivity_category = 'PROCESSNIK'::productivity_category;

UPDATE "public"."hr_candidate_funnels"
SET productivity_category = 'TRABLDAYKER'::productivity_category
WHERE productivity_category = 'UNPRODUCTIVE'::productivity_category;

UPDATE "public"."hr_tool_test_results"
SET category_result = 'PROTSESSNIK'::productivity_category
WHERE category_result = 'PROCESSNIK'::productivity_category;

UPDATE "public"."hr_tool_test_results"
SET category_result = 'TRABLDAYKER'::productivity_category
WHERE category_result = 'UNPRODUCTIVE'::productivity_category;

-- Step 4: Create hr_references_checks table
CREATE TABLE IF NOT EXISTS "public"."hr_references_checks" (
  "id" serial PRIMARY KEY NOT NULL,
  "funnel_id" integer NOT NULL REFERENCES "public"."hr_candidate_funnels"("id") ON DELETE cascade,
  "candidate_id" integer NOT NULL REFERENCES "public"."candidates"("id") ON DELETE cascade,
  "previous_company" varchar(200) NOT NULL,
  "contact_person" varchar(200) NOT NULL,
  "contact_phone" varchar(50),
  "contact_position" varchar(200),
  "result" text,
  "would_rehire" boolean,
  "notes" text,
  "rating" integer,
  "checked_by_id" integer REFERENCES "public"."users"("id"),
  "checked_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hr_references_checks_funnel_idx" ON "public"."hr_references_checks" ("funnel_id");
CREATE INDEX IF NOT EXISTS "hr_references_checks_candidate_idx" ON "public"."hr_references_checks" ("candidate_id");

-- Step 5: Create job_offer_status enum and hr_job_offers table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_offer_status') THEN
    CREATE TYPE "public"."job_offer_status" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "public"."hr_job_offers" (
  "id" serial PRIMARY KEY NOT NULL,
  "vacancy_id" integer REFERENCES "public"."vacancies"("id"),
  "candidate_id" integer NOT NULL REFERENCES "public"."candidates"("id") ON DELETE cascade,
  "funnel_id" integer REFERENCES "public"."hr_candidate_funnels"("id"),
  "position" varchar(200) NOT NULL,
  "department" varchar(200),
  "start_date" timestamp,
  "probation_months" integer DEFAULT 3,
  "salary_probation" integer,
  "salary_after" integer,
  "work_schedule" varchar(50),
  "additional_benefits" text,
  "status" "public"."job_offer_status" DEFAULT 'DRAFT' NOT NULL,
  "offer_expires_at" timestamp,
  "sent_at" timestamp,
  "responded_at" timestamp,
  "decline_reason" text,
  "created_by_id" integer REFERENCES "public"."users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hr_job_offers_candidate_idx" ON "public"."hr_job_offers" ("candidate_id");
CREATE INDEX IF NOT EXISTS "hr_job_offers_funnel_idx" ON "public"."hr_job_offers" ("funnel_id");
CREATE INDEX IF NOT EXISTS "hr_job_offers_status_idx" ON "public"."hr_job_offers" ("status");
