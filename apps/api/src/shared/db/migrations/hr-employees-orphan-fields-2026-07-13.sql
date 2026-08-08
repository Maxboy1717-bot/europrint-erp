-- APPROVED: orchestrator-delegated Employees module bug-fix task 2026-07-13 (bug #3:
-- orphan form fields) — follows Q-35 schema-approval convention.
-- hr-employees-orphan-fields-2026-07-13.sql
--
-- Context: EmployeeDialog.tsx (Add/Edit Xodim form) collects ~11 fields that the
-- backend silently discards because `employees` had no matching column AND
-- drizzle-hr-base.repo.ts's saveEmployee()/updateEmployee() only ever wrote an
-- explicit hardcoded field list. User types data in these fields, clicks "Saqlash",
-- gets a success toast, re-opens the form — data is gone. Classic Q-40/Q-43
-- "ko'rinadi lekin saqlamaydi" fake-save.
--
-- Fields kept + column added (genuine HR/production data, worth persisting):
--   shift              (ContractSection: A/B/C/D/kunlik/ofis)
--   salaryType          (ContractSection: fiks/ishbay/smenbay/soatbay — payroll calc basis)
--   workshopZone        (ContractSection: free-text "1-sex" etc.)
--   attestationDate      (ContractSection — already rendered as a column in EmployeeTable.tsx,
--                          get-employees.handler.ts hardcodes it to null today)
--   maritalStatus        (PersonalInfoSection — HR social-data census)
--   childrenCount        (PersonalInfoSection)
--   childrenEducation    (PersonalInfoSection)
--   householdSize        (HouseholdSection)
--   householdMembers     (HouseholdSection)
--   housingType          (HouseholdSection)
--
-- NOT added — `age` field removed from the form instead (session's other change):
-- it duplicates birthDate (age is derivable, storing it invites drift).
--
-- latitude/longitude and address form fields are NOT orphans — `employees` already
-- has `lat`/`lng`/`address_actual` columns; that gap is a field-name mismatch fixed
-- in code (drizzle-hr-base.repo.ts), not a schema change.
--
-- Verified before drafting: live \d employees (81 columns) had none of the 10 names
-- below. employees table has 0 rows (post full-company-reset 2026-07-11) — purely
-- additive, no regression on any existing row (Q-46).
--
-- Applied at boot via ensureSchemaAdditions() — this .sql is the human-readable
-- mirror of the entries executed from
-- apps/api/src/shared/db/invariants/migrations-schema.ts (SCHEMA_MIGRATIONS array,
-- 'employees.<col> column (hr-employees-orphan-fields)').

ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS shift VARCHAR(20);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS salary_type VARCHAR(20);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS workshop_zone VARCHAR(100);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS attestation_date DATE;
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(30);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS children_count INTEGER;
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS children_education VARCHAR(30);
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS household_size INTEGER;
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS household_members TEXT;
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS housing_type VARCHAR(30);
