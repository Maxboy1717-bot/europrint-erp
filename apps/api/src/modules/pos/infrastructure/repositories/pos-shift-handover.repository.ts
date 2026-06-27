/**
 * @module pos-shift-handover.repository
 * @description Repository / data-access layer for POS smena-topshirish (2-imzo) + qaytariladigan-tara.
 *   Wraps raw SQL (tables have no Drizzle schema yet); returns Result<T>. NOTE (Qoida 4): raw SQL
 *   parametrli (sql``) ishlatiladi — `pos_shift_handovers` / `pos_returnable_pallets` jadvallari
 *   Drizzle sxemasiz; barcha qiymatlar bind orqali (SQL injection yo'q).
 */

import { Injectable } from '@nestjs/common';
import type { SQL, SQLWrapper } from 'drizzle-orm';
import { db, sql } from '@workspace/db';
import { safeCall, Result } from '@common/result';
import type { HandoverItem } from '../../dto/shift-handover.dto';

type Row = Record<string, unknown>;
const exec = async (q: SQL | SQLWrapper): Promise<Row[]> => (await db.execute(q)).rows as Row[];

export interface CreateHandoverData {
  handoverNumber: string;
  warehouseId: string | null;
  fromUserId: number;
  toUserId: number;
  items: HandoverItem[];
  notes: string | null;
  photoEvidenceUrl: string | null;
  createdBy: number;
}

export interface CreatePalletData {
  warehouseId: string | null;
  palletType: string;
  direction: 'out' | 'in';
  quantity: number;
  counterpartyId: number | null;
  handoverId: number | null;
  movementId: number | null;
  photoEvidenceUrl: string | null;
  note: string | null;
  createdBy: number;
}

@Injectable()
export class PosShiftHandoverRepository {
  // ─── Smena-topshirish aktlari ──────────────────────────────────────────────
  async createHandover(d: CreateHandoverData): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await exec(sql`
        INSERT INTO pos_shift_handovers
          (handover_number, warehouse_id, from_user_id, to_user_id, items, notes, photo_evidence_url, status, created_by)
        VALUES
          (${d.handoverNumber}, ${d.warehouseId}, ${d.fromUserId}, ${d.toUserId},
           ${JSON.stringify(d.items)}::jsonb, ${d.notes}, ${d.photoEvidenceUrl}, 'draft', ${d.createdBy})
        RETURNING *`);
      return r[0] as Row;
    }, 'DB_ERROR');
  }

  async findById(id: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const r = await exec(sql`SELECT * FROM pos_shift_handovers WHERE id = ${id}`);
      return (r[0] ?? null) as Row | null;
    }, 'DB_ERROR');
  }

  async findAll(filter: { warehouseId?: string; status?: string; limit: number; offset: number }): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const wh = filter.warehouseId ?? null;
      const st = filter.status ?? null;
      return exec(sql`
        SELECT * FROM pos_shift_handovers
        WHERE (${wh}::varchar IS NULL OR warehouse_id = ${wh})
          AND (${st}::varchar IS NULL OR status = ${st})
        ORDER BY id DESC
        LIMIT ${filter.limit} OFFSET ${filter.offset}`);
    }, 'DB_ERROR');
  }

  /** Imzo yozish — faqat berilgan rolning imzo vaqtini va statusni yangilaydi. */
  async applySignature(
    id: number,
    role: 'from' | 'to',
    newStatus: string,
    photoEvidenceUrl: string | null,
  ): Promise<Result<Row>> {
    return safeCall(async () => {
      const column = role === 'from' ? sql`from_signed_at` : sql`to_signed_at`;
      const r = await exec(sql`
        UPDATE pos_shift_handovers
        SET ${column} = now(),
            status = ${newStatus},
            photo_evidence_url = COALESCE(${photoEvidenceUrl}, photo_evidence_url),
            updated_at = now()
        WHERE id = ${id}
        RETURNING *`);
      return r[0] as Row;
    }, 'DB_ERROR');
  }

  async cancel(id: number, reason: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await exec(sql`
        UPDATE pos_shift_handovers
        SET status = 'cancelled', cancel_reason = ${reason}, updated_at = now()
        WHERE id = ${id}
        RETURNING *`);
      return r[0] as Row;
    }, 'DB_ERROR');
  }

  // ─── Qaytariladigan-tara (poddon / rohler) ─────────────────────────────────
  async createPalletEntry(d: CreatePalletData): Promise<Result<Row>> {
    return safeCall(async () => {
      const r = await exec(sql`
        INSERT INTO pos_returnable_pallets
          (warehouse_id, pallet_type, direction, quantity, counterparty_id, handover_id, movement_id, photo_evidence_url, note, created_by)
        VALUES
          (${d.warehouseId}, ${d.palletType}, ${d.direction}, ${d.quantity}, ${d.counterpartyId},
           ${d.handoverId}, ${d.movementId}, ${d.photoEvidenceUrl}, ${d.note}, ${d.createdBy})
        RETURNING *`);
      return r[0] as Row;
    }, 'DB_ERROR');
  }

  /**
   * Tara balansi: har tur (poddon/rohler) bo'yicha berilgan (out) − qaytgan (in) = qarzdor qoldiq.
   * Filtr: ombor va/yoki kontragent bo'yicha.
   */
  async getPalletBalance(filter: { warehouseId?: string; palletType?: string; counterpartyId?: number }): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const wh = filter.warehouseId ?? null;
      const pt = filter.palletType ?? null;
      const cp = filter.counterpartyId ?? null;
      return exec(sql`
        SELECT
          pallet_type,
          counterparty_id,
          COALESCE(SUM(CASE WHEN direction = 'out' THEN quantity ELSE 0 END), 0) AS issued,
          COALESCE(SUM(CASE WHEN direction = 'in'  THEN quantity ELSE 0 END), 0) AS returned,
          COALESCE(SUM(CASE WHEN direction = 'out' THEN quantity ELSE -quantity END), 0) AS outstanding
        FROM pos_returnable_pallets
        WHERE (${wh}::varchar IS NULL OR warehouse_id = ${wh})
          AND (${pt}::varchar IS NULL OR pallet_type = ${pt})
          AND (${cp}::int IS NULL OR counterparty_id = ${cp})
        GROUP BY pallet_type, counterparty_id
        ORDER BY pallet_type, counterparty_id`);
    }, 'DB_ERROR');
  }
}
