-- ============================================================
-- FILE: apps/api/src/shared/db/migrations/pp-priority-columns-2026-06-22.sql
-- APPROVED: Claude (egasi vakolati) 2026-06-22
-- production_orders priority/frozen columns — the Drizzle schema declares
-- is_urgent/is_frozen/frozen_until but the live DB lacked them, so EVERY
-- Drizzle INSERT into production_orders failed ("column is_urgent does not
-- exist"). This silently BROKE the golden thread HOP 1 (SD order ->
-- ready_for_planning -> SalesOrderReadyPlanningListener -> createPlanFromSalesOrder
-- INSERT production_orders): the listener fired but the insert threw.
--
-- Applies ONLY the additive columns + indexes. The status-CHECK widening from
-- pp-order-lifecycle-priority-frozen-2026-06-19.sql is STILL DEFERRED — its
-- CHECK list omits live statuses (running/active/failed/...) and would REGRESS
-- working PP writes (see project_unapplied_migrations_audit_2026_06_20).
--
-- After this: HOP 1 verified live — an SD order advanced to ready_for_planning
-- auto-creates a production_order (PO-{soId}-{prodId}-{ts}, status 'created')
-- via the domain event. Idempotent.
-- ============================================================

ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS is_urgent    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS is_frozen    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS frozen_until TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_production_orders_urgent ON production_orders (is_urgent);
CREATE INDEX IF NOT EXISTS idx_production_orders_frozen ON production_orders (is_frozen);
