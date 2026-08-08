-- APPROVED: egasi 'hamma vizyon' 2026-06-26
-- T21-B1-MASTER-AUDIT-DIRECTOR — master-data converge + audit columns + owner-summary support.
-- FAQAT ADDITIV: ADD COLUMN IF NOT EXISTS / ADD CONSTRAINT IF NOT EXISTS (guarded).
-- DESTRUCTIVE amal YO'Q (DROP/TYPE-change/VIEW-convert/DELETE yo'q). Idempotent — qayta qo'llasa xavfsiz.
-- Manba gaplari: #24 raw_materials↔material_cards int-link, #25 created_by/updated_by audit ustun.

-- ---------------------------------------------------------------------------
-- (#24) raw_materials converge — ADDITIV int-link material_cards'ga.
--   raw_materials (10 qator) ╳ material_cards (31 qator, kanonik) ikki parallel
--   master-data dunyosi. Konvergensiya ADDITIV: raw_materials.material_card_id
--   FK qo'shiladi (material_cards.id ga) — DELETE/DROP/TYPE-change YO'Q.
--   Mavjud material_cards.raw_material_id (teskari yo'nalish) tegilmaydi.
--   FK ON DELETE SET NULL (jonli-data BUZMAslik — Q-46): raw_materials.material_card_id
--   bo'sh qoladi (egasi/AI keyin map qiladi), soxta map YOZILMAYDI (Q-40).
-- ---------------------------------------------------------------------------
ALTER TABLE raw_materials ADD COLUMN IF NOT EXISTS material_card_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'raw_materials_material_card_id_fkey'
      AND table_name = 'raw_materials'
  ) THEN
    ALTER TABLE raw_materials
      ADD CONSTRAINT raw_materials_material_card_id_fkey
      FOREIGN KEY (material_card_id) REFERENCES material_cards(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_raw_materials_material_card_id
  ON raw_materials(material_card_id);

-- ---------------------------------------------------------------------------
-- (#25) Audit ustunlar — created_by / updated_by (INTEGER, nullable).
--   Master-data jadvallariga kim yaratdi / kim o'zgartirdi kuzatuvi.
--   Nullable + FK YO'Q (mavjud data NULL bilan graceful; soxta egasi yozilmaydi).
-- ---------------------------------------------------------------------------
ALTER TABLE material_cards     ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE material_cards     ADD COLUMN IF NOT EXISTS updated_by INTEGER;

ALTER TABLE sd_customers       ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE sd_customers       ADD COLUMN IF NOT EXISTS updated_by INTEGER;

ALTER TABLE unit_of_measures   ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE unit_of_measures   ADD COLUMN IF NOT EXISTS updated_by INTEGER;
