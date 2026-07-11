-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- Marketing-14 #59/#67 — Lid mahsulot turi (ofset/gofra/etiketka/flekso/blanka) majburiy
-- Vision: TASDIQ-2146 §14 #59, #67 (EP-MKT-089)
--   docs/vision/FULL-VISION-EXTRACTION-2026-07-07.md:4018 ("Lid mahsulot turi
--   (ofset/gofra/etiketka/flekso) majburiy") and :4026 ("...flekso/blanka) majburiy").
-- crm_leads = the LIVE lead table: the lead-create flow (crm-leads.controller.ts →
-- leads.service.ts → drizzle-crm-leads.repo.ts) reads/writes crm_leads via the
-- `crmLeads` Drizzle def in schema-compat-1a.ts. The separate uuid-PK `leads` table
-- (schema-core.ts) has zero application readers/writers by name (grep=0) — it is
-- left untouched here (STANDARTLAR §15: don't touch a dead legacy table as part of
-- an unrelated feature; a dedicated cleanup pass would need its own owner sign-off).
-- Nullable, not NOT NULL: two existing live insert paths do not (yet) supply a
-- product type — the website-lead listeners (website-lead.repository.ts, raw SQL
-- INSERT INTO crm_leads) and the QuickCreateModal FE form (POST /api/crm/leads,
-- artifacts/erp-dashboard/src/pages/crm/QuickCreateModalTypes.ts has no product-type
-- field yet). A NOT NULL constraint today would break those existing callers
-- (violates "never break an existing caller"). The CHECK constraint still restricts
-- ANY value that IS supplied to the 5 vision-approved categories, so the column is a
-- correctly-typed, ready-to-populate target the moment the FE form is updated.
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS product_type text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_product_type_check') THEN
    ALTER TABLE crm_leads
      ADD CONSTRAINT crm_leads_product_type_check
      CHECK (product_type IS NULL OR product_type IN ('ofset', 'gofra', 'etiketka', 'flekso', 'blanka'));
  END IF;
END $$;
