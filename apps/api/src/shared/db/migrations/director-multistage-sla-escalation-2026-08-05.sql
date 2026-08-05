-- director-multistage-sla-escalation-2026-08-05.sql
-- APPROVED: Q-35 blanket schema-approval (owner grant 2026-07-11, ca3648bf) — this item
-- was harvested + explicitly pre-classified "Code-buildable-now" in
-- FULL-ITEM-LEVEL-MASTER-PLAN-2026-07-11.md [Module-05] Item 33
-- (vision-1000-answers/05-director.md #33): "2 marta eslatmadan keyin bo'lim rahbarining
-- o'z rahbariga avtomatik eskalatsiya; 3-marta ham topshirilmasa HR intizom tizimiga
-- uzatiladi".
--
-- Human-readable mirror only. The actual boot-time DDL/seed lives in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (SCHEMA_MIGRATIONS).

ALTER TABLE zno ADD COLUMN IF NOT EXISTS escalation_stage smallint NOT NULL DEFAULT 0;
ALTER TABLE zvs ADD COLUMN IF NOT EXISTS escalation_stage smallint NOT NULL DEFAULT 0;
ALTER TABLE rasporyazhenie ADD COLUMN IF NOT EXISTS escalation_stage smallint NOT NULL DEFAULT 0;
COMMENT ON COLUMN zno.escalation_stage IS '0=none,1=notified@1xSLA(existing),2=escalated to managers-manager,3=HR discipline_records created (terminal)';
COMMENT ON COLUMN zvs.escalation_stage IS 'same ladder as zno.escalation_stage';
COMMENT ON COLUMN rasporyazhenie.escalation_stage IS 'same ladder as zno.escalation_stage';

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
 ('director','director.escalation_stage2_sla_multiplier','ZNO/ZVS 2-bosqich: bazaviy SLA soatining necha barobari','number',2,'x',1,10,'stage 1->2 (managers-manager) necha x bazaviy SLA (24h/48h) dan keyin', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
 ('director','director.escalation_stage3_sla_multiplier','ZNO/ZVS 3-bosqich: bazaviy SLA soatining necha barobari','number',3,'x',2,15,'stage 2->3 (HR discipline_records) necha x bazaviy SLA dan keyin', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
 ('director','director.rasp_escalation_stage2_days','Farmoyish 2-bosqich: overdue dan necha kun keyin','number',1,'kun',0,30,'rasporyazhenie stage1(overdue)->2 (ijrochi menejerining menejeri) necha kundan keyin', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
 ('director','director.rasp_escalation_stage3_days','Farmoyish 3-bosqich: overdue dan necha kun keyin','number',2,'kun',1,60,'rasporyazhenie stage2->3 (HR discipline_records) necha kundan keyin', true)
ON CONFLICT (setting_key) DO NOTHING;
