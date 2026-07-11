-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Global CRUD-qoidasi (OWNER-JAVOBLAR-2026-07-11.md §0/§1): barcha biznes threshold/norma/
-- %/kun/daqiqa/summa qiymatlari kodga hardcode qilinmaydi — shu jadvalda saqlanadi va egasi
-- sozlamalar ekranidan CRUD qiladi. Bitta umumiy mexanizm ~60 "settings-CRUD" itemni yopadi.
CREATE TABLE IF NOT EXISTS business_settings (
  id           SERIAL PRIMARY KEY,
  module       VARCHAR(40)  NOT NULL,                 -- mes/qc/wms/sd/pp/cc/crm/marketing/kanban/iot/lms/notifications/director/pos/mm/finance
  setting_key  VARCHAR(120) NOT NULL UNIQUE,          -- kanonik kalit, masalan 'mes.stopped_machine_escalation_no_min'
  label        VARCHAR(200) NOT NULL,                 -- ekranda ko'rinadigan nom
  value_type   VARCHAR(20)  NOT NULL DEFAULT 'number',-- number | percent | days | minutes | amount | text | boolean
  value_num    NUMERIC,                               -- raqamli turlar uchun
  value_text   TEXT,                                  -- text/boolean turlari uchun
  unit         VARCHAR(30),                           -- 'daqiqa','kun','%','so''m',...
  min_val      NUMERIC,                               -- ixtiyoriy chegara (validatsiya)
  max_val      NUMERIC,
  description  TEXT,
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  updated_by   INTEGER,
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT business_settings_value_type_chk CHECK (value_type IN ('number','percent','days','minutes','amount','text','boolean'))
);
CREATE INDEX IF NOT EXISTS business_settings_module_idx ON business_settings(module);

-- Egasi 2026-07-11 da ANIQ tasdiqlagan qiymatlar (qolganini egasi ekrandan kiritadi):
INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description)
SELECT * FROM (VALUES
  ('mes', 'mes.stopped_machine_escalation_no_min',        'To''xtagan mashina — НО ga eskalatsiya',      'minutes', 15, 'daqiqa', 1, 240, 'Vizyon 08-mes#68: shuncha daqiqadan keyin bo''lim boshlig''iga signal'),
  ('mes', 'mes.stopped_machine_escalation_director_min',  'To''xtagan mashina — Direktorga eskalatsiya', 'minutes', 30, 'daqiqa', 1, 480, 'Vizyon 08-mes#68: shuncha daqiqadan keyin direktorga signal'),
  ('mes', 'mes.oee_target_percent',                        'OEE maqsad (%)',                              'percent', 85, '%',      0, 100, 'MESExtended OEE maqsad chizig''i (avval hardcode 85 edi)')
) AS v(module, setting_key, label, value_type, value_num, unit, min_val, max_val, description)
WHERE NOT EXISTS (SELECT 1 FROM business_settings b WHERE b.setting_key = v.setting_key);
