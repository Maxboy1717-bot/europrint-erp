-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- vision 06-sd#14 — Klishe/forma ~3 yil saqlash muddati + cron ogohlantirish + hisobdan chiqarish akti.
-- Idempotent (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS / additive UPDATE): safe to re-run.
-- Non-regressing: owner_type defaults 'factory'; retention_until/archived_at nullable; existing 0 rows unaffected.

ALTER TABLE ow_molds ADD COLUMN IF NOT EXISTS owner_type text NOT NULL DEFAULT 'factory';   -- 'factory' | 'customer' (klishe egaligi, #124 bilan umumiy)
ALTER TABLE ow_molds ADD COLUMN IF NOT EXISTS retention_until date;                          -- = received_at + ~3 yil (1095 kun); cron to'ldiradi
ALTER TABLE ow_molds ADD COLUMN IF NOT EXISTS archived_at timestamptz;                        -- hisobdan chiqarilgan (write-off) vaqti; NULL = faol

CREATE TABLE IF NOT EXISTS ow_mold_writeoff_acts (
  id              serial PRIMARY KEY,
  mold_id         uuid NOT NULL REFERENCES ow_molds(id),
  act_number      text NOT NULL,                                   -- KLW-YYYY-NNNNN
  owner_type      text NOT NULL DEFAULT 'factory',                 -- write-off paytidagi egalik (mold'dan ko'chiriladi)
  received_at     timestamptz,                                     -- mold'dan snapshot
  retention_until date,                                            -- mold'dan snapshot
  reason          text,
  status          text NOT NULL DEFAULT 'written_off',
  acted_by        integer,                                         -- users.id (aktni imzolagan; soft ref)
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ow_mold_writeoff_acts_act_number_uq UNIQUE (act_number)
);

CREATE INDEX IF NOT EXISTS ow_mold_writeoff_acts_mold_idx ON ow_mold_writeoff_acts (mold_id);
CREATE INDEX IF NOT EXISTS ow_molds_retention_idx ON ow_molds (retention_until) WHERE archived_at IS NULL;

-- Backfill retention_until (received_at + ~3 yil = 1095 kun) for already-received, non-archived molds.
-- Additive & idempotent: only touches rows where retention_until is still NULL.
UPDATE ow_molds
   SET retention_until = (received_at + interval '1095 days')::date
 WHERE received_at IS NOT NULL AND retention_until IS NULL AND archived_at IS NULL;
