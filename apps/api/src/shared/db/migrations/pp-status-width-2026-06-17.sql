-- APPROVED: owner 2026-06-17
-- #05 PP — widen production_orders.status varchar(20) -> varchar(50) so the canonical PP status
-- 'released_to_production' (22 chars) fits. Without this, release-production-order crashes 22001
-- ("value too long"). Matches sales_orders.status (already varchar(50)). Non-destructive widening.
ALTER TABLE production_orders ALTER COLUMN status TYPE varchar(50);
