-- APPROVED: owner schema-approval 2026-07-13 (Muslimbek, chat) -- AI Rush Orders
--
-- Context: apps/api/src/modules/ai/presentation/ai.controller.ts:185-210 had 3
-- notImplemented() stubs (GET /ai/rush-orders, POST :id/approve, POST :id/reject). FE
-- reference already built ahead of backend:
-- artifacts/erp-dashboard/src/pages/ai-planning/RushOrderPage.tsx expects
-- { orderId, orderNumber, customerName, requestedDate, standardLeadDays, rushLeadDays,
--   rushSurchargePct, feasibilityScore, status: "pending_approval"|"approved"|"rejected" }.
--
-- sales_orders has NO rush-specific columns and its existing master_status is a 23-value
-- order-fulfillment lifecycle (draft..cancelled, lib/db/src/schema/sd-orders.ts salesOrders
-- CHECK constraint) that is semantically UNRELATED to a rush approve/reject decision --
-- deliberately NOT overloaded (Q-46). rush_order_requests is the dedicated persistence home
-- for that decision instead: one row per sales_orders.id (order_id UNIQUE -- GET always wants
-- the CURRENT decision status, not a history of re-decisions).
--
-- Snapshot columns (standard_lead_days / rush_lead_days / surcharge_pct / feasibility_score)
-- are captured at approve/reject time so a later business_settings tuning change never
-- silently mutates the audit trail of an already-decided request -- only still-undecided
-- ("virtual", no row yet) candidates returned by GET are computed live from current settings.
--
-- The qualification rule (N days), the surcharge %, and the feasibility-scoring weights are
-- ALL owner-tunable via business_settings CRUD (Q-40) -- NONE hardcoded in
-- apps/api/src/modules/ai/application/services/rush-orders.service.ts; every number is read
-- through getBusinessSettingNumber(key, fallback) (same helper/pattern as
-- sd.full_advance_discount_pct in sd-quotations.service.ts and the sibling
-- ai.forecast_min_orders gate in demand-forecast.service.ts, both built this same session).
-- Defaults below are clearly-labeled PLACEHOLDERS pending owner tuning through the
-- Business Settings screen -- not researched/invented "correct" business numbers.
--
-- FK order_id -> sales_orders(id) ON DELETE CASCADE: a rush-decision row is meaningless
-- without its order (mirrors kanban_wip_overrides' card_id/column_id FK convention, same
-- 2026-07-13 session). requested_by / approved_by -> users(id) ON DELETE SET NULL: keep the
-- audit row if the acting user account is later removed.
--
-- Idempotent (safe to re-run every boot -- apps/api/src/shared/db/invariants.ts
-- ensureSchemaAdditions() re-executes every SCHEMA_MIGRATIONS entry on each start, there is
-- no migrations-tracking table). This file is a human-readable mirror of the TS entries in
-- apps/api/src/shared/db/invariants/migrations-schema.ts (the TS array is what actually runs
-- on boot; this .sql file documents the same statements for manual/psql reference).

CREATE TABLE IF NOT EXISTS rush_order_requests (
  id                  SERIAL PRIMARY KEY,
  order_id            INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  requested_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  standard_lead_days  INTEGER NOT NULL,
  rush_lead_days      INTEGER NOT NULL,
  surcharge_pct       NUMERIC(5,2) NOT NULL,
  feasibility_score   INTEGER NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending_approval',
  approved_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at         TIMESTAMPTZ,
  rejected_reason     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rush_order_requests_status_chk CHECK (status IN ('pending_approval','approved','rejected')),
  CONSTRAINT rush_order_requests_feasibility_chk CHECK (feasibility_score BETWEEN 0 AND 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rush_order_requests_order_id ON rush_order_requests (order_id);
CREATE INDEX IF NOT EXISTS idx_rush_order_requests_status ON rush_order_requests (status);

-- business_settings seed: 5 owner-tunable rush-order numbers.
--   ai.rush_order_max_lead_days: an order qualifies as "rush" when its requested delivery
--     date is within N days of order creation (N=3 default placeholder).
--   ai.rush_order_surcharge_pct: extra % charged on a rush order (20 default placeholder).
--   ai.rush_order_standard_lead_days: the "normal" lead time shown on the FE next to the
--     rush lead time for comparison (RushOrderPage.tsx standardLeadDays field) -- 14 default
--     placeholder, distinct from rush_order_max_lead_days (which gates qualification).
--   ai.rush_order_load_penalty_per_order: feasibility-score points deducted per open
--     production_orders-per-active-work_center ratio (5 default placeholder).
--   ai.rush_order_feasibility_weight_load_pct: 0-100 weight given to the production-load
--     component of the feasibility score; the remaining (100-weight) goes to the
--     lead-time-margin component (50/50 default placeholder split).
INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'rush_order_max_lead_days', 'Rush buyurtma - maksimal muddat (kun)', 'days', 3, 'kun', 1, 30,
    'Buyurtma yaratilgan kundan talab qilingan yetkazib berish sanasigacha shu kundan kam/teng bo''lsa, "rush" (tezkor) deb hisoblanadi. Placeholder default=3, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'rush_order_surcharge_pct', 'Rush buyurtma - qo''shimcha to''lov (%)', 'percent', 20, '%', 0, 100,
    'Rush deb tasdiqlangan buyurtmaga qo''llaniladigan qo''shimcha to''lov foizi. Placeholder default=20, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'rush_order_standard_lead_days', 'Standart ishlab chiqarish muddati (kun)', 'days', 14, 'kun', 1, NULL,
    'Rush bo''lmagan buyurtma uchun odatiy ishlab chiqarish muddati - RushOrderPage taqqoslash uchun ko''rsatadi. Placeholder default=14, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'rush_order_load_penalty_per_order', 'Rush feasibility - yuklama jarimasi', 'number', 5, NULL, 0, 100,
    'Har bir ochiq production_orders / faol work_centers nisbati birligi uchun feasibility balidan ayiriladigan ball. Placeholder default=5, egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO business_settings (module, setting_key, label, value_type, value_num, unit, min_val, max_val, description, is_active) VALUES
  ('ai', 'rush_order_feasibility_weight_load_pct', 'Rush feasibility - yuklama og''irligi (%)', 'percent', 50, '%', 0, 100,
    'Feasibility skorida ishlab chiqarish yuklamasi komponentining og''irligi (%); qolgan qism muddat-zaxira komponentiga beriladi. Placeholder default=50 (teng bo''lingan), egasi business_settings CRUD orqali sozlaydi.', true)
ON CONFLICT (setting_key) DO NOTHING;
