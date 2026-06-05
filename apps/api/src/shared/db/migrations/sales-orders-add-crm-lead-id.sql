-- APPROVED: owner Q-35 (2026-06-04) — STEP 3 BO'LAK B.
-- The SD lead->order convert (sd-leads.repository insertOrderFromLead / convertLeadToOrderAtomic)
-- INSERTs sales_orders with a lead reference, but `sd_lead_id` never existed -> every convert errored.
-- Add `crm_lead_id` (the canonical lead id from crm_leads) so the order records which lead it came
-- from (lead -> CRM -> sales chain). Nullable + additive: the 12 existing sales_orders get NULL.
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS crm_lead_id integer;

-- FK with ON DELETE SET NULL: a non-existent lead can't be linked (integrity); and if a lead is
-- later deleted, the ORDER SURVIVES (money-safe) — only the lead link clears.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_orders_crm_lead_id_fkey') THEN
    ALTER TABLE sales_orders
      ADD CONSTRAINT sales_orders_crm_lead_id_fkey
      FOREIGN KEY (crm_lead_id) REFERENCES crm_leads(id) ON DELETE SET NULL;
  END IF;
END $$;
