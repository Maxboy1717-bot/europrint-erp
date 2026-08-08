-- ============================================================================
-- T8-06 — WMS manzil legacy hard-FK (USHLANGAN / GATED — egasi DATA qarori kerak)
-- ============================================================================
-- Status: PARTIAL — bu fayl AVTOMATIK ISHGA TUSHMAYDI (DRIFT_MIGRATIONS'ga
--   qo'shilmagan, faqat egasi qo'lda + data tozalashdan keyin qo'llaydi).
--
-- KONTEKST: T8-06 manzil FK-zanjiri (Zona→Qator→Javon→Yacheyka) ADDITIV qismi
--   migrations-drift.ts'da JONLI qo'llandi (warehouse_rows, warehouse_shelves,
--   warehouse_bins.row_id/shelf_id FK — yangi/NULL ustunlar, toza). Quyidagi
--   LEGACY ustunlarga hard-FK qo'shish JONLI iflos data sababli BLOK:
--
--     * warehouse_zones.warehouse_id → warehouses(id)
--         orphan: 1 / 9  (warehouse_id mavjud warehouse'ga ishora qilmaydi)
--     * warehouse_bins.warehouse_id  → warehouses(id)
--         orphan: 60 / 126
--     * warehouse_bins.zone_id       → warehouse_zones(id)
--         orphan: 54 / 126  (yo'q zone_id: 9,10,11,12,14,15 — o'chirilgan zonalar)
--
-- ⚠️ DESTRUKTIV/DATA: FK qo'shishdan OLDIN orphan qatorlar TOZALANISHI shart
--   (yoki orphan FK ustun NULL'ga set, yoki yetishmayotgan zona/warehouse tiklash).
--   Buni AGENT FABRIKATSIYA qila olmaydi (Q-40) — qaysi bin qaysi real
--   warehouse/zonaga tegishli ekanini faqat egasi/ombor menejeri biladi.
--
-- EGASI QARORI (ownerDataNeeded):
--   1) Orphan bin/zona qatorlarni qanday hal qilish: (a) o'chirish, (b) to'g'ri
--      warehouse_id/zone_id biriktirish, yoki (c) FK ustunni NULL qoldirish.
--   2) Tozalashdan keyin quyidagi FK'larni qo'llash (idempotent, guarded).
--
-- TOZALASH NAMUNASI (egasi tasdig'idan keyin — bu yerda IZOHDA, ishlamaydi):
--   -- Variant (c): orphanlarni NULL qilish (ma'lumotni o'chirmaydi)
--   -- UPDATE warehouse_zones z SET warehouse_id = NULL
--   --   WHERE warehouse_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM warehouses w WHERE w.id = z.warehouse_id);
--   -- UPDATE warehouse_bins b SET warehouse_id = NULL
--   --   WHERE warehouse_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM warehouses w WHERE w.id = b.warehouse_id);
--   -- UPDATE warehouse_bins b SET zone_id = NULL
--   --   WHERE zone_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM warehouse_zones z WHERE z.id = b.zone_id);
-- ============================================================================

-- 1) warehouse_zones.warehouse_id → warehouses(id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_warehouse_zones_warehouse_id') THEN
    ALTER TABLE warehouse_zones
      ADD CONSTRAINT fk_warehouse_zones_warehouse_id
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2) warehouse_bins.warehouse_id → warehouses(id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_warehouse_bins_warehouse_id') THEN
    ALTER TABLE warehouse_bins
      ADD CONSTRAINT fk_warehouse_bins_warehouse_id
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3) warehouse_bins.zone_id → warehouse_zones(id)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_warehouse_bins_zone_id') THEN
    ALTER TABLE warehouse_bins
      ADD CONSTRAINT fk_warehouse_bins_zone_id
      FOREIGN KEY (zone_id) REFERENCES warehouse_zones(id) ON DELETE SET NULL;
  END IF;
END $$;
