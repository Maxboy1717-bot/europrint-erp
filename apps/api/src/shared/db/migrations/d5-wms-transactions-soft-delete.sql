-- APPROVED: owner 2026-06-08
-- D5: wms_transactions needs soft-delete columns (softDeleteTransaction/patchTransaction/
--     getMaterialRecentTransactions use deleted_at; consistent with warehouses, wms_inventory). Idempotent.
ALTER TABLE wms_transactions
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by integer,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;
