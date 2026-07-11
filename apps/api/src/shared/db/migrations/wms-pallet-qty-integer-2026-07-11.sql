-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 10-wms#31 — poddondagi birlik soni butun son bo'lishi kerak (fraksional yo'q).
-- Zod (material-life.controller.ts) app-qatlamda tekshiradi; bu DB CHECK ikkinchi
-- himoya qatlami (raw SQL / boshqa yozuvchi yo'llar uchun ham).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_material_cards_pallet_unit_qty_integer'
  ) THEN
    ALTER TABLE material_cards
      ADD CONSTRAINT ck_material_cards_pallet_unit_qty_integer
      CHECK (pallet_unit_qty IS NULL OR pallet_unit_qty = FLOOR(pallet_unit_qty));
  END IF;
END $$;
