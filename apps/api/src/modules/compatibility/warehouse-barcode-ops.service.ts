/**
 * @module warehouse-barcode-ops.service
 * @description Business-logic service. Returns Result<T> from @common/result; never throws raw Errors.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { db,
  rawSql} from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

function ean13(numericId: number): string {
  const base = `869${String(numericId % 999999999999).padStart(9, '0')}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
  return base + ((10 - (sum % 10)) % 10);
}

@Injectable()
export class WarehouseBarcodeOpsService {

  async generateBarcode(type: string, entityId: string): Promise<Result<object, AppError>> {
    return safeCall(async () => {
    if (type === 'material') {
      const result = await rawSql(sql`SELECT barcode, xom_ashyo FROM material_cards WHERE id = ${parseInt(entityId, 10)}`)
        ;
      const row = dbRows(result)[0] ?? {};
      let barcode = String(row['barcode'] ?? '');
      const name = String(row['xom_ashyo'] ?? '');
      if (!barcode) {
        barcode = ean13(parseInt(entityId, 10));
        await rawSql(sql`UPDATE material_cards SET barcode = ${barcode} WHERE id = ${parseInt(entityId, 10)}`); // allow throw;
      }
      return { barcode, message: { uz: `Barcode: ${barcode} — ${name}`, ru: `Штрих-код: ${barcode} — ${name}` } };
    }
    if (type === 'batch') {
      const result = await rawSql(sql`
        SELECT wb.batch_number, mc.barcode, mc.xom_ashyo FROM warehouse_batches wb
        JOIN material_cards mc ON mc.id = wb.material_card_id WHERE wb.id = ${entityId}
      `);
      const row = dbRows(result)[0] ?? {};
      const barcode = String(row['barcode'] ?? '');
      const name = String(row['xom_ashyo'] ?? '');
      return { barcode, message: { uz: `Barcode: ${barcode} — ${name}`, ru: `Штрих-код: ${barcode} — ${name}` } };
    }
    return { barcode: '', message: { uz: 'Noma\'lum tur', ru: 'Неизвестный тип' } };
  
    });}

  async scanBarcode(barcode: string){
    return safeCall(async () => {
    const result = await rawSql(sql`
      SELECT mc.id, mc.xom_ashyo AS "xomAshyo", mc.barcode, mc.unit_of_measure AS "unitOfMeasure"
      FROM material_cards mc WHERE mc.barcode = ${barcode} LIMIT 1
    `);
    const row = dbRows(result)[0];
    if (!row) return { found: false, message: { uz: 'Barcode topilmadi', ru: 'Штрих-код не найден' } };
    return { found: true, materialCard: row, message: { uz: `Topildi: ${row['xomAshyo']}`, ru: `Найден: ${row['xomAshyo']}` } };
  
    });}

  async bulkGenerateBarcodes(entityIds: string[], type: string){
    return safeCall(async () => {
    if (type !== 'batch' || entityIds.length === 0) {
      return { message: { uz: '0 ta barcode yaratildi / yangilandi', ru: '0 штрих-кодов создано / обновлено' } };
    }

    // Pattern 1: single batch SELECT instead of N+1 per-id lookups
    const lookup = await rawSql(sql`
      SELECT wb.id AS batch_id, mc.id AS material_id, mc.barcode
      FROM warehouse_batches wb
      JOIN material_cards mc ON mc.id = wb.material_card_id
      WHERE wb.id = ANY(${entityIds})
    `);
    const rows = dbRows(lookup) as Array<Record<string, unknown>>;

    // Independent UPDATEs run in parallel (Pattern 2)
    const updates = rows
      .filter(row => row['material_id'] && !row['barcode'])
      .map(row => {
        const matId = row['material_id'];
        const barcode = ean13(parseInt(String(matId), 10));
        return rawSql(sql`UPDATE material_cards SET barcode = ${barcode} WHERE id = ${matId}`);
      });
    await Promise.all(updates);

    const count = rows.filter(row => row['material_id']).length;
    return {
      message: {
        uz: `${count} ta barcode yaratildi / yangilandi`,
        ru: `${count} штрих-кодов создано / обновлено`,
      },
    };

    });}

  async getPrintPreview(id: string, type = 'batch'){
    return safeCall(async () => {
      if (type === 'batch') return this.batchPrintPreview(id);
      return this.materialPrintPreview(id);
    });
  }

  private async batchPrintPreview(id: string) {
    const result = await rawSql(sql`
      SELECT wb.id, wb.batch_number AS "batchNumber", mc.xom_ashyo AS "materialName",
             COALESCE(mc.kod, mc.id::text) AS "materialCode", COALESCE(mc.barcode, '') AS barcode,
             mc.unit_of_measure AS "unitOfMeasure", wb.quantity, wb.remaining_quantity AS "remainingQuantity",
             TO_CHAR(wb.expiry_date, 'YYYY-MM-DD') AS "expiryDate", w.name AS "warehouseName"
      FROM warehouse_batches wb JOIN material_cards mc ON mc.id = wb.material_card_id
      LEFT JOIN warehouses w ON w.id = wb.warehouse_id WHERE wb.id = ${id}
    `);
    const row = dbRows(result)[0];
    if (!row) throw new NotFoundException('Barcode topilmadi');
    return {
      type: 'batch', barcode: row['barcode'], batchNumber: row['batchNumber'],
      materialName: row['materialName'], materialCode: row['materialCode'],
      unitOfMeasure: row['unitOfMeasure'], quantity: Number(row['quantity'] ?? 0),
      remainingQuantity: Number(row['remainingQuantity'] ?? 0),
      expiryDate: row['expiryDate'], warehouseName: row['warehouseName'],
    };
  }

  private async materialPrintPreview(id: string) {
    const result = await rawSql(sql`
      SELECT mc.id, mc.xom_ashyo AS "materialName", COALESCE(mc.kod, mc.id::text) AS "materialCode",
             COALESCE(mc.barcode, '') AS barcode, mc.unit_of_measure AS "unitOfMeasure"
      FROM material_cards mc WHERE mc.id = ${parseInt(id, 10)}
    `);
    const row = dbRows(result)[0];
    if (!row) throw new NotFoundException('Material topilmadi');
    return { type: 'material', barcode: row['barcode'], materialName: row['materialName'], materialCode: row['materialCode'], unitOfMeasure: row['unitOfMeasure'] };
  }
}
