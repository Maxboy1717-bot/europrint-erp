-- ============================================================================
-- 14 ta AI Agent uchun infrastruktura jadvallari
-- ============================================================================

-- Agent harakatlari audit log
CREATE TABLE IF NOT EXISTS "agents_audit_log" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "agent_name"    varchar(60) NOT NULL,                -- director, lead-scoring, production, ...
  "action"        varchar(80) NOT NULL,                -- analyzed, generated_proposal, sent_alert, ...
  "user_id"       integer,                             -- agent kim nomidan ishladi
  "target_type"   varchar(60),                         -- order, lead, employee, machine, ...
  "target_id"     varchar(80),
  "input_summary" jsonb,
  "output_summary" jsonb,
  "duration_ms"   integer,
  "ai_used"       boolean NOT NULL DEFAULT false,
  "ai_tokens"     integer,
  "ai_cost_usd"   numeric(10, 6),
  "success"       boolean NOT NULL DEFAULT true,
  "error_message" text,
  "created_at"    timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "agents_audit_agent_idx"  ON "agents_audit_log"("agent_name", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "agents_audit_target_idx" ON "agents_audit_log"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "agents_audit_user_idx"   ON "agents_audit_log"("user_id");

-- Modul holati (har 20 modul uchun health 0-100)
CREATE TABLE IF NOT EXISTS "agent_module_health" (
  "module_name"     varchar(60) PRIMARY KEY,
  "health_score"    integer     NOT NULL DEFAULT 100,    -- 0-100
  "errors_24h"      integer     NOT NULL DEFAULT 0,
  "avg_response_ms" integer,
  "last_error"      text,
  "last_check_at"   timestamp   NOT NULL DEFAULT now(),
  "issues_summary"  jsonb       DEFAULT '[]'::jsonb,
  "updated_at"      timestamp   NOT NULL DEFAULT now()
);

-- Agent ogohlantirishlari (alerts)
CREATE TABLE IF NOT EXISTS "agent_alerts" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "agent_name"       varchar(60) NOT NULL,
  "severity"         varchar(20) NOT NULL DEFAULT 'info',     -- info|warning|critical|urgent
  "title"            varchar(300) NOT NULL,
  "message"          text NOT NULL,
  "target_user_id"   integer,
  "target_role"      varchar(40),                              -- director|cfo|hr_head|...
  "module"           varchar(60),
  "related_id"       varchar(80),
  "is_read"          boolean NOT NULL DEFAULT false,
  "read_at"          timestamp,
  "telegram_sent"    boolean NOT NULL DEFAULT false,
  "telegram_message_id" varchar(50),
  "action_required"  boolean NOT NULL DEFAULT false,
  "actions"          jsonb DEFAULT '[]'::jsonb,                -- [{label,action,payload}]
  "created_at"       timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "agent_alerts_user_idx"     ON "agent_alerts"("target_user_id", "is_read", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "agent_alerts_severity_idx" ON "agent_alerts"("severity", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "agent_alerts_agent_idx"    ON "agent_alerts"("agent_name", "created_at" DESC);

-- 20 modul ro'yxati (constants)
CREATE TABLE IF NOT EXISTS "agent_modules_registry" (
  "code"        varchar(40) PRIMARY KEY,
  "name_uz"     varchar(120) NOT NULL,
  "name_ru"     varchar(120),
  "icon"        varchar(20),
  "category"    varchar(40),
  "owner_role"  varchar(40),
  "is_critical" boolean NOT NULL DEFAULT false,
  "sort_order"  integer NOT NULL DEFAULT 0
);

INSERT INTO "agent_modules_registry" (code, name_uz, name_ru, icon, category, owner_role, is_critical, sort_order) VALUES
  ('director',    'Direktor paneli',     'Панель директора',         '👔', 'executive',  'ceo',       true,  1),
  ('crm',         'Sotuv va CRM',         'Продажи и CRM',            '📊', 'sales',      'sales_head', true,  2),
  ('production',  'Ishlab chiqarish',     'Производство',             '🏭', 'production', 'prod_head', true,  3),
  ('warehouse',   'Ombor',                'Склад',                    '📦', 'logistics',  'wh_head',   true,  4),
  ('finance',     'Moliya',               'Финансы',                  '💰', 'finance',    'cfo',       true,  5),
  ('procurement', 'Ta''minot',            'Снабжение',                '🛒', 'logistics',  'wh_head',   false, 6),
  ('hr',          'HR',                   'HR',                       '👥', 'people',     'hr_head',   true,  7),
  ('quality',     'Sifat nazorati',       'Контроль качества',        '✅', 'quality',    'qc_head',   true,  8),
  ('security',    'Xavfsizlik',           'Безопасность',             '🔒', 'security',   'admin',     true,  9),
  ('marketing',   'Marketing',            'Маркетинг',                '📢', 'sales',      'mk_head',   false, 10),
  ('lms',         'Ta''lim (LMS)',        'Обучение',                 '📚', 'people',     'hr_head',   false, 11),
  ('iot',         'IoT va Kamera',        'IoT и камеры',             '📡', 'tech',       'admin',     false, 12),
  ('facilities',  'Xo''jalik',            'Хозяйство',                '🔧', 'admin',      'admin',     false, 13),
  ('strategic',   'Strategik',            'Стратегия',                '🎯', 'executive',  'ceo',       false, 14),
  ('coordination','Koordinatsiya/CC',     'Координация',              '📨', 'executive',  'ceo',       true,  15),
  ('chat',        'Chat',                 'Чат',                      '💬', 'people',     'hr_head',   false, 16),
  ('kanban',      'Vazifalar',            'Задачи',                   '🗂️', 'people',     'hr_head',   false, 17),
  ('design',      'Dizayn',               'Дизайн',                   '🎨', 'production', 'design_head', false, 18),
  ('mes',         'MES',                  'МES',                      '⚙️', 'production', 'prod_head', false, 19),
  ('admin',       'Admin panel',          'Администрирование',        '⚙️', 'admin',      'admin',     true,  20)
ON CONFLICT (code) DO NOTHING;

-- Agent eslatmalari (cron joblar uchun keyingi ishga tushish)
CREATE TABLE IF NOT EXISTS "agent_cron_state" (
  "agent_name"    varchar(60) PRIMARY KEY,
  "last_run_at"   timestamp,
  "next_run_at"   timestamp,
  "last_success"  boolean,
  "last_error"    text,
  "run_count"     integer NOT NULL DEFAULT 0,
  "updated_at"    timestamp NOT NULL DEFAULT now()
);
