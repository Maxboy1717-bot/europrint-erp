-- Magic-Numbers M6 remaining gap (memory: "quarantine still hardcoded", flagged 2026-07-07):
-- quarantine-workflow.repository.ts escalateExpiredQuarantine() had INTERVAL '48 hours'
-- hardcoded directly in raw SQL. Same CRUD-sozlanadigan naqsh as director/cc escalation
-- hours (business_settings, category='pos'). Human-readable mirror of the entry appended
-- to SCHEMA_MIGRATIONS in apps/api/src/shared/db/invariants/migrations-schema.ts (the
-- actual boot-time loader — this file is documentation only).
INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('pos', 'pos.quarantine_escalation_hours', 'Karantin: necha soatdan keyin QC-ko''rikka avtomatik o''tkaziladi', 'number', 48, 'soat', 1, 336,
  'quarantine-workflow.repository.ts escalateExpiredQuarantine() — status=''karantin'' shu soatdan ko''p turgan pos_movements avtomatik ''qc_review''ga o''tkaziladi (pos-quarantine-check.job.ts, har soatlik cron)', true)
ON CONFLICT (setting_key) DO NOTHING;
