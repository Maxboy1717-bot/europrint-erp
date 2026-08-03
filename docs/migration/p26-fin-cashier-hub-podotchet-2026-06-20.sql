-- Migration: P26-FIN — Cashier-hub (KAS-1/KAS-2) + Podotchet (advance/debt) + cashier PIN
-- APPROVED: Claude (egasi vakolati) 2026-06-20
-- Idempotent: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout — safe to re-run.
--
-- Tables created here back the EXISTING finance/cashier-hub slice (fi-cashier-hub.ts):
--   cashier_shifts          — KAS-1 factory cashier shifts (open/close, X/Z reconciliation)
--   cashier_movements       — every cash in/out posting a real GL journal (entries.id stored)
--   salary_payout_approvals — KAS-2 4-stage salary-payout approval chain (PIN-gated payout)
--   employee_debt           — podotchet "har som hisobli" employee debt (open/cleared)
--   advance_reports         — podotchet advance report (receipt) that clears a debt on approval
-- Plus users.pin_hash (VARCHAR(72)) — bcrypt store for the 4-digit cashier PIN (owner: PIN 4-digit).
--   Degressive: until populated, the cashier service GATES PIN-required movements (no forge).
--
-- NOTE: distinct from the retail cash_registers/cash_sessions/cash_transactions (fi-kassa.ts) POS flow.

-- ── KAS-1: cashier shifts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cashier_shifts (
  id               SERIAL PRIMARY KEY,
  cashier_user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  opened_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  opened_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
  closed_at        TIMESTAMP,
  closed_amount    NUMERIC(18,2),
  expected_amount  NUMERIC(18,2),
  variance         NUMERIC(18,2),
  status           VARCHAR(10) NOT NULL DEFAULT 'open',
  notes            TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT cashier_shifts_status_chk CHECK (status IN ('open','closed'))
);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_cashier_user_id ON cashier_shifts(cashier_user_id);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_status          ON cashier_shifts(status);
-- One OPEN shift per cashier (partial unique — service also guards).
CREATE UNIQUE INDEX IF NOT EXISTS uq_cashier_shifts_one_open
  ON cashier_shifts(cashier_user_id) WHERE status = 'open';

-- ── KAS-1: cashier movements (each posts to canonical GL `entries`) ──────────
CREATE TABLE IF NOT EXISTS cashier_movements (
  id           SERIAL PRIMARY KEY,
  shift_id     INTEGER NOT NULL REFERENCES cashier_shifts(id) ON DELETE RESTRICT,
  type         VARCHAR(20) NOT NULL,
  amount       NUMERIC(18,2) NOT NULL,
  reference    VARCHAR(120) NOT NULL UNIQUE,
  gl_entry_id  INTEGER,
  description  TEXT,
  created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  pin_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT cashier_movements_type_chk
    CHECK (type IN ('cash_in','cash_out','salary_payout','advance','expense')),
  CONSTRAINT cashier_movements_amount_chk CHECK (amount > 0)
);
CREATE INDEX IF NOT EXISTS idx_cashier_movements_shift_id ON cashier_movements(shift_id);
CREATE INDEX IF NOT EXISTS idx_cashier_movements_type     ON cashier_movements(type);

-- ── KAS-2: salary-payout approval chain ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_payout_approvals (
  id                   SERIAL PRIMARY KEY,
  employee_id          INTEGER NOT NULL,
  amount               NUMERIC(18,2) NOT NULL,
  reference            VARCHAR(120) NOT NULL UNIQUE,
  status               VARCHAR(20) NOT NULL DEFAULT 'pending',
  ai_checked_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ai_checked_at        TIMESTAMP,
  hr_approved_by       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  hr_approved_at       TIMESTAMP,
  finance_approved_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  finance_approved_at  TIMESTAMP,
  director_approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  director_approved_at TIMESTAMP,
  rejected_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejected_at          TIMESTAMP,
  rejection_reason     TEXT,
  paid_movement_id     INTEGER,
  notes                TEXT,
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT salary_payout_approvals_status_chk
    CHECK (status IN ('pending','ai_checked','hr_approved','finance_approved','approved','rejected')),
  CONSTRAINT salary_payout_approvals_amount_chk CHECK (amount > 0)
);
CREATE INDEX IF NOT EXISTS idx_salary_payout_approvals_employee_id ON salary_payout_approvals(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payout_approvals_status      ON salary_payout_approvals(status);

-- ── Podotchet: employee debt ("har som hisobli") ────────────────────────────
CREATE TABLE IF NOT EXISTS employee_debt (
  id           SERIAL PRIMARY KEY,
  employee_id  INTEGER NOT NULL,
  amount       NUMERIC(18,2) NOT NULL,
  reason       TEXT,
  status       VARCHAR(10) NOT NULL DEFAULT 'open',
  reference    VARCHAR(120) NOT NULL UNIQUE,
  movement_id  INTEGER,
  cleared_at   TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT employee_debt_status_chk CHECK (status IN ('open','cleared')),
  CONSTRAINT employee_debt_amount_chk CHECK (amount > 0)
);
CREATE INDEX IF NOT EXISTS idx_employee_debt_employee_id ON employee_debt(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_debt_status      ON employee_debt(status);

-- ── Podotchet: advance report (receipt) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS advance_reports (
  id           SERIAL PRIMARY KEY,
  employee_id  INTEGER NOT NULL,
  debt_id      INTEGER NOT NULL REFERENCES employee_debt(id) ON DELETE RESTRICT,
  amount       NUMERIC(18,2) NOT NULL,
  receipt_ref  VARCHAR(200),
  approved     BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at  TIMESTAMP,
  reference    VARCHAR(120) NOT NULL UNIQUE,
  notes        TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT advance_reports_amount_chk CHECK (amount > 0)
);
CREATE INDEX IF NOT EXISTS idx_advance_reports_employee_id ON advance_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_reports_debt_id     ON advance_reports(debt_id);

-- ── KAS-2: cashier PIN store (bcrypt, 4-digit) ──────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(72);
