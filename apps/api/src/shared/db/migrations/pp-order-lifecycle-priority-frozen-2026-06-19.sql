-- APPROVED: Claude(egasi vakolati) 2026-06-19
-- PP production-order lifecycle extension (EP-PP-082 / EP-PP-010 / EP-PP-059 / EP-PP-097 / EP-PP-025 / EP-PP-061)
--
-- Extends the existing `production_orders` table (canonical PP order table) to the
-- owner vision: 7-status lifecycle + 4 priority levels + ZARUR urgent flag +
-- frozen-zone (no-preempt) ordering. PP-contained, additive, idempotent.
--
-- WHAT THIS DOES
--   1. ZARUR (urgent) flag — EP-PP-097: floats an order above every non-urgent one.
--   2. Frozen-zone flag + window — EP-PP-025/061: a committed near-term order
--      cannot be preempted by a new higher-priority order.
--   3. Widens the status CHECK constraint to the 7-status lifecycle (EP-PP-082)
--      while keeping the legacy strings as a SUPERSET so already-persisted rows
--      ('created' / 'pending' / 'released' / 'qc_hold') do NOT violate it (Q-46).
--   4. Indexes for the new flags so queue ordering stays fast.
--
-- NOTE: the numeric `priority` column (integer, default 3) and its index ALREADY
-- exist on production_orders — they are REUSED for the 4 priority bands
-- (1=Shoshilinch, 2=Yuqori, 3=Oddiy, 4=Past). No new priority column is created.
--
-- This file is GATED and NOT auto-run. Apply manually after owner confirmation.

-- 1 + 2: ZARUR + frozen-zone columns (additive, idempotent)
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false;
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS is_frozen boolean NOT NULL DEFAULT false;
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS frozen_until timestamp;

-- 4: indexes for the new flags (queue ordering)
CREATE INDEX IF NOT EXISTS idx_production_orders_urgent ON production_orders (is_urgent);
CREATE INDEX IF NOT EXISTS idx_production_orders_frozen ON production_orders (is_frozen);

-- 3: widen the status check to the 7-status lifecycle + legacy superset (EP-PP-082, Q-46)
ALTER TABLE production_orders DROP CONSTRAINT IF EXISTS production_orders_status_chk;
ALTER TABLE production_orders ADD CONSTRAINT production_orders_status_chk
  CHECK (status IN (
    'created','pending','planned','confirmed','released','released_to_production',
    'in_progress','in_qc','qc_hold','completed','closed','cancelled','paused'
  ));
