-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Vision 09-qc #34: "Yakuniy xulosada har bosqich holati; eng past FTQ% = eng zaif halqa auto-belgi".
-- Per-stage FTQ (First-Time-Quality) weakest-link auto-flag. Adds a stage gate classifier to
-- qc_inspections so FTQ% can be aggregated per quality-gate stage and the minimum-FTQ% stage is
-- auto-flagged as the "eng zaif halqa" (weakest link). Column is nullable (existing rows
-- non-regressed); a backfill derives stage from the existing reference_type. text+CHECK matches
-- the live qc_inspections.status varchar convention (not a native pg enum). Pure computation over
-- existing inspection counts — no owner data.

ALTER TABLE qc_inspections ADD COLUMN IF NOT EXISTS stage TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'qc_inspections_stage_check') THEN
    ALTER TABLE qc_inspections
      ADD CONSTRAINT qc_inspections_stage_check
      CHECK (stage IS NULL OR stage IN ('incoming','in_process','final','dispatch'));
  END IF;
END $$;

-- Backfill existing rows from reference_type (additive; only touches NULL stages).
UPDATE qc_inspections
SET stage = CASE
    WHEN reference_type IN ('purchase_order','material','incoming') THEN 'incoming'
    WHEN reference_type IN ('dispatch','shipment','delivery')        THEN 'dispatch'
    WHEN reference_type = 'production_order'                          THEN 'in_process'
    ELSE 'final'
  END
WHERE stage IS NULL;

CREATE INDEX IF NOT EXISTS qc_inspections_stage_idx ON qc_inspections (stage);
