-- pp-production-order-status-log-2026-06-26.sql
-- T18-C3-CRM-GATED — PP buyurtma status o'zgarishlar jurnali (audit trail).
-- Vizyon: PP status o'zgarganda kim/qachon/eski→yangi yoziladi (golden-thread kuzatuv).
--
-- APPROVED: egasi-direktiva "vizyon bo'yicha to'liq bajar hamma vizyon" 2026-06-26
--   (additiv: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS — idempotent).
--
-- production_orders.id = integer (logical ref, cross-module FK ADR bo'yicha logikada).
-- Yozuvchi: UpdateOrderStatusHandler (PP) — status o'zgarganda INSERT.
-- DB-PROOF (rollback-tx, 2026-06-26): INSERT old→new + read-back PASS.

BEGIN;

CREATE TABLE IF NOT EXISTS production_order_status_log (
  id                  SERIAL PRIMARY KEY,
  production_order_id INTEGER NOT NULL,   -- logical ref production_orders.id
  old_status          VARCHAR(40),         -- NULL = birinchi status (yaratilish)
  new_status          VARCHAR(40) NOT NULL,
  changed_by          INTEGER,             -- logical ref users.id (NULL = system/auto)
  reason              TEXT,
  metadata            JSONB,
  changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_status_log_order
  ON production_order_status_log(production_order_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_po_status_log_new_status
  ON production_order_status_log(new_status, changed_at DESC);

COMMENT ON TABLE production_order_status_log IS
  'T18-C3: PP buyurtma status o''zgarishlar audit jurnali (kim/qachon/eski→yangi). Yozuvchi: UpdateOrderStatusHandler.';

COMMIT;

-- Tekshirish:
--   SELECT production_order_id, old_status, new_status, changed_by, changed_at
--   FROM production_order_status_log ORDER BY changed_at DESC LIMIT 20;
