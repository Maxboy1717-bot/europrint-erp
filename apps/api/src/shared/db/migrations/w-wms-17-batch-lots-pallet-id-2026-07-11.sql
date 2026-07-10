-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 10-wms #17 — Bir paletda 2 partiya -> ogohlantirish (blok EMAS).
--   batch_lots ga pallet_id (varchar biznes-kalit) qo'shiladi. Bugun faqat bin_location_id bor.
--   Ogohlantirish = sof duplikat-aniqlash so'rovi: bitta non-null pallet_id ostida >=2 distinct
--   partiya (batch_number) bo'lsa "Aralash" bayrog'i. Egasi-DATA/chegara kerak EMAS: pallet_id
--   kirim-vaqtidagi operatsion ma'lumot, master-data emas. Mavjud satrlar NULL -> ogoh yo'q (regress yo'q).
--   Sof qo'shimcha (IF NOT EXISTS). Boshqa jadvalga tegmaydi.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'batch_lots' AND column_name = 'pallet_id'
  ) THEN
    ALTER TABLE batch_lots ADD COLUMN pallet_id varchar(120);
  END IF;
END $$;

-- Aralash-aniqlash so'rovini tezlashtiradi; faqat faol, paletlangan partiyalar.
CREATE INDEX IF NOT EXISTS idx_batch_lots_pallet_id
  ON batch_lots (warehouse_id, pallet_id)
  WHERE pallet_id IS NOT NULL AND is_active = true;
