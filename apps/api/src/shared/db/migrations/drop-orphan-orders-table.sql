-- APPROVED: owner-confirmed dead table (2026-06-06)
-- Zero INSERT writers in codebase. Canonical replacement: sales_orders.
-- Three SELECT references in legacy-iot.service.ts / legacy-warehouse.helpers.ts
-- are wrapped in try/catch { return [] } — they silently return [] after this drop.
DROP TABLE IF EXISTS orders CASCADE;
