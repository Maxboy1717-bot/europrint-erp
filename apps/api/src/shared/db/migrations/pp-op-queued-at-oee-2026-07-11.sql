-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- vision 07-pp#46: "Qo'shimcha bosqich kutish vaqti = queue time, ish vaqti EMAS; OEE ga kirmaydi."
-- Additive ALTER only. queued_at = the moment an operation enters its work-center queue.
-- The gap queued_at -> started_at is WAITING time (not machine work); it is reported
-- separately and EXCLUDED from the OEE availability denominator (which uses active work =
-- completed_at - started_at). queued_at NULL = untracked -> 0 queue time, so every existing
-- row keeps its current OEE contribution (no regression). started_at already exists on this
-- table; the ADD IF NOT EXISTS below is a safe no-op kept for fidelity to the schema-queue line.
ALTER TABLE production_order_operations ADD COLUMN IF NOT EXISTS queued_at TIMESTAMP;
ALTER TABLE production_order_operations ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_poo_queued_at
  ON production_order_operations (queued_at)
  WHERE queued_at IS NOT NULL;
