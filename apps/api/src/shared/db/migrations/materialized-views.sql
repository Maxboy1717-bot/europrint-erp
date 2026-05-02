-- materialized-views.sql — TZ-62: 3 ta Materialized View + UNIQUE INDEX
-- Ishlatish: psql -f materialized-views.sql yoki ddlRun bilan
-- REFRESH CONCURRENTLY — toʻliq tʻsiqlanmaslik (non-blocking)

-- ============================================================================
-- 1. mv_sales_monthly — Oylik savdo KPI
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sales_monthly AS
SELECT
  DATE_TRUNC('month', si.created_at)   AS month_start,
  COUNT(*)                              AS order_count,
  SUM(si.total_amount)                 AS total_revenue,
  AVG(si.total_amount)                 AS avg_order_value,
  COUNT(DISTINCT si.customer_id)       AS unique_customers,
  SUM(si.tax_amount)                   AS total_tax
FROM sales_invoices si
WHERE si.status = 'POSTED'
GROUP BY DATE_TRUNC('month', si.created_at)
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_mv_sales_monthly_month
  ON mv_sales_monthly (month_start);

-- ============================================================================
-- 2. mv_inventory_daily — Kunlik inventar qiymati
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_inventory_daily AS
SELECT
  DATE_TRUNC('day', wm.created_at)     AS day_start,
  wm.warehouse_id,
  SUM(wm.quantity * COALESCE(wm.unit_cost, 0)) AS inventory_value,
  SUM(wm.quantity)                     AS total_quantity,
  COUNT(DISTINCT wm.product_id)        AS sku_count
FROM warehouse_stock wm
GROUP BY DATE_TRUNC('day', wm.created_at), wm.warehouse_id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_mv_inventory_daily_day_wh
  ON mv_inventory_daily (day_start, warehouse_id);

-- ============================================================================
-- 3. mv_kpi_daily — Kunlik OEE va Scrap Rate
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_kpi_daily AS
SELECT
  DATE_TRUNC('day', po.created_at)     AS day_start,
  po.work_center_id,
  -- OEE = Availability × Performance × Quality
  AVG(
    CASE
      WHEN po.planned_time > 0
      THEN (po.planned_time - COALESCE(po.downtime_minutes, 0))::numeric
           / po.planned_time
           * COALESCE(po.performance_rate, 1.0)
           * COALESCE(po.quality_rate, 1.0)
      ELSE NULL
    END
  )                                     AS avg_oee,
  -- Scrap Rate = scrap_qty / total_qty
  SUM(COALESCE(po.scrap_qty, 0))       AS total_scrap,
  SUM(po.produced_qty)                 AS total_produced,
  CASE
    WHEN SUM(po.produced_qty) > 0
    THEN SUM(COALESCE(po.scrap_qty, 0))::numeric / SUM(po.produced_qty)
    ELSE 0
  END                                   AS scrap_rate
FROM production_orders po
WHERE po.status IN ('COMPLETED', 'CLOSED')
GROUP BY DATE_TRUNC('day', po.created_at), po.work_center_id
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_mv_kpi_daily_day_wc
  ON mv_kpi_daily (day_start, work_center_id);

-- ============================================================================
-- REFRESH CONCURRENTLY (cron orqali chaqiriladi — har 15 daqiqada)
-- MaterializedViewRefreshService.refreshAll() tomonidan bajariladi
-- ============================================================================
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sales_monthly;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inventory_daily;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kpi_daily;
