-- APPROVED: owner Q-35 (2026-06-04) — STEP 1b leads -> crm_leads consolidation, final step.
-- sd_leads was a VIEW over the (empty) `leads` table. All ~8 code consumers were repointed to
-- the canonical crm_leads (commits 208caf6d..0fbf5e81), and a full grep sweep confirmed ZERO
-- remaining query references to sd_leads / sdLeads. So the view is dead — drop it.
-- The base `leads` table (0 rows) is intentionally left (orphaned, harmless). The Drizzle
-- `sdLeads` object remains as unused metadata (nothing queries it).
DROP VIEW IF EXISTS sd_leads;
