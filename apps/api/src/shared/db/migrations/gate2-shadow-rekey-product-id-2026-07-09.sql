-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — Batch 3 STEP B (owner decision #4).
--   Gate 2 shadow (delivery_request_fulfillment_shadow) ni material_card_id dan product_id ga QAYTA KALITLASH.
--   Sabab: real FG-yetkazish (#51) va warehouse_stock_fg products.id-kalitli. Gate 3 shadow-compare ma'noli
--   bo'lishi uchun shadow HAM products.id da bo'lishi shart — shunda uch tomon (shadow / #51 / warehouse_stock_fg)
--   bir xil ID-fazoga ishora qiladi (Gate 3 to'sig'i yechiladi).
--
--   Jadval hozircha 0 qatorli (Gate 2 shadow hali ishlatilmagan) → xavfsiz rename. Toza product_id FK -> products
--   qo'shiladi (warehouse_stock_fg bilan bir xil tamoyil). Idempotent (IF/NOT EXISTS guardlar bilan).

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='delivery_request_fulfillment_shadow' AND column_name='material_card_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='delivery_request_fulfillment_shadow' AND column_name='product_id') THEN
    ALTER TABLE delivery_request_fulfillment_shadow RENAME COLUMN material_card_id TO product_id;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname='delivery_request_fulfillment_shadow_product_id_fkey') THEN
    ALTER TABLE delivery_request_fulfillment_shadow
      ADD CONSTRAINT delivery_request_fulfillment_shadow_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;
