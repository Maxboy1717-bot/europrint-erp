/**
 * @module drizzle-crm-leads.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { crmLeads } from '@europrint/schemas';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { ICrmLeadsRepository } from './i-crm-leads.repo';

type Row = Record<string, unknown>;

/**
 * Map actual crm_leads DB columns → Bitrix24-style camelCase expected by the frontend.
 * Actual DB columns: contact_name, contact_phone, contact_email, status, source,
 *   customer_id, manager_id, created_at, deleted_at, notes
 */
function mapLeadRow(r: Row): Row {
  const contactName = String(r['contact_name'] ?? '');
  const title = contactName || 'Nomsiz lid';
  return {
    id:           r['id'],
    title,
    name:         contactName || null,
    lastName:     null,
    companyTitle: null,
    statusId:     r['status'] ? String(r['status']).toUpperCase() : 'NEW',
    phones:       r['contact_phone'] ? [{ value: r['contact_phone'], type: 'WORK' }] : [],
    emails:       r['contact_email'] ? [{ value: r['contact_email'], type: 'WORK' }] : [],
    sourceId:     r['source'] ?? null,
    assignedById: r['manager_id'] ? String(r['manager_id']) : null,
    dateCreate:   r['created_at'] ?? new Date().toISOString(),
    opportunity:  0,
    notes:        r['notes'] ?? null,
    ai_score:     null,
    companyId:    r['customer_id'] ?? null,
  };
}

@Injectable()
export class DrizzleCrmLeadsRepository implements ICrmLeadsRepository {
  async findAll(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [countResult, rows] = await Promise.all([
        db.select({ count: count() }).from(crmLeads).where(isNull(crmLeads.deleted_at)).limit(1).offset(0),
        db.select().from(crmLeads).where(isNull(crmLeads.deleted_at)).orderBy(desc(crmLeads.created_at)).limit(limit).offset(offset),
      ]);
      return Ok({ data: (rows as Row[]).map(mapLeadRow), count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Lidlar topilmadi'); }
  }

  async findById(id: number): Promise<Result<Row | null>> {
    try {
      const rows = await db.select().from(crmLeads).where(and(eq(crmLeads.id, id), isNull(crmLeads.deleted_at))).limit(1).offset(0);
      const row = (rows as Row[])[0] || null;
      return Ok(row ? mapLeadRow(row) : null);
    } catch (e: unknown) { return Err((e as Error)?.message || `Lid #${id} topilmadi`); }
  }

  async create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>> {
    try {
      const firstName = (dto.firstName as string | undefined) ?? '';
      const lastName  = (dto.lastName as string | undefined) ?? '';
      const contactName = [firstName, lastName].filter(Boolean).join(' ') || null;
      const row = {
        contact_name:  contactName,
        contact_phone: (dto.phone as string | undefined) || null,
        contact_email: (dto.email as string | undefined) || null,
        status:        (dto.status as string | undefined) ?? 'new',
        source:        (dto.source as string | undefined) || null,
        notes:         (dto.notes as string | undefined) || null,
        customer_id:   (dto.companyId as number | undefined) || null,
        manager_id:    (dto.assignedTo as number | undefined) || (createdBy ?? null),
      };
      const result = await db.insert(crmLeads).values(row as typeof crmLeads.$inferInsert).returning();
      return Ok(mapLeadRow(result[0] as Row));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(crmLeads).set(dto as Partial<typeof crmLeads.$inferInsert>).where(eq(crmLeads.id, id)).returning();
      return Ok(result[0] ? mapLeadRow(result[0] as Row) : {} as Row);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yangilashda xatolik'); }
  }

  async softDelete(id: number): Promise<Result<void>> {
    try {
      await db.update(crmLeads).set({ deleted_at: _time.now() }).where(eq(crmLeads.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error)?.message || "O'chirishda xatolik"); }
  }
}
