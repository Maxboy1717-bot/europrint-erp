-- ============================================================================
-- Communication Center — 3-Basket Document Workflow System
-- Migration 0006: All 15 models + AI sessions
-- Generated to match lib/db/src/schema/communication-center.ts
-- ============================================================================

-- ─── MODEL 14: Branches ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_branches" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       varchar(200) NOT NULL,
  "code"       varchar(50)  NOT NULL,
  "city"       varchar(120),
  "address"    text,
  "is_active"  boolean      NOT NULL DEFAULT true,
  "created_at" timestamp    NOT NULL DEFAULT now(),
  "updated_at" timestamp    NOT NULL DEFAULT now(),
  CONSTRAINT "cc_branches_code_uq" UNIQUE ("code")
);

-- ─── MODEL 1: Document Templates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_document_templates" (
  "id"                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code"                   varchar(60)  NOT NULL UNIQUE,
  "name_uz"                varchar(200) NOT NULL,
  "name_ru"                varchar(200) NOT NULL,
  "category"               varchar(30)  NOT NULL,
  "ai_questions"           jsonb        NOT NULL DEFAULT '[]'::jsonb,
  "html_template"          text,
  "version"                integer      NOT NULL DEFAULT 1,
  "is_active"              boolean      NOT NULL DEFAULT true,
  "default_priority"       varchar(20)  NOT NULL DEFAULT 'normal',
  "max_file_size_mb"       integer      NOT NULL DEFAULT 10,
  "allowed_file_types"     jsonb        NOT NULL DEFAULT '["pdf","png","jpg","jpeg","docx","xlsx"]'::jsonb,
  "print_requires_reason"  boolean      NOT NULL DEFAULT true,
  "cooldown_days"          integer,
  "archive_after_days"     integer,
  "number_format"          varchar(60)  NOT NULL DEFAULT 'DOC-{YYYY}-{SEQ}',
  "inbox_sla_hours"        integer      NOT NULL DEFAULT 24,
  "reminder_hours"         integer      NOT NULL DEFAULT 20,
  "escalation_hours"       integer      NOT NULL DEFAULT 48,
  "is_recurring"           boolean      NOT NULL DEFAULT false,
  "cron_expression"        varchar(60),
  "test_mode"              boolean      NOT NULL DEFAULT false,
  "created_at"             timestamp    NOT NULL DEFAULT now(),
  "updated_at"             timestamp    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_tmpl_code_idx"   ON "cc_document_templates"("code");
CREATE INDEX IF NOT EXISTS "cc_tmpl_active_idx" ON "cc_document_templates"("is_active");
CREATE INDEX IF NOT EXISTS "cc_tmpl_cat_idx"    ON "cc_document_templates"("category");

-- ─── MODEL 2: Workflow Steps ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_workflow_steps" (
  "id"                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "template_id"              uuid    NOT NULL REFERENCES "cc_document_templates"("id") ON DELETE CASCADE,
  "template_version"         integer NOT NULL,
  "step_order"               integer NOT NULL,
  "step_type"                varchar(20) NOT NULL DEFAULT 'sequential',
  "approver_position_code"   varchar(80) NOT NULL,
  "rejection_stops"          boolean NOT NULL DEFAULT true,
  "time_limit_hours"         integer NOT NULL DEFAULT 24,
  "is_mandatory"             boolean NOT NULL DEFAULT true,
  "created_at"               timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "cc_step_order_uq" UNIQUE ("template_id","template_version","step_order","approver_position_code")
);
CREATE INDEX IF NOT EXISTS "cc_step_tmpl_idx" ON "cc_workflow_steps"("template_id","template_version");

-- ─── MODEL 3: Rejection Reasons ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_rejection_reasons" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "template_id" uuid    NOT NULL REFERENCES "cc_document_templates"("id") ON DELETE CASCADE,
  "reason_uz"   varchar(300) NOT NULL,
  "reason_ru"   varchar(300) NOT NULL,
  "is_active"   boolean      NOT NULL DEFAULT true,
  "sort_order"  integer      NOT NULL DEFAULT 0,
  "created_at"  timestamp    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_rej_tmpl_idx" ON "cc_rejection_reasons"("template_id","is_active");

-- ─── MODEL 4: Documents (the core entity) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_documents" (
  "id"                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_number"        varchar(80) NOT NULL UNIQUE,
  "template_id"            uuid    NOT NULL REFERENCES "cc_document_templates"("id"),
  "template_version"       integer NOT NULL,
  "sender_user_id"         integer NOT NULL,
  "branch_id"              uuid    REFERENCES "cc_branches"("id"),

  "basket_state"           varchar(20) NOT NULL DEFAULT 'inbox',
  "basket_owner_user_id"   integer,
  "basket_entered_at"      timestamp NOT NULL DEFAULT now(),
  "is_inbox_overdue"       boolean   NOT NULL DEFAULT false,

  "workflow_state"         varchar(20) NOT NULL DEFAULT 'draft',
  "current_step_order"     integer NOT NULL DEFAULT 0,

  "subject"                varchar(500) NOT NULL,
  "ai_body"                text NOT NULL,
  "ai_answers"             jsonb NOT NULL DEFAULT '{}'::jsonb,
  "sender_comment"         text,
  "priority"               varchar(20) NOT NULL DEFAULT 'normal',
  "language"               varchar(5)  NOT NULL DEFAULT 'uz',

  "parent_document_id"     uuid,
  "version"                integer NOT NULL DEFAULT 1,

  "cancelled_by_user_id"   integer,
  "cancelled_reason"       text,
  "cancelled_at"           timestamp,

  "created_offline"        boolean NOT NULL DEFAULT false,
  "synced_at"              timestamp,

  "created_at"             timestamp NOT NULL DEFAULT now(),
  "updated_at"             timestamp NOT NULL DEFAULT now(),
  "archived_at"            timestamp
);

-- Self-referential FK for parent_document_id (added separately to avoid forward-reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cc_doc_parent_fk'
  ) THEN
    ALTER TABLE "cc_documents"
      ADD CONSTRAINT "cc_doc_parent_fk"
      FOREIGN KEY ("parent_document_id") REFERENCES "cc_documents"("id") ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS "cc_doc_basket_owner_idx"    ON "cc_documents"("basket_owner_user_id","basket_state");
CREATE INDEX IF NOT EXISTS "cc_doc_sender_idx"          ON "cc_documents"("sender_user_id");
CREATE INDEX IF NOT EXISTS "cc_doc_workflow_idx"        ON "cc_documents"("workflow_state");
CREATE INDEX IF NOT EXISTS "cc_doc_template_idx"        ON "cc_documents"("template_id");
CREATE INDEX IF NOT EXISTS "cc_doc_branch_idx"          ON "cc_documents"("branch_id");
CREATE INDEX IF NOT EXISTS "cc_doc_number_idx"          ON "cc_documents"("document_number");
CREATE INDEX IF NOT EXISTS "cc_doc_overdue_idx"         ON "cc_documents"("is_inbox_overdue","basket_state");
CREATE INDEX IF NOT EXISTS "cc_doc_basket_entered_idx"  ON "cc_documents"("basket_entered_at");
CREATE INDEX IF NOT EXISTS "cc_doc_parent_idx"          ON "cc_documents"("parent_document_id");

-- ─── MODEL 5: Basket History (audit) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_basket_history" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id"    uuid    NOT NULL REFERENCES "cc_documents"("id") ON DELETE CASCADE,
  "owner_user_id"  integer NOT NULL,
  "from_basket"    varchar(20),
  "to_basket"      varchar(20) NOT NULL,
  "moved_by_user_id" integer,
  "note"           text,
  "moved_at"       timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_bh_doc_idx"   ON "cc_basket_history"("document_id","moved_at");
CREATE INDEX IF NOT EXISTS "cc_bh_owner_idx" ON "cc_basket_history"("owner_user_id");

-- ─── MODEL 6: Approvals ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_approvals" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id"         uuid    NOT NULL REFERENCES "cc_documents"("id") ON DELETE CASCADE,
  "step_order"          integer NOT NULL,
  "approver_user_id"    integer NOT NULL,
  "state"               varchar(20) NOT NULL DEFAULT 'pending',
  "rejection_reason_id" uuid    REFERENCES "cc_rejection_reasons"("id"),
  "comment"             text,
  "signed_at"           timestamp,
  "signature_hash"      varchar(200),
  "deadline_at"         timestamp,
  "escalated_at"        timestamp,
  "delegated_to_user_id" integer,
  "rejection_stops"     boolean NOT NULL DEFAULT true,
  "created_at"          timestamp NOT NULL DEFAULT now(),
  "updated_at"          timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_appr_doc_idx"      ON "cc_approvals"("document_id","step_order");
CREATE INDEX IF NOT EXISTS "cc_appr_approver_idx" ON "cc_approvals"("approver_user_id","state");
CREATE INDEX IF NOT EXISTS "cc_appr_state_idx"    ON "cc_approvals"("state");
CREATE INDEX IF NOT EXISTS "cc_appr_deadline_idx" ON "cc_approvals"("deadline_at");

-- ─── MODEL 7: Attachments ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_attachments" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id"        uuid    NOT NULL REFERENCES "cc_documents"("id") ON DELETE CASCADE,
  "file_name"          varchar(300) NOT NULL,
  "file_url"           varchar(1000) NOT NULL,
  "file_size_bytes"    integer NOT NULL,
  "mime_type"          varchar(120) NOT NULL,
  "uploaded_by_user_id" integer NOT NULL,
  "uploaded_at"        timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_att_doc_idx" ON "cc_attachments"("document_id");

-- ─── MODEL 8: Audit Trail ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_audit_trail" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id"      uuid    NOT NULL REFERENCES "cc_documents"("id") ON DELETE CASCADE,
  "action"           varchar(40) NOT NULL,
  "from_basket"      varchar(20),
  "to_basket"        varchar(20),
  "from_workflow"    varchar(20),
  "to_workflow"      varchar(20),
  "performed_by_user_id" integer,
  "comment"          text,
  "print_reason"     text,
  "ip_address"       varchar(50),
  "user_agent"       varchar(500),
  "via_telegram"     boolean NOT NULL DEFAULT false,
  "performed_at"     timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_audit_doc_idx"    ON "cc_audit_trail"("document_id","performed_at");
CREATE INDEX IF NOT EXISTS "cc_audit_action_idx" ON "cc_audit_trail"("action");
CREATE INDEX IF NOT EXISTS "cc_audit_user_idx"   ON "cc_audit_trail"("performed_by_user_id");

-- ─── MODEL 9: Document Versions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_document_versions" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id"       uuid    NOT NULL REFERENCES "cc_documents"("id") ON DELETE CASCADE,
  "version"           integer NOT NULL,
  "ai_body"           text NOT NULL,
  "sender_comment"    text,
  "created_by_user_id" integer NOT NULL,
  "created_at"        timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "cc_ver_doc_uq" UNIQUE ("document_id","version")
);

-- ─── MODEL 10: Delegations ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_delegations" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "from_user_id"  integer NOT NULL,
  "to_user_id"    integer NOT NULL,
  "starts_at"     timestamp NOT NULL,
  "ends_at"       timestamp NOT NULL,
  "is_active"     boolean NOT NULL DEFAULT true,
  "set_by_user_id" integer,
  "reason"        text,
  "created_at"    timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_deleg_active_idx" ON "cc_delegations"("from_user_id","is_active","starts_at","ends_at");

-- ─── MODEL 11: Print Log ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_print_log" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id"      uuid    NOT NULL REFERENCES "cc_documents"("id") ON DELETE CASCADE,
  "printed_by_user_id" integer NOT NULL,
  "reason"           text NOT NULL,
  "printed_at"       timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_print_doc_idx" ON "cc_print_log"("document_id");

-- ─── MODEL 12: Notifications ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_notifications" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"           integer NOT NULL,
  "document_id"       uuid    REFERENCES "cc_documents"("id") ON DELETE CASCADE,
  "type"              varchar(40) NOT NULL,
  "priority"          varchar(20) NOT NULL DEFAULT 'normal',
  "title_uz"          varchar(300) NOT NULL,
  "title_ru"          varchar(300) NOT NULL,
  "message_uz"        text NOT NULL,
  "message_ru"        text NOT NULL,
  "is_read"           boolean NOT NULL DEFAULT false,
  "read_at"           timestamp,
  "sent_via_telegram" boolean NOT NULL DEFAULT false,
  "telegram_message_id" varchar(50),
  "created_at"        timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cc_notif_user_idx"   ON "cc_notifications"("user_id","is_read","created_at");
CREATE INDEX IF NOT EXISTS "cc_notif_doc_idx"    ON "cc_notifications"("document_id");
CREATE INDEX IF NOT EXISTS "cc_notif_unread_idx" ON "cc_notifications"("user_id","is_read");

-- ─── MODEL 13: Complaints (director-only) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_complaints" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id"        uuid    NOT NULL REFERENCES "cc_documents"("id") ON DELETE CASCADE,
  "complainant_user_id" integer NOT NULL,
  "reason"             text NOT NULL,
  "state"              varchar(20) NOT NULL DEFAULT 'pending',
  "director_comment"   text,
  "created_at"         timestamp NOT NULL DEFAULT now(),
  "reviewed_at"        timestamp
);
CREATE INDEX IF NOT EXISTS "cc_compl_state_idx" ON "cc_complaints"("state","created_at");
CREATE INDEX IF NOT EXISTS "cc_compl_doc_idx"   ON "cc_complaints"("document_id");

-- ─── MODEL 15: Notification Preferences ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_notification_prefs" (
  "user_id"           integer PRIMARY KEY,
  "urgent_only"       boolean NOT NULL DEFAULT false,
  "telegram_enabled"  boolean NOT NULL DEFAULT true,
  "reminders_enabled" boolean NOT NULL DEFAULT true,
  "language"          varchar(5) NOT NULL DEFAULT 'uz',
  "updated_at"        timestamp NOT NULL DEFAULT now()
);

-- ─── AI Sessions (Task 4 / 6) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "cc_ai_sessions" (
  "id"                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"              integer NOT NULL,
  "template_id"          uuid    NOT NULL REFERENCES "cc_document_templates"("id"),
  "channel"              varchar(20) NOT NULL DEFAULT 'web',
  "current_question_idx" integer NOT NULL DEFAULT 0,
  "answers"              jsonb NOT NULL DEFAULT '{}'::jsonb,
  "language"             varchar(5)  NOT NULL DEFAULT 'uz',
  "is_completed"         boolean NOT NULL DEFAULT false,
  "draft_document_id"    uuid REFERENCES "cc_documents"("id") ON DELETE SET NULL,
  "started_at"           timestamp NOT NULL DEFAULT now(),
  "completed_at"         timestamp,
  "expires_at"           timestamp
);
CREATE INDEX IF NOT EXISTS "cc_ai_user_idx" ON "cc_ai_sessions"("user_id","is_completed");

-- ─── SEED: 14 ta hujjat turi (Task 1 talabi) ────────────────────────────────
INSERT INTO "cc_document_templates"
  ("code","name_uz","name_ru","category","ai_questions","number_format","inbox_sla_hours","reminder_hours","escalation_hours")
VALUES
  ('ADVANCE',         'Avans uchun ariza',                     'Заявление на аванс',                          'ariza',  '[
    {"key":"amount","qUz":"Avans miqdorini kiriting (UZS)","qRu":"Введите сумму аванса (UZS)","required":true,"type":"number"},
    {"key":"reason","qUz":"Avans olish sababi","qRu":"Причина получения аванса","required":true,"type":"text"},
    {"key":"return_date","qUz":"Qaytarish sanasi","qRu":"Дата возврата","required":true,"type":"date"}
  ]'::jsonb, 'AVANS-{YYYY}-{SEQ}', 24, 20, 48),

  ('VACATION',        'Tatil uchun ariza',                     'Заявление на отпуск',                          'ariza',  '[
    {"key":"start_date","qUz":"Tatil boshlanish sanasi","qRu":"Дата начала отпуска","required":true,"type":"date"},
    {"key":"end_date","qUz":"Tatil tugash sanasi","qRu":"Дата окончания отпуска","required":true,"type":"date"},
    {"key":"reason","qUz":"Sabab","qRu":"Причина","required":false,"type":"text"}
  ]'::jsonb, 'TATIL-{YYYY}-{SEQ}', 24, 20, 48),

  ('SALARY_RAISE',    'Ish haqini oshirish uchun ariza',       'Заявление о повышении зарплаты',               'ariza',  '[
    {"key":"current_salary","qUz":"Joriy ish haqi","qRu":"Текущая зарплата","required":true,"type":"number"},
    {"key":"requested_salary","qUz":"Talab qilinayotgan ish haqi","qRu":"Запрашиваемая зарплата","required":true,"type":"number"},
    {"key":"justification","qUz":"Asoslantiring","qRu":"Обоснование","required":true,"type":"text"}
  ]'::jsonb, 'OSH-{YYYY}-{SEQ}', 24, 20, 72),

  ('IMPROVEMENT',     'Yaxshilash bo''yicha ariza',            'Заявление об улучшении',                       'ariza',  '[
    {"key":"area","qUz":"Soha (qaysi jarayon)","qRu":"Область (какой процесс)","required":true,"type":"text"},
    {"key":"proposal","qUz":"Taklif tafsiloti","qRu":"Детали предложения","required":true,"type":"text"},
    {"key":"expected_benefit","qUz":"Kutilayotgan natija","qRu":"Ожидаемый результат","required":true,"type":"text"}
  ]'::jsonb, 'YAX-{YYYY}-{SEQ}', 24, 20, 72),

  ('DOKLAD',          'Doklad',                                 'Доклад',                                       'hisobot','[
    {"key":"topic","qUz":"Mavzu","qRu":"Тема","required":true,"type":"text"},
    {"key":"problem","qUz":"Muammo","qRu":"Проблема","required":true,"type":"text"},
    {"key":"recommendations","qUz":"Tavsiyalar","qRu":"Рекомендации","required":true,"type":"text"}
  ]'::jsonb, 'DOK-{YYYY}-{SEQ}', 48, 36, 96),

  ('REPORT',          'Rаpорт',                                 'Рапорт',                                       'hisobot','[
    {"key":"event_date","qUz":"Voqea sanasi","qRu":"Дата события","required":true,"type":"date"},
    {"key":"description","qUz":"Voqea tavsifi","qRu":"Описание события","required":true,"type":"text"}
  ]'::jsonb, 'RAP-{YYYY}-{SEQ}', 24, 20, 48),

  ('TRAINING',        'Malaka oshirish uchun ariza',           'Заявление на повышение квалификации',          'ariza',  '[
    {"key":"course_name","qUz":"Kurs nomi","qRu":"Название курса","required":true,"type":"text"},
    {"key":"cost","qUz":"Taxminiy narx (UZS)","qRu":"Примерная стоимость (UZS)","required":false,"type":"number"},
    {"key":"benefit","qUz":"Korxonaga foydasi","qRu":"Польза для компании","required":true,"type":"text"}
  ]'::jsonb, 'TRAIN-{YYYY}-{SEQ}', 48, 36, 96),

  ('FIX_ERRORS',      'Xatolarni tuzatish uchun ariza',         'Заявление об исправлении ошибок',              'ariza',  '[
    {"key":"error_description","qUz":"Xato tavsifi","qRu":"Описание ошибки","required":true,"type":"text"},
    {"key":"proposed_fix","qUz":"Tuzatish taklifi","qRu":"Предлагаемое исправление","required":true,"type":"text"}
  ]'::jsonb, 'FIX-{YYYY}-{SEQ}', 24, 20, 48),

  ('FINANCIAL_AID',   'Moddiy yordam uchun ariza',             'Заявление о материальной помощи',              'ariza',  '[
    {"key":"amount","qUz":"Talab qilinayotgan miqdor (UZS)","qRu":"Запрашиваемая сумма (UZS)","required":true,"type":"number"},
    {"key":"reason","qUz":"Sabab","qRu":"Причина","required":true,"type":"text"}
  ]'::jsonb, 'YOR-{YYYY}-{SEQ}', 24, 20, 48),

  ('CONTRACT_END',    'Mehnat shartnomasini bekor qilish',     'Расторжение трудового договора',               'ariza',  '[
    {"key":"last_day","qUz":"Oxirgi ish kuni","qRu":"Последний рабочий день","required":true,"type":"date"},
    {"key":"reason","qUz":"Sabab","qRu":"Причина","required":true,"type":"text"}
  ]'::jsonb, 'BEK-{YYYY}-{SEQ}', 48, 36, 96),

  ('TRANSFER',        'Boshqa lavozimga o''tish',              'Перевод на другую должность',                  'ariza',  '[
    {"key":"target_position","qUz":"Ko''zlangan lavozim","qRu":"Желаемая должность","required":true,"type":"text"},
    {"key":"justification","qUz":"Asoslantiring","qRu":"Обоснование","required":true,"type":"text"}
  ]'::jsonb, 'TRANS-{YYYY}-{SEQ}', 48, 36, 96),

  ('SCHEDULE_CHANGE', 'Ish vaqtini o''zgartirish',             'Изменение рабочего графика',                   'ariza',  '[
    {"key":"current_schedule","qUz":"Joriy ish vaqti","qRu":"Текущий график","required":true,"type":"text"},
    {"key":"requested_schedule","qUz":"Talab qilinayotgan ish vaqti","qRu":"Запрашиваемый график","required":true,"type":"text"},
    {"key":"reason","qUz":"Sabab","qRu":"Причина","required":true,"type":"text"}
  ]'::jsonb, 'GRAF-{YYYY}-{SEQ}', 24, 20, 48),

  ('ORDER',           'Buyruq',                                 'Приказ',                                       'buyruq', '[
    {"key":"recipient","qUz":"Kimga (lavozim/xodim)","qRu":"Кому (должность/сотрудник)","required":true,"type":"text"},
    {"key":"order_text","qUz":"Buyruq matni","qRu":"Текст приказа","required":true,"type":"text"},
    {"key":"deadline","qUz":"Bajarish muddati","qRu":"Срок выполнения","required":false,"type":"date"}
  ]'::jsonb, 'BUY-{YYYY}-{SEQ}', 24, 20, 48),

  ('ZRS_ZVS',         'ZRS-ZVS xabari',                         'Сообщение ЗРС-ЗВС',                            'xabar',  '[
    {"key":"subject","qUz":"Mavzu","qRu":"Тема","required":true,"type":"text"},
    {"key":"body","qUz":"Xabar matni","qRu":"Текст сообщения","required":true,"type":"text"}
  ]'::jsonb, 'ZRS-{YYYY}-{SEQ}', 24, 20, 48)
ON CONFLICT ("code") DO NOTHING;

-- ─── SEED: minimal rejection reasons (har bir shablon uchun 3 ta) ───────────
INSERT INTO "cc_rejection_reasons" ("template_id","reason_uz","reason_ru","sort_order")
SELECT t.id, r.uz, r.ru, r.so
FROM "cc_document_templates" t
CROSS JOIN (VALUES
  ('Yetarli asos yo''q',     'Недостаточно обоснований', 1),
  ('Hujjatlar to''liq emas', 'Документы неполные',       2),
  ('Boshqa sabab',           'Другая причина',           3)
) AS r(uz, ru, so)
ON CONFLICT DO NOTHING;
