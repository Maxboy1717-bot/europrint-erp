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
      // Batch 2 item 1.1: campaign_id + assigned_to are real integer columns the previous INSERT
      // silently dropped (a lead created from a campaign / with an owner "saved" but lost both). Added.
      const result = await db.execute(sql`
        INSERT INTO marketing_leads
          (id, name, company, phone, email, source, channel, status, score, notes,
           lost_reason, first_name, last_name, campaign_id, assigned_to, created_at, updated_at)
        VALUES (
          gen_random_uuid()::text, ${String(v.name ?? '')}, ${(v.company as string) ?? null}, ${(v.phone as string) ?? null},
          ${(v.email as string) ?? null}, ${(v.source as string) ?? 'website'}, ${(v.channel as string) ?? null},
          ${(v.status as string) ?? 'new'}, ${Number(v.score ?? 0)}, ${(v.notes as string) ?? null},
          ${(v.lostReason as string) ?? null}, ${(v.firstName as string) ?? null}, ${(v.lastName as string) ?? null},
          ${v.campaignId != null ? Number(v.campaignId) || null : null}, ${v.assignedTo != null ? Number(v.assignedTo) || null : null},
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
    // Raw SQL mirror of create(): the @europrint/schemas marketingLeads def OMITS
    // name/company/source/channel/notes/score, so db.update(...).set(values) silently
    // dropped exactly those 6 fields (Drizzle builds the SET clause from the def's
    // columns, so unmapped keys never reach the DB → "saved" but nothing saved). The
    // live table has all of them. COALESCE(new, old) preserves .partial() semantics:
    // an absent DTO key leaves the column unchanged. camelCase DTO keys → snake_case cols.
    try {
      const v = values;
      const result = await db.execute(sql`
        UPDATE marketing_leads SET
          name        = COALESCE(${v.name        !== undefined ? String(v.name)          : null}, name),
          company     = COALESCE(${v.company     !== undefined ? (v.company as string)    : null}, company),
          phone       = COALESCE(${v.phone       !== undefined ? (v.phone as string)      : null}, phone),
          email       = COALESCE(${v.email       !== undefined ? (v.email as string)      : null}, email),
          source      = COALESCE(${v.source      !== undefined ? (v.source as string)     : null}, source),
          channel     = COALESCE(${v.channel     !== undefined ? (v.channel as string)    : null}, channel),
          status      = COALESCE(${v.status      !== undefined ? (v.status as string)     : null}, status),
          score       = COALESCE(${v.score !== undefined && v.score !== null ? Number(v.score) : null}, score),
          notes       = COALESCE(${v.notes       !== undefined ? (v.notes as string)      : null}, notes),
          lost_reason = COALESCE(${v.lostReason  !== undefined ? (v.lostReason as string) : null}, lost_reason),
          first_name  = COALESCE(${v.firstName   !== undefined ? (v.firstName as string)  : null}, first_name),
          last_name   = COALESCE(${v.lastName    !== undefined ? (v.lastName as string)   : null}, last_name),
          -- Batch 2 item 1.2: campaign_id + assigned_to were dropped by the UPDATE too (sibling of 1.1).
          campaign_id = COALESCE(${v.campaignId  !== undefined && v.campaignId !== null ? Number(v.campaignId) : null}, campaign_id),
          assigned_to = COALESCE(${v.assignedTo  !== undefined && v.assignedTo !== null ? Number(v.assignedTo) : null}, assigned_to),
          updated_at  = NOW()
        WHERE id = ${id}
        RETURNING *
      `);
      const rows = (Array.isArray(result) ? result : (result as { rows?: unknown[] }).rows ?? []) as Record<string, unknown>[];
      return Ok(rows[0] ?? {});
    } catch (_e) {
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
