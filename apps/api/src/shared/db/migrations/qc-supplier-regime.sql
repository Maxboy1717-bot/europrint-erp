-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- vision 09-qc#8 — Kuchaytirilgan nazorat (ISO 2859): per-supplier + per-material inspection regime.
-- Idempotent (CREATE TYPE guard / CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS): safe to re-run.
-- Non-regressing: additive only; no existing table/column altered.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inspection_regime') THEN
    CREATE TYPE inspection_regime AS ENUM ('normal', 'tightened', 'reduced');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS qc_supplier_regime (
  id                     serial PRIMARY KEY,
  supplier_id            integer NOT NULL,                       -- vendors.id (soft ref)
  material_id            integer NOT NULL,                       -- material_cards.id (soft ref)
  regime                 inspection_regime NOT NULL DEFAULT 'normal',
  consecutive_rejections integer NOT NULL DEFAULT 0,
  consecutive_accepts    integer NOT NULL DEFAULT 0,
  last_inspection_id     integer,                                -- qc_inspections.id (soft ref, audit)
  tightened_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT qc_supplier_regime_supplier_material_uq UNIQUE (supplier_id, material_id),
  CONSTRAINT qc_supplier_regime_rej_chk CHECK (consecutive_rejections >= 0),
  CONSTRAINT qc_supplier_regime_acc_chk CHECK (consecutive_accepts >= 0)
);

CREATE INDEX IF NOT EXISTS qc_supplier_regime_regime_idx ON qc_supplier_regime (regime);
