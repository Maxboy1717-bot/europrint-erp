-- APPROVED: egasi 'Ombor+POS vizyon-build' 2026-06-27
-- =============================================================================
-- W2-SUPPLIER-RATING — Ta'minotchi ishonchlilik reytingi (EP-WMS-094 / EP-WMS-022)
-- 4-faktor reyting (o'z-vaqtida% / brak% / narx / hujjat) har kirim/QC-fail da
-- AVTO-qayta hisoblanadi (oxirgi N-oy oynasi). Faqat ADDITIVE (Q-46) — mavjud
-- WMS dvigateli (karantin/FIFO/atomik chiqim) buzilmaydi.
--
-- Persistentlik:
--   * vendor_performance_metrics  — oylik metrik breakdown (ALLAQACHON mavjud,
--     bu yerda faqat indeks + past-reyting bayroq ustuni qo'shiladi).
--   * vendors.rating              — joriy umumiy reyting (ALLAQACHON mavjud, UPDATE).
--   * vendors.rating_low_flag     — past-reyting PO-ogohlantirish bayrog'i (YANGI).
--   * vendors.rating_updated_at   — oxirgi qayta hisoblash vaqti (YANGI).
-- =============================================================================

-- 1) Past-reyting PO-ogohlantirish bayrog'i + oxirgi hisoblash vaqti (vendors).
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS rating_low_flag   BOOLEAN     NOT NULL DEFAULT FALSE;
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS rating_updated_at TIMESTAMPTZ;

-- 2) vendor_performance_metrics: faktor breakdown ustunlari (mavjud bo'lmasa).
--    on_time_rate / quality_rate / document_compliance — 0..1 oralig'ida.
ALTER TABLE vendor_performance_metrics
  ADD COLUMN IF NOT EXISTS on_time_rate         NUMERIC;
ALTER TABLE vendor_performance_metrics
  ADD COLUMN IF NOT EXISTS document_compliance  NUMERIC;
ALTER TABLE vendor_performance_metrics
  ADD COLUMN IF NOT EXISTS source               VARCHAR(32);

-- 3) Bir davr (yil+oy) uchun bitta metrik qatori — upsert kaliti.
CREATE UNIQUE INDEX IF NOT EXISTS uq_vendor_perf_metrics_period
  ON vendor_performance_metrics (vendor_id, period_year, period_month);

-- 4) Tezkor vendor-bo'yicha oxirgi metrikani topish uchun indeks.
CREATE INDEX IF NOT EXISTS idx_vendor_perf_metrics_vendor
  ON vendor_performance_metrics (vendor_id, calculated_at DESC);
