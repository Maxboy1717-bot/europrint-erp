-- APPROVED: egasi 2026-07-02 vizyonni toliq qilish
-- MASTER-REJA-VIZYON-2026-07-02.md band 3.7: "ZNO/ZVS 24/48h SLA-eskalatsiya cron".
-- Additive ALTER only — dedup marker so zno-zvs-sla-escalation.cron.ts does not re-notify
-- the same overdue request on every hourly run (escalated_at IS NULL guards the UPDATE).
ALTER TABLE zvs ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP;
ALTER TABLE zno ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP;
