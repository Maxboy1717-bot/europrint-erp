-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) -- Q-35.
-- Owner decision 2026-07-13 (chat): GET /ai/forecast/demand wired to the real forecast
-- engines (was `notImplemented('GET /ai/forecast/demand')`,
-- apps/api/src/modules/ai/presentation/ai.controller.ts). Owner explicitly ruled the
-- minimum-history threshold must NOT be hardcoded/asked in chat -- read via
-- getBusinessSettingNumber() with a CRUD-editable row, same pattern as
-- sd.full_advance_discount_pct / cc.stale_draft_archive_days. Default=10 is a starting
-- default pending owner tuning via the Business Settings CRUD screen (see doc-comment on
-- DemandForecastService), not an invented magic number pulled from nowhere.
-- Additive-only: existing business_settings rows/table untouched; ON CONFLICT DO NOTHING.
-- Human-readable mirror of the entry appended to SCHEMA_MIGRATIONS in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (the actual boot-time loader --
-- this file is documentation only).

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'ai.forecast_min_orders', 'Talab bashorati uchun minimal tarixiy buyurtmalar soni', 'number', 10, 'ta', 1, NULL, 'GET /ai/forecast/demand shu sondan kam tarixiy (oxirgi 18 oy) savdo buyurtmasi bo''lsa EMA modelni ishga tushirmaydi, o''rniga status=insufficient_history qaytaradi (DemandForecastService.getDemandForecast, owner 2026-07-13).', true)
ON CONFLICT (setting_key) DO NOTHING;
