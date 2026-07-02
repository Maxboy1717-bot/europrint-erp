-- APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02
-- Domen: Ombor-WMS-MM — Yetkazuvchi-reyting ikki-dunyo tuzatish.
--
-- Topilma: 4 ta yetkazuvchi-reyting jadval bir-birini bilmaydi:
--   1. mm_vendor_ratings           — MM moduli, PO-hodisa darajasida reyting
--                                    (POST /api/mm/vendor-performance, mm-dashboard.controller.ts).
--   2. vendor_performance_metrics  — WMS moduli, oylik agregat breakdown
--                                    (SupplierRatingRepository.persistRating, WMS-094/WMS-022).
--   3. vendor_performance          — stale/orfan (faqat schema-ext-b-3.ts'da e'lon qilingan,
--                                    hech qanday repository/servis UNDA yozmaydi/o'qimaydi).
--   4. material_supplier_ratings   — 0 qator, hech qanday repository/servis ishlatmaydi
--                                    (faqat schema-db-only-generated.ts'da e'lon + bir martalik
--                                    setup skriptida CREATE TABLE).
--
-- Qaror: (3) va (4) kod-darajasida uzildi (pgTable export olib tashlandi — bu commit bilan
-- birga), lekin DB jadvali DROP QILINMAYDI (Q-39/loyiha qoidasi: hech qachon DROP TABLE,
-- faqat kod-darajasida uzish/backfill). (1) va (2) — ikkalasi ham FAOL yozuvchiga ega
-- (MM va WMS), shuning uchun o'chirilmaydi; ular bitta agregatsion VIEW orqali birlashtiriladi
-- (o'qish uchun yagona nuqta), ikkala modul o'z yozish yo'lini saqlab qoladi.
--
-- vendors.id === mm_vendors.id (parallel master, WMS persistRating har ikkalasini ham
-- sinxron yangilaydi — tasdiqlangan: vendors va mm_vendors bir xil 20 qator/id/name).

CREATE OR REPLACE VIEW vendor_rating_unified AS
SELECT
  v.id                          AS vendor_id,
  v.name                        AS vendor_name,
  v.is_active                   AS vendor_is_active,

  -- Kanonik joriy reyting (vendors master — WMS persistRating har ikkala master
  -- jadvalni ham (vendors + mm_vendors) shu qiymat bilan sinxronlaydi).
  v.rating                      AS canonical_rating,
  v.rating_low_flag             AS canonical_rating_low_flag,
  v.rating_updated_at           AS canonical_rating_updated_at,

  -- MM moduli — PO-hodisa darajasidagi reytinglar agregati (mm_vendor_ratings).
  mm.rating_count               AS mm_rating_count,
  mm.avg_quality_score          AS mm_avg_quality_score,
  mm.avg_delivery_score         AS mm_avg_delivery_score,
  mm.avg_price_score            AS mm_avg_price_score,
  mm.last_rated_at              AS mm_last_rated_at,

  -- WMS moduli — eng so'nggi oylik agregat breakdown (vendor_performance_metrics).
  wms.period_year               AS wms_period_year,
  wms.period_month              AS wms_period_month,
  wms.total_orders              AS wms_total_orders,
  wms.on_time_deliveries        AS wms_on_time_deliveries,
  wms.late_deliveries           AS wms_late_deliveries,
  wms.on_time_rate              AS wms_on_time_rate,
  wms.quality_score             AS wms_quality_score,
  wms.price_competitiveness     AS wms_price_competitiveness,
  wms.document_compliance       AS wms_document_compliance,
  wms.return_rate               AS wms_return_rate,
  wms.overall_rating            AS wms_overall_rating,
  wms.total_spend               AS wms_total_spend,
  wms.source                    AS wms_source,
  wms.calculated_at             AS wms_calculated_at
FROM vendors v
LEFT JOIN (
  SELECT
    vendor_id,
    COUNT(*)                    AS rating_count,
    AVG(quality_score)          AS avg_quality_score,
    AVG(delivery_score)         AS avg_delivery_score,
    AVG(price_score)            AS avg_price_score,
    MAX(rated_at)                AS last_rated_at
  FROM mm_vendor_ratings
  GROUP BY vendor_id
) mm ON mm.vendor_id = v.id
LEFT JOIN LATERAL (
  SELECT *
  FROM vendor_performance_metrics vpm
  WHERE vpm.vendor_id = v.id
  ORDER BY vpm.period_year DESC, vpm.period_month DESC
  LIMIT 1
) wms ON TRUE
WHERE v.deleted_at IS NULL;
