-- crm-deals-sales-order-fk-2026-07-08.sql
-- VISION-3340 #32 — crm_deals.sales_order_id varchar -> integer + real FK to sales_orders(id).
--
-- STRUCTURAL: crm_deals is a VIEW (pg_class.relkind='v') over base table `deals`, so an
-- in-place ALTER COLUMN TYPE / ADD CONSTRAINT on crm_deals is impossible. This drops and
-- recreates the 50-column pass-through view around a type change on the base column.
--
-- APPROVED: egasi (owner) 2026-07-08 VISION-3340 #32 — option (a) DROP/RECREATE-view path.
--   Irreversible type change; column verified 100% EMPTY (5 deals, 0 non-null, 0
--   non-integer-shaped) via fresh live re-check immediately before drafting, and validated
--   by a BEGIN/ROLLBACK dry-run that confirmed the recreated view's 50-column list is
--   byte-for-byte identical (names + order) except sales_order_id's type, the view stays
--   auto-updatable, row counts unchanged (5/5), and the FK is added.
--
-- IDEMPOTENT (this file re-runs on every boot via ensureSchemaAdditions):
--   * the DROP/ALTER/CREATE only fires while deals.sales_order_id is still character varying;
--   * the FK is only added when fk_deals_sales_order does not already exist.
-- The recreated view is a verbatim copy of the live pg_get_viewdef output (captured 2026-07-08);
-- sales_order_id's new integer type flows automatically from the base column. The FK lives on
-- the base table `deals` (a view cannot carry a constraint). No non-owner GRANTs existed on the
-- view (owner-only defaults), so none need reapplying.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'sales_order_id' AND data_type = 'character varying'
  ) THEN
    DROP VIEW IF EXISTS crm_deals;
    ALTER TABLE deals
      ALTER COLUMN sales_order_id TYPE integer USING NULLIF(btrim(sales_order_id), '')::integer;
    CREATE VIEW crm_deals AS
      SELECT id, lead_id, title, amount, currency, status, probability, won_at, lost_reason,
             created_by, created_at, updated_at, stage_semantic_id, opportunity, value, customer_id,
             manager_id, closed_at, category_id, stage_id, is_new, is_recurring, is_return_customer,
             is_repeated_approach, currency_id, is_manual_opportunity, tax_value, company_id, contact_ids,
             begin_date, close_date, assigned_by_id, created_by_id, modify_by_id, date_create, date_modify,
             opened, closed, comments, additional_info, originator_id, origin_id, sales_order_id,
             forecast_amount, sla_deadline, is_repeating, last_activity_at, next_activity_at, deleted_at, metadata
      FROM deals;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'deals' AND constraint_name = 'fk_deals_sales_order'
  ) THEN
    ALTER TABLE deals
      ADD CONSTRAINT fk_deals_sales_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE SET NULL;
  END IF;
END $$;
