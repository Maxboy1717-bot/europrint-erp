/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Triple LEFT JOIN (warehouses + users twice for received_by/approved_by)
 *     with concatenated derived columns: `(COALESCE(u1.first_name,'') || ' ' || COALESCE(u1.last_name,''))`
 *     projected as receivedByName/approvedByName — Drizzle has no native
 *     sql-concat helper that survives the typedExecute<T> mapping layer.
 *   - "Smart NULL" optional-filter pattern: `(${param}::text IS NULL OR col = ${param})`
 *     repeated five times for status/warehouseId/supplierName/dateFrom/dateTo,
 *     allowing a single prepared statement plan regardless of which filters
 *     are populated. Equivalent Drizzle code would conditionally append
 *     .where() clauses, invalidating the plan cache.
 *   - EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) in
 *     countByCurrentYear() — Drizzle has no extract() helper.
 *   - Snake_case → camelCase aliasing inside one statement (grnNumber,
 *     movementId, purchaseOrderId, totalAmount, etc.) to feed the typed
 *     GoodsReceipt interface directly.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 *
 * G2-2 (2026-07-04, SB0541): supplier_tin/currency/contract_number/movement_id
 *   ustunlari migration g2-2-goods-receipts-tin-currency.sql orqali qo'shildi
 *   (APPLIED) — endi haqiqiy qiymat saqlanadi/o'qiladi (avval FE yuborgan
 *   qiymatlar jim tashlab yuborilardi).
 */
/**
 * @module goods-receipt.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Result, Ok, Err, AppError } from '@common/result';

export interface GoodsReceipt {
  id:               number;
  grnNumber:        string;
  movementId:       number | null;
  purchaseOrderId:  string | null;
  supplierName:     string;
  supplierTin:      string | null;
  warehouseId:      number | null;
  warehouseCode:    string | null;
  warehouseName:    string | null;
  receivedDate:     string;
  waybillNumber:    string | null;
  contractNumber:   string | null;
  totalAmount:      number;
  currency:         string;
  status:           string;
  notes:            string | null;
  receivedByName:   string;
  approvedByName:   string | null;
  approvedAt:       string | null;
  createdAt:        string;
}

@Injectable()
export class GoodsReceiptRepository {
  private readonly logger = new Logger(GoodsReceiptRepository.name);

  async findAll(filters?: {
    status?:       string;
    warehouseId?:  number;
    supplierName?: string;
    dateFrom?:     string;
    dateTo?:       string;
    limit?:        number;
  }): Promise<Result<GoodsReceipt[], AppError>> {
    try {
      const lim = Math.min(filters?.limit ?? 100, 500);
      // NOTE: Live DB goods_receipts schema uses receipt_number/receipt_date/total_value
      // (not grn_number/received_date/total_amount). waybill_number still maps to
      // invoice_number (no separate column). movement_id/contract_number/supplier_tin/
      // currency now exist (G2-2, 2026-07-04) — real values below (was NULL/'UZS' literal).
      const rows = await typedExecute<GoodsReceipt>(sql`
        SELECT
          gr.id,
          gr.receipt_number                                         AS "grnNumber",
          gr.movement_id                                            AS "movementId",
          gr.purchase_order_id::text                                AS "purchaseOrderId",
          COALESCE(gr.supplier_name, '')                            AS "supplierName",
          gr.supplier_tin                                           AS "supplierTin",
          gr.warehouse_id                                           AS "warehouseId",
          w.code                                                    AS "warehouseCode",
          w.name                                                    AS "warehouseName",
          gr.receipt_date                                           AS "receivedDate",
          gr.invoice_number                                         AS "waybillNumber",
          gr.contract_number                                        AS "contractNumber",
          COALESCE(gr.total_value, 0)::numeric                      AS "totalAmount",
          COALESCE(gr.currency, 'UZS')                              AS "currency",
          gr.status,
          gr.notes,
          (COALESCE(u1.first_name, '') || ' ' || COALESCE(u1.last_name, '')) AS "receivedByName",
          (COALESCE(u2.first_name, '') || ' ' || COALESCE(u2.last_name, '')) AS "approvedByName",
          gr.completed_at                                           AS "approvedAt",
          gr.created_at                                             AS "createdAt"
        FROM goods_receipts gr
        LEFT JOIN warehouses w  ON w.id  = gr.warehouse_id
        LEFT JOIN users u1      ON u1.id = gr.received_by
        LEFT JOIN users u2      ON u2.id = gr.completed_by
        WHERE (${filters?.status       ?? null}::text IS NULL OR gr.status        = ${filters?.status       ?? null})
          AND (${filters?.warehouseId  ?? null}::int  IS NULL OR gr.warehouse_id  = ${filters?.warehouseId  ?? null})
          AND (${filters?.supplierName ?? null}::text IS NULL OR gr.supplier_name ILIKE '%' || ${filters?.supplierName ?? null} || '%')
          AND (${filters?.dateFrom     ?? null}::date IS NULL OR gr.receipt_date::date >= ${filters?.dateFrom    ?? null}::date)
          AND (${filters?.dateTo       ?? null}::date IS NULL OR gr.receipt_date::date <= ${filters?.dateTo      ?? null}::date)
        ORDER BY gr.created_at DESC
        LIMIT ${lim}
      `);
      return Ok(rows.map(g => ({ ...g, totalAmount: Number(g.totalAmount ?? 0) })));
    } catch (e) {
      this.logger.error(`[GRN] findAll: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async countByCurrentYear(): Promise<Result<number, AppError>> {
    try {
      const rows = await typedExecute<{ cnt: number }>(sql`
        SELECT COUNT(*)::int AS cnt FROM goods_receipts
        WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `);
      return Ok(rows[0]?.cnt ?? 0);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async insert(dto: {
    grnNumber:        string;
    movementId?:      number;
    purchaseOrderId?: string;
    supplierName:     string;
    supplierTin?:     string;
    warehouseId:      number;
    waybillNumber?:   string;
    contractNumber?:  string;
    totalAmount?:     number;
    currency?:        string;
    notes?:           string;
    receivedBy:       number;
  }): Promise<Result<{ id: number }, AppError>> {
    try {
      // NOTE: Live DB goods_receipts uses receipt_number/receipt_date/total_value.
      // invoice_number used for waybillNumber (no separate waybill column).
      // movement_id/contract_number/supplier_tin/currency now exist (G2-2, 2026-07-04) —
      // real values persisted below (was silently dropped before).
      const rows = await typedExecute<{ id: number }>(sql`
        INSERT INTO goods_receipts
          (receipt_number, movement_id, purchase_order_id, supplier_name, supplier_tin,
           warehouse_id, receipt_date, invoice_number, contract_number, total_value, currency,
           status, notes, received_by, created_at)
        VALUES
          (${dto.grnNumber},
           ${dto.movementId ?? null},
           ${dto.purchaseOrderId ? parseInt(dto.purchaseOrderId, 10) : null},
           ${dto.supplierName}, ${dto.supplierTin ?? null},
           ${dto.warehouseId},
           CURRENT_DATE::text, ${dto.waybillNumber ?? null}, ${dto.contractNumber ?? null},
           ${dto.totalAmount ?? 0}, ${dto.currency ?? 'UZS'},
           'draft',
           ${dto.notes ?? null}, ${dto.receivedBy}, NOW())
        RETURNING id
      `);
      return Ok({ id: rows[0]?.id ?? 0 });
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async approve(id: number, approvedBy: number): Promise<Result<void, AppError>> {
    try {
      // Live DB has completed_by/completed_at; no approved_by/approved_at columns.
      // Status values in live DB are lowercase ('draft'→'approved').
      await db.execute(sql`
        UPDATE goods_receipts
           SET status = 'approved', completed_by = ${approvedBy}, completed_at = NOW()
         WHERE id = ${id} AND status = 'draft'
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
