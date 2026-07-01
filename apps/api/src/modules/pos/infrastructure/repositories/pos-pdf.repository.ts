/**
 * @module pos-pdf.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { sql, db } from '@workspace/db';
import type { SQL, SQLWrapper } from 'drizzle-orm';
import { Ok, Err, Result, safeCall } from '@common/result';

import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';

interface PdfMovementLine {
  xom_ashyo: string; unit_of_measure: string; quantity: number;
  unit_price: number; total_price: number; currency: string;
  batch_id: string | null; expiry_date: unknown;
}

type Row = Record<string, unknown>;
const exec = (q: SQL | SQLWrapper): Promise<Result<Row[]>> => safeCall(async () => (await db.execute(q)).rows as Row[]);

@Injectable()
export class PosPdfRepository {
  async getMovementLines(movementId: number): Promise<Result<PdfMovementLine[]>>  {
  try {
      // FAZA D bag-fix (2026-07-01): avval `exec(...)` (Promise<Result<Row[]>>) hech qachon
      // await qilinmasdan to'g'ridan `castTo` + `Ok(...)` ichiga o'ralardi — natijada bu metod
      // qatorlar o'rniga Result-o'ramning o'zini qaytarardi ("...castTo(...).map is not a
      // function" chaqiruvchida). Endi to'g'ri await + unwrap qilinadi (Q-46: buzuq kod
      // to'liq tuzatildi, Q-40: ishlaydi(200) lekin noto'g'ri holatining yana bir isboti).
      const r = await exec(sql`SELECT ml.quantity, ml.unit_price, ml.total_price, ml.currency, ml.batch_id, ml.expiry_date, mc.xom_ashyo, mc.unit_of_measure FROM pos_movement_lines ml JOIN material_cards mc ON mc.id = ml.material_id WHERE ml.movement_id = ${movementId}`);
      if (!r.ok) return Err(r.error);
      return Ok(castTo<PdfMovementLine[]>(r.data));
  } catch (_e) {
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
