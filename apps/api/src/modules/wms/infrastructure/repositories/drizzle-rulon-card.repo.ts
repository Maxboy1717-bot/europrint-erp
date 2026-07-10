/**
 * @module drizzle-rulon-card.repo
 * @description Repository / data-access layer — RULON QOG'OZ KARTA.
 *   Wraps Drizzle ORM queries against `rulon_cards`; returns Result<T>.
 * @layer Infrastructure (WMS)
 */

import { Injectable } from '@nestjs/common';
import { Ok, Err, Result } from '@common/result';
import { db } from '@shared/db';
import { rulonCards, RulonCard } from '@workspace/db';
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm';
import type {
  IRulonCardRepo,
  RulonCardListFilter,
  RulonCardCreateData,
} from '../../domain/repositories/i-rulon-card.repo';
import { RULON_STATUS_REMNANT } from '../../domain/constants/wms-rulon-card.constants';

@Injectable()
export class DrizzleRulonCardRepository implements IRulonCardRepo {
  async findAll(
    filter: RulonCardListFilter,
  ): Promise<Result<{ items: RulonCard[]; total: number }>> {
    try {
      const conds: SQL[] = [];
      if (filter.status) conds.push(eq(rulonCards.status, filter.status));
      if (filter.rollType) conds.push(eq(rulonCards.rollType, filter.rollType));
      const where = conds.length ? and(...conds) : undefined;

      const [items, totalRes] = await Promise.all([
        db
          .select()
          .from(rulonCards)
          .where(where)
          .orderBy(desc(rulonCards.createdAt))
          .limit(filter.limit)
          .offset(filter.offset),
        db.select({ value: count() }).from(rulonCards).where(where),
      ]);
      return Ok({ items, total: Number(totalRes[0]?.value ?? 0) });
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Rulon kartalar topilmadi');
    }
  }

  async findById(id: number): Promise<Result<RulonCard | null>> {
    try {
      const rows = await db.select().from(rulonCards).where(eq(rulonCards.id, id)).limit(1);
      return Ok(rows[0] ?? null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Rulon karta #${id} topilmadi`);
    }
  }

  async findByRollCode(rollCode: string): Promise<Result<RulonCard | null>> {
    try {
      const rows = await db
        .select()
        .from(rulonCards)
        .where(eq(rulonCards.rollCode, rollCode))
        .limit(1);
      return Ok(rows[0] ?? null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Rulon kodi ${rollCode} topilmadi`);
    }
  }

  async create(data: RulonCardCreateData): Promise<Result<RulonCard>> {
    try {
      const rows = await db
        .insert(rulonCards)
        .values(data as typeof rulonCards.$inferInsert)
        .returning();
      const row = rows[0];
      if (!row) return Err('Rulon karta yaratilmadi');
      return Ok(row);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Rulon karta yaratishda xatolik');
    }
  }

  async updateWeight(
    id: number,
    currentWeightKg: string,
    estimatedLengthM: string,
    status?: string,
  ): Promise<Result<RulonCard>> {
    try {
      const patch: Partial<typeof rulonCards.$inferInsert> = {
        currentWeightKg,
        estimatedLengthM,
        updatedAt: new Date(),
      };
      if (status) patch.status = status;
      const rows = await db
        .update(rulonCards)
        .set(patch)
        .where(eq(rulonCards.id, id))
        .returning();
      const row = rows[0];
      if (!row) return Err('Rulon karta topilmadi (yangilash)');
      return Ok(row);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Og\'irlikni yangilashda xatolik');
    }
  }

  async updateStatus(id: number, status: string): Promise<Result<RulonCard>> {
    try {
      const rows = await db
        .update(rulonCards)
        .set({ status, updatedAt: new Date() })
        .where(eq(rulonCards.id, id))
        .returning();
      const row = rows[0];
      if (!row) return Err('Rulon karta topilmadi (holat yangilash)');
      return Ok(row);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Holatni yangilashda xatolik');
    }
  }

  async findRemnantSuggestions(limit: number): Promise<Result<RulonCard[]>> {
    try {
      const rows = await db
        .select()
        .from(rulonCards)
        .where(eq(rulonCards.status, RULON_STATUS_REMNANT))
        .orderBy(asc(rulonCards.currentWeightKg), asc(rulonCards.receivedDate))
        .limit(limit);
      return Ok(rows);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Qoldiq rulon takliflarini olishda xatolik');
    }
  }
}
