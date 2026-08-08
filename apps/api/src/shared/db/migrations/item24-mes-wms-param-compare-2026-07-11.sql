-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 08-mes #24 — "Format/gramm compared vs WMS batch parameters".
--   Sessiya Format/gramm (А×В + grammaj) ni WMS partiya (batch_lots → material_cards)
--   material parametrlari bilan taqqoslash mexanizmi.
--
-- 1) production_sessions ga format/gramm ustunlari (operator sessiyada kiritadi).
--    #116 (Qog'oz formati А×В + gramm) bilan UMUMIY ustunlar — IF NOT EXISTS bilan
--    idempotent, tartibdan qat'i nazar xavfsiz (qaysi migration avval yursa yaratadi,
--    ikkinchisi no-op). Hammasi NULL default — mavjud sessiyalar o'zgarmaydi.
-- 2) mes_wms_param_checks — har taqqoslash bitta qator (session ↔ batch snapshot +
--    is_mismatch bayrog'i). Additive; destructive amal yo'q; kanonik jadvallarga FK.

ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS format_a numeric;
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS format_b numeric;
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS gramm    numeric;
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS kg       numeric;

CREATE TABLE IF NOT EXISTS mes_wms_param_checks (
  id                serial PRIMARY KEY,
  session_id        integer NOT NULL REFERENCES production_sessions(id) ON DELETE CASCADE,
  batch_lot_id      integer REFERENCES batch_lots(id) ON DELETE SET NULL,
  material_id       integer,
  session_format_a  numeric(12,4),
  session_format_b  numeric(12,4),
  session_gramm     numeric(12,4),
  wms_format_a      numeric(12,4),
  wms_format_b      numeric(12,4),
  wms_grammage      numeric(12,4),
  compared_params   integer NOT NULL DEFAULT 0,
  is_mismatch       boolean NOT NULL DEFAULT false,
  mismatch_detail   text,
  checked_by        integer,
  checked_at        timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mes_wms_param_checks_session
  ON mes_wms_param_checks (session_id);
CREATE INDEX IF NOT EXISTS idx_mes_wms_param_checks_mismatch
  ON mes_wms_param_checks (is_mismatch) WHERE is_mismatch = true;
