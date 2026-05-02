-- Chat Messenger v2 — new tables only
-- Date: 2026-04-27
-- Only adds the 5 missing tables; existing chat_* tables are untouched.

CREATE TABLE IF NOT EXISTS "chat_emoji_packs" (
  "id"          varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"        varchar NOT NULL,
  "slug"        varchar NOT NULL,
  "is_company"  boolean DEFAULT false,
  "is_default"  boolean DEFAULT false,
  "created_by"  text,
  "created_at"  timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_chat_emoji_packs_slug" ON "chat_emoji_packs" ("slug");

CREATE TABLE IF NOT EXISTS "chat_custom_emoji" (
  "id"         varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "pack_id"    varchar NOT NULL,
  "code"       varchar NOT NULL,
  "image_url"  text NOT NULL,
  "width"      integer,
  "height"     integer,
  "created_at" timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_chat_custom_emoji_pack_code"
  ON "chat_custom_emoji" ("pack_id", "code");

CREATE TABLE IF NOT EXISTS "chat_join_requests" (
  "id"          varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "room_id"     varchar NOT NULL,
  "user_id"     text NOT NULL,
  "status"      varchar DEFAULT 'PENDING',
  "message"     text,
  "decided_by"  text,
  "decided_at"  timestamp,
  "created_at"  timestamp DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "uq_chat_join_requests_room_user"
  ON "chat_join_requests" ("room_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_chat_join_requests_status"
  ON "chat_join_requests" ("status");

CREATE TABLE IF NOT EXISTS "chat_push_subscriptions" (
  "id"           varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"      text NOT NULL,
  "channel"      varchar NOT NULL,
  "endpoint"     text,
  "p256dh"       text,
  "auth"         text,
  "fcm_token"    text,
  "apns_token"   text,
  "device_info"  jsonb,
  "is_active"    boolean DEFAULT true,
  "created_at"   timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_chat_push_user_channel"
  ON "chat_push_subscriptions" ("user_id", "channel");

CREATE TABLE IF NOT EXISTS "chat_video_calls" (
  "id"           varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "room_id"      varchar NOT NULL,
  "initiator_id" text NOT NULL,
  "status"       varchar DEFAULT 'RINGING',
  "started_at"   timestamp DEFAULT now(),
  "ended_at"     timestamp,
  "duration_sec" integer,
  "participants" jsonb DEFAULT '[]'::jsonb,
  "ice_servers"  jsonb
);
CREATE INDEX IF NOT EXISTS "idx_chat_video_calls_room" ON "chat_video_calls" ("room_id");

INSERT INTO "chat_emoji_packs" ("id", "name", "slug", "is_company", "is_default")
VALUES (gen_random_uuid(), 'Standart', 'standard', false, true)
ON CONFLICT (slug) DO NOTHING;
