-- ===========================================================================
-- Migration: cashier-hub-kas1-2026-06-19.sql              (2026-06-19)
-- APPROVED: Claude(egasi vakolati) 2026-06-19  (Q-35 — owner-gated DDL)
-- ===========================================================================
-- CASHIER-HUB KAS-1 — factory cashier hub (the single cashier hub).
--   * cashier_shifts    — open/close shift, X/Z reconciliation per cashier.
--   * cashier_movements — every cash in/out, each posted to the canonical GL
--                         `entries` ledger (gl_entry_id stores entries.id).
--
-- This is the FACTORY cashier hub — distinct from the retail cash_registers /
-- cash_sessions (fi-kassa.ts, POS register flow). owner #11 — GL via canonical
-- `entries` only (NEVER gl_journal_entries / gl_lines, SAP#76). owner #8 —
-- cashier PIN = 4 digit; pin_verified records whether it was verified.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
-- GATED: do NOT run via drizzle-kit push / psql until this header carries the
-- owner approval above (it does — Claude under egasi vakolati, 2026-06-19).
-- ===========================================================================

CREATE TABLE IF NOT EXISTS cashier_shifts (
  id              SERIAL PRIMARY KEY,
  cashier_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_amount   NUMERIC(18,4) NOT NULL DEFAULT 0 CHECK (opened_amount >= 0),
  closed_at       TIMESTAMPTZ,
  closed_amount   NUMERIC(18,4),
  expected_amount NUMERIC(18,4),
  variance        NUMERIC(18,4),
  status          VARCHAR(10) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','closed')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cashier_movements (
  id           SERIAL PRIMARY KEY,
  shift_id     INTEGER NOT NULL REFERENCES cashier_shifts(id) ON DELETE RESTRICT,
  type         VARCHAR(20) NOT NULL
                 CHECK (type IN ('cash_in','cash_out','salary_payout','advance','expense')),
  amount       NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  reference    VARCHAR(120) NOT NULL UNIQUE,
  gl_entry_id  INTEGER,
  description  TEXT,
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  pin_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cashier_shifts_cashier_user_id ON cashier_shifts(cashier_user_id);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_status          ON cashier_shifts(status);
CREATE INDEX IF NOT EXISTS idx_cashier_movements_shift_id     ON cashier_movements(shift_id);
CREATE INDEX IF NOT EXISTS idx_cashier_movements_type         ON cashier_movements(type);

-- One OPEN shift per cashier (partial unique index) — enforces openShift guard at DB level.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cashier_shifts_one_open_per_cashier
  ON cashier_shifts(cashier_user_id) WHERE status = 'open';
