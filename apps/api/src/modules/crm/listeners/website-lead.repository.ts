/**
 * @module website-lead.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, safeCall } from '@common/result';
import { LEAD_SOURCE, LEAD_STATUS, LEAD_SUB_SOURCE, type LeadSubSource } from '@common/constants/lead-sources.constants';

type Row = Record<string, unknown>;

export interface WebsiteLeadInput {
  contactName: string;
  contactPhone: string;
  contactEmail?: string | null;
  productInterest?: string | null;
  estimatedValue?: number | null;
  managerId?: number | null;
  subSource: LeadSubSource;
  metadata?: Record<string, unknown>;
}

/**
 * Saytdan kelgan lead'larni `crm_leads` jadvaliga yozadi va navbatdagi
 * sotuv menejerini tanlaydi (round-robin).
 *
 * Repository — Service'larda `db.*` ishlatilmasligi uchun (Qoida 6).
 */
@Injectable()
export class WebsiteLeadRepository {
  /**
   * Round-robin: oxirgi 30 kunda eng kam lead biriktirilgan
   * faol sotuv menejerini topadi.
   */
  async pickNextSalesManager(): Promise<Result<number | null>> {
    return safeCall(async () => {
      const rows = await db.execute<Row>(sql`
        SELECT e.id::int AS manager_id
        FROM employees e
        LEFT JOIN crm_leads l
          ON l.manager_id::int = e.id
         AND l.created_at >= NOW() - INTERVAL '30 days'
        WHERE COALESCE(e.role, '') = 'sales_manager'
          AND COALESCE(e.is_active, true) = true
        GROUP BY e.id
        ORDER BY COUNT(l.id) ASC, e.id ASC
        LIMIT 1
      `);
      const list = Array.isArray((rows as { rows?: Row[] }).rows)
        ? ((rows as { rows: Row[] }).rows)
        : (Array.isArray(rows) ? (rows as Row[]) : []);
      const first = list[0];
      const id = first ? Number(first['manager_id']) : NaN;
      return Number.isFinite(id) ? id : null;
    }, 'DB_ERROR');
  }

  /**
   * Yangi lead yaratadi (idempotent — mavjud bo'lsa qo'shmaydi).
   * Idempotency kalit: `phone + sub_source + occurredAt` (24 soat oynada).
   */
  async insertWebsiteLead(input: WebsiteLeadInput): Promise<Result<{ leadId: number; created: boolean }>> {
    return safeCall(async () => {
      const subNote = `[${input.subSource}]`;
      // Idempotency: oxirgi 24 soatda shu telefon + sub_source bilan yangi lead bormi?
      const existing = await db.execute<Row>(sql`
        SELECT id FROM crm_leads
        WHERE contact_phone = ${input.contactPhone}
          AND COALESCE(lost_reason, '') LIKE ${`%${subNote}%`}
          AND created_at >= NOW() - INTERVAL '24 hours'
        LIMIT 1
      `);
      const exList = Array.isArray((existing as { rows?: Row[] }).rows)
        ? ((existing as { rows: Row[] }).rows)
        : (Array.isArray(existing) ? (existing as Row[]) : []);
      const existingId = exList[0] ? Number(exList[0]['id']) : NaN;
      if (Number.isFinite(existingId)) {
        return { leadId: existingId, created: false };
      }

      // Repoint to canonical crm_leads (raw SQL — the crmLeads Drizzle shim diverges:
      // no `status` prop, manager_id->assigned_to). tenant_id defaults to 1.
      // estimatedValue -> opportunity_amount; sub-source kept in lost_reason (no sub_source col yet).
      const insLostReason = subNote + (input.metadata ? ' ' + JSON.stringify(input.metadata) : '');
      const inserted = await db.execute<Row>(sql`
        INSERT INTO crm_leads (source, status, contact_name, contact_phone, manager_id, product_interest, opportunity_amount, lost_reason)
        VALUES (${LEAD_SOURCE.WEBSITE}, ${LEAD_STATUS.NEW}, ${input.contactName}, ${input.contactPhone}, ${input.managerId ?? null}, ${input.productInterest ?? null}, ${input.estimatedValue ?? null}, ${insLostReason})
        RETURNING id
      `);
      const list = Array.isArray((inserted as { rows?: Row[] }).rows)
        ? ((inserted as { rows: Row[] }).rows)
        : (Array.isArray(inserted) ? (inserted as Row[]) : []);
      const leadId = Number(list[0]?.['id'] ?? 0);
      return { leadId, created: leadId > 0 };
    }, 'DB_ERROR');
  }

  /**
   * Mavjud lead'ga sotuv menejerini biriktiradi.
   *
   * Standart (overwrite=false, mavjud chaqiruvchilar — website/order/contact
   * listener'lari — shu holatga tayanadi): faqat `manager_id` bo'sh bo'lsa
   * yozadi (null-fill).
   *
   * overwrite=true (VISION-3340 #33, faqat `lead-aging-reassign.cron.ts`
   * ishlatadi): joriy tayinlangan menejerni ham almashtirib, YANGI menejerga
   * qayta biriktiradi — 60+ kun sovigan lead'larni boshqa menejerga o'tkazish
   * uchun aniq opt-in parametr. Standart chaqiruvchilar bu parametrni
   * bermagani uchun ularning xatti-harakati o'zgarmaydi.
   */
  async assignManagerIfMissing(leadId: number, managerId: number, overwrite = false): Promise<Result<boolean>> {
    // crm_leads.manager_id (integer).
    return safeCall(async () => {
      const updated = overwrite
        ? await db.execute<Row>(sql`
            UPDATE crm_leads SET manager_id = ${managerId}, updated_at = NOW()
            WHERE id = ${leadId}
            RETURNING id
          `)
        : await db.execute<Row>(sql`
            UPDATE crm_leads SET manager_id = ${managerId}
            WHERE id = ${leadId} AND manager_id IS NULL
            RETURNING id
          `);
      const updList = Array.isArray((updated as { rows?: Row[] }).rows)
        ? ((updated as { rows: Row[] }).rows)
        : (Array.isArray(updated) ? (updated as Row[]) : []);
      return updList.length > 0;
    }, 'DB_ERROR');
  }

  /**
   * VISION-3340 #33 — lead-aging-reassign.cron uchun: `COALESCE(last_activity_at,
   * created_at)` `agingDays` kundan ko'proq oldin bo'lgan va `status`
   * `terminalStatuses` ro'yxatida BO'LMAGAN (hali yakunlanmagan) lead'larni
   * topadi. Soft-delete'langan (`deleted_at IS NOT NULL`) lead'lar chetlab
   * o'tiladi.
   */
  async findColdLeadsForReassignment(
    agingDays: number,
    terminalStatuses: readonly string[],
  ): Promise<Result<Array<{ id: number; managerId: number | null }>>> {
    return safeCall(async () => {
      const rows = await db.execute<Row>(sql`
        SELECT id, manager_id
        FROM crm_leads
        WHERE deleted_at IS NULL
          AND COALESCE(last_activity_at, created_at) < NOW() - (${agingDays} || ' days')::interval
          AND COALESCE(status, 'new') <> ALL(${Array.from(terminalStatuses)}::text[])
        ORDER BY id ASC
      `);
      const list = Array.isArray((rows as { rows?: Row[] }).rows)
        ? ((rows as { rows: Row[] }).rows)
        : (Array.isArray(rows) ? (rows as Row[]) : []);
      return list
        .map((r) => ({
          id: Number(r['id']),
          managerId: r['manager_id'] != null ? Number(r['manager_id']) : null,
        }))
        .filter((r) => Number.isFinite(r.id));
    }, 'DB_ERROR');
  }

  /**
   * VISION-3340 #33 — har bir avtomatik lead-aging qayta biriktirishni
   * `crm_activities`'ga 'note' turi bilan yozadi (audit trail: kimdan-kimga,
   * necha kun sovigani).
   */
  async logLeadReassignmentNote(
    leadId: number,
    previousManagerId: number | null,
    newManagerId: number,
    agingDays: number,
  ): Promise<Result<void>> {
    return safeCall(async () => {
      const fromText = previousManagerId != null ? `#${previousManagerId}` : 'biriktirilmagan';
      const noteText = `Lead ${agingDays}+ kun faolsiz (aging) — menejer ${fromText} dan #${newManagerId} ga avtomatik qayta biriktirildi.`;
      await db.execute(sql`
        INSERT INTO crm_activities (type, subject, lead_id, notes, status)
        VALUES ('note', 'Lead aging — avtomatik qayta biriktirish', ${leadId}, ${noteText}, 'completed')
      `);
    }, 'DB_ERROR');
  }

  /**
   * Manager Telegram chat ID — xabar yuborish uchun.
   */
  async getManagerTelegramChatId(managerId: number): Promise<Result<string | null>> {
    return safeCall(async () => {
      const rows = await db.execute<Row>(sql`
        SELECT telegram_chat_id AS chat_id
        FROM employees
        WHERE id = ${managerId}
        LIMIT 1
      `);
      const list = Array.isArray((rows as { rows?: Row[] }).rows)
        ? ((rows as { rows: Row[] }).rows)
        : (Array.isArray(rows) ? (rows as Row[]) : []);
      const chatId = list[0]?.['chat_id'];
      return typeof chatId === 'string' && chatId.length > 0 ? chatId : null;
    }, 'DB_ERROR');
  }
}
