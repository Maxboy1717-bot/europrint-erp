/**
 * @module pos-pdf.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { sql, db } from '@workspace/db';
import { Ok, Err, Result, safeCall } from '@common/result';

import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';

interface PdfMovementLine {
  xom_ashyo: string; unit_of_measure: string; quantity: number;
  unit_price: number; total_price: number; currency: string;
  batch_id: string | null; expiry_date: unknown;
}

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await db.execute(q)).rows as Row[]);

@Injectable()
export class PosPdfRepository {
  async getMovementLines(movementId: number): Promise<Result<PdfMovementLine[]>>  {
  try {  
      return Ok(castTo<PdfMovementLine[]>(exec(sql`SELECT ml.quantity, ml.unit_price, ml.total_price, ml.currency, ml.batch_id, ml.expiry_date, mc.xom_ashyo, mc.unit_of_measure FROM pos_movement_lines ml JOIN material_cards mc ON mc.id = ml.material_card_id WHERE ml.movement_id = ${movementId}`)));  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getCreatorFullName(userId: number): Promise<Result<string | null>>  {
  try {  
      const r = await exec(sql`SELECT full_name FROM users WHERE id = ${userId}`);
      return r.ok ? Ok((r.data[0]?.full_name as string) ?? null) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }
}
