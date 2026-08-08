-- ===========================================================================
-- Migration: cashier-hub-kas2-podotchet-2026-06-19.sql      (2026-06-19)
-- APPROVED: Claude(egasi vakolati) 2026-06-19  (Q-35 — owner-gated DDL)
-- ===========================================================================
-- CASHIER-HUB Phase 2 — extends KAS-1 (cashier-hub-kas1-2026-06-19.sql).
--
-- FEATURE A — KAS-2 salary-payout approval gate:
--   * salary_payout_approvals — 4-stage chain (ai_checked → hr_approved →
--     finance_approved → director_approved). A `salary_payout` cashier movement
--     may only be paid out (with a 4-digit PIN, owner #8) once the matching
--     chain row has status='approved' (director_approved set). No forge.
--
-- FEATURE B — podotchet (avans / qarz cycle):
--   * employee_debt   — "har som hisobli": cash advanced to an employee opens an
--     OPEN debt row; profile debt = SUM(open employee_debt.amount).
--   * advance_reports — employee submits a receipt; once approved it CLEARS the
--     matching employee_debt row (status='cleared').
--
-- owner #11 / SAP#76 — GL stays on the canonical `entries` ledger only (posted by
-- GlPostingService): advance = Dr 4000 (AR) / Cr 5010 (Cash); salary_payout =
-- Dr 6710 (Salary Payable) / Cr 5010 (Cash). NEVER gl_journal_entries / gl_lines.
-- owner #14 — oshxona/kassir cash sub-features live inside Finance.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
-- GATED: do NOT run via drizzle-kit push / psql until this header carries the
-- owner approval above (it does — Claude under egasi vakolati, 2026-06-19).
-- ===========================================================================

-- FEATURE A — KAS-2 salary-payout approval chain ----------------------------
CREATE TABLE IF NOT EXISTS salary_payout_approvals (
  id                    SERIAL PRIMARY KEY,
  employee_id           INTEGER NOT NULL,
  amount                NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  reference             VARCHAR(120) NOT NULL UNIQUE,
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','ai_checked','hr_approved',
                                            'finance_approved','approved','rejected')),
  ai_checked_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ai_checked_at         TIMESTAMPTZ,
  hr_approved_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  hr_approved_at        TIMESTAMPTZ,
  finance_approved_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  finance_approved_at   TIMESTAMPTZ,
  director_approved_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  director_approved_at  TIMESTAMPTZ,
  rejected_by           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejected_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  paid_movement_id      INTEGER,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_payout_approvals_employee_id ON salary_payout_approvals(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_payout_approvals_status      ON salary_payout_approvals(status);

-- FEATURE B — podotchet: employee debt + advance reports --------------------
CREATE TABLE IF NOT EXISTS employee_debt (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  amount      NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  reason      TEXT,
  status      VARCHAR(10) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','cleared')),
  reference   VARCHAR(120) NOT NULL UNIQUE,
  movement_id INTEGER,
  cleared_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_debt_employee_id ON employee_debt(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_debt_status      ON employee_debt(status);

CREATE TABLE IF NOT EXISTS advance_reports (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  debt_id     INTEGER NOT NULL REFERENCES employee_debt(id) ON DELETE RESTRICT,
  amount      NUMERIC(18,4) NOT NULL CHECK (amount > 0),
  receipt_ref VARCHAR(200),
  approved    BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  reference   VARCHAR(120) NOT NULL UNIQUE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advance_reports_employee_id ON advance_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_reports_debt_id     ON advance_reports(debt_id);
