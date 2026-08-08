-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 10-wms #39: Lead-time o'zgarsa reorder DARHOL qayta-hisob (event-driven) + PR loyihasi AVTO.
--
-- inventory_policy jadvali ALLAQACHON mavjud (jonli europrint'da 31 qator; ustunlar:
--   safety_stock, reorder_point, lead_time_days, eoq, lot_sizing_method, ...).
--   YANGI jadval YARATILMAYDI — dublikat taqiqlanadi (Q-29/§15). Faqat bitta additive
--   audit ustuni qo'shiladi: reorder_recomputed_at — event-driven (lead-time o'zgarishi)
--   qayta-hisob QACHON ishlaganini kuzatish uchun, kechalik MRP-batch tegadigan umumiy
--   `updated_at`dan farqlash imkonini beradi.
-- Additive + NULL default => mavjud 31 qator regressiyaga uchramaydi (Q-39).
ALTER TABLE inventory_policy
  ADD COLUMN IF NOT EXISTS reorder_recomputed_at timestamptz;
