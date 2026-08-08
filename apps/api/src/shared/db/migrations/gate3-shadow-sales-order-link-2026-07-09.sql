-- APPROVED: egasi (owner, Muslimbek) 2026-07-09 — Batch 3 GATE 3 (Variant A).
--   delivery_request_fulfillment_shadow ga STRUKTURAVIY sales_order_id (FK sales_orders) qo'shish.
--   Sabab: Gate 3 shadow-compare zayavka-shadow ni #51 haqiqiy warehouse_stock_fg kamayishi bilan
--   BIR XIL BUYURTMA bo'yicha bog'lashi shart. Ilgari shadow'da faqat zayavka document_id bor edi;
--   zayavka -> sotuv-buyurtma ko'prigi faqat erkin-matn ixtiyoriy ai_answer (sales_order_ref) orqali edi
--   (ishonchsiz). Endi shadow to'g'ridan-to'g'ri sales_order_id ni saqlaydi -> compare deliveries.sales_order_id
--   bilan toza join qiladi.
--
--   Nullable (ba'zi zayavka sotuv-buyurtmaga bog'lanmasligi mumkin — u holda compare uni tashlab ketadi).
--   FK ON DELETE SET NULL. Idempotent (IF/NOT EXISTS guardlar). warehouse_stock/_fg balansiga tegmaydi.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='delivery_request_fulfillment_shadow' AND column_name='sales_order_id') THEN
    ALTER TABLE delivery_request_fulfillment_shadow ADD COLUMN sales_order_id integer;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                 WHERE conname='delivery_request_fulfillment_shadow_sales_order_id_fkey') THEN
    ALTER TABLE delivery_request_fulfillment_shadow
      ADD CONSTRAINT delivery_request_fulfillment_shadow_sales_order_id_fkey
      FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dr_fulfillment_shadow_sales_order
  ON delivery_request_fulfillment_shadow (sales_order_id);
