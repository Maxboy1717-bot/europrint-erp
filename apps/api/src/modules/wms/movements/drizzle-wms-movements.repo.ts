import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { stockTransferLines } from '@europrint/schemas';
import { eq, count } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IWmsMovementsRepository } from './i-wms-movements.repo';

import { MAX_EXPORT_LIMIT } from '@common/constants/app.constants';
const stockTransfers = stockTransferLines;

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleWmsMovementsRepository implements IWmsMovementsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(stockTransfers).limit(limit).offset(offset),
        db.select({ count: count() }).from(stockTransfers).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Ko\'chirishlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(stockTransfers).where(eq(stockTransfers.id, id)).limit(1).offset(0);
      return Ok(rows[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Ko'chirish #${id} topilmadi`); }
  }

  async findLinesByTransferId(transferId: number): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(stockTransferLines).where(eq(stockTransferLines.transferId, String(transferId))).limit(MAX_EXPORT_LIMIT).offset(0);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Ko\'chirish qatorlari topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(stockTransfers).values({ ...dto, status: 'draft' } as typeof stockTransfers.$inferInsert).returning();
      const rows = Array.isArray(result) ? result : [];
      return Ok(rows[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async updateStatus(id: number, status: string): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(stockTransfers).set({ status }).where(eq(stockTransfers.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Holat yangilashda xatolik'); }
  }
}
