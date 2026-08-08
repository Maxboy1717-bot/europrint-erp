-- Additive ALTER only — no CREATE TABLE, no owner-approval marker needed (Q-35 only gates
-- new tables). notifications.priority already exists ad hoc on the live DB (character
-- varying, written by notification-schedules.controller.ts's PriorityEnum: low/normal/
-- high/urgent — see notification-schedule.cron.ts + notification-schedules.repository.ts).
-- This file brings any other environment (fresh DB / CI) in line with the live schema, and
-- backs the new `priority` field now mapped in schema-compat-3.ts's notifications pgTable so
-- drizzle-notification.repo.ts can ORDER BY it (urgent/high first, then created_at DESC).
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR;
