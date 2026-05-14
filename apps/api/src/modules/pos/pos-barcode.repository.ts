/**
 * @module pos-barcode.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { sql, db } from '@workspace/db';
import { Ok, Err, Result, safeCall } from '@common/result';

import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';
import { execPosBarcodeClearPrimary } from '@common/database/queries-remaining';

interface MaterialCardRow {
  id: number; xom_ashyo: string; xom_ashyo_ru: string; barcode: string;
  unit_of_measure: string; is_consumable: boolean; is_indivisible: boolean;
  min_interval_days: number; max_qty_per_issue: number;
}

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await db.execute(q)).rows as Row[]);

@Injectable()
export class PosBarcodeRepository {
  async findByBarcode(barcode: string): Promise<Result<MaterialCardRow | null>>  {
  try {  
      const r = await castTo<MaterialCardRow[]>(exec(sql`SELECT mc.id, mc.xom_ashyo, mc.xom_ashyo_ru, mc.barcode, mc.unit_of_measure, mc.is_consumable, mc.is_indivisible, COALESCE(mc.min_interval_days, 0) AS min_interval_days, COALESCE(mc.max_qty_per_issue, 0) AS max_qty_per_issue FROM material_cards mc WHERE mc.barcode = ${barcode} OR mc.id IN (SELECT material_card_id FROM inventory_barcode_assignments WHERE barcode = ${barcode} AND is_active = TRUE UNION SELECT material_card_id FROM pos_barcode_map WHERE barcode = ${barcode} AND is_primary = TRUE) LIMIT 1`));
      return Ok(r[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async checkBarcodeExists(barcode: string): Promise<Result<boolean>>  {
  try {  
      const r = await exec(sql`SELECT 1 FROM inventory_barcode_assignments WHERE barcode = ${barcode} AND is_active = TRUE UNION SELECT 1 FROM pos_barcode_map WHERE barcode = ${barcode} UNION SELECT 1 FROM material_cards WHERE barcode = ${barcode} LIMIT 1`);
      return Ok((r.ok ? r.data : []).length > 0);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async clearPrimaryBarcode(materialCardId: string): Promise<Result<void>>  {
  try {  
      await execPosBarcodeClearPrimary(parseInt(materialCardId, 10));  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
