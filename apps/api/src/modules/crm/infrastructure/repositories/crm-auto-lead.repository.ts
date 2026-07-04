/**
 * @module crm-auto-lead.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (CRM)
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, sql } from 'drizzle-orm';
import { crmLeads, crmDeals } from '@shared/db';
import { employees } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { ICrmAutoLeadRepo } from '../../domain/repositories/i-crm-auto-lead.repo';

type Row = Record<string, unknown>;
type LeadInsert = Omit<typeof crmLeads.$inferInsert, 'id'>;

@Injectable()
export class CrmAutoLeadRepository implements ICrmAutoLeadRepo {
  async findLeadScore(eid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(crmLeads).where(eq(crmLeads.id, eid)).limit(1);
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async findDeal(eid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await db.select().from(crmDeals).where(eq(crmDeals.id, eid)).limit(1);
      return (rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async getSupervisorDashboard(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:             employees.id,
        full_name:      employees.full_name,
        leads_30d:      sql<number>`COUNT(DISTINCT ${crmLeads.id}) FILTER (WHERE ${crmLeads.created_at} >= NOW() - INTERVAL '30 days')::int`,
        open_deals:     sql<number>`COUNT(DISTINCT ${crmDeals.id}) FILTER (WHERE ${crmDeals.status} = 'open')::int`,
        pipeline_value: sql<number>`COALESCE(SUM(${crmDeals.expected_amount}) FILTER (WHERE ${crmDeals.status} = 'open'), 0)::numeric`,
      })
        .from(employees)
        .leftJoin(crmLeads, sql`${crmLeads.manager_id}::text = ${employees.id}::text`)
        .leftJoin(crmDeals, sql`${crmDeals.assigned_to}::text = ${employees.id}::text`)
        .where(sql`employees.role = 'sales_manager' AND employees.is_active = true`)
        .groupBy(employees.id, employees.full_name)
        .orderBy(sql`pipeline_value DESC`).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getAutoLeadSources(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        source:   crmLeads.source,
        total:    sql<number>`COUNT(*)::int`,
        last_30d: sql<number>`COUNT(*) FILTER (WHERE ${crmLeads.created_at} >= NOW() - INTERVAL '30 days')::int`,
      })
        .from(crmLeads)
        .where(sql`${crmLeads.source} IS NOT NULL`)
        .groupBy(crmLeads.source)
        .orderBy(sql`total DESC`).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async ingestCallLead(phone: unknown, first_name: unknown, last_name: unknown, notes: unknown, source_meta: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const contactName = [(first_name as string) ?? 'Unknown', last_name as string].filter(Boolean).join(' ');
      const payload: LeadInsert = {
        title:         contactName || 'Yangi lid',
        contact_phone: (phone as string) || null,
        contact_name:  contactName,
        source:        'call',
        notes:         (notes as string) ?? JSON.stringify(source_meta ?? {}),
        status_description:        'new',
      };
      const rows = await db.insert(crmLeads).values(payload as typeof crmLeads.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async ingestFormLead(email: unknown, phone: unknown, first_name: unknown, last_name: unknown, form_name: unknown, notes: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const contactName = [(first_name as string) ?? 'Unknown', last_name as string].filter(Boolean).join(' ');
      const payload: LeadInsert = {
        title:         contactName || 'Yangi lid',
        contact_email: (email as string) || null,
        contact_phone: (phone as string) || null,
        contact_name:  contactName,
        source:        (form_name as string) ?? 'web_form',
        notes:         (notes as string) || null,
        status_description:        'new',
      };
      const rows = await db.insert(crmLeads).values(payload as typeof crmLeads.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async ingestTelegramLead(first_name: unknown, last_name: unknown, username: unknown, message: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const contactName = [(first_name as string) ?? 'Telegram User', (last_name ?? username) as string].filter(Boolean).join(' ');
      const payload: LeadInsert = {
        title:        contactName || 'Yangi lid',
        contact_name: contactName,
        source:       'telegram',
        notes:        (message as string) || null,
        status_description:       'new',
      };
      const rows = await db.insert(crmLeads).values(payload as typeof crmLeads.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async ingestWebsiteLead(email: unknown, phone: unknown, first_name: unknown, last_name: unknown, page_url: unknown, message: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const contactName = [(first_name as string) ?? 'Website Visitor', last_name as string].filter(Boolean).join(' ');
      const payload: LeadInsert = {
        title:         contactName || 'Yangi lid',
        contact_email: (email as string) || null,
        contact_phone: (phone as string) || null,
        contact_name:  contactName,
        source:        'website',
        notes:         ((message ?? page_url) as string) || null,
        status_description:        'new',
      };
      const rows = await db.insert(crmLeads).values(payload as typeof crmLeads.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  // SB0651/SB0671 fix: same webhook-ingest shape as ingestTelegramLead — EP-CRM-007's
  // channel list also names whatsapp/sms, which had no ingest endpoint at all.
  async ingestWhatsappLead(phone: unknown, first_name: unknown, last_name: unknown, message: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const contactName = [(first_name as string) ?? 'WhatsApp User', last_name as string].filter(Boolean).join(' ');
      const payload: LeadInsert = {
        title:         contactName || 'Yangi lid',
        contact_phone: (phone as string) || null,
        contact_name:  contactName,
        source:        'whatsapp',
        notes:         (message as string) || null,
        status_description:        'new',
      };
      const rows = await db.insert(crmLeads).values(payload as typeof crmLeads.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async ingestSmsLead(phone: unknown, first_name: unknown, last_name: unknown, message: unknown): Promise<Result<Row>> {
    return safeCall(async () => {
      const contactName = [(first_name as string) ?? 'SMS User', last_name as string].filter(Boolean).join(' ');
      const payload: LeadInsert = {
        title:         contactName || 'Yangi lid',
        contact_phone: (phone as string) || null,
        contact_name:  contactName,
        source:        'sms',
        notes:         (message as string) || null,
        status_description:        'new',
      };
      const rows = await db.insert(crmLeads).values(payload as typeof crmLeads.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async getChurnRisk(entityType: string, eid: number): Promise<Result<Row | null>> {
    return safeCall(async () => {
      if (entityType === 'lead') {
        const rows = await db.select({
          id:         crmLeads.id,
          status:     crmLeads.status_description,
          updated_at: crmLeads.updated_at,
          created_at: crmLeads.created_at,
          source:     crmLeads.source,
        }).from(crmLeads).where(eq(crmLeads.id, eid)).limit(1);
        return (rows[0] ?? null) as Row | null;
      } else {
        const rows = await db.select({
          id:         crmDeals.id,
          status:     crmDeals.status,
          updated_at: crmDeals.updated_at,
          created_at: crmDeals.created_at,
        }).from(crmDeals).where(eq(crmDeals.id, eid)).limit(1);
        return (rows[0] ?? null) as Row | null;
      }
    }, 'DB_ERROR');
  }
}
