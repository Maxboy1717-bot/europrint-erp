/**
 * @module leads.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err, Result } from '@common/result';
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { marketingLeads } from '@europrint/schemas';
import { eq, and, isNull, desc, count, sql } from 'drizzle-orm';

@Injectable()
export class LeadsRepository {
  async findAll(opts?: { limit?: number; offset?: number }): Promise<Result<Record<string, unknown>[]>> {
    try {
      const lim = opts?.limit ?? 10;
      const off = opts?.offset ?? 0;
      return Ok(
        await db.select().from(marketingLeads)
          .where(isNull(marketingLeads.deletedAt))
          .orderBy(desc(marketingLeads.createdAt))
          .limit(lim)
          .offset(off) as Record<string, unknown>[],
      );
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async count(): Promise<Result<number>> {
    try {
      const rows = await db.select({ total: count() }).from(marketingLeads).where(isNull(marketingLeads.deletedAt));
      return Ok(Number(rows[0]?.total ?? 0));
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async findOne(id: string): Promise<Result<Record<string, unknown> | null>> {
  try {  
      // NB: the @europrint/schemas Drizzle def mis-types marketingLeads.id as integer, but the
      // LIVE column is varchar (slug ids like "demo-lead-010"). Use a parametrized sql comparison
      // so a string id binds correctly (eq() would fail to compile against the mistyped column).
      const rows = await db.select().from(marketingLeads).where(and(sql`${marketingLeads.id} = ${id}`, isNull(marketingLeads.deletedAt)));
      return Ok(rows[0] ?? null);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async create(values: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    // Raw SQL: the @europrint/schemas Drizzle def for marketingLeads omits several real
    // columns (name/company/source/channel/notes/lost_reason), so db.insert would drop
    // them. The live marketing_leads table has all of these — insert them directly.
    try {
      const v = values;
      const result = await db.execute(sql`
        INSERT INTO marketing_leads
          (id, name, company, phone, email, source, channel, status, score, notes,
           lost_reason, first_name, last_name, created_at, updated_at)
        VALUES (
          gen_random_uuid()::text, ${String(v.name ?? '')}, ${(v.company as string) ?? null}, ${(v.phone as string) ?? null},
          ${(v.email as string) ?? null}, ${(v.source as string) ?? 'website'}, ${(v.channel as string) ?? null},
          ${(v.status as string) ?? 'new'}, ${Number(v.score ?? 0)}, ${(v.notes as string) ?? null},
          ${(v.lostReason as string) ?? null}, ${(v.firstName as string) ?? null}, ${(v.lastName as string) ?? null},
          NOW(), NOW()
        )
        RETURNING *
      `);
      const rows = (Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? []) as Record<string, unknown>[];
      return Ok(rows[0] ?? {});
    } catch (_e) {
      return Err(String(_e));
    }
  }

  async update(id: string, values: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
  try {
      const result = await db.update(marketingLeads).set(values as Partial<typeof marketingLeads.$inferInsert>).where(sql`${marketingLeads.id} = ${id}`).returning();
      return Ok(result[0] as Record<string, unknown>);  } catch (_e) {
    return Err(String(_e));
  }

  }

  async softDelete(id: string): Promise<Result<void>> {
  try {
      await db.update(marketingLeads).set({ deletedAt: _time.now() }).where(sql`${marketingLeads.id} = ${id}`);  return Ok();  } catch (_e) {
    return Err(String(_e));
  }

  }

  async getLossAnalysis(): Promise<Result<{ total: number; breakdown: Array<{ reason: string; count: number; percent: number }> }>> {
    try {
      const rows = await db
        .select({ reason: marketingLeads.lostReason, cnt: count() })
        .from(marketingLeads)
        .where(and(eq(marketingLeads.status, 'lost'), isNull(marketingLeads.deletedAt)))
        .groupBy(marketingLeads.lostReason);
      const total = rows.reduce((s, r) => s + Number(r.cnt), 0);
      const breakdown = rows.map(r => ({
        reason: r.reason ?? 'other',
        count: Number(r.cnt),
        percent: total > 0 ? Math.round((Number(r.cnt) / total) * 100) : 0,
      }));
      return Ok({ total, breakdown });
    } catch (_e) {
      return Err(String(_e));
    }
  }
}
