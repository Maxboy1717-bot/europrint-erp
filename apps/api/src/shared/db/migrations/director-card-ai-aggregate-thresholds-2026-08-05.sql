-- director-card-ai-aggregate-thresholds-2026-08-05.sql
-- INSERT-only (no CREATE TABLE / no ALTER TABLE) -- Q-35 schema-approval NOT required
-- (business_settings already exists). Item #104: Director dashboard's `aiInsights`
-- field was hardcoded [] with a "deferred to P35/P36" comment, but the underlying
-- per-card AI data (ckp_fact_values, populated via ai-daily-report.service.ts) is
-- already real and live. This just seeds the owner-tunable thresholds for the
-- new aggregate query (dashboard-query.repository.ts::getCardAiAggregate) so the
-- lookback window / underperform threshold / result limit are never hardcoded.
--
-- Idempotent: this is a human-readable mirror only. The actual boot-time DDL/seed
-- lives in apps/api/src/shared/db/invariants/migrations-schema.ts (SCHEMA_MIGRATIONS).

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('director', 'director.card_ai_lookback_days', 'Karta-AI agregat - orqaga qarash oynasi (kun)', 'days', 7, 'kun', 1, 90,
  'Director dashboard aiInsights (karta-AI agregat) ckp_fact_values dan shu sondan kam kun oldingi faktlarni o''rtachalaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('director', 'director.card_ai_underperform_threshold_pct', 'Karta-AI agregat - past-korsatkich chegarasi (%)', 'percent', 80, '%', 0, 100,
  'Shu foizdan past o''rtacha achievement_pct bo''lgan kartalar "erishmayapti" deb aiInsights ro''yxatida chiqadi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active)
VALUES ('director', 'director.card_ai_aggregate_limit', 'Karta-AI agregat - korsatiladigan kartalar soni', 'number', 10, 'ta', 1, 50,
  'aiInsights ro''yxatida bir vaqtda korsatiladigan eng-yomon kartalar maksimal soni.', true)
ON CONFLICT (setting_key) DO NOTHING;
