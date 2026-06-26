-- APPROVED: egasi "hamma vizyon" 2026-06-26
-- T21-A1-MES — Gap #9 (3-bosqich GSD vaqt-o'lchovi) + Gap #11 (SOS/downtime org-zanjir eskalatsiya)
-- ADDITIV + idempotent: faqat ADD COLUMN/CREATE IF NOT EXISTS. DESTRUCTIVE YO'Q (Q-46/Q-39).
--
-- (1) GSD 3-bosqich (setup/main/teardown) sekund-o'lchovi production_sessions'ga.
--     OEE Availability bosqich-asosida: setup (sozlash/changeover) + teardown (tozalash)
--     ne-produktiv vaqt sifatida runTime'dan ayriladi — main_seconds = sof ishlab-chiqarish.
-- (2) mes_sos_events'ga org-zanjir eskalatsiya ustunlari: hozirgi daraja, keyingi javobgar,
--     deadline, eskalatsiya tarixi. parent_id (org_departments) bo'ylab usta→bo'lim→direktor.

-- ── (1) GSD bosqich vaqt-o'lchovi ──────────────────────────────────────────────
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS setup_seconds    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS main_seconds     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS teardown_seconds INTEGER NOT NULL DEFAULT 0;
-- joriy GSD bosqich (null=boshlanmagan; 'setup'|'main'|'teardown'|'done') + bosqich start markeri
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS current_stage      VARCHAR(16);
ALTER TABLE production_sessions ADD COLUMN IF NOT EXISTS stage_started_at   TIMESTAMP;

COMMENT ON COLUMN production_sessions.setup_seconds    IS 'GSD 1-bosqich: sozlash/changeover vaqti (sek) — OEE Availability dan ayriladi';
COMMENT ON COLUMN production_sessions.main_seconds     IS 'GSD 2-bosqich: sof ishlab-chiqarish vaqti (sek)';
COMMENT ON COLUMN production_sessions.teardown_seconds IS 'GSD 3-bosqich: tozalash/yig''ishtirish vaqti (sek) — OEE Availability dan ayriladi';
COMMENT ON COLUMN production_sessions.current_stage    IS 'Joriy GSD bosqich: setup|main|teardown|done (NULL=boshlanmagan)';

-- ── (2) SOS/downtime org-zanjir eskalatsiya ───────────────────────────────────
-- mes_sos_events allaqachon mavjud (session_id, employee_id, reason, work_center_id, resolved_*, created_at).
-- Eskalatsiya holatini ADDITIV ustunlar bilan kengaytiramiz.
ALTER TABLE mes_sos_events ADD COLUMN IF NOT EXISTS escalation_level     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE mes_sos_events ADD COLUMN IF NOT EXISTS current_department_id INTEGER;   -- zanjirdagi joriy karta (org_departments.id)
ALTER TABLE mes_sos_events ADD COLUMN IF NOT EXISTS assigned_user_id     INTEGER;    -- joriy javobgar (org_departments.head_user_id)
ALTER TABLE mes_sos_events ADD COLUMN IF NOT EXISTS escalation_due_at    TIMESTAMP WITH TIME ZONE; -- shu vaqtgacha javob yo'q → keyingi daraja
ALTER TABLE mes_sos_events ADD COLUMN IF NOT EXISTS status               VARCHAR(16) NOT NULL DEFAULT 'open'; -- open|escalated|resolved
ALTER TABLE mes_sos_events ADD COLUMN IF NOT EXISTS escalation_history   JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN mes_sos_events.escalation_level      IS 'Org-zanjir eskalatsiya darajasi (0=usta, har timeout +1 yuqoriga)';
COMMENT ON COLUMN mes_sos_events.current_department_id IS 'Zanjirdagi joriy karta (org_departments.id) — parent_id bo''ylab ko''tariladi';
COMMENT ON COLUMN mes_sos_events.assigned_user_id      IS 'Joriy javobgar foydalanuvchi (org_departments.head_user_id)';
COMMENT ON COLUMN mes_sos_events.escalation_due_at     IS 'Javob deadline — o''tib ketsa cron keyingi darajaga eskalatsiya qiladi';
COMMENT ON COLUMN mes_sos_events.status                IS 'SOS holati: open|escalated|resolved';
COMMENT ON COLUMN mes_sos_events.escalation_history    IS 'Eskalatsiya tarixi: [{level, department_id, user_id, at}]';

-- timeout-cron uchun index (faqat hal qilinmagan, deadline'i o'tganlar)
CREATE INDEX IF NOT EXISTS idx_mes_sos_escalation_due
  ON mes_sos_events (escalation_due_at)
  WHERE status <> 'resolved';
