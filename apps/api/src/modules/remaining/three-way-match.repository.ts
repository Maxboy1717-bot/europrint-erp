/**
 * @module three-way-match.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Ok, Err, Result, safeCall } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { execThreeWayMatchInsert } from '@common/database/queries-remaining';

type Row = Record<string, unknown>;
const exec = (q: Parameters<typeof db.execute>[0]): Promise<Result<Row[]>> => safeCall(async () => (await runQuery<Row>(q)).rows as Row[]);

@Injectable()
export class ThreeWayMatchRepository {
  async getResults(poId: number | null, limit: number): Promise<Result<Row[]>>  {
  try {  
      return poId
        ? exec(sql`SELECT twm.*, po.order_number as po_number FROM three_way_match_results twm LEFT JOIN purchase_orders po ON po.id = twm.po_id WHERE twm.po_id = ${poId} ORDER BY twm.created_at DESC LIMIT ${limit}`)
        : exec(sql`SELECT twm.*, po.order_number as po_number FROM three_way_match_results twm LEFT JOIN purchase_orders po ON po.id = twm.po_id ORDER BY twm.created_at DESC LIMIT ${limit}`);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getPurchaseOrderAmount(poId: number): Promise<Result<number>>  {
  try {  
      const r = await exec(sql`SELECT total_amount FROM purchase_orders WHERE id = ${poId} LIMIT 1`);
      return r.ok ? Ok(Number(r.data[0]?.total_amount ?? 0)) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getGoodsReceiptAmount(grId: number): Promise<Result<number>>  {
  try {  
      const r = await exec(sql`SELECT total_value FROM goods_receipts WHERE id = ${grId} LIMIT 1`);
      return r.ok ? Ok(Number(r.data[0]?.total_value ?? 0)) : Err(r.error);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async insertResult(poId: number, grId: number, vendorInvoiceId: string, poAmount: number, grAmount: number, invoiceAmount: number, status: string, userId: number): Promise<Result<void>>  {
  try {  
      await execThreeWayMatchInsert(poId, grId, vendorInvoiceId, poAmount, grAmount, invoiceAmount, status, userId);  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }
}
