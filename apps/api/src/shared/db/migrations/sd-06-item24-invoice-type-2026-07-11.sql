-- APPROVED: owner schema-approval 2026-07-11 (Muslimbek, chat) — Q-35
-- 06-sd #24 (SD-06) — Partial-delivery invoice_type. Faktura yaratilganda buyurtmaning
--   haqiqatda yetkazilgan miqdori (delivery_items.delivery_quantity, deliveries orqali)
--   buyurtma qilingan miqdoridan (sales_order_items.order_quantity) kam bo'lsa 'partial',
--   aks holda 'full' yoziladi — apps/api/src/modules/sd/application/commands/
--   create-invoice.handler.ts (DrizzleSdInvoicesRepository.getOrderFulfillmentQty orqali).
--   Yetkazish ma'lumoti hali yo'q bo'lsa (delivery_items bo'sh — build-fazasi) qiymat
--   fabrikatsiya qilinmaydi, NULL qoladi (Q-40). Sof qo'shimcha ustun (IF NOT EXISTS),
--   default yo'q — mavjud fakturalar uchun NULL (regress emas). Kanonik jadval: invoices
--   (STANDARTLAR §15, DB_ERD). Qiymatlar: full | partial | NULL.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='invoice_type') THEN
    ALTER TABLE invoices ADD COLUMN invoice_type text;
  END IF;
END $$;
