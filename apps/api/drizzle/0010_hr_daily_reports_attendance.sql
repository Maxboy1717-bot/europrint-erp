-- ============================================================================
-- HR — Kunlik hisobotlar + AI Davomat (kamera + sog'liq) jadvallari
-- ============================================================================

-- Kunlik xodim hisobotlari (har xodim ishdan keyin telegram bot orqali yuboradi)
CREATE TABLE IF NOT EXISTS "hr_daily_reports" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"          integer     NOT NULL,
  "report_date"      date        NOT NULL,
  "submitted_at"     timestamp   NOT NULL DEFAULT now(),
  "via_channel"      varchar(20) NOT NULL DEFAULT 'telegram',  -- telegram|web|auto
  "tasks_completed"  text,                                      -- bajarilgan vazifalar
  "metrics"          jsonb       DEFAULT '{}'::jsonb,           -- raqamli ko'rsatkichlar
  "tomorrow_plan"    text,                                      -- ertangi reja
  "blockers"         text,                                      -- to'siqlar / muammolar
  "auto_generated"   boolean     NOT NULL DEFAULT false,         -- uskunada ishlovchi xodim → avto
  "pdf_url"          varchar(500),                              -- invoice PDF URL
  "is_late"          boolean     NOT NULL DEFAULT false,        -- 3 soatda yuborilmagan
  "marked_absent"    boolean     NOT NULL DEFAULT false,        -- ish kun emas
  "hr_overridden"    boolean     NOT NULL DEFAULT false,
  "created_at"       timestamp   NOT NULL DEFAULT now(),
  "updated_at"       timestamp   NOT NULL DEFAULT now(),
  CONSTRAINT "hr_daily_reports_user_date_uq" UNIQUE ("user_id", "report_date")
);
CREATE INDEX IF NOT EXISTS "hr_daily_reports_user_idx" ON "hr_daily_reports"("user_id", "report_date" DESC);
CREATE INDEX IF NOT EXISTS "hr_daily_reports_late_idx" ON "hr_daily_reports"("is_late", "report_date");

-- AI kamera davomat hodisalari (ishxonaga kirish/chiqish)
CREATE TABLE IF NOT EXISTS "hr_ai_attendance" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"          integer     NOT NULL,
  "event_type"       varchar(20) NOT NULL,           -- territory_in|territory_out|workplace_in|workplace_out
  "camera_id"        varchar(80),
  "location"         varchar(200),                    -- xona nomi yoki kirish nuqtasi
  "captured_at"      timestamp   NOT NULL,
  "face_confidence"  numeric(5,2),                    -- yuz aniqlash ishonchliligi
  "snapshot_url"     varchar(500),                    -- foto URL
  "created_at"       timestamp   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "hr_ai_attendance_user_idx" ON "hr_ai_attendance"("user_id", "captured_at" DESC);
CREATE INDEX IF NOT EXISTS "hr_ai_attendance_event_idx" ON "hr_ai_attendance"("event_type", "captured_at");

-- Kech qolish hujjatlari (avtomatik)
CREATE TABLE IF NOT EXISTS "hr_late_arrivals" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"             integer     NOT NULL,
  "arrival_at"          timestamp   NOT NULL,
  "expected_at"         timestamp   NOT NULL,
  "minutes_late"        integer     NOT NULL,
  "reason"              text,
  "fine_amount"         numeric(12,2) DEFAULT 0,
  "fine_approved"       boolean     NOT NULL DEFAULT false,    -- jarima tasdiqlanmagan bo'lsa yozilmaydi
  "approved_by_user_id" integer,
  "approved_at"         timestamp,
  "cc_document_id"      uuid REFERENCES cc_documents(id) ON DELETE SET NULL,
  "created_at"          timestamp   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "hr_late_arrivals_user_idx" ON "hr_late_arrivals"("user_id", "arrival_at" DESC);

-- 3 kun sababsiz blok holati
CREATE TABLE IF NOT EXISTS "hr_user_blocks" (
  "user_id"           integer     PRIMARY KEY,
  "blocked_at"        timestamp   NOT NULL DEFAULT now(),
  "reason"            varchar(200) NOT NULL DEFAULT '3 kun sababsiz kelmagan',
  "blocked_by_user_id" integer,
  "unblocked_at"      timestamp,
  "unblocked_by_user_id" integer,
  "unblock_dalolatnoma" text,
  "is_active"         boolean     NOT NULL DEFAULT true
);

-- Sog'liq kuzatuvi (AI kameraga asoslanan ogohlantirishlar)
CREATE TABLE IF NOT EXISTS "hr_health_alerts" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"          integer     NOT NULL,
  "alert_type"       varchar(40) NOT NULL,    -- fatigue|stress|sick|emotion_negative
  "severity"         varchar(10) NOT NULL DEFAULT 'low',     -- low|medium|high
  "ai_confidence"    numeric(5,2),
  "details"          jsonb,
  "snapshot_url"     varchar(500),
  "captured_at"      timestamp   NOT NULL,
  "reviewed_by_user_id" integer,
  "reviewed_at"      timestamp,
  "action_taken"     text,
  "created_at"       timestamp   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "hr_health_alerts_user_idx" ON "hr_health_alerts"("user_id", "captured_at" DESC);
CREATE INDEX IF NOT EXISTS "hr_health_alerts_severity_idx" ON "hr_health_alerts"("severity", "captured_at");
