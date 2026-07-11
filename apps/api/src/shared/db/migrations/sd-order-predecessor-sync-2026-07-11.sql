-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Vision 06-sd #40: Kashirovka (offset+gofra) sinxron — predecessor_order_id.
-- Links a successor sales order to its predecessor so MES can hard-block the successor
-- from starting until the predecessor reaches a ship-ready/terminal state. Canonical SD
-- order table = sales_orders (STANDARTLAR.md §15, ADR-002) — ALTERed in place, never forked.
-- Additive + idempotent: column defaults NULL (= no predecessor = free to start = current
-- behavior, no regress). Self-referential FK (ON DELETE SET NULL) + index for the join.
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS predecessor_order_id integer NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sales_orders_predecessor_order_id_fkey'
      AND table_name = 'sales_orders'
  ) THEN
    ALTER TABLE sales_orders
      ADD CONSTRAINT sales_orders_predecessor_order_id_fkey
      FOREIGN KEY (predecessor_order_id) REFERENCES sales_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_orders_predecessor_order_id
  ON sales_orders (predecessor_order_id);
