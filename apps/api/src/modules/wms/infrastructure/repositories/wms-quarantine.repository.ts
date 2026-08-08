/**
 * @module wms-quarantine.repository
 * @description Karantin darvozasi repository — mavjud `mm_goods_receipts`
 *   jadvalini qayta ishlatadi (yangi jadval YO'Q). Holat (status) ustunida
 *   5-bosqichli karantin holat-mashinasi saqlanadi. Result<T> qaytaradi.
 * @layer Infrastructure (WMS)
 */

import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result } from '@common/result';
import { QUARANTINE_STATUS } from '../../domain/constants/wms-quarantine.constants';
import type {
  IWmsQuarantineRepo,
  QuarantineTransition,
  ReceiptStatusRow,
} from '../../domain/repositories/i-wms-quarantine.repo';

type Row = Record<string, unknown>;

/** `tx.execute` natijasini har ikki shakl (massiv yoki `{rows}`) uchun normallashtiradi. */
function toRows(res: unknown): Row[] {
  if (Array.isArray(res)) return res as Row[];
  const r = (res as { rows?: unknown }).rows;
  return Array.isArray(r) ? (r as Row[]) : [];
}

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
    audit?: {
      userId?: number | null;
      completed?: boolean;
      note?: string | null;
      expectedStatus?: string | null;
    },
  ): Promise<Result<ReceiptStatusRow>> {
    try {
      const userId = audit?.userId ?? null;
      const note = audit?.note ?? null;
      // MAIN ga o'tganda completed audit maydonlari yoziladi (mavjud ustunlar).
      const isMain = status === QUARANTINE_STATUS.MAIN || audit?.completed === true;
      // TOCTOU himoyasi (VISION-3340 #41): yozuv o'qilgan holatga SHARTLANADI —
      // SELECT ↔ UPDATE oynasida parallel tranzaksiya holatni o'zgartirgan
      // bo'lsa WHERE mos kelmaydi va 0 qator qaytadi (guarded-UPDATE naqshi,
      // qarang: queries-wms.ts execIssueFromWarehouseStock). IS NOT DISTINCT
      // FROM — `=` ning NULL-xavfsiz varianti (status NULL bo'lishi mumkin).
      const hasGuard = audit?.expectedStatus !== undefined;
      const statusGuard = hasGuard
        ? sql` AND status IS NOT DISTINCT FROM ${audit?.expectedStatus ?? null}`
        : sql``;
      const res = await runQuery<Row>(sql`
        UPDATE mm_goods_receipts SET
          status       = ${status},
          qc_by        = COALESCE(${userId}, qc_by),
          notes        = COALESCE(${note}, notes),
          completed_by = CASE WHEN ${isMain} THEN ${userId} ELSE completed_by END,
          completed_at = CASE WHEN ${isMain} THEN NOW() ELSE completed_at END
        WHERE id = ${receiptId}${statusGuard}
        RETURNING id, status
      `);
      const row = Array.isArray(res.rows) ? res.rows[0] : undefined;
      if (!row) {
        if (hasGuard) {
          return Err({
            code: 'CONFLICT',
            message: `Qabul ${receiptId}: holat parallel o'zgargan (kutilgan: '${audit?.expectedStatus ?? 'NULL'}') — yozuv bekor qilindi`,
          });
        }
        return Err({ code: 'NOT_FOUND', message: `Qabul topilmadi: ${receiptId}` });
      }
      return Ok({ id: Number(row.id), status: (row.status as string | null) ?? null });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }

  /**
   * VISION-3340 QC#1 — pessimistik atomik o'tish. Bitta SERIALIZABLE tranzaksiya:
   *   1) `SELECT ... FOR UPDATE` — qatorni bloklaydi (boshqa tranzaksiya kutadi);
   *   2) `computeTarget(currentStatus)` — domen darvozasi (holat-mashinasi) qulf
   *      ostidagi HAQIQIY joriy holatga qarab qaror beradi;
   *   3) darvoza Ok bersa UPDATE, aks holda hech narsa yozilmaydi.
   * O'qish↔yozish oynasi qulf bilan yopilgani uchun TOCTOU poygasi yo'q. `computeTarget`
   * Err qaytarsa tranzaksiya faqat SELECT bilan yopiladi (yozuvsiz, qulf bo'shaydi).
   */
  async transitionReceiptStatusAtomic(
    receiptId: number,
    computeTarget: (currentStatus: string | null) => Result<QuarantineTransition>,
  ): Promise<Result<ReceiptStatusRow>> {
    try {
      return await db.transaction(
        async (tx): Promise<Result<ReceiptStatusRow>> => {
          const sel = await tx.execute(sql`
            SELECT id, status FROM mm_goods_receipts WHERE id = ${receiptId} FOR UPDATE
          `);
          const cur = toRows(sel)[0];
          if (!cur) return Err({ code: 'NOT_FOUND', message: `Qabul topilmadi: ${receiptId}` });

          const currentStatus = (cur.status as string | null) ?? null;
          const decision = computeTarget(currentStatus);
          if (!decision.ok) return decision as Result<ReceiptStatusRow>;

          const { target, audit } = decision.data;
          const userId = audit?.userId ?? null;
          const note = audit?.note ?? null;
          const isMain = target === QUARANTINE_STATUS.MAIN || audit?.completed === true;
          const upd = await tx.execute(sql`
            UPDATE mm_goods_receipts SET
              status       = ${target},
              qc_by        = COALESCE(${userId}, qc_by),
              notes        = COALESCE(${note}, notes),
              completed_by = CASE WHEN ${isMain} THEN ${userId} ELSE completed_by END,
              completed_at = CASE WHEN ${isMain} THEN NOW() ELSE completed_at END
            WHERE id = ${receiptId}
            RETURNING id, status
          `);
          const row = toRows(upd)[0];
          if (!row) return Err({ code: 'NOT_FOUND', message: `Qabul topilmadi: ${receiptId}` });
          return Ok({ id: Number(row.id), status: (row.status as string | null) ?? null });
        },
        { isolationLevel: 'serializable' },
      );
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: String(e) });
    }
  }
}
