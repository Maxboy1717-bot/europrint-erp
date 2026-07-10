-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Vision 07-pp #125 (EP-PP-119): Marshrutga material-tayyorlash + yetkazish tashqi bosqichlari.
-- An external stage (material prep / delivery) is a route step that does NOT occupy an internal
-- work center (machine_id stays NULL) but contributes lead time to the card's schedule.
-- is_external flags the step; external_lead_time_hours carries the lead time it adds.
-- Additive + idempotent: existing rows default to is_external=false (= ordinary internal
-- operation = current behavior) and external_lead_time_hours = NULL.
ALTER TABLE tech_card_routes ADD COLUMN IF NOT EXISTS is_external boolean NOT NULL DEFAULT false;
ALTER TABLE tech_card_routes ADD COLUMN IF NOT EXISTS external_lead_time_hours numeric;
