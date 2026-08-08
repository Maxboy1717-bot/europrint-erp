-- SD-CRM-COMPLETE-FRESH-ANALYSIS-2026-07-10-v3 §2.2 (fake-save): SdCreateContractSchema
-- (sd-quotations.dto.ts) already accepts start_date/total_amount as input, but
-- sd_contracts had no backing column for either — both were silently dropped on every
-- contract create. Additive nullable columns, numeric(18,2) matches
-- sales_orders.total_amount precedent. Human-readable mirror of the entry appended to
-- SCHEMA_MIGRATIONS in apps/api/src/shared/db/invariants/migrations-schema.ts (the
-- actual boot-time loader — this file is documentation only).
ALTER TABLE IF EXISTS sd_contracts
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18,2);
