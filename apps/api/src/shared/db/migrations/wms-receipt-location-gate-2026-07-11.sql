-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- vision 10-wms#5: Manzilsiz kirim akti tasdiqlanmaydi — kirim bosqichi "manzil" (zona/yacheyka)
-- maydonisiz DRAFT holatida qoladi; freeform fallback ruxsat etilmaydi (FK real master-datani talab qiladi).
-- Canonical base table = goods_receipt_items (mm_goods_receipt_items is a VIEW over it).
-- Additive + idempotent only. Existing rows default NULL (non-regressed).

ALTER TABLE goods_receipt_items ADD COLUMN IF NOT EXISTS zone_id integer;
ALTER TABLE goods_receipt_items ADD COLUMN IF NOT EXISTS bin_location_id integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goods_receipt_items_zone_id_fkey') THEN
    ALTER TABLE goods_receipt_items
      ADD CONSTRAINT goods_receipt_items_zone_id_fkey
      FOREIGN KEY (zone_id) REFERENCES warehouse_zones(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goods_receipt_items_bin_location_id_fkey') THEN
    ALTER TABLE goods_receipt_items
      ADD CONSTRAINT goods_receipt_items_bin_location_id_fkey
      FOREIGN KEY (bin_location_id) REFERENCES warehouse_bins(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Expose the two new columns through the mm_goods_receipt_items VIEW (read path + Drizzle mapping).
-- CREATE OR REPLACE VIEW keeps the existing column list/order and appends the two new columns.
CREATE OR REPLACE VIEW mm_goods_receipt_items AS
  SELECT id, gr_id, raw_material_id, ordered_qty, received_qty, unit,
         receipt_id, material_id, batch_number, created_at,
         zone_id, bin_location_id
  FROM goods_receipt_items;
