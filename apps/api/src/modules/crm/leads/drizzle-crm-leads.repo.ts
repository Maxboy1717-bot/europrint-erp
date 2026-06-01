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
import { toBitrixStatusId } from './lead-status-id.util';
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
    // statusId is what the kanban board groups cards by → expose the FINE stage from
    // status_description (= LEAD_STAGES.stageId domain: NEW/IN_PROGRESS/ANALYSIS/FINAL/
    // CONVERTED/WON/LOST). status_id is the coarse Bitrix CHECK state {NEW,IN_PROCESS,
    // CONVERTED,JUNK} and can't represent 4 of the 7 columns, so it's only the fallback
    // for legacy rows that have no description.
    statusId:     r['status_description'] ? String(r['status_description']).toUpperCase() : (r['status_id'] ? String(r['status_id']).toUpperCase() : 'NEW'),
    // Lifecycle code (new/qualified/proposal/...) for the FE label; statusId stays the
    // coarse Bitrix state. Falls back to lower(status_id) for legacy rows w/o a description.
    status:       r['status_description'] ? String(r['status_description']) : (r['status_id'] ? String(r['status_id']).toLowerCase() : 'new'),
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
      // Write the real compat-1a def properties (camelCase keys like name/phones/statusId
      // are NOT def properties and were silently dropped by Drizzle). Lifecycle goes to
      // status_description; status_id holds the mapped Bitrix coarse state (CHECK-safe).
      // Canonical fine stage = LEAD_STAGES.stageId (uppercase). Stored verbatim in
      // status_description (the field the board reads), so read==write equality holds.
      const lifecycle = String((dto.status as string | undefined) ?? (dto.statusId as string | undefined) ?? 'NEW').toUpperCase();
      const phoneVal = (dto.phone as string | undefined)
        ?? (Array.isArray(dto.phones) && dto.phones[0] ? String((dto.phones[0] as { value?: unknown }).value ?? '') : undefined);
      const emailVal = (dto.email as string | undefined)
        ?? (Array.isArray(dto.emails) && dto.emails[0] ? String((dto.emails[0] as { value?: unknown }).value ?? '') : undefined);
      const row = {
        title:              titleValue,                                          // NOT NULL
        status_description: lifecycle,
        status_id:          toBitrixStatusId(lifecycle),
        source:             (dto.source as string | undefined) ?? (dto.sourceId as string | undefined) ?? null, // → source_description
        contact_name:       contactName,
        contact_phone:      phoneVal ?? null,
        contact_email:      emailVal ?? null,
        notes:              (dto.notes as string | undefined) ?? (dto.comments as string | undefined) ?? null,  // → comments
        manager_id:         Number(dto.assignedById ?? dto.assignedTo ?? createdBy) || null,                    // → assigned_to
      };
      const result = await db.insert(crmLeads).values(row as unknown as typeof crmLeads.$inferInsert).returning();
      return Ok(mapLeadRow(result[0] as Row));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  async update(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      // Map incoming (often camelCase) keys to the real def properties. A blind
      // .set(dto) dropped every non-property key (statusId/status/...) → empty SET →
      // "UPDATE crm_leads SET  WHERE id=$1" SQL error. Lifecycle → status_description;
      // status_id → mapped Bitrix coarse state (CHECK-safe).
      const setObj: Record<string, unknown> = {};
      const lifecycleRaw = (dto.status ?? dto.statusId ?? dto.stage_id) as string | undefined;
      if (lifecycleRaw != null) {
        // Canonical fine stage = LEAD_STAGES.stageId (uppercase). The board reads
        // status_description (exposed as statusId) for column placement → store it
        // verbatim/uppercase so the dragged stage persists and the card stays put.
        const stage = String(lifecycleRaw).toUpperCase();
        setObj.status_description = stage;
        setObj.status_id = toBitrixStatusId(stage); // coarse Bitrix mirror (CHECK-safe)
      }
      if (dto.title != null) setObj.title = String(dto.title);
      if (dto.contact_name != null) setObj.contact_name = String(dto.contact_name);
      else {
        const nm = (dto.name ?? dto.firstName) as string | undefined;
        const ln = dto.lastName as string | undefined;
        if (nm != null || ln != null) setObj.contact_name = [nm, ln].filter(Boolean).join(' ');
      }
      if (dto.phone != null) setObj.contact_phone = String(dto.phone);
      if (dto.email != null) setObj.contact_email = String(dto.email);
      if (dto.source != null || dto.sourceId != null) setObj.source = String(dto.source ?? dto.sourceId);
      if (dto.notes != null || dto.comments != null) setObj.notes = String(dto.notes ?? dto.comments);
      if (dto.assignedById != null || dto.assignedTo != null) setObj.manager_id = Number(dto.assignedById ?? dto.assignedTo) || null;
      setObj.updated_at = _time.now();
      const result = await db.update(crmLeads).set(setObj as Partial<typeof crmLeads.$inferInsert>).where(eq(crmLeads.id, id)).returning();
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
