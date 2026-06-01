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
    // Live crm_leads columns: status_id/status_description, source_id, assigned_to,
    // date_create, comments (NOT status/source/manager_id/created_at/notes/customer_id).
    statusId:     r['status_id'] ? String(r['status_id']).toUpperCase() : (r['status_description'] ? String(r['status_description']).toUpperCase() : 'NEW'),
    phones:       r['contact_phone'] ? [{ value: r['contact_phone'], type: 'WORK' }] : [],
    emails:       r['contact_email'] ? [{ value: r['contact_email'], type: 'WORK' }] : [],
    sourceId:     r['source_description'] ?? r['source_id'] ?? null,
    assignedById: r['assigned_to'] ? String(r['assigned_to']) : null,
    dateCreate:   r['date_create'] ?? new Date().toISOString(),
    opportunity:  0,
    notes:        r['comments'] ?? null,
    ai_score:     null,
    companyId:    null,
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
      const firstName   = (dto.firstName as string | undefined) ?? '';
      const lastNameVal = (dto.lastName as string | undefined) ?? '';
      const contactName = [firstName, lastNameVal].filter(Boolean).join(' ') || null;
      // CRM-1: title is NOT NULL — derive from dto.title, companyTitle, or name
      const titleValue = String(
        (dto.title as string | undefined) ||
        (dto.companyTitle as string | undefined) ||
        contactName ||
        'Yangi lid',
      );
      const row = {
        title:         titleValue,                                              // NOT NULL fix
        name:          (dto.name as string | undefined) || firstName || null,
        lastName:      (dto.lastName as string | undefined) || null,
        companyTitle:  (dto.companyTitle as string | undefined) || null,
        phones:        dto.phones ?? (dto.phone ? [{ value: dto.phone, type: 'WORK' }] : []),
        emails:        dto.emails ?? (dto.email ? [{ value: dto.email, type: 'WORK' }] : []),
        statusId:      (dto.statusId as string | undefined) || (dto.status as string | undefined) || 'NEW',
        sourceId:      (dto.sourceId as string | undefined) || (dto.source as string | undefined) || null,
        assignedById:  (dto.assignedById as string | undefined) || (dto.assignedTo ? String(dto.assignedTo) : null) || (createdBy ? String(createdBy) : null),
        budget:        (dto.budget as number | undefined) ?? null,
        opportunityAmount: (dto.opportunityAmount as number | undefined) ?? null,
        comments:      (dto.comments as string | undefined) || null,
        // Live legacy alias that exists in crm_leads. status/source removed — they
        // are phantom (not in live DB); statusId/sourceId above cover them.
        contact_name:  contactName,
      };
      const result = await db.insert(crmLeads).values(row as unknown as typeof crmLeads.$inferInsert).returning();
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
