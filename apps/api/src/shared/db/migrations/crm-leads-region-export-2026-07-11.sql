-- APPROVED: owner Q-35 schema-approval wave (2026-07-11, ca3648bf) — EP-MKT-102
-- (docs/audit/decisions/14-marketing.md:733-738, Javob A, action: CREATE).
-- Marketing #80 "Hudud+eksport belgisi": har mijoz/lid uchun hudud (viloyat/davlat) +
-- eksport/ichki belgisi. Scoped here to crm_leads (the live lead table used by
-- DrizzleCrmLeadsRepository / CrmLeadsController — the standalone `leads` table has 0
-- TypeScript references anywhere in apps/api/src, confirmed 2026-07-11). Additive only:
-- nullable `region` text + `is_export` boolean default false; existing 0 rows unaffected
-- (Q-39/Q-46). sd_customers side of EP-MKT-102 is a separate, larger item (SD/Logistics/
-- Finance) and is intentionally NOT part of this migration.
--
-- This file is the human-readable mirror. The migration that actually RUNS at boot is the
-- matching pair of entries in apps/api/src/shared/db/invariants/migrations-crm.ts
-- (CRM_MIGRATIONS array, imported by invariants.ts) — same pattern as every other *.sql
-- file in this directory (see e.g. crm-leads-add-5-cols.sql, lms-card-mentors-*.sql).
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS region    TEXT,
  ADD COLUMN IF NOT EXISTS is_export BOOLEAN NOT NULL DEFAULT FALSE;
