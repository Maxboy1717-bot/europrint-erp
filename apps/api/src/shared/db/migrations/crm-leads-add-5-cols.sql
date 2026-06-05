-- APPROVED: owner Q-35 (2026-06-04) — STEP 1b leads -> crm_leads consolidation.
-- crm_leads is the canonical lead table (5 rows). The SD/website lead intake
-- (sd-leads.repository, website-lead.repository, ecommerce.repository) writes 5 fields
-- that crm_leads lacked; add them so those writers can repoint from leads/sd_leads to
-- crm_leads. Types match the source `leads` table; converted_at/closed_at use timestamptz
-- to match crm_leads' existing timestamptz convention. All nullable, additive only.
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS product_interest text,
  ADD COLUMN IF NOT EXISTS estimated_volume numeric,
  ADD COLUMN IF NOT EXISTS lost_reason      text,
  ADD COLUMN IF NOT EXISTS converted_at     timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at        timestamptz;
