-- db-partitioning-prep.sql — TZ-64: DB Partitioning Tayyorlash (prep)
-- Bu fayl hozircha faqat tayyorlik bosqichi — haqiqiy partition PRODUCTION'dan oldin qo'llanadi
-- Partition kaliti: created_at (time-based range partitioning)

-- ============================================================================
-- 1. Katta jadvallar uchun partitioning rejalash
-- ============================================================================
-- Quyidagi jadvallar partitioning uchun nomzod:
--   - sales_invoices      (haftalik 50k+ qator)
--   - warehouse_stock     (kundalik harakat)
--   - production_orders   (oylik 10k+ qator)
--   - security_attendance (kundalik 1k+ qator)

-- ============================================================================
-- 2. Indeks optimallashtirish (partitioning oldidan)
-- ============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_invoices_created_at
  ON sales_invoices (created_at DESC)
  WHERE status IN ('POSTED', 'PAID');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_warehouse_stock_created_at
  ON warehouse_stock (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_production_orders_created_at
  ON production_orders (created_at DESC)
  WHERE status IN ('COMPLETED', 'CLOSED');

-- ============================================================================
-- 3. Partition bo'lim (qachon tayyor bo'lganda ishga tushiriladi)
-- ============================================================================
-- NOTE: Haqiqiy partition migration alohida release da bajariladi.
-- Sabab: Mavjud ma'lumotlarni partition jadvalga ko'chirish
--        production maintenance windowini talab qiladi.

-- REJALANGAN PARTITION STRATEGIYASI:
-- ALTER TABLE sales_invoices RENAME TO sales_invoices_legacy;
-- CREATE TABLE sales_invoices (LIKE sales_invoices_legacy INCLUDING ALL)
--   PARTITION BY RANGE (created_at);
-- CREATE TABLE sales_invoices_y2024 PARTITION OF sales_invoices
--   FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
-- CREATE TABLE sales_invoices_y2025 PARTITION OF sales_invoices
--   FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
-- INSERT INTO sales_invoices SELECT * FROM sales_invoices_legacy;
