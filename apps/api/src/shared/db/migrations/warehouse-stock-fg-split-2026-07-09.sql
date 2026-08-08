-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — Batch 3 Variant-2 split, STEP 1 (schema).
--   Tayyor-mahsulot (finished-goods) qoldig'i uchun YANGI, ALOHIDA jadval — xom-ashyo warehouse_stock
--   (material_cards.id-kalit) dan MANTIQIY ajratilgan. Sabab: xom-ashyo va tayyor mahsulot jismonan
--   alohida omborlar, alohida hisobot ekranlari, va ular orasidagi aylanish uzoq vaqt oralig'ida (atomik emas)
--   sodir bo'ladi — genuine ravishda mustaqil stock domenlari (egasi qarori: Variant 2).
--
--   warehouse_stock_fg: products.id-kalitli, TOZA product_id FK bilan (raw warehouse_stock da material_id FK
--   YO'Q edi — bu yangi jadval FK bilan id-fazo ifloslanishini strukturaviy bloklaydi), va YAGONA
--   UNIQUE(warehouse_id, product_id) — raw jadvaldagi TAKROR juftlik (warehouse_stock_wh_mat_uniq +
--   warehouse_stock_wh_mat_unique) EMAS. material_cards ga FK YO'Q, warehouse_stock bilan umumiy unique YO'Q.
--   UoM/narx bu jadvalda takrorlanmaydi — products (products.unit, products.standard_cost, products.unit_price)
--   dan JOIN qilib olinadi.
--
--   fg_scrap_log: FG-brak REGISTER (egasi qarori #1) — sof yozuv, OMBOR/BALANS semantikasi YO'Q
--   (warehouse_id yo'q, available_quantity yo'q). Faqat: qaysi mahsulot, qancha, sabab, manba-buyurtma, qachon.
--
--   warehouse_stock ga TEGMAYDI — sof qo'shimcha (0 qator ko'chirilmaydi, backfill yo'q). Idempotent (IF NOT EXISTS).
--   Q-35 tasdiqlangan.

CREATE TABLE IF NOT EXISTS warehouse_stock_fg (
  id                    serial PRIMARY KEY,
  warehouse_id          integer NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,   -- qaysi tayyor-mahsulot ombori
  product_id            integer NOT NULL REFERENCES products(id)   ON DELETE CASCADE,   -- qaysi tayyor mahsulot (TOZA FK)
  quantity              numeric(18,4) NOT NULL DEFAULT 0,                               -- receipt +, delivery -
  reserved_quantity     numeric(18,4) NOT NULL DEFAULT 0,                               -- FG rezervatsiyasi (hozircha 0)
  available_quantity    numeric(18,4) NOT NULL DEFAULT 0,                               -- #51 delivery shuni kamaytiradi
  last_movement_at      timestamp,
  last_updated_at       timestamp NOT NULL DEFAULT now(),
  created_at            timestamp NOT NULL DEFAULT now(),
  tenant_id             integer NOT NULL DEFAULT 1,
  CONSTRAINT warehouse_stock_fg_wh_prod_uniq UNIQUE (warehouse_id, product_id)          -- YAGONA (bitta) unique
);

-- product_id (leading emas) bo'yicha qidiruv uchun (ATP: SUM(available) per product barcha FG omborlar bo'yicha).
-- warehouse_id-leading qidiruv allaqachon yuqoridagi composite unique bilan qoplangan.
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_fg_product_id ON warehouse_stock_fg (product_id);

CREATE TABLE IF NOT EXISTS fg_scrap_log (
  id                serial PRIMARY KEY,
  product_id        integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,   -- nima brak bo'ldi (tayyor mahsulot)
  quantity          numeric(18,4) NOT NULL,                                       -- qancha
  reason            text,                                                         -- nega (brak sababi)
  source_order_id   integer,                                                      -- manba buyurtma (production/sales id)
  source_type       varchar(30),                                                  -- provenance, masalan 'qc_failed'
  created_by        integer,                                                      -- kim (ixtiyoriy)
  created_at        timestamp NOT NULL DEFAULT now()                              -- qachon
);

CREATE INDEX IF NOT EXISTS idx_fg_scrap_log_product_id   ON fg_scrap_log (product_id);
CREATE INDEX IF NOT EXISTS idx_fg_scrap_log_source_order ON fg_scrap_log (source_order_id);
