/**
 * @module supplier-rating.repository
 * @description Ta'minotchi reyting repo (EP-WMS-094 / EP-WMS-022) — Drizzle/raw SQL.
 *   Oxirgi N-oy oynasi bo'yicha 4-faktor xom agregatlarini jonli jadvalardan
 *   hisoblaydi (purchase_orders + goods_receipts/_lines) va natijani
 *   vendors + vendor_performance_metrics ga yozadi.
 *
 *   RULE4_EXCEPTION: oyna agregati ko'p-CTE/window funksiyali analitik so'rov —
 *   Drizzle builder buni ifodalay olmaydi; parametrli `runQuery` (SQL injection
 *   himoyasi) ishlatiladi. Q-46: faqat O'QISH + ADDITIVE yozuv (vendors.rating /
 *   yangi ustunlar / vendor_performance_metrics UPSERT) — mavjud WMS yo'liga tegmaydi.
 * @layer Infrastructure (WMS)
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result, AppError } from '@common/result';
import { runQuery } from '@shared/db';
import {
  ISupplierRatingRepo,
  SupplierRatingPersist,
  SupplierRatingRow,
  SupplierRatingDetail,
} from '../../domain/repositories/i-supplier-rating.repo';
import { SupplierWindowAggregate } from '../../domain/constants/supplier-rating.constants';

interface DeliveryAggRow {
  total_deliveries: string | number | null;
  on_time_deliveries: string | number | null;
  late_deliveries: string | number | null;
  documents_complete: string | number | null;
  documents_total: string | number | null;
  total_spend: string | number | null;
}

interface QcAggRow {
  qc_accepted: string | number | null;
  qc_rejected: string | number | null;
}

interface PriceAggRow {
  avg_unit_price: string | number | null;
  stddev_unit_price: string | number | null;
  price_observations: string | number | null;
}

const num = (v: string | number | null | undefined): number => {
  const n = v == null ? 0 : Number(v);
  return Number.isFinite(n) ? n : 0;
};

@Injectable()
export class SupplierRatingRepository implements ISupplierRatingRepo {
  private readonly logger = new Logger(SupplierRatingRepository.name);

  /**
   * Ta'minotchilar reyting ro'yxati (ADDITIVE READ — vendors master jadvalidan).
   * `lowOnly` → faqat past-reyting bayrog'i bor (PO-ogohlantirish). Reyting null
   * bo'lganlar oxirida (hali hisoblanmagan). Data yo'q → bo'sh ro'yxat (Q-40).
   */
  async listRatings(
    lowOnly: boolean,
    limit: number,
    offset: number,
  ): Promise<Result<SupplierRatingRow[], AppError>> {
    try {
      const rows = await runQuery<{
        vendor_id: number;
        vendor_name: string | null;
        rating: string | number | null;
        rating_low_flag: boolean | null;
        rating_updated_at: string | Date | null;
      }>(sql`
        SELECT
          v.id                AS vendor_id,
          v.name              AS vendor_name,
          v.rating            AS rating,
          COALESCE(v.rating_low_flag, FALSE) AS rating_low_flag,
          v.rating_updated_at AS rating_updated_at
        FROM vendors v
        WHERE v.deleted_at IS NULL
          ${lowOnly ? sql`AND COALESCE(v.rating_low_flag, FALSE) = TRUE` : sql``}
        ORDER BY (v.rating IS NULL), v.rating ASC NULLS LAST, v.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `);
      const list = Array.isArray(rows.rows) ? rows.rows : [];
      return Ok(
        list.map((r) => ({
          vendorId: Number(r.vendor_id),
          vendorName: r.vendor_name ?? null,
          rating: r.rating == null ? null : Number(r.rating),
          ratingLowFlag: Boolean(r.rating_low_flag),
          ratingUpdatedAt: r.rating_updated_at == null ? null : new Date(r.rating_updated_at).toISOString(),
        })),
      );
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `listRatings: ${String(e)}` });
    }
  }

  /**
   * Bitta ta'minotchi reytingi + oxirgi oylik breakdown (ADDITIVE READ).
   * vendors (kanonik reyting) LEFT JOIN vendor_performance_metrics (oxirgi davr).
   * Vendor topilmasa null → controller NOT_FOUND qaytaradi.
   */
  async getRating(vendorId: number): Promise<Result<SupplierRatingDetail | null, AppError>> {
    try {
      const rows = await runQuery<{
        vendor_id: number;
        vendor_name: string | null;
        rating: string | number | null;
        rating_low_flag: boolean | null;
        rating_updated_at: string | Date | null;
        on_time_rate: string | number | null;
        quality_score: string | number | null;
        price_competitiveness: string | number | null;
        document_compliance: string | number | null;
        total_orders: string | number | null;
        on_time_deliveries: string | number | null;
        late_deliveries: string | number | null;
        total_spend: string | number | null;
        period_year: number | null;
        period_month: number | null;
        source: string | null;
      }>(sql`
        SELECT
          v.id                AS vendor_id,
          v.name              AS vendor_name,
          v.rating            AS rating,
          COALESCE(v.rating_low_flag, FALSE) AS rating_low_flag,
          v.rating_updated_at AS rating_updated_at,
          m.on_time_rate          AS on_time_rate,
          m.quality_score         AS quality_score,
          m.price_competitiveness AS price_competitiveness,
          m.document_compliance   AS document_compliance,
          m.total_orders          AS total_orders,
          m.on_time_deliveries    AS on_time_deliveries,
          m.late_deliveries       AS late_deliveries,
          m.total_spend           AS total_spend,
          m.period_year           AS period_year,
          m.period_month          AS period_month,
          m.source                AS source
        FROM vendors v
        LEFT JOIN LATERAL (
          SELECT *
          FROM vendor_performance_metrics vpm
          WHERE vpm.vendor_id = v.id
          ORDER BY vpm.period_year DESC, vpm.period_month DESC
          LIMIT 1
        ) m ON TRUE
        WHERE v.id = ${vendorId}
          AND v.deleted_at IS NULL
        LIMIT 1
      `);
      const r = rows.rows[0];
      if (!r) return Ok(null);

      const n = (v: string | number | null): number | null =>
        v == null ? null : (Number.isFinite(Number(v)) ? Number(v) : null);

      const detail: SupplierRatingDetail = {
        vendorId: Number(r.vendor_id),
        vendorName: r.vendor_name ?? null,
        rating: n(r.rating),
        ratingLowFlag: Boolean(r.rating_low_flag),
        ratingUpdatedAt: r.rating_updated_at == null ? null : new Date(r.rating_updated_at).toISOString(),
        onTimeRate: n(r.on_time_rate),
        qualityScore: n(r.quality_score),
        priceCompetitiveness: n(r.price_competitiveness),
        documentCompliance: n(r.document_compliance),
        totalOrders: n(r.total_orders),
        onTimeDeliveries: n(r.on_time_deliveries),
        lateDeliveries: n(r.late_deliveries),
        totalSpend: n(r.total_spend),
        periodYear: r.period_year ?? null,
        periodMonth: r.period_month ?? null,
        source: r.source ?? null,
      };
      return Ok(detail);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `getRating: ${String(e)}` });
    }
  }

  async vendorExists(vendorId: number): Promise<Result<boolean, AppError>> {
    try {
      const rows = await runQuery<{ exists: boolean }>(sql`
        SELECT EXISTS (
          SELECT 1 FROM vendors WHERE id = ${vendorId} AND deleted_at IS NULL
        ) AS exists
      `);
      return Ok(Boolean(rows.rows[0]?.exists));
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `vendorExists: ${String(e)}` });
    }
  }

  /**
   * Oxirgi `windowMonths` oy ichidagi xom agregatlar. Uchta mustaqil so'rov:
   *   1) yetkazib berish + hujjat (purchase_orders).
   *   2) QC qabul/rad (goods_receipts + goods_receipt_lines).
   *   3) narx volatilligi (goods_receipt_lines.unit_cost).
   * Data yo'q → barcha hisoblagichlar 0 / narx null (Q-40: soxta emas, neytral).
   */
  async computeWindowAggregate(
    vendorId: number,
    windowMonths: number,
  ): Promise<Result<SupplierWindowAggregate, AppError>> {
    try {
      const monthsInterval = sql.raw(`INTERVAL '${Math.max(1, Math.trunc(windowMonths))} months'`);

      // 1) Yetkazib berish (o'z-vaqtida) + hujjat (invoice / 3-tomon moslik).
      //    on-time = actual <= expected (ikkalasi ham bor bo'lganda); aks holda
      //    bu PO o'z-vaqtida o'lchovidan tashqarida qoladi (skip — soxta emas).
      const deliveryRows = await runQuery<DeliveryAggRow>(sql`
        SELECT
          COUNT(*)                                                          AS total_deliveries,
          COUNT(*) FILTER (
            WHERE po.expected_delivery_date IS NOT NULL
              AND po.actual_delivery_date   IS NOT NULL
              AND po.actual_delivery_date  <= po.expected_delivery_date
          )                                                                 AS on_time_deliveries,
          COUNT(*) FILTER (
            WHERE po.expected_delivery_date IS NOT NULL
              AND po.actual_delivery_date   IS NOT NULL
              AND po.actual_delivery_date   > po.expected_delivery_date
          )                                                                 AS late_deliveries,
          COUNT(*) FILTER (
            WHERE COALESCE(po.invoice_matched, FALSE) = TRUE
               OR COALESCE(po.three_way_matched, FALSE) = TRUE
          )                                                                 AS documents_complete,
          COUNT(*)                                                          AS documents_total,
          COALESCE(SUM(po.total_amount), 0)                                 AS total_spend
        FROM purchase_orders po
        WHERE COALESCE(po.supplier_id, po.vendor_id) = ${vendorId}
          AND po.deleted_at IS NULL
          AND COALESCE(po.actual_delivery_date, po.goods_received_at, po.created_at)
              >= (NOW() - ${monthsInterval})
      `);
      const d = deliveryRows.rows[0];

      // 2) QC: qabul qilingan vs rad etilgan element soni (goods_receipt_lines orqali,
      //    receipt → supplier). Brak% = rejected / (accepted + rejected).
      const qcRows = await runQuery<QcAggRow>(sql`
        SELECT
          COALESCE(SUM(
            COALESCE(grl.accepted_quantity, grl.received_quantity, grl.quantity, 0)
          ), 0)                                                             AS qc_accepted,
          COALESCE(SUM(COALESCE(grl.rejected_quantity, 0)), 0)             AS qc_rejected
        FROM goods_receipts gr
        JOIN goods_receipt_lines grl
          ON grl.receipt_id = gr.id OR grl.goods_receipt_id = gr.id
        WHERE gr.supplier_id = ${vendorId}
          AND COALESCE(gr.received_at, gr.created_at) >= (NOW() - ${monthsInterval})
      `);
      const q = qcRows.rows[0];

      // 3) Narx volatilligi (CV = stddev/mean) — narx barqarorligi proksisi.
      //    Benchmark narx master-data'da yo'q (Q-40) → volatillik proksisi.
      const priceRows = await runQuery<PriceAggRow>(sql`
        SELECT
          AVG(grl.unit_cost)                AS avg_unit_price,
          STDDEV_POP(grl.unit_cost)         AS stddev_unit_price,
          COUNT(grl.unit_cost)              AS price_observations
        FROM goods_receipts gr
        JOIN goods_receipt_lines grl
          ON grl.receipt_id = gr.id OR grl.goods_receipt_id = gr.id
        WHERE gr.supplier_id = ${vendorId}
          AND grl.unit_cost IS NOT NULL
          AND grl.unit_cost > 0
          AND COALESCE(gr.received_at, gr.created_at) >= (NOW() - ${monthsInterval})
      `);
      const p = priceRows.rows[0];

      const avg = p?.avg_unit_price != null ? Number(p.avg_unit_price) : null;
      const stddev = p?.stddev_unit_price != null ? Number(p.stddev_unit_price) : null;
      const priceObs = num(p?.price_observations);
      const priceCv =
        avg != null && avg > 0 && stddev != null && Number.isFinite(stddev) && priceObs > 1
          ? stddev / avg
          : null;

      const aggregate: SupplierWindowAggregate = {
        vendorId,
        totalDeliveries: num(d?.total_deliveries),
        onTimeDeliveries: num(d?.on_time_deliveries),
        lateDeliveries: num(d?.late_deliveries),
        qcAccepted: num(q?.qc_accepted),
        qcRejected: num(q?.qc_rejected),
        documentsComplete: num(d?.documents_complete),
        documentsTotal: num(d?.documents_total),
        priceCv,
        avgUnitPrice: avg != null && Number.isFinite(avg) ? avg : null,
        totalSpend: num(d?.total_spend),
      };
      return Ok(aggregate);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `computeWindowAggregate: ${String(e)}` });
    }
  }

  /**
   * Reytingni saqlaydi (ADDITIVE):
   *   - vendors.rating / rating_low_flag / rating_updated_at UPDATE (ikkala
   *     master jadval: vendors va mm_vendors — ikkalasi ham `rating` ustuniga ega).
   *   - vendor_performance_metrics ga joriy yil+oy uchun breakdown UPSERT.
   */
  async persistRating(input: SupplierRatingPersist): Promise<Result<void, AppError>> {
    try {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth() + 1;

      // vendors — kanonik master (FK manbasi). rating_low_flag yangi PO ogohlantirishi.
      await runQuery(sql`
        UPDATE vendors
           SET rating            = ${input.rating},
               rating_low_flag   = ${input.lowFlag},
               rating_updated_at = NOW()
         WHERE id = ${input.vendorId}
      `);

      // mm_vendors — parallel master (ai `customers`-bo'linishi); shu reytingni oyna.
      await runQuery(sql`
        UPDATE mm_vendors
           SET rating = ${input.rating}
         WHERE id = ${input.vendorId}
      `);

      // vendor_performance_metrics — oylik breakdown UPSERT (canonical metrik jadval).
      await runQuery(sql`
        INSERT INTO vendor_performance_metrics (
          vendor_id, period_year, period_month,
          total_orders, on_time_deliveries, late_deliveries,
          quality_score, price_competitiveness, return_rate,
          overall_rating, total_spend,
          on_time_rate, document_compliance, source,
          calculated_at, created_at
        ) VALUES (
          ${input.vendorId}, ${year}, ${month},
          ${input.totalOrders}, ${input.onTimeDeliveries}, ${input.lateDeliveries},
          ${input.qualityRate}, ${input.priceScore},
          ${input.qualityRate == null ? null : 1 - input.qualityRate},
          ${input.rating}, ${input.totalSpend},
          ${input.onTimeRate}, ${input.documentCompliance}, ${input.source},
          NOW(), NOW()
        )
        ON CONFLICT (vendor_id, period_year, period_month) DO UPDATE SET
          total_orders          = EXCLUDED.total_orders,
          on_time_deliveries    = EXCLUDED.on_time_deliveries,
          late_deliveries       = EXCLUDED.late_deliveries,
          quality_score         = EXCLUDED.quality_score,
          price_competitiveness = EXCLUDED.price_competitiveness,
          return_rate           = EXCLUDED.return_rate,
          overall_rating        = EXCLUDED.overall_rating,
          total_spend           = EXCLUDED.total_spend,
          on_time_rate          = EXCLUDED.on_time_rate,
          document_compliance   = EXCLUDED.document_compliance,
          source                = EXCLUDED.source,
          calculated_at         = NOW()
      `);

      return Ok(undefined);
    } catch (e) {
      this.logger.error({ vendorId: input.vendorId, err: String(e) }, 'persistRating failed');
      return Err({ code: 'DB_ERROR', message: `persistRating: ${String(e)}` });
    }
  }
}
