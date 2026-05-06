-- Migration: fix-assets-view.sql
-- Maqsad: Backend `asset_items` jadvalini so'raydi, lekin DB'da faqat `asset_inventory`.
-- Yechim: VIEW yaratish — kod o'zgarishi shart emas.

DROP VIEW IF EXISTS asset_items;

CREATE VIEW asset_items AS
SELECT
  id,
  asset_code,
  asset_name        AS name,
  asset_name_ru     AS name_ru,
  asset_type        AS category,
  location,
  department_id,
  responsible_id    AS assigned_to,
  purchase_date,
  purchase_value,
  current_value,
  depreciation_method,
  useful_life,
  salvage_value,
  accumulated_depreciation,
  condition,
  status,
  last_inventory_date,
  serial_number,
  notes,
  created_at
FROM asset_inventory;

-- Verify
SELECT 'asset_items VIEW' AS check, COUNT(*) AS rows FROM asset_items;
