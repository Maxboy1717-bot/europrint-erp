-- ============================================================================
-- Communication Center — Phase 2
-- PIN imzolash uchun jadval (har xodim bitta PIN saqlaydi, bcrypt hash)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "cc_user_pins" (
  "user_id"    integer PRIMARY KEY,
  "pin_hash"   varchar(200) NOT NULL,
  "updated_at" timestamp    NOT NULL DEFAULT now()
);
