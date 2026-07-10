/**
 * @module advance-linkage.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (WMS)
 */

import { Injectable } from '@nestjs/common';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Err, Result, safeCall } from '@common/result';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> =>
  safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class AdvanceLinkageRepository {
  /**
   * Vision 10-warehouse #65 (TASDIQ-2146 §10 #65) — "Avans to'lov ↔ yetkazish bog'lanishi
   * (yopilmagan avanslar)". Kross-modul READ-model: Finance `advance_payments` (avans daftari)
   * ni WMS `mm_goods_receipts` (mol qabul) bilan ta'minotchi(vendor_id=supplier_id) + PO bo'yicha
   * bog'laydi va HALI YOPILMAGAN avanslarni (settlement_status <> 'settled') yuzaga chiqaradi.
   * "Yopilmagan" semantikasi jonli yozuvchidan tasdiqlangan (procurement-request.service.ts:
   * yaratishda 'unsettled', qabulda 'settled'). Har avans uchun: berilgan summa, yopilgan summa,
   * ochiq (open) summa, shu PO bo'yicha qabul qilingan jami qiymat va qabul soni. Faqat O'QISH —
   * hech narsa yozmaydi; yangi ustun/jadval YO'Q. Ixtiyoriy vendorId / purchaseOrderId filtri.
   *
   * NB: mm_goods_receipts VIEW (goods_receipts ustidan) — bu yerda faqat o'qiladi.
   * Raw SQL: ko'p-jadvalli agregat-join (Qoida 4 murakkab-so'rov istisnosi).
   */
  async findUnclosedAdvances(
    vendorId: number | null,
    purchaseOrderId: number | null,
    lim = 100,
  ): Promise<Result<Row[]>> {
    try {
      const base = (extra: SQL) => sql`
        SELECT
          ap.id AS advance_id,
          ap.request_number,
          ap.vendor_id,
          COALESCE(gr.supplier_name, v.name) AS vendor_name,
          ap.purchase_order_id,
          ap.payment_type,
          ap.status AS advance_status,
          ap.settlement_status,
          ap.amount::numeric AS advance_amount,
          COALESCE(ap.settled_amount, 0)::numeric AS settled_amount,
          (COALESCE(ap.amount, 0) - COALESCE(ap.settled_amount, 0))::numeric AS open_amount,
          ap.currency,
          ap.disbursed_at,
          ap.request_date,
          COALESCE(gr.received_value, 0)::numeric AS received_value,
          COALESCE(gr.receipt_count, 0)::int AS receipt_count,
          gr.last_receipt_at
        FROM advance_payments ap
        LEFT JOIN (
          SELECT supplier_id, purchase_order_id,
                 MAX(supplier_name) AS supplier_name,
                 SUM(total_value) AS received_value,
                 COUNT(*) AS receipt_count,
                 MAX(received_at) AS last_receipt_at
          FROM mm_goods_receipts
          WHERE purchase_order_id IS NOT NULL
          GROUP BY supplier_id, purchase_order_id
        ) gr ON gr.supplier_id = ap.vendor_id AND gr.purchase_order_id = ap.purchase_order_id
        LEFT JOIN vendors v ON v.id = ap.vendor_id
        WHERE ap.settlement_status IS DISTINCT FROM 'settled'${extra}
        ORDER BY ap.disbursed_at DESC NULLS LAST, ap.id DESC
        LIMIT ${lim}`;
      const filters =
        vendorId != null && purchaseOrderId != null
          ? sql` AND ap.vendor_id = ${vendorId} AND ap.purchase_order_id = ${purchaseOrderId}`
          : vendorId != null
          ? sql` AND ap.vendor_id = ${vendorId}`
          : purchaseOrderId != null
          ? sql` AND ap.purchase_order_id = ${purchaseOrderId}`
          : sql``;
      return exec(base(filters));
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
