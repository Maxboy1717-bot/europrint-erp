-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Vision 07-pp #131 — Maket holat sikli + avto muddat surish (dorabotka).
-- Replaces the single boolean maket_approved with a 4-state status cycle
-- (draft -> sent -> revision_requested -> approved) and an accumulated
-- revision-duration column that drives the auto deadline shift. Additive +
-- idempotent; existing rows migrate maket_approved=true -> 'approved', false -> 'draft'.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maket_status') THEN
    CREATE TYPE maket_status AS ENUM ('draft', 'sent', 'revision_requested', 'approved');
  END IF;
END $$;

ALTER TABLE technology_cards
  ADD COLUMN IF NOT EXISTS maket_status maket_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS maket_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS maket_revision_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS maket_revision_minutes integer NOT NULL DEFAULT 0;

-- One-time backfill from the legacy boolean. Guarded on maket_status='draft' so a
-- re-run never re-flips a card an operator later moved back through the cycle.
UPDATE technology_cards
   SET maket_status = 'approved'
 WHERE maket_approved = true AND maket_status = 'draft';
