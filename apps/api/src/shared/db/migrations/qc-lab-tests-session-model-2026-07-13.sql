-- APPROVED: owner schema-approval 2026-07-13 (Muslimbek, chat) -- QC lab-tests session model
-- Owner decision (given directly in chat, not a Q-35 owner-data gap): the live FE
-- (artifacts/erp-dashboard/src/components/production/qc/LabSection.tsx, LabSchema /
-- createLabTest mutation) records ONE lab-test SESSION -- material identity
-- (materialName/lotNumber) + 4 SIMULTANEOUS measurements (grammatura/qalinlik/bosim/
-- namlik) + operator -- not the generic one-parameter-per-row model qc_lab_tests was
-- originally built for (parameter_name + a single value/unit/min_value/max_value per
-- row). These columns are ADDITIVE alongside that pre-existing generic-model shape
-- (Q-46) -- nothing that reads/writes parameter_name/value/unit/min_value/max_value/
-- tested_by is touched. POST /qc/lab-tests (QcNewController.createLabTest ->
-- QcNewService.createLabTest -> QcNewRepository.insertLabTest) now accepts and persists
-- whichever shape the caller sends.
--
-- The pre-existing `result` TEXT NOT NULL DEFAULT 'pending' column is REUSED as-is for
-- the session model's pass/fail/conditional choice (LabSchema.result on the FE already
-- only allows those 3 values) -- no new result/status column or enum is added: it's
-- free text already, same convention the column always had (previously server-computed
-- pass/fail/pending from a min/max compare; now it can also arrive pre-set from the FE).
--
-- parameter_name's NOT NULL constraint is dropped in the same migration below: the
-- session model has no single "parameter name" (4 simultaneous parameters, not 1).
-- Verified live 2026-07-13 that QcNewRepository.insertLabTest (qc-new.repository.ts) is
-- the ONLY live write path to this table -- QcParametersService.createTest /
-- qc-parameters.repository.ts's insertTest also reference qc_lab_tests.parameterName but
-- are dead code (no controller route calls QcParametersService.createTest; the sibling
-- POST /qc/tests route in qc-parameters.controller.ts calls svc.createMaterialTest() ->
-- qc_material_tests, a completely different table) -- dropping the NOT NULL constraint
-- cannot break any live caller.
--
-- Human-readable mirror of the SCHEMA_MIGRATIONS entries in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (actual boot-time loader).
ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS material_name TEXT;
ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS lot_number TEXT;
ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS grammatura NUMERIC;
ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS qalinlik NUMERIC;
ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS bosim NUMERIC;
ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS namlik NUMERIC;
ALTER TABLE IF EXISTS qc_lab_tests ADD COLUMN IF NOT EXISTS operator_name TEXT;
ALTER TABLE qc_lab_tests ALTER COLUMN parameter_name DROP NOT NULL;
