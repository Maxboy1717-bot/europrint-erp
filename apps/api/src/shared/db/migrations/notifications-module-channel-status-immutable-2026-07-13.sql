-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Owner decision 2026-07-13 (chat): 4 new columns on the single `notifications` table (NOT a
-- new table) — module_code / channel / status / immutable.
--
-- module_code  — originating ERP module (nullable TEXT). Vocabulary matches the established
--                business_settings.module values already live in this DB (cc, coordination, crm,
--                director, finance, iot, kanban, lms, marketing, mes, mm, notifications, pos, pp,
--                qc, sd, wms). Wired as an optional field on CreateNotificationCommand
--                (create-notification.handler.ts) — no reliable inference from reference_type
--                exists (its live values like 'pos_movement'/'lms_exam'/'write_off_act' don't map
--                1:1 to a module code), so the caller supplies it explicitly instead of it being
--                guessed (Q-40, no fabrication).
-- channel      — delivery channel attempted for this notification (nullable TEXT). Vocabulary
--                matches the existing channels already used in create-notification.handler.ts /
--                ExtendedCreateNotificationCommand: 'telegram'|'email'|'sms'|'in_app'. Wired in
--                the handler as the primary (first) channel from the resolved channels list — the
--                same list the existing per-channel delivery loop iterates.
-- status       — delivery status (nullable TEXT, default 'pending'). Vocabulary: 'pending'|
--                'sent'|'failed'. NOTE: distinct from the existing is_read/read_at columns, which
--                track READ status, not delivery status — deliberately not conflated with those
--                (owner clarification 2026-07-13).
-- immutable    — marks certain notification types (e.g. official/legal notices) as
--                non-deletable/non-editable (NOT NULL BOOLEAN, default false — additive, existing
--                rows unaffected). No notifications DELETE/body-mutating endpoint exists yet in
--                this codebase (only mark-as-read), so there is nothing to guard today; when one
--                is added it must follow the existing CC "immutable document" convention —
--                application-level check before mutate (see
--                communication-center/application/cc-retention.service.ts archiveWithRetention:
--                re-reads current state, returns Err({code:'CONFLICT'}) if already immutable) —
--                this codebase has no DB-trigger precedent for enforcing immutability, so one is
--                not invented here.
--
-- Human-readable mirror of the SCHEMA_MIGRATIONS entries in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (actual boot-time loader).
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS module_code TEXT;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS immutable BOOLEAN NOT NULL DEFAULT false;
