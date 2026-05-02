import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db , runQuery } from '@shared/db';
import { qcBraks, qcReclamations } from '@europrint/schemas';
import { eq, isNull, count, desc, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IDefectsRepository, BrakRow, ReclamationRow } from './i-defects.repo';

type Row = Record<string, unknown>;
const exec = async (q: Parameters<typeof db.execute>[0]): Promise<Row[]> => {
  return (await runQuery<Row>(q)).rows as Row[];
};

@Injectable()
export class DrizzleDefectsRepository implements IDefectsRepository {
  async findAllBraks(limit: number, offset: number): Promise<Result<{ data: BrakRow[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(qcBraks).orderBy(desc(qcBraks.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(qcBraks).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err(e instanceof Error ? e.message : 'Braklar topilmadi'); }
  }

  async findBrakById(id: number): Promise<Result<BrakRow | null>> {
    try {
      const rows = await db.select().from(qcBraks).where(eq(qcBraks.id, id));
      return Ok(rows[0] ?? null);
    } catch (e: unknown) { return Err(e instanceof Error ? e.message : `Brak #${id} topilmadi`); }
  }

  async getBrakStats(): Promise<Result<{ byStage: BrakRow[]; topReasons: BrakRow[]; pendingRework: number }>> {
    try {
      const [byStage, byReason, reworkable] = await Promise.all([
        castTo<Promise<BrakRow[]>>(exec(sql`SELECT stage, COUNT(*)::int AS qty FROM qc_braks GROUP BY stage`)),
        castTo<Promise<BrakRow[]>>(exec(sql`SELECT reason, SUM(total_qty)::int AS total_qty FROM qc_braks GROUP BY reason ORDER BY total_qty DESC LIMIT 5`)),
        db.select({ count: count() }).from(qcBraks).where(sql`is_reworkable = true`),
      ]);
      return Ok({ byStage, topReasons: byReason, pendingRework: Number(reworkable[0]?.count || 0) });
    } catch (e: unknown) { return Err(e instanceof Error ? e.message : 'Statistika topilmadi'); }
  }

  async findAllReclamations(limit: number, offset: number): Promise<Result<{ data: ReclamationRow[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(qcReclamations).where(isNull(qcReclamations.resolvedAt)).orderBy(desc(qcReclamations.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(qcReclamations).where(isNull(qcReclamations.resolvedAt)).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err(e instanceof Error ? e.message : 'Reklamatsiyalar topilmadi'); }
  }

  async createBrak(dto: Record<string, unknown>): Promise<Result<BrakRow>> {
    try {
      const result = await db.insert(qcBraks).values(dto as typeof qcBraks.$inferInsert).returning();
      return Ok((Array.isArray(result) ? result : [])[0]);
    } catch (e: unknown) { return Err(e instanceof Error ? e.message : 'Brak yaratishda xatolik'); }
  }

  async createReclamation(dto: Record<string, unknown>): Promise<Result<ReclamationRow>> {
    try {
      const result = await db.insert(qcReclamations).values({ ...dto, status: 'open' } as typeof qcReclamations.$inferInsert).returning();
      return Ok((Array.isArray(result) ? result : [])[0]);
    } catch (e: unknown) { return Err(e instanceof Error ? e.message : 'Reklamatsiya yaratishda xatolik'); }
  }
}
