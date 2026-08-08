-- APPROVED: owner 2026-07-13 — cross-cutting Document Control / leak-prevention layer,
-- STEP 3.1 (owner said "go" after STEP 2 design approval + 3 fork decisions:
-- (a) single new document_access_log table, (b) dedicated 'Tizim' system chat sender,
-- (c) exfil channels in-scope). Q-28 dry-run (BEGIN/CREATE/ROLLBACK) proven before apply.
-- Idempotent (IF NOT EXISTS). Thresholds live in business_settings (CRUD-editable), not hardcoded.

-- 1) Single canonical cross-module access log (view/print/copy/export/client_export).
--    Append-only; retained forever (no delete path in code). document_id is TEXT because
--    document ids vary by module (uuid for cc_documents, integer for hr_documents/kanban…).
CREATE TABLE IF NOT EXISTS document_access_log (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER,
  user_full_name   TEXT,
  user_role        VARCHAR(50),
  document_type    VARCHAR(60) NOT NULL,   -- e.g. 'cc' | 'hr_document' | 'lms_certificate' | 'technology_card'
  document_id      TEXT        NOT NULL,
  action           VARCHAR(20) NOT NULL,   -- view | print | copy | export | client_export
  reason           TEXT,                   -- REQUIRED (app-level) for print/export
  sensitivity_tier VARCHAR(20),
  ip_address       VARCHAR(64),
  user_agent       TEXT,
  device           VARCHAR(120),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doc_access_doc  ON document_access_log(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_doc_access_user ON document_access_log(user_id, created_at);

-- 2) sensitivity_tier (oddiy | maxfiy | juda-maxfiy) on first-wave base tables.
--    NB: lms_certificates is a VIEW over base table `certificates` → tier goes on certificates.
--    kanban_cards keeps its existing is_confidential flag (mapped to tier in app code).
ALTER TABLE cc_documents         ADD COLUMN IF NOT EXISTS sensitivity_tier VARCHAR(20) DEFAULT 'oddiy';
ALTER TABLE hr_documents         ADD COLUMN IF NOT EXISTS sensitivity_tier VARCHAR(20) DEFAULT 'oddiy';
ALTER TABLE employment_contracts ADD COLUMN IF NOT EXISTS sensitivity_tier VARCHAR(20) DEFAULT 'oddiy';
ALTER TABLE technology_cards     ADD COLUMN IF NOT EXISTS sensitivity_tier VARCHAR(20) DEFAULT 'oddiy';
ALTER TABLE sd_contracts         ADD COLUMN IF NOT EXISTS sensitivity_tier VARCHAR(20) DEFAULT 'oddiy';
ALTER TABLE certificates         ADD COLUMN IF NOT EXISTS sensitivity_tier VARCHAR(20) DEFAULT 'oddiy';
ALTER TABLE gl_documents         ADD COLUMN IF NOT EXISTS sensitivity_tier VARCHAR(20) DEFAULT 'oddiy';
DO $$ BEGIN
  ALTER TABLE cc_documents         ADD CONSTRAINT chk_cc_tier CHECK (sensitivity_tier IN ('oddiy','maxfiy','juda-maxfiy'));
  ALTER TABLE hr_documents         ADD CONSTRAINT chk_hr_tier CHECK (sensitivity_tier IN ('oddiy','maxfiy','juda-maxfiy'));
  ALTER TABLE employment_contracts ADD CONSTRAINT chk_ec_tier CHECK (sensitivity_tier IN ('oddiy','maxfiy','juda-maxfiy'));
  ALTER TABLE technology_cards     ADD CONSTRAINT chk_tc_tier CHECK (sensitivity_tier IN ('oddiy','maxfiy','juda-maxfiy'));
  ALTER TABLE sd_contracts         ADD CONSTRAINT chk_sd_tier CHECK (sensitivity_tier IN ('oddiy','maxfiy','juda-maxfiy'));
  ALTER TABLE certificates         ADD CONSTRAINT chk_ce_tier CHECK (sensitivity_tier IN ('oddiy','maxfiy','juda-maxfiy'));
  ALTER TABLE gl_documents         ADD CONSTRAINT chk_gl_tier CHECK (sensitivity_tier IN ('oddiy','maxfiy','juda-maxfiy'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Auto-logout (#9): idle enforcement stamps last_activity on the existing refresh_tokens row.
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ;

-- 4) Reserved 'Tizim' system chat sender (#2). Non-loginable: password_hash is NOT a valid
--    bcrypt hash, so bcrypt.compare always fails → nobody can authenticate as this user.
INSERT INTO users (username, password_hash, first_name, last_name, full_name, role, is_active, created_at, updated_at)
SELECT 'tizim_system', 'SYSTEM-NO-LOGIN', 'Tizim', '', 'Tizim', 'system', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username='tizim_system');

-- 5) Settings (CRUD-editable via business_settings; NOT hardcoded — memory rule).
INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active, created_at, updated_at)
SELECT * FROM (VALUES
  ('document_control','chat_system_user_id','Chat tizim-foydalanuvchi ID','number',(SELECT id FROM users WHERE username='tizim_system')::numeric,'',NULL::numeric,NULL::numeric,'Hujjat-havola xabarlari shu userdan (Tizim) yuboriladi',true,NOW(),NOW()),
  ('document_control','idle_logout_oddiy_min','Avto-chiqish: oddiy (daq)','number',30,'min',5,120,'Oddiy hujjat sessiyasi idle avto-logout',true,NOW(),NOW()),
  ('document_control','idle_logout_maxfiy_min','Avto-chiqish: maxfiy (daq)','number',20,'min',5,120,'Maxfiy hujjat sessiyasi idle avto-logout',true,NOW(),NOW()),
  ('document_control','idle_logout_juda_maxfiy_min','Avto-chiqish: juda-maxfiy (daq)','number',15,'min',5,120,'Juda-maxfiy hujjat sessiyasi idle avto-logout',true,NOW(),NOW())
) v(module,setting_key,label,value_type,value_num,unit,min_val,max_val,description,is_active,created_at,updated_at)
WHERE NOT EXISTS (SELECT 1 FROM business_settings WHERE module='document_control' AND setting_key=v.setting_key);
