-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Vision 10-warehouse #6 — "IoT signalda o'sha zonadagi barcha zaxira 'xavf ostida'"
--   (an IoT anomaly in a zone flags ALL stock in that zone as at-risk).
-- Additive + idempotent. Canonical raw-material stock table = warehouse_stock (STANDARTLAR.md §15) —
-- ALTERed in place, never forked. Zone membership resolves via warehouse_stock.bin_location_id ->
-- warehouse_bins.zone_id. Existing rows default at_risk=false (no regress); the flag is set only when a
-- zone signal fires. qc_review_queue = one QC-review entry per flagged stock row (pure append/resolve log).

ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS at_risk        boolean   NOT NULL DEFAULT false;
ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS at_risk_reason text;
ALTER TABLE warehouse_stock ADD COLUMN IF NOT EXISTS at_risk_at     timestamp;

-- Partial index: only the (few) at-risk rows are indexed.
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_at_risk ON warehouse_stock (at_risk) WHERE at_risk = true;

CREATE TABLE IF NOT EXISTS qc_review_queue (
  id            serial PRIMARY KEY,
  stock_id      integer NOT NULL REFERENCES warehouse_stock(id) ON DELETE CASCADE, -- qaysi zaxira qatori
  warehouse_id  integer,                                                           -- ombor (denormalized context)
  zone_id       integer,                                                           -- signal bergan zona
  material_id   integer,                                                           -- material (context)
  reason        text,                                                              -- xavf sababi (IoT signal matni)
  source        varchar(40)  NOT NULL DEFAULT 'iot_signal',                        -- provenance
  status        varchar(20)  NOT NULL DEFAULT 'pending',                           -- pending | resolved
  created_at    timestamp    NOT NULL DEFAULT now(),
  resolved_at   timestamp,
  resolved_by   integer,
  tenant_id     integer      NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_qc_review_queue_status   ON qc_review_queue (status);
CREATE INDEX IF NOT EXISTS idx_qc_review_queue_stock_id ON qc_review_queue (stock_id);
CREATE INDEX IF NOT EXISTS idx_qc_review_queue_zone_id  ON qc_review_queue (zone_id);
