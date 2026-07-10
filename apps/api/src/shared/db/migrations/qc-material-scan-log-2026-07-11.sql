-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- qc-material-scan-log-2026-07-11.sql
-- Vision 09-qc #11 — "Har rulon tabletda scan → qc_material_scan_log
-- (order/lot/stanok/smena/ts); FIFO aybdor-lot".
--
-- Append-only per-roll scan log: every roll a floor operator scans on the tablet
-- writes ONE row — order_id, lot, work_center_id (stanok), shift_id (smena),
-- scanned_at (ts) — so a later defect can be walked FIFO back to the guilty
-- material lot. No owner master-data / threshold is required to function.
--
-- Idempotency mirrors iot-tablet-idempotency-2026-07-08.sql: an offline tablet
-- re-submitting after a network retry carries the same (tablet_id, local_seq_no);
-- the PARTIAL UNIQUE INDEX (both keys NOT NULL) makes the retry a no-op, while
-- key-less scans (NULL,NULL) are exempt and can coexist.
--
-- Fully additive + idempotent: brand-new table (to_regclass=null this pass), no
-- existing table/row is touched. Only id / scanned_at / created_at are NOT NULL
-- and self-default; every business column is NULLABLE.

CREATE TABLE IF NOT EXISTS qc_material_scan_log (
  id             SERIAL PRIMARY KEY,
  order_id       INTEGER,
  session_id     INTEGER,
  lot            VARCHAR(100),
  material_id    INTEGER,
  work_center_id INTEGER,
  shift_id       INTEGER,
  scanned_by     INTEGER,
  scanned_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  tablet_id      TEXT,
  local_seq_no   BIGINT,
  notes          TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_qc_material_scan_log_tablet_seq
  ON qc_material_scan_log (tablet_id, local_seq_no)
  WHERE tablet_id IS NOT NULL AND local_seq_no IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_qc_material_scan_log_order   ON qc_material_scan_log (order_id);
CREATE INDEX IF NOT EXISTS idx_qc_material_scan_log_session ON qc_material_scan_log (session_id);
CREATE INDEX IF NOT EXISTS idx_qc_material_scan_log_lot     ON qc_material_scan_log (lot);
CREATE INDEX IF NOT EXISTS idx_qc_material_scan_log_scanned ON qc_material_scan_log (scanned_at);
