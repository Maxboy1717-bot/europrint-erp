-- p49-wms-supplier-traceability-2026-06-26.sql
-- T18-C3-CRM-GATED — P49 WMS yetkazib beruvchi izlanuvchanlik (supplier traceability).
-- Vizyon: har qabul qilingan material partiyasi yetkazib beruvchi + lot/batch + sana
--   bilan bog'lanadi (sifat muammosi → manbagacha izlash; QC recall zanjiri).
--
-- APPROVED: egasi-direktiva "vizyon bo'yicha to'liq bajar hamma vizyon" 2026-06-26
--   (additiv: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS — idempotent).
--
-- Logical refs (cross-module FK ADR bo'yicha logikada, DB-level FK YO'Q):
--   supplier_id → vendors/suppliers.id,  material_id → material_cards.id,
--   goods_receipt_id → goods_receipts.id (integer).
-- DB-PROOF (rollback-tx, 2026-06-26): INSERT trace + read-back PASS.

BEGIN;

CREATE TABLE IF NOT EXISTS wms_supplier_traceability (
  id                  SERIAL PRIMARY KEY,
  goods_receipt_id    INTEGER,             -- logical ref goods_receipts.id
  supplier_id         INTEGER NOT NULL,    -- logical ref vendors/suppliers.id
  material_id         INTEGER,             -- logical ref material_cards.id
  batch_number        VARCHAR(80),
  lot_number          VARCHAR(80),
  supplier_lot_ref    VARCHAR(120),        -- yetkazib beruvchi o'z lot raqami
  quantity            NUMERIC(14,3),
  unit                VARCHAR(20),
  manufacture_date    DATE,
  expiry_date         DATE,
  received_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quality_status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (quality_status IN ('pending','passed','failed','quarantined')),
  certificate_ref     TEXT,                -- sifat sertifikati / hujjat havolasi
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wms_trace_supplier
  ON wms_supplier_traceability(supplier_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_wms_trace_material
  ON wms_supplier_traceability(material_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_wms_trace_batch
  ON wms_supplier_traceability(batch_number);
CREATE INDEX IF NOT EXISTS idx_wms_trace_receipt
  ON wms_supplier_traceability(goods_receipt_id);

COMMENT ON TABLE wms_supplier_traceability IS
  'T18-C3 / P49: material partiya → yetkazib beruvchi + lot/batch izlanuvchanlik (QC recall zanjiri).';

COMMIT;

-- Tekshirish:
--   SELECT supplier_id, material_id, batch_number, quality_status, received_at
--   FROM wms_supplier_traceability ORDER BY received_at DESC LIMIT 20;
