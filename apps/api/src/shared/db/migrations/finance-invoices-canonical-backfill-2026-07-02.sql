-- APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02
-- OWNER QARORI: finance_invoices = kanonik invoice-manba (Moliya-GL-Kassa).
-- Eski/dublikat manbalar: invoices (uuid, golden-thread/SD uchun saqlanadi — items/subtotal/
--   tax_amount/sales_order_id kerak, finance_invoices'da yo'q, shuning uchun REDIRECT QILINMAYDI),
--   purchase_invoices (yagona yozuvchi edi finance-ap.repository.ts — endi finance_invoices'ga),
--   sales_invoices (yagona yozuvchi edi finance-ar.repository.ts — endi finance_invoices'ga),
--   vendor_invoices (yozuvchisi umuman yo'q edi — 3-way-match maxsus sxema, tegilmadi).
--
-- FAQAT ADDITIV: ADD COLUMN IF NOT EXISTS + idempotent INSERT..SELECT..WHERE NOT EXISTS.
-- DESTRUCTIVE amal YO'Q (DROP/TYPE-change/VIEW yo'q). Qayta ishga tushirish xavfsiz.

-- ---------------------------------------------------------------------------
-- 1) finance_invoices — kam yetishmayotgan display ustunlar (denormalized, AP/AR
--    repository'lar to'g'ridan supplier_name/customer_name/notes talab qiladi).
-- ---------------------------------------------------------------------------
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS notes TEXT;

-- ---------------------------------------------------------------------------
-- 2) Backfill — `invoices` jadvalidagi haqiqiy AP/AR yozuvlarni (type IN
--    ('receivable','payable') yoki customer_name mavjud umumiy hisob-fakturalar)
--    finance_invoices'ga ko'chirish. invoice_number bo'yicha idempotent
--    (allaqachon mavjud bo'lsa qayta qo'shilmaydi).
-- ---------------------------------------------------------------------------
INSERT INTO finance_invoices
  (invoice_number, invoice_type, customer_id, vendor_id, total_amount, paid_amount,
   payment_status, due_date, customer_name, supplier_name, notes, created_at, updated_at)
SELECT
  i.invoice_number,
  CASE WHEN i.type = 'payable' THEN 'purchase' ELSE 'sales' END AS invoice_type,
  NULL::integer AS customer_id,   -- invoices.customer_id = uuid, finance_invoices.customer_id = integer (no safe cast; all source rows NULL today)
  i.vendor_id,
  i.total_amount,
  COALESCE(i.paid_amount, 0),
  CASE WHEN i.status = 'paid' THEN 'paid'
       WHEN i.status = 'overdue' THEN 'overdue'
       ELSE 'unpaid' END AS payment_status,
  i.due_date::date,
  CASE WHEN i.type = 'payable' THEN NULL ELSE i.customer_name END,
  CASE WHEN i.type = 'payable' THEN i.customer_name ELSE NULL END,
  i.notes,
  i.created_at,
  i.updated_at
FROM invoices i
WHERE i.invoice_number IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM finance_invoices fi WHERE fi.invoice_number = i.invoice_number
  );

-- purchase_invoices / sales_invoices / vendor_invoices: 0 satr (2026-07-02 tekshiruvda) —
-- backfill qiladigan haqiqiy ma'lumot yo'q; shu SELECT hech narsa qo'shmasa ham xavfsiz
-- (kelajakda ma'lumot paydo bo'lsa idempotent tarzda ishlaydi).
INSERT INTO finance_invoices
  (invoice_number, invoice_type, vendor_id, total_amount, paid_amount, payment_status,
   due_date, supplier_name, notes, created_at, updated_at)
SELECT
  pi.invoice_number, 'purchase', pi.vendor_id, pi.total_amount, COALESCE(pi.paid_amount, 0),
  COALESCE(pi.payment_status, 'unpaid'), pi.due_date::date, pi.supplier_name, pi.notes,
  pi.created_at, pi.updated_at
FROM purchase_invoices pi
WHERE pi.invoice_number IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM finance_invoices fi WHERE fi.invoice_number = pi.invoice_number);

INSERT INTO finance_invoices
  (invoice_number, invoice_type, customer_id, total_amount, paid_amount, payment_status,
   due_date, customer_name, created_at, updated_at)
SELECT
  si.invoice_number, 'sales', si.customer_id, COALESCE(si.total_amount, si.net_value),
  COALESCE(si.paid_amount, 0), COALESCE(si.payment_status, 'unpaid'), si.due_date,
  si.customer_name, si.created_at, si.updated_at
FROM sales_invoices si
WHERE si.invoice_number IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM finance_invoices fi WHERE fi.invoice_number = si.invoice_number);
