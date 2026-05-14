/**
 * @module label.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { sql, db } from '@workspace/db';
import type { SQL, SQLWrapper } from 'drizzle-orm';
import { Ok, Err, Result, safeCall } from '@common/result';

import { Injectable, Logger } from '@nestjs/common';
import { execPosBarcodePrintQueueInsert } from '@common/database/queries-remaining';

export type LabelFormat = 'ZPL' | 'EPL' | 'PDF';
type Row = Record<string, unknown>;
const execLog = new Logger('LabelRepository');
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => {
  try { return (await db.execute(q)).rows as Row[]; } catch (e) { execLog.warn('[Label] DB exec failed', String(e)); return []; }
};

@Injectable()
export class LabelRepository {
  private readonly logger = new Logger(LabelRepository.name);

  async getMaterialCard(materialCardId: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT mc.id AS material_card_id, mc.xom_ashyo AS material_name, COALESCE(mc.kod, '') AS material_code, COALESCE(mc.barcode, '') AS barcode, COALESCE(mc.unit_of_measure, 'dona') AS unit_of_measure FROM material_cards mc WHERE mc.id = ${materialCardId}`);
      return Ok(r[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getBatch(batchId: number): Promise<Result<Row | null>>  {
  try {  
      const r = await exec(sql`SELECT wb.batch_number, wb.quantity, wb.production_date, wb.expiry_date, w.name AS warehouse_name FROM warehouse_batches wb LEFT JOIN warehouses w ON w.id = wb.warehouse_id WHERE wb.id = ${batchId}`);
      return Ok(r[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getMovementLines(movementId: number): Promise<Result<Row[]>>  {
  try {  
      return Ok(await exec(sql`SELECT mc.id AS material_card_id, mc.xom_ashyo AS material_name, COALESCE(mc.kod, '') AS material_code, COALESCE(mc.barcode, '') AS barcode, COALESCE(mc.unit_of_measure, 'dona') AS unit_of_measure, ml.quantity, ml.batch_id, wb.batch_number, TO_CHAR(wb.production_date, 'YYYY-MM-DD') AS production_date, TO_CHAR(wb.expiry_date, 'YYYY-MM-DD') AS expiry_date, w.name AS warehouse_name FROM pos_movement_lines ml JOIN material_cards mc ON mc.id = ml.material_card_id LEFT JOIN warehouse_batches wb ON wb.id = ml.batch_id LEFT JOIN warehouses w ON w.id = wb.warehouse_id WHERE ml.movement_id = ${movementId}`));  } catch (_e) {
    return Err(String(_e));
  }

  }

  async insertPrintQueue(materialCardId: number, movementId: number, format: LabelFormat, printerIp: string | null, sentToPrinter: boolean): Promise<Result<void>>  {
  try {  
      await execPosBarcodePrintQueueInsert(materialCardId, movementId, format, printerIp, sentToPrinter)
        .catch((e: unknown) => { this.logger.warn('[Label] insertPrintQueue failed', String(e)); });  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
