-- APPROVED: additive-only ALTER, no new table (Q-35). Closes SB0667 (deal-won.listener.ts).
-- Context: crm_deals is an updatable VIEW over base table `deals`, so the FK must be
-- declared on the base table `deals(id)`, not on the view. sales_orders.deal_id (uuid)
-- is the typed link written by DealWonListener._linkDealToOrder(); crm_deal_id (varchar,
-- redundant display copy of the same uuid-as-text) is left without an FK since varchar
-- columns cannot carry a typed FK to a uuid PK.
--
-- Dry-run verified 2026-07-04 (BEGIN/ROLLBACK against live `europrint` DB):
--   - deals: 5 rows, sales_order_id all NULL, 0 orphans vs sales_orders.id
--   - sales_orders: 13 rows, deal_id/crm_deal_id all NULL, 0 orphans vs deals.id
--   - ADD CONSTRAINT ... NOT VALID + VALIDATE CONSTRAINT succeeded immediately (0 rows to revalidate)
--   - bad insert (random uuid) correctly rejected with 23503
--
-- ON DELETE SET NULL: mirrors existing sales_orders.crm_lead_id FK convention
-- (sales_orders_crm_lead_id_fkey) — deleting a deal must not cascade-delete its order.
ALTER TABLE sales_orders
  ADD CONSTRAINT fk_sales_orders_deal_id
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL NOT VALID;

ALTER TABLE sales_orders
  VALIDATE CONSTRAINT fk_sales_orders_deal_id;
