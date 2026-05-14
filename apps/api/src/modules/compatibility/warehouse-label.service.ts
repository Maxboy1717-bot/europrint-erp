/**
 * @module warehouse-label.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, NotFoundException } from '@nestjs/common';
import { Result, AppError, safeCall } from '@common/result';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { LabelService, LabelFormat } from '../pos/services/label.service';
import { PrintLabelDto } from './dto/compat-body.dto';

export interface LabelPrintResult {
  success: boolean;
  content?: string;
  contentType?: string;
  message?: string;
}

@Injectable()
export class WarehouseLabelCompatService {
  constructor(private readonly labelSvc: LabelService) {}

  async printLabel(body: PrintLabelDto): Promise<LabelPrintResult & { format?: string; copies?: number }> {
    const format = ((body.format ?? 'ZPL').toUpperCase()) as LabelFormat;
    const copies = Math.max(1, body.copies ?? 1);

    if (body.batchId) {
      const rowR = await this.getBatchLabelData(body.batchId);
      if (!rowR.ok) return { success: false, message: 'Partiya topilmadi' };
      const row = rowR.data as Record<string, unknown>;
      const labelData = {
        materialCardId: Number(row['material_card_id']),
        materialName:   String(row['material_name'] ?? ''),
        materialCode:   String(row['material_code'] ?? ''),
        barcode:        String(row['barcode'] ?? ''),
        unitOfMeasure:  String(row['unit_of_measure'] ?? 'dona'),
        batchNumber:    String(row['batch_number'] ?? ''),
        productionDate: String(row['production_date'] ?? ''),
        expiryDate:     String(row['expiry_date'] ?? ''),
        quantity:       Number(row['quantity'] ?? 0),
        warehouseName:  String(row['warehouse_name'] ?? ''),
        date:           _time.now().toLocaleDateString('uz-UZ'),
      };
      const content = this.labelSvc.generateEpl(labelData, copies);
      return { success: true, content, format, copies };
    }

    if (body.materialCardId) {
      const labelDataR = await this.labelSvc.fetchLabelData(body.materialCardId);
      const labelData = labelDataR.ok ? labelDataR.data : {};
      const content = this.labelSvc.generateEpl(labelData as Parameters<typeof this.labelSvc.generateEpl>[0], copies);
      return { success: true, content, format, copies };
    }

    return { success: false, message: 'batchId yoki materialCardId kerak' };
  }

  async getBatchLabelData(batchId: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
      const result = await rawSql(sql`
        SELECT mc.id AS material_card_id, mc.xom_ashyo AS material_name,
               COALESCE(mc.kod, mc.id::text) AS material_code,
               COALESCE(mc.barcode, '') AS barcode, mc.unit_of_measure,
               wb.batch_number, TO_CHAR(wb.production_date, 'YYYY-MM-DD') AS production_date,
               TO_CHAR(wb.expiry_date, 'YYYY-MM-DD') AS expiry_date,
               wb.quantity, w.name AS warehouse_name
        FROM warehouse_batches wb
        JOIN material_cards mc ON mc.id = wb.material_card_id
        LEFT JOIN warehouses w ON w.id = wb.warehouse_id
        WHERE wb.id = ${batchId}
      `);
      return dbRows(result)[0] ?? null;
    });
  }

  async getLabelBatches(warehouseId?: string, status?: string) {
    const warehouseFilter = warehouseId ? sql`AND wb.warehouse_id = ${warehouseId}` : sql``;
    const statusFilter = status ? sql`AND wb.status = ${status}` : sql``;
    const result = await rawSql(sql`
      SELECT wb.id, wb.batch_number, wb.quantity, wb.status,
             wb.production_date, wb.expiry_date, wb.created_at,
             mc.xom_ashyo AS material_name, mc.barcode,
             w.name AS warehouse_name
      FROM warehouse_batches wb
      JOIN material_cards mc ON mc.id = wb.material_card_id
      LEFT JOIN warehouses w ON w.id = wb.warehouse_id
      WHERE true ${warehouseFilter} ${statusFilter}
      ORDER BY wb.created_at DESC LIMIT 100
    `);
    return dbRows(result);
  }

  async getPrintHistory(warehouseId?: string, limit = 50) {
    const warehouseFilter = warehouseId
      ? sql`AND EXISTS (SELECT 1 FROM warehouse_batches wb2 WHERE wb2.id = q.batch_id AND wb2.warehouse_id = ${warehouseId})`
      : sql``;
    const result = await rawSql(sql`
      SELECT q.id, q.batch_id, q.status, q.format, q.copies, q.printed_at, q.created_at,
             mc.xom_ashyo AS material_name, wb.batch_number
      FROM pos_barcode_print_queue q
      LEFT JOIN warehouse_batches wb ON wb.id = q.batch_id
      LEFT JOIN material_cards mc ON mc.id = wb.material_card_id
      WHERE true ${warehouseFilter}
      ORDER BY q.created_at DESC LIMIT ${limit}
    `);
    return dbRows(result);
  }

  async updateBatchStatus(id: string, status: string, notes?: string) {
    const result = await rawSql(sql`
      UPDATE warehouse_batches
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id} RETURNING id, batch_number, status, updated_at
    `);
    const found = dbRows(result)[0];
    if (!found) throw new NotFoundException(`Batch ${id} not found`);
    return found;
  }

  async createLabelPrintJob(batchId: string, format: string, copies: number) {
    const result = await rawSql(sql`
      INSERT INTO pos_barcode_print_queue (batch_id, format, copies, status)
      VALUES (${batchId}, ${format}, ${copies}, 'QUEUED')
      RETURNING id, status, created_at
    `);
    const created = dbRows(result)[0];
    return created;
  }
}
