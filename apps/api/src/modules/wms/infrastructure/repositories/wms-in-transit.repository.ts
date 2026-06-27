/**
 * @module wms-in-transit.repository
 * @description Repository / data-access layer — import xom-ashyo YO'LDA kuzatuvi.
 *   Drizzle `sql` parametrli so'rovlar (SQL injection yo'q, Qoida B). Result<T>
 *   qaytaradi; throw qilmaydi. Jadvallar: wms_in_transit_shipments +
 *   wms_import_documents (docs/migration/wms-in-transit-shipments.sql).
 * @layer Infrastructure (WMS)
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { SQL, SQLWrapper, sql } from 'drizzle-orm';
import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
import type { IWmsInTransitRepo } from '../../domain/repositories/i-wms-in-transit.repo';

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> =>
  safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class WmsInTransitRepository implements IWmsInTransitRepo {
  async listShipments(status?: string): Promise<Result<Row[]>> {
    return status
      ? exec(sql`SELECT * FROM wms_in_transit_shipments WHERE status = ${status} ORDER BY created_at DESC LIMIT ${MAX_QUERY_LIMIT}`)
      : exec(sql`SELECT * FROM wms_in_transit_shipments ORDER BY created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);
  }

  async findShipment(id: number): Promise<Result<Row | null>> {
    const r = await exec(sql`SELECT * FROM wms_in_transit_shipments WHERE id = ${id} LIMIT 1`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async createShipment(body: Row, userId: number | null): Promise<Result<Row>> {
    const r = await exec(sql`
      INSERT INTO wms_in_transit_shipments
        (shipment_number, supplier_id, supplier_name, purchase_order_id, warehouse_id,
         status, origin_country, eta, shipped_date, currency, declared_value, incoterm,
         customs_doc_url, notes, created_by)
      VALUES (
        ${body.shipment_number ?? null},
        ${body.supplier_id ?? null},
        ${body.supplier_name ?? null},
        ${body.purchase_order_id ?? null},
        ${body.warehouse_id ?? null},
        'shipped',
        ${body.origin_country ?? null},
        ${body.eta ?? null},
        ${body.shipped_date ?? null},
        ${body.currency ?? null},
        ${body.declared_value ?? null},
        ${body.incoterm ?? null},
        ${body.customs_doc_url ?? null},
        ${body.notes ?? null},
        ${userId}
      )
      RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async updateStatus(
    id: number,
    status: string,
    patch?: { customsDate?: string | null; arrivedDate?: string | null; goodsReceiptId?: number | null },
  ): Promise<Result<Row>> {
    const r = await exec(sql`
      UPDATE wms_in_transit_shipments SET
        status = ${status},
        customs_date = COALESCE(${patch?.customsDate ?? null}, customs_date),
        arrived_date = COALESCE(${patch?.arrivedDate ?? null}, arrived_date),
        goods_receipt_id = COALESCE(${patch?.goodsReceiptId ?? null}, goods_receipt_id),
        updated_at = now()
      WHERE id = ${id}
      RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }

  async createGoodsReceiptDraft(shipment: Row, userId: number | null): Promise<Result<{ id: number }>> {
    // Karantin oqimiga kirim: DRAFT qabul (mavjud darvoza shu jadval ustida ishlaydi).
    const receiptNo = `IMP-${shipment.shipment_number ?? shipment.id ?? 'NA'}`;
    // receipt_date — goods_receipts (mm_goods_receipts VIEW manbasi) da NOT NULL.
    // Arrived sanasi bo'lmasa bugungi sana (ISO).
    const receiptDate = String(shipment.arrived_date ?? new Date().toISOString().slice(0, 10));
    const r = await exec(sql`
      INSERT INTO mm_goods_receipts
        (receipt_number, receipt_date, supplier_id, supplier_name, warehouse_id, purchase_order_id,
         status, invoice_number, received_by, received_at, notes)
      VALUES (
        ${receiptNo},
        ${receiptDate},
        ${shipment.supplier_id ?? null},
        ${shipment.supplier_name ?? null},
        ${shipment.warehouse_id ?? null},
        ${shipment.purchase_order_id ?? null},
        'DRAFT',
        ${shipment.invoice_number ?? null},
        ${userId},
        NOW(),
        ${`Import jo'natma #${shipment.id ?? ''} (in-transit → karantin)`}
      )
      RETURNING id`);
    if (!r.ok) return Err(r.error);
    const id = r.data[0]?.id;
    if (id == null) return Err({ code: 'DB_ERROR', message: 'Qabul yaratilmadi' });
    return Ok({ id: Number(id) });
  }

  async listDocuments(shipmentId: number): Promise<Result<Row[]>> {
    return exec(sql`SELECT * FROM wms_import_documents WHERE shipment_id = ${shipmentId} ORDER BY created_at DESC LIMIT ${MAX_QUERY_LIMIT}`);
  }

  async addDocument(shipmentId: number, body: Row, userId: number | null): Promise<Result<Row>> {
    const r = await exec(sql`
      INSERT INTO wms_import_documents
        (shipment_id, doc_type, doc_number, file_url, issued_date, notes, uploaded_by)
      VALUES (
        ${shipmentId},
        ${body.doc_type ?? null},
        ${body.doc_number ?? null},
        ${body.file_url ?? null},
        ${body.issued_date ?? null},
        ${body.notes ?? null},
        ${userId}
      )
      RETURNING *`);
    return r.ok ? Ok(r.data[0] ?? null) : Err(r.error);
  }
}
