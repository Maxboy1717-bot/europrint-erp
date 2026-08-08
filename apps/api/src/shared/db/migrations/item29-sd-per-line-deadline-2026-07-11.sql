-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 06-sd #29 (Q20) — Per-line deadline scheduling. Ko'p qatorli buyurtmada har bir qator uchun
--   alohida muddat (sales_order_items.line_deadline). sales_orders.per_line_scheduling=true bo'lsa
--   qator-muddati amal qiladi; false bo'lsa buyurtma-darajali delivery_date barcha qatorlarga tegishli.
--   line_deadline NULL bo'lganda COALESCE orqali order-darajali delivery_date ga qaytadi (fallback).
--   Sof qo'shimcha (IF NOT EXISTS): per_line_scheduling DEFAULT false, line_deadline NULL → mavjud
--   buyurtmalar regress emas. Kanonik jadvallar: sales_orders / sales_order_items (STANDARTLAR §15, DB_ERD).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_orders' AND column_name='per_line_scheduling') THEN
    ALTER TABLE sales_orders ADD COLUMN per_line_scheduling boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales_order_items' AND column_name='line_deadline') THEN
    ALTER TABLE sales_order_items ADD COLUMN line_deadline timestamptz;
  END IF;
END $$;
