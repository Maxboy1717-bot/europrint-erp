-- Migration: T21-B2 — Cashier daily-cash-limit + FP-cycle (INPS/JSHD) configurable rates
-- APPROVED: egasi "hamma vizyon" 2026-06-26
-- Idempotent: ADD COLUMN IF NOT EXISTS / INSERT ... ON CONFLICT — safe to re-run.
-- ADDITIVE ONLY — no DROP, no destructive constraint change (Q-46 / Q-39).
--
-- WHY:
--   (1) Gap #31 — KAS-1 cashier cash-control needs a per-shift daily cash limit so the
--       X/Z naqd-ledger can warn when the drawer exceeds the configured ceiling. The
--       column is NULL by default (no limit) — owner sets it per-shift or a global default
--       is read from cfo_config('cashier_daily_cash_limit_uzs'). Nothing is fabricated:
--       NULL limit = no warning (graceful default, Q-40).
--   (2) Gap #32 — FP-cycle (financial-period) INPS/JSHD payroll-tax rates were hardcoded in
--       payroll-tax.constants.ts. PayrollTaxService.compute() already accepts an `opts`
--       override; these cfo_config rows make the rates owner-configurable from the screen
--       (ArApAging FP-cycle config UI) without a recompile. Defaults mirror the constants
--       (INPS 12% = 0.12, JSHD 1% = 0.01) — owner can change them later.

-- (1) cashier_shifts.daily_cash_limit — optional per-shift ceiling (UZS). NULL = no limit.
ALTER TABLE cashier_shifts
  ADD COLUMN IF NOT EXISTS daily_cash_limit numeric(18,2);

COMMENT ON COLUMN cashier_shifts.daily_cash_limit IS
  'KAS-1 optional per-shift daily cash ceiling (UZS). NULL = no limit. X/Z ledger warns when drawer > limit.';

-- (2) FP-cycle configurable payroll-tax rates (INPS / JSHD) + a global cashier limit default.
--     cfo_config(config_key text unique, config_value numeric, description text, updated_at).
INSERT INTO cfo_config (config_key, config_value, description, updated_at) VALUES
  ('payroll_inps_rate',            0.12,      'INPS — jismoniy shaxs daromad solig''i stavkasi (FP-tsikl, sozlanadigan)',   NOW()),
  ('payroll_jshd_rate',            0.01,      'JSHD — xodim ijtimoiy/pensiya hissasi stavkasi (FP-tsikl, sozlanadigan)',    NOW()),
  ('payroll_employer_social_rate', 0.12,      'Ish beruvchi ijtimoiy soliq (ESP) stavkasi — GL uchun (sozlanadigan)',       NOW()),
  ('cashier_daily_cash_limit_uzs', 0,         'Kassir kunlik naqd limiti (UZS) — global standart (0 = limitsiz)',           NOW())
ON CONFLICT (config_key) DO NOTHING;
