/**
 * @module wms-quarantine.repository
 * @description Karantin darvozasi repository — mavjud `mm_goods_receipts`
 *   jadvalini qayta ishlatadi (yangi jadval YO'Q). Holat (status) ustunida
 *   5-bosqichli karantin holat-mashinasi saqlanadi. Result<T> qaytaradi.
 * @layer Infrastructure (WMS)
 */

import { Injectable } from '@nestjs/common';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';
import { QUARANTINE_STATUS } from '../../domain/constants/wms-quarantine.constants';
import type {
  IWmsQuarantineRepo,
  ReceiptStatusRow,
} from '../../domain/repositories/i-wms-quarantine.repo';

type Row = Record<string, unknown>;

@Injectable()
export class WmsQuarantineRepository implements IWmsQuarantineRepo {
  async findReceiptStatus(receiptId: number): Promise<Result<ReceiptStatusRow | null>> {
    try {
      const res = await runQuery<Row>(sql`
        SELECT id, status FROM mm_goods_receipts WHERE id = ${receiptId} LIMIT 1
      `);
      const row = Array.isArray(res.rows) ? res.rows[0] : undefined;
      if (!row) return Ok(null);
      return Ok({ id: Number(row.id), status: (row.status as string | null) ?? null });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  async updateReceiptStatus(
    receiptId: number,
    status: string,
    audit?: { userId?: number | null; completed?: boolean; note?: string | null },
  ): Promise<Result<ReceiptStatusRow>> {
    try {
      const userId = audit?.userId ?? null;
      const note = audit?.note ?? null;
      // MAIN ga o'tganda completed audit maydonlari yoziladi (mavjud ustunlar).
      const isMain = status === QUARANTINE_STATUS.MAIN || audit?.completed === true;
      const res = await runQuery<Row>(sql`
        UPDATE mm_goods_receipts SET
          status       = ${status},
          qc_by        = COALESCE(${userId}, qc_by),
          notes        = COALESCE(${note}, notes),
          completed_by = CASE WHEN ${isMain} THEN ${userId} ELSE completed_by END,
          completed_at = CASE WHEN ${isMain} THEN NOW() ELSE completed_at END
        WHERE id = ${receiptId}
        RETURNING id, status
      `);
      const row = Array.isArray(res.rows) ? res.rows[0] : undefined;
      if (!row) return Err({ code: 'NOT_FOUND', message: `Qabul topilmadi: ${receiptId}` });
      return Ok({ id: Number(row.id), status: (row.status as string | null) ?? null });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }
}
