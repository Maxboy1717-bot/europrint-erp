-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/sd-customers-packaging-method-2026-07-11.sql
-- Vision CRM-13 #133 — Agreed packaging method on customer card. Runtime-entered
--   per-customer free-text field (e.g. pallet+strech, karobka, quti+skotch)
--   negotiated with the customer; vision text gives no fixed vocabulary/enum for
--   this field, so it is a nullable free-text column (build note: "defaults NULL").
-- Idempotent (IF NOT EXISTS). Additive column on canonical live customer table
--   sd_customers — no existing reader/writer touched, no rename/drop.
-- ============================================================

ALTER TABLE sd_customers
  ADD COLUMN IF NOT EXISTS packaging_method TEXT;
