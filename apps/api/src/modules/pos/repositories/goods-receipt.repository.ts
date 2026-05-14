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
      const rows = await typedExecute<GoodsReceipt>(sql`
        SELECT
          gr.id,
          gr.grn_number        AS "grnNumber",
          gr.movement_id       AS "movementId",
          gr.purchase_order_id AS "purchaseOrderId",
          gr.supplier_name     AS "supplierName",
          gr.supplier_tin      AS "supplierTin",
          gr.warehouse_id      AS "warehouseId",
          w.code               AS "warehouseCode",
          w.name               AS "warehouseName",
          gr.received_date     AS "receivedDate",
          gr.waybill_number    AS "waybillNumber",
          gr.contract_number   AS "contractNumber",
          gr.total_amount::numeric AS "totalAmount",
          gr.currency,
          gr.status,
          gr.notes,
          (COALESCE(u1.first_name, '') || ' ' || COALESCE(u1.last_name, '')) AS "receivedByName",
          (COALESCE(u2.first_name, '') || ' ' || COALESCE(u2.last_name, '')) AS "approvedByName",
          gr.approved_at       AS "approvedAt",
          gr.created_at        AS "createdAt"
        FROM goods_receipts gr
        LEFT JOIN warehouses w  ON w.id  = gr.warehouse_id
        LEFT JOIN users u1      ON u1.id = gr.received_by
        LEFT JOIN users u2      ON u2.id = gr.approved_by
        WHERE (${filters?.status       ?? null}::text IS NULL OR gr.status        = ${filters?.status       ?? null})
          AND (${filters?.warehouseId  ?? null}::int  IS NULL OR gr.warehouse_id  = ${filters?.warehouseId  ?? null})
          AND (${filters?.supplierName ?? null}::text IS NULL OR gr.supplier_name ILIKE '%' || ${filters?.supplierName ?? null} || '%')
          AND (${filters?.dateFrom     ?? null}::date IS NULL OR gr.received_date >= ${filters?.dateFrom    ?? null}::date)
          AND (${filters?.dateTo       ?? null}::date IS NULL OR gr.received_date <= ${filters?.dateTo      ?? null}::date)
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
      const rows = await typedExecute<{ id: number }>(sql`
        INSERT INTO goods_receipts
          (grn_number, movement_id, purchase_order_id, supplier_name, supplier_tin,
           warehouse_id, received_date, waybill_number, contract_number, total_amount,
           currency, status, notes, received_by, created_at)
        VALUES
          (${dto.grnNumber}, ${dto.movementId ?? null}, ${dto.purchaseOrderId ?? null},
           ${dto.supplierName}, ${dto.supplierTin ?? null}, ${dto.warehouseId},
           CURRENT_DATE, ${dto.waybillNumber ?? null}, ${dto.contractNumber ?? null},
           ${dto.totalAmount ?? 0}, ${dto.currency ?? 'UZS'}, 'DRAFT',
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
      await db.execute(sql`
        UPDATE goods_receipts
           SET status = 'APPROVED', approved_by = ${approvedBy}, approved_at = NOW()
         WHERE id = ${id} AND status = 'DRAFT'
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
