-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/pp-operation-progress-2026-06-22.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-22
-- PP planning operation progress tracking. PATCH /api/pp/planning/operations/:id
-- validates progress / actual_time (PpUpdateOperationSchema) but production_orders
-- (the real planning "operation" row that getSchedule reads) had no columns for
-- them, so the UPDATE silently dropped those fields (Q-43 fake-save). Additive +
-- idempotent. After this, the PATCH persists progress + actual_time.
-- ============================================================

ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS progress    integer;
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS actual_time integer;
