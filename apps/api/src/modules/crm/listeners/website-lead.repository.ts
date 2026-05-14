/**
 * @module website-lead.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sdLeads } from '@europrint/schemas';
import { sql, eq } from 'drizzle-orm';
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
 * Saytdan kelgan lead'larni `sd_leads` jadvaliga yozadi va navbatdagi
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
        LEFT JOIN sd_leads l
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
        SELECT id::int AS id FROM sd_leads
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

      const inserted = await db
        .insert(sdLeads)
        .values({
          source: LEAD_SOURCE.WEBSITE,
          status: LEAD_STATUS.NEW,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          managerId: input.managerId ?? null,
          productInterest: input.productInterest ?? null,
          estimatedValue: input.estimatedValue ?? null,
          // Sub-source ni `lostReason` ichida saqlaymiz (sd_leads.lost_reason text)
          // chunki schema'da hali sub_source/metadata ustun yo'q.
          lostReason: subNote + (input.metadata ? ' ' + JSON.stringify(input.metadata) : ''),
        } as typeof sdLeads.$inferInsert)
        .returning({ id: sdLeads.id });
      const list = Array.isArray(inserted) ? inserted : [];
      const leadId = Number(list[0]?.id ?? 0);
      return { leadId, created: leadId > 0 };
    }, 'DB_ERROR');
  }

  /**
   * Mavjud lead'ga sotuv menejerini biriktiradi (manager bo'sh bo'lsa).
   */
  async assignManagerIfMissing(leadId: number, managerId: number): Promise<Result<boolean>> {
    return safeCall(async () => {
      const updated = await db
        .update(sdLeads)
        .set({ managerId })
        .where(sql`${sdLeads.id} = ${leadId} AND ${sdLeads.managerId} IS NULL`)
        .returning({ id: sdLeads.id });
      return Array.isArray(updated) && updated.length > 0;
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
