-- material-kit-items-batch-id-2026-07-08.sql
-- VISION-3340 #16 — material_kit_items had no FK to material_batches (28 cols,
-- 0 rows) — a floor-operator's scan could never be traced back to the physical
-- LOT it consumed. Additive nullable FK column + index.
--
-- Write path: IotTabletController.persistKitItemScan (scanMaterialKitItem /
-- patchScanMaterialKitItem) — when the scan resolves a batchId, it persists it
-- here and decrements material_batches.remaining_quantity by the kit item's
-- required_quantity, both in one transaction.
--
-- Idempotent: IF NOT EXISTS on both statements.

ALTER TABLE IF EXISTS material_kit_items
  ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES material_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_material_kit_items_batch_id ON material_kit_items(batch_id);

-- DB-proof: after running
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name='material_kit_items' AND column_name='batch_id';  -- expected: 1 row
