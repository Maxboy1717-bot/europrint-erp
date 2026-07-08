-- iot-tablet-idempotency-2026-07-08.sql
-- VISION-3340 #38 — IoT tablet offline defect / inline-QC / material-return
-- mutations had no dedup key, so an offline tablet re-submitting after a network
-- retry double-inserts (double defect count / duplicate inline-QC row / duplicate
-- material_movements + double stock credit). Adds an OPTIONAL idempotency key
-- (tablet_id, local_seq_no) to each of the three raw-SQL INSERT targets so a retry
-- is detectable and skipped by IotTabletController.
--
-- APPROVED: egasi (owner) 2026-07-08 VISION-3340 #38
--
-- Additive + idempotent: both columns are NULLABLE (existing rows unaffected) and
-- every statement is ALTER ... IF EXISTS ... ADD COLUMN IF NOT EXISTS / CREATE INDEX
-- IF NOT EXISTS. The uniqueness backstop is a PARTIAL UNIQUE INDEX that only applies
-- when BOTH keys are non-NULL, so all legacy rows (tablet_id/local_seq_no NULL) are
-- exempt and can coexist without violating the constraint.
--
-- Write path: IotTabletController.reportProductionDefect (downtime_events),
-- submitInlineQc (inline_qc_checks), submitMaterialReturn (material_movements) —
-- each probes SELECT 1 ... WHERE tablet_id=? AND local_seq_no=? before inserting and
-- returns an idempotent success (no re-insert, no count bump, no command dispatch)
-- when the pair already exists.

ALTER TABLE IF EXISTS downtime_events   ADD COLUMN IF NOT EXISTS tablet_id    TEXT;
ALTER TABLE IF EXISTS downtime_events   ADD COLUMN IF NOT EXISTS local_seq_no BIGINT;

ALTER TABLE IF EXISTS inline_qc_checks  ADD COLUMN IF NOT EXISTS tablet_id    TEXT;
ALTER TABLE IF EXISTS inline_qc_checks  ADD COLUMN IF NOT EXISTS local_seq_no BIGINT;

ALTER TABLE IF EXISTS material_movements ADD COLUMN IF NOT EXISTS tablet_id    TEXT;
ALTER TABLE IF EXISTS material_movements ADD COLUMN IF NOT EXISTS local_seq_no BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_downtime_events_tablet_seq
  ON downtime_events (tablet_id, local_seq_no)
  WHERE tablet_id IS NOT NULL AND local_seq_no IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_inline_qc_checks_tablet_seq
  ON inline_qc_checks (tablet_id, local_seq_no)
  WHERE tablet_id IS NOT NULL AND local_seq_no IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_material_movements_tablet_seq
  ON material_movements (tablet_id, local_seq_no)
  WHERE tablet_id IS NOT NULL AND local_seq_no IS NOT NULL;

-- DB-proof: after running
-- SELECT table_name, column_name FROM information_schema.columns
--  WHERE column_name IN ('tablet_id','local_seq_no')
--    AND table_name IN ('downtime_events','inline_qc_checks','material_movements')
--  ORDER BY table_name, column_name;  -- expected: 6 rows
