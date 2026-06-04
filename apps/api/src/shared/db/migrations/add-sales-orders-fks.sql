-- ===========================================================================
-- Migration: add-sales-orders-fks.sql                      (2026-06-04)
-- APPROVED: owner 2026-06-04  (Q-35 — owner-gated DDL, approved this session)
-- ===========================================================================
-- Sabab (problem): `sales_orders` (kanonik integer-kalitli sotuv order jadvali)
--   ga ishlab-chiqarish / fan-out bola jadvallaridan FOREIGN KEY yo'q edi →
--   sales↔production bog'lanishi majburlanmagan (orphan order_id mumkin). Bu —
--   "ballonsiz mashina": referensial yaxlitliksiz aloqa. Quyidagi 7 FK aloqani
--   majburlaydi (real jadvallar; view'lar chiqarildi — pastga qarang).
--
-- DDL'дan OLDIN tasdiqlangan (information_schema + _audit/q.cjs):
--   • sales_orders.id = integer; barcha 8 bola ustun = integer (type mos).
--   • har bola jadvalda 0 ORPHAN (jadvallar hozir bo'sh — FK kelajakdagi
--     yozuvlar uchun majburlanadi, bu aynan maqsad).
--   • sales_orders'ga mavjud FK yo'q (ziddiyat yo'q).
--
-- ON DELETE: NO ACTION (default) — bolasi bor sotuv order'ini o'chirib bo'lmaydi
--   (xavfsiz; tasodifiy kaskad o'chirish yo'q). Egasi tomonidan tanlandi.
--
-- CHIQARILDI:
--   • mes_papka_orders — bu VIEW (papka_orders ustida; papka_orders = messaging/order
--     ARALASH jadval: from_user_id/to_user_ids/subject/body/files + order ustunlari).
--     View'ga FK qo'shib bo'lmaydi; base papka_orders'ga FK alohida qaror (aralash
--     jadval, "papka_orders dublikat" tugunining bir qismi) — egasi hал qiladi.
--   • ow_orders.production_order_id — semantik jihatdan ishlab-chiqarish orderi (sotuv
--     emas); ow_orders'da sotuv-order integer ustuni yo'q.
-- BLOCKED (bu migrationda EMAS): 12 ta ow_* uuid-kalitli ustun (uuid→integer type
--   mismatch — boshqa uuid-order olamiga tegishli; type-migration kerak).
--
-- IDEMPOTENT: har constraint pg_constraint'da tekshiriladi; mavjud bo'lsa o'tkazib
--   yuboriladi → qayta ishga tushirish xavfsiz.
--
-- Qo'llash (manual):
--   psql "$DATABASE_URL" -f apps/api/src/shared/db/migrations/add-sales-orders-fks.sql
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_order_items_sales_order_id_fkey') THEN
    ALTER TABLE sales_order_items ADD CONSTRAINT sales_order_items_sales_order_id_fkey
      FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sd_order_departments_order_id_fkey') THEN
    ALTER TABLE sd_order_departments ADD CONSTRAINT sd_order_departments_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ow_cliches_order_id_fkey') THEN
    ALTER TABLE ow_cliches ADD CONSTRAINT ow_cliches_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ow_material_requirements_order_id_fkey') THEN
    ALTER TABLE ow_material_requirements ADD CONSTRAINT ow_material_requirements_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ow_molds_order_id_fkey') THEN
    ALTER TABLE ow_molds ADD CONSTRAINT ow_molds_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ow_shipping_requests_order_id_fkey') THEN
    ALTER TABLE ow_shipping_requests ADD CONSTRAINT ow_shipping_requests_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ow_tech_cards_order_id_fkey') THEN
    ALTER TABLE ow_tech_cards ADD CONSTRAINT ow_tech_cards_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE NO ACTION;
  END IF;
END $$;

-- Tekshiruv (kutilgan: 8 qator):
--   SELECT conname, conrelid::regclass AS child FROM pg_constraint
--   WHERE contype='f' AND confrelid='sales_orders'::regclass ORDER BY child;
